'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const {
  findCssDeclaration,
  normalizeAssetUrl,
  parseHtmlResources,
  resolveRegularFileInside,
  verifyContentHash
} = require('./lib/verification-helpers');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'source');
const publicDir = path.join(root, 'public');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const site = yaml.load(read('_config.yml'));
const theme = yaml.load(read('_config.next.yml'));
const customStyles = read('source/_data/styles.styl');
const manifest = JSON.parse(read('source/images/manifest.json'));
const productionOrigin = 'https://snails.cafe/';

assert.equal(site.url, 'https://snails.cafe', 'canonical site URL must use the production domain');
assert.equal(site.updated_option, 'date',
  'posts without explicit updates must fall back to their publication date, not git checkout mtime');
assert.equal(site.filter_optimize?.versioning, true,
  'CSS and JS must use content-hashed URLs for safe immutable caching');
assert.ok(!(site.filter_optimize?.css?.inlines || []).includes('css/main.css'),
  'shared theme CSS must not be duplicated inline into every generated page');
assert.equal(theme.motion.enable, false, 'motion must not hide initial article content');
assert.equal(theme.pace.enable, false, 'Pace must not delay or mask initial rendering');
assert.equal(theme.mediumzoom, true, 'Medium Zoom must be enabled in the source theme config');
assert.equal(theme.lazyload, true, 'lazy loading must be enabled in the source theme config');
assert.equal(theme.fancybox, false, 'Fancybox must be disabled in the source theme config');
assert.equal(theme.pjax, false, 'PJAX must be disabled in the source theme config');

