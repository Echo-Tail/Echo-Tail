'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const getAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match && (match[1] ?? match[2] ?? match[3]);
};
const site = yaml.load(read('_config.yml'));
const theme = yaml.load(read('_config.next.yml'));
const customStyles = read('source/_data/styles.styl');
const sourceLogo = path.join(root, 'source/images/logo.svg');
const manifest = JSON.parse(read('source/images/manifest.json'));

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
  assert.match(theme.vendors[vendor] || '', /^\/lib\//,
    `${vendor} must be served from this site`);
  assert.ok(fs.existsSync(path.join(root, 'source', theme.vendors[vendor])),
    `${vendor} vendored asset must exist in source`);
}
assert.ok(!(theme.fancybox && theme.mediumzoom), 'only one image zoom library may be enabled');
assert.match(customStyles, /\.posts-expand \.post-header\s*\{[^}]*margin-bottom:\s*24px/s,
  'post header spacing must be compact');
assert.match(customStyles, /\.posts-expand \.post-button\s*\{[^}]*margin-top:\s*16px/s,
  'read-more spacing must be compact');
assert.match(customStyles, /\.post-block\s*\{[^}]*padding:\s*28px/s,
  'desktop post cards must use compact padding');
assert.ok(fs.statSync(sourceLogo).size < 100 * 1024, 'source Safari icon must remain below 100 KiB');
assert.doesNotMatch(read('source/images/logo.svg'), /data:image\//,
  'Safari icon must be a real vector, not a raster image embedded in SVG');
assert.ok(fs.statSync(path.join(root, 'source/images/avatar.png')).size < 200 * 1024,
  'source avatar must remain below 200 KiB');
assert.equal(manifest.name, 'Echo-Tail', 'web app manifest must identify the blog');
for (const icon of manifest.icons || []) {
  assert.match(icon.src, /^\.\//, 'manifest icons must resolve relative to /images/manifest.json');
  assert.ok(fs.existsSync(path.join(root, 'source/images', icon.src.slice(2))),
    `manifest icon must exist: ${icon.src}`);
}

const publicIndex = path.join(root, 'public/index.html');
assert.ok(fs.existsSync(publicIndex), 'Hexo build must generate public/index.html');

const html = read('public/index.html');
const publicDir = path.join(root, 'public');
const publicLogo = path.join(publicDir, 'images/logo.svg');
const tags = html.match(/<(?:link|script)\b[^>]*>/gi) || [];
const linkTags = html.match(/<link\b[^>]*>/gi) || [];
const canonicalTags = linkTags.filter(tag =>
  (getAttribute(tag, 'rel') || '').split(/\s+/).includes('canonical'));

assert.equal(canonicalTags.length, 1, 'generated home page must contain one canonical link');
assert.equal(getAttribute(canonicalTags[0], 'href'), 'https://snails.cafe/',
  'generated canonical link must be exactly https://snails.cafe/');

const assetUrls = [...new Set(tags.flatMap(tag =>
  ['href', 'src'].map(name => getAttribute(tag, name)).filter(Boolean)))]
  .filter(url => {
    try {
      return /\.(?:css|js)$/i.test(new URL(url, 'https://snails.cafe/').pathname);
    } catch {
      return false;
    }
  });
const localAssets = assetUrls
  .map(url => ({ url, parsed: new URL(url, 'https://snails.cafe/') }))
  .filter(asset => asset.parsed.origin === 'https://snails.cafe')
  .map(asset => {
    const relativePath = decodeURIComponent(asset.parsed.pathname).replace(/^\/+/, '');
    return { ...asset, filePath: path.resolve(publicDir, relativePath) };
  });

assert.ok(localAssets.length > 0, 'generated home page must reference local CSS/JS assets');
for (const asset of localAssets) {
  assert.match(path.posix.basename(asset.parsed.pathname), /-[a-f0-9]{8}\.(?:css|js)$/i,
    `local asset must have an 8-hex content hash: ${asset.url}`);
  assert.ok(asset.filePath.startsWith(`${publicDir}${path.sep}`),
    `local asset must resolve under public: ${asset.url}`);
  assert.ok(fs.existsSync(asset.filePath) && fs.statSync(asset.filePath).isFile(),
    `referenced local asset must exist: ${asset.url}`);
}

const mainStylesheet = localAssets.find(asset =>
  /^\/css\/main-[a-f0-9]{8}\.css$/i.test(asset.parsed.pathname));
assert.ok(mainStylesheet, 'generated home page must load a content-hashed main stylesheet');
const css = fs.readFileSync(mainStylesheet.filePath, 'utf8');

assert.ok(localAssets.some(asset =>
  /^\/lib\/medium-zoom\/medium-zoom\.min-[a-f0-9]{8}\.js$/i.test(asset.parsed.pathname)),
  'generated home page must load versioned Medium Zoom');
assert.ok(localAssets.some(asset =>
  /^\/lib\/lozad\/lozad\.min-[a-f0-9]{8}\.js$/i.test(asset.parsed.pathname)),
  'generated home page must load versioned Lozad');
for (const disabledAsset of ['fancybox', 'pjax', 'pace']) {
  assert.ok(!assetUrls.some(url => {
    const pathname = new URL(url, 'https://snails.cafe/').pathname;
    return new RegExp(`(?:^|[/_.-])${disabledAsset}(?:[/_.-]|$)`, 'i').test(pathname);
  }), `generated home page must not load ${disabledAsset}`);
}

assert.doesNotMatch(html, /itemprop=["']dateModified["']/,
  'home page must not claim every cloned post was updated at build time');
assert.ok(fs.statSync(publicIndex).size < 60 * 1024,
  'generated home page must stay below 60 KiB instead of duplicating the theme CSS');
assert.doesNotMatch(html, /class=["'][^"']*use-motion/, 'generated body must not hide content for motion');
assert.doesNotMatch(html, /(?:cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com)/,
  'generated home page theme assets must not depend on foreign public CDNs');
assert.match(css, /\.posts-expand\s+\.post-header\s*\{[^}]*margin-bottom:\s*24px/s,
  'generated CSS must contain compact post header spacing');
assert.match(css, /\.posts-expand\s+\.post-button\s*\{[^}]*margin-top:\s*16px/s,
  'generated CSS must contain compact read-more spacing');
assert.match(css,
  /@media\s*\(\s*max-width\s*:\s*767px\s*\)\s*\{[\s\S]*?\.site-subtitle\s*\{[^}]*display\s*:\s*none\s*;?[^}]*\}/,
  'generated CSS must hide the site subtitle on mobile');
assert.ok(fs.statSync(publicLogo).size < 100 * 1024, 'generated Safari icon must remain below 100 KiB');

console.log('Hexo optimization checks passed.');
