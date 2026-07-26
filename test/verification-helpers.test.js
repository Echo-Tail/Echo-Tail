'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  findCssDeclaration,
  normalizeAssetUrl,
  parseHtmlResources,
  parseSrcsetUrls,
  resolveRegularFileInside,
  verifyContentHash
} = require('./lib/verification-helpers');

const origin = 'https://snails.cafe/';

test('URL normalization decodes once before classifying assets', () => {
  const asset = normalizeAssetUrl('/lib/%66ancybox/fancybox-deadbeef%2Ejs', origin);
  assert.equal(asset.pathname, '/lib/fancybox/fancybox-deadbeef.js');
  assert.equal(asset.extension, '.js');
  assert.equal(asset.isLocal, true);
});

test('file resolution rejects traversal, symlinks, and non-regular files', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-verifier-'));
  const root = path.join(temp, 'source');
  const outside = path.join(temp, 'package.json');
  const outsideDir = path.join(temp, 'outside');
  fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
  fs.mkdirSync(outsideDir);
  fs.writeFileSync(path.join(root, 'lib', 'safe.js'), 'safe');
  fs.writeFileSync(outside, '{}');
  fs.writeFileSync(path.join(outsideDir, 'secret.js'), 'secret');
  fs.symlinkSync(outside, path.join(root, 'lib', 'escape.js'));
  fs.symlinkSync(outsideDir, path.join(root, 'lib', 'linked'), 'dir');
  fs.mkdirSync(path.join(root, 'lib', 'directory'));

  assert.equal(resolveRegularFileInside(root, '/lib/safe.js', '/lib/'), path.join(root, 'lib', 'safe.js'));
  assert.throws(() => resolveRegularFileInside(root, '/lib/../../package.json', '/lib/'));
  assert.throws(() => resolveRegularFileInside(root, '/lib/%2e%2e/%2e%2e/package.json', '/lib/'));
  assert.throws(() => resolveRegularFileInside(root, '/lib/escape.js', '/lib/'));
  assert.throws(() => resolveRegularFileInside(root, '/lib/linked/secret.js', '/lib/'));
  assert.throws(() => resolveRegularFileInside(root, '/lib/directory', '/lib/'));
  fs.rmSync(temp, { recursive: true, force: true });
});

test('normalized assets are not decoded a second time during file resolution', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-double-encoding-'));
  const root = path.join(temp, 'public');
  fs.mkdirSync(path.join(root, 'lib', 'fancybox'), { recursive: true });
  fs.writeFileSync(path.join(root, 'lib', 'fancybox', 'asset-deadbeef.js'), 'content');
  const asset = normalizeAssetUrl('/lib/%2566ancybox/asset-deadbeef.js', origin);
  assert.equal(asset.pathname, '/lib/%66ancybox/asset-deadbeef.js');
  assert.throws(() => resolveRegularFileInside(root, asset, '/lib/'));
  fs.rmSync(temp, { recursive: true, force: true });
});

test('HTML parsing uses element semantics instead of interchangeable href/src regexes', () => {
  const html = `<!doctype html>
    <script>const fake = '<link rel="canonical" href="https://evil.example/">';</script>
    <link rel="canonical" href="https://snails.cafe/">
    <script src="/css/main-deadbeef.css"></script>
    <link rel="alternate" href="/lib/medium-zoom/medium-zoom.min-deadbeef.js">
    <link rel="stylesheet" href="/css/main-cafebabe.css">
    <script src="/lib/medium-zoom/medium-zoom.min-cafebabe.js"></script>`;
  const resources = parseHtmlResources(html, origin);
  assert.deepEqual(resources.canonicalHrefs, ['https://snails.cafe/']);
  assert.deepEqual(resources.stylesheets.map(asset => asset.pathname), ['/css/main-cafebabe.css']);
  assert.deepEqual(resources.scripts.map(asset => asset.pathname), [
    '/css/main-deadbeef.css',
    '/lib/medium-zoom/medium-zoom.min-cafebabe.js'
  ]);
});

test('HTML parsing fails closed on empty resource attributes and counts empty canonicals', () => {
  const canonicalHtml = `
    <link rel="canonical" href="https://snails.cafe/">
    <link rel="canonical" href="">`;
  assert.deepEqual(parseHtmlResources(canonicalHtml, origin).canonicalHrefs,
    ['https://snails.cafe/', '']);
  assert.throws(() => parseHtmlResources('<link rel="stylesheet" href="">', origin));
  assert.throws(() => parseHtmlResources('<script src=""></script>', origin));
});

test('srcset parsing rejects data candidates instead of skipping later local assets', () => {
  assert.deepEqual(parseSrcsetUrls('/images/a.png 1x, /images/b.png 2x'),
    ['/images/a.png', '/images/b.png']);
  assert.throws(() => parseSrcsetUrls('data:image/gif;base64,AAAA 1x, /images/missing.png 2x'));
  assert.throws(() => parseSrcsetUrls('/images/a.png 1x, data:image/png;base64,BBBB 2x'));
});

test('content hash must equal the first eight SHA-256 characters', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-hash-'));
  const file = path.join(temp, 'asset.js');
  fs.writeFileSync(file, 'console.log("verified");\n');
  const crypto = require('node:crypto');
  const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
  assert.doesNotThrow(() => verifyContentHash(file, `asset-${digest}.js`));
  assert.throws(() => verifyContentHash(file, 'asset-deadbeef.js'));
  fs.rmSync(temp, { recursive: true, force: true });
});

test('CSS declaration matching is scoped to the requested media block', () => {
  const css = `
    @media (min-width: 992px) { .post-block { padding: 28px; } }
    @media (max-width: 767px) { .other { display: none; } }
    .site-subtitle { display: none; }
  `;
  assert.equal(findCssDeclaration(css, '.post-block', 'padding', '28px', /min-width\s*:\s*992px/), true);
  assert.equal(findCssDeclaration(css, '.site-subtitle', 'display', 'none', /max-width\s*:\s*767px/), false);
});

test('CSS media matching rejects contradictory and negated scopes', () => {
  const contradictory = `
    @media (max-width: 767px) {
      @media (min-width: 992px) { .post-block { padding: 28px; } }
    }`;
  const negated = '@media not all and (max-width: 767px) { .site-subtitle { display: none; } }';
  assert.equal(findCssDeclaration(contradictory, '.post-block', 'padding', '28px', /min-width\s*:\s*992px/), false);
  assert.equal(findCssDeclaration(negated, '.site-subtitle', 'display', 'none', /max-width\s*:\s*767px/), false);
});

test('CSS parsing disables automatic previous source-map loading', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-postcss-map-'));
  const mapPath = path.join(temp, 'invalid.map');
  fs.writeFileSync(mapPath, 'not valid JSON');
  const css = `.verified { color: green; }\n/*# sourceMappingURL=${mapPath} */`;
  assert.equal(findCssDeclaration(css, '.verified', 'color', 'green'), true);
  fs.rmSync(temp, { recursive: true, force: true });
});