for (const vendor of [
  'fontawesome', 'anime', 'mediumzoom', 'lazyload',
  'local_search', 'gitalk_js', 'gitalk_css', 'creative_commons'
]) {
  const vendorPath = theme.vendors[vendor] || '';
  assert.match(vendorPath, /^\/lib\//, `${vendor} must be served from this site`);
  assert.doesNotThrow(
    () => resolveRegularFileInside(sourceDir, vendorPath, '/lib/'),
    `${vendor} must resolve to a regular vendored file inside source/lib`
  );
}

assert.match(customStyles, /\.posts-expand \.post-header\s*\{[^}]*margin-bottom:\s*24px/s,
  'post header spacing must be compact');
assert.match(customStyles, /\.posts-expand \.post-button\s*\{[^}]*margin-top:\s*16px/s,
  'read-more spacing must be compact');
assert.match(customStyles, /@media\s*\(min-width:\s*992px\)[\s\S]*?\.post-block\s*\{[^}]*padding:\s*28px/s,
  'desktop post cards must use compact padding');

const sourceLogo = resolveRegularFileInside(sourceDir, '/images/logo.svg', '/images/');
const sourceAvatar = resolveRegularFileInside(sourceDir, '/images/avatar.png', '/images/');
assert.ok(fs.statSync(sourceLogo).size < 100 * 1024, 'source Safari icon must remain below 100 KiB');
assert.doesNotMatch(fs.readFileSync(sourceLogo, 'utf8'), /data:image\//,
  'Safari icon must be a real vector, not a raster image embedded in SVG');
assert.ok(fs.statSync(sourceAvatar).size < 200 * 1024, 'source avatar must remain below 200 KiB');

assert.equal(manifest.name, 'Echo-Tail', 'web app manifest must identify the blog');
for (const icon of manifest.icons || []) {
  assert.match(icon.src, /^\.\//, 'manifest icons must resolve relative to /images/manifest.json');
  const asset = normalizeAssetUrl(icon.src, 'https://snails.cafe/images/manifest.json');
  assert.ok(asset.pathname.startsWith('/images/'), `manifest icon must stay under /images/: ${icon.src}`);
  assert.doesNotThrow(
    () => resolveRegularFileInside(sourceDir, asset, '/images/'),
    `manifest icon must resolve to a regular file inside source/images: ${icon.src}`
  );
}

const publicIndex = path.join(publicDir, 'index.html');
assert.ok(fs.existsSync(publicIndex), 'Hexo build must generate public/index.html');
const html = fs.readFileSync(publicIndex, 'utf8');
const resources = parseHtmlResources(html, productionOrigin);

assert.deepEqual(resources.canonicalHrefs, ['https://snails.cafe/'],
  'generated home page must contain exactly one production canonical link');
assert.equal(resources.dateModifiedCount, 0,
  'home page must not claim every cloned post was updated at build time');
assert.ok(!resources.bodyClasses.includes('use-motion'),
  'generated body must not hide content for motion');
assert.ok(fs.statSync(publicIndex).size < 60 * 1024,
  'generated home page must stay below 60 KiB instead of duplicating the theme CSS');

for (const stylesheet of resources.stylesheets) {
  assert.equal(stylesheet.extension, '.css', `stylesheet link must reference CSS: ${stylesheet.rawUrl}`);
}
for (const script of resources.scripts) {
  assert.equal(script.extension, '.js', `script src must reference JavaScript: ${script.rawUrl}`);
}

const loadedAssets = [...resources.stylesheets, ...resources.scripts];
for (const asset of loadedAssets) {
  assert.ok(!['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com'].includes(new URL(asset.href).hostname),
    `runtime theme asset must not depend on a foreign public CDN: ${asset.rawUrl}`);
}

const localStylesheets = resources.stylesheets.filter(asset => asset.isLocal);
const localScripts = resources.scripts.filter(asset => asset.isLocal);
const localAssets = [...localStylesheets, ...localScripts];
assert.ok(localAssets.length > 0, 'generated home page must reference local CSS/JS assets');

for (const asset of localAssets) {
  const filePath = resolveRegularFileInside(publicDir, asset, '/');
  assert.doesNotThrow(
    () => verifyContentHash(filePath, asset.basename),
    `local asset must have a valid SHA-256-derived content hash: ${asset.rawUrl}`
  );
}

const mainStylesheet = localStylesheets.find(asset =>
  /^\/css\/main-[a-f0-9]{8}\.css$/i.test(asset.pathname));
assert.ok(mainStylesheet, 'generated home page must load a content-hashed main stylesheet as CSS');
const mainCssPath = resolveRegularFileInside(publicDir, mainStylesheet, '/css/');
const css = fs.readFileSync(mainCssPath, 'utf8');

assert.ok(localScripts.some(asset =>
  /^\/lib\/medium-zoom\/medium-zoom\.min-[a-f0-9]{8}\.js$/i.test(asset.pathname)),
  'generated home page must execute versioned Medium Zoom JavaScript');
assert.ok(localScripts.some(asset =>
  /^\/lib\/lozad\/lozad\.min-[a-f0-9]{8}\.js$/i.test(asset.pathname)),
  'generated home page must execute versioned Lozad JavaScript');

for (const disabledAsset of ['fancybox', 'pjax', 'pace']) {
  assert.ok(!loadedAssets.some(asset =>
    new RegExp(`(?:^|[/_.-])${disabledAsset}(?:[/_.-]|$)`, 'i').test(asset.pathname)),
  `generated home page must not load ${disabledAsset}`);
}

assert.equal(findCssDeclaration(css, '.posts-expand .post-header', 'margin-bottom', '24px'), true,
  'generated CSS must contain compact post header spacing');
assert.equal(findCssDeclaration(css, '.posts-expand .post-button', 'margin-top', '16px'), true,
  'generated CSS must contain compact read-more spacing');
assert.equal(findCssDeclaration(css, '.post-block', 'padding', '28px', /min-width\s*:\s*992px/), true,
  'generated CSS must contain compact desktop card padding under min-width 992px');
assert.equal(findCssDeclaration(css, '.site-subtitle', 'display', 'none', /max-width\s*:\s*767px/), true,
  'generated CSS must hide the site subtitle inside the mobile media query');

const publicLogo = resolveRegularFileInside(publicDir, '/images/logo.svg', '/images/');
assert.ok(fs.statSync(publicLogo).size < 100 * 1024, 'generated Safari icon must remain below 100 KiB');

console.log('Hexo optimization checks passed.');
