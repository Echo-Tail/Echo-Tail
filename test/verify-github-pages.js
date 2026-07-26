'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parse5 = require('parse5');
const {
  normalizeAssetUrl,
  parseSrcsetUrls,
  resolveRegularFileInside
} = require('./lib/verification-helpers');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public-github');
const pageSite = 'https://echo-tail.github.io';
const pagePrefix = '/Echo-Tail/';

function attrs(node) {
  return Object.fromEntries((node.attrs || []).map(attribute => [attribute.name.toLowerCase(), attribute.value]));
}

function htmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

function pageUrlFor(file) {
  const relative = path.relative(publicDir, file).split(path.sep).join('/');
  const route = relative === 'index.html'
    ? pagePrefix
    : `${pagePrefix}${relative.replace(/index\.html$/, '')}`;
  return new URL(route, pageSite).href;
}

const files = htmlFiles(publicDir);
assert.ok(files.length > 1, 'GitHub Pages build must generate multiple HTML pages');
let localAssetCount = 0;
let localInternalLinkCount = 0;

for (const file of files) {
  const pageUrl = pageUrlFor(file);
  const document = parse5.parse(fs.readFileSync(file, 'utf8'));
  const localAssets = [];
  const internalLinks = [];
  const canonicals = [];
  let clientConfig = null;

  function addAsset(rawUrl) {
    const asset = normalizeAssetUrl(rawUrl, pageUrl);
    if (asset.isLocal) localAssets.push(asset);
  }

  function visit(node) {
    const attributes = attrs(node);
    if (node.tagName === 'link') {
      const rel = new Set((attributes.rel || '').split(/\s+/).filter(Boolean));
      if (rel.has('canonical') && Object.hasOwn(attributes, 'href')) canonicals.push(attributes.href);
      const assetRels = ['stylesheet', 'icon', 'manifest', 'apple-touch-icon', 'mask-icon', 'preload'];
      if (assetRels.some(value => rel.has(value)) && Object.hasOwn(attributes, 'href')) addAsset(attributes.href);
    }

    const srcElements = new Set(['script', 'img', 'source', 'video', 'audio', 'input', 'iframe', 'embed']);
    if (srcElements.has(node.tagName) && Object.hasOwn(attributes, 'src')) addAsset(attributes.src);
    if (['img', 'source', 'video'].includes(node.tagName) && Object.hasOwn(attributes, 'data-src')) {
      addAsset(attributes['data-src']);
    }
    if (node.tagName === 'video' && Object.hasOwn(attributes, 'poster')) addAsset(attributes.poster);
    if (['img', 'source'].includes(node.tagName)) {
      for (const name of ['srcset', 'data-srcset']) {
        if (Object.hasOwn(attributes, name)) {
          for (const rawUrl of parseSrcsetUrls(attributes[name])) addAsset(rawUrl);
        }
      }
    }

    if (node.tagName === 'a' && Object.hasOwn(attributes, 'href')) {
      const link = normalizeAssetUrl(attributes.href, pageUrl);
      if (link.isLocal) internalLinks.push(link);
    }

    if (node.tagName === 'script' && attributes.class?.split(/\s+/).includes('next-config') && attributes['data-name'] === 'main') {
      const text = (node.childNodes || []).find(child => child.nodeName === '#text')?.value;
      if (text) clientConfig = JSON.parse(text);
    }

    for (const child of node.childNodes || []) visit(child);
  }
  visit(document);

  assert.deepEqual(canonicals, [pageUrl], `canonical must match generated route: ${file}`);
  assert.equal(clientConfig?.root, pagePrefix, `NexT client root must use ${pagePrefix}: ${file}`);

  for (const asset of localAssets) {
    localAssetCount++;
    assert.ok(asset.pathname.startsWith(pagePrefix),
      `local GitHub Pages asset must include ${pagePrefix}: ${asset.rawUrl} in ${file}`);
    assert.doesNotThrow(
      () => resolveRegularFileInside(publicDir, asset, pagePrefix, '/Echo-Tail'),
      `GitHub Pages asset must exist in the uploaded artifact: ${asset.rawUrl} in ${file}`
    );
  }

  for (const link of internalLinks) {
    localInternalLinkCount++;
    assert.ok(link.pathname.startsWith(pagePrefix),
      `internal GitHub Pages link must include ${pagePrefix}: ${link.rawUrl} in ${file}`);
  }
}

assert.ok(localAssetCount > 0, 'GitHub Pages verifier must inspect local assets');
assert.ok(localInternalLinkCount > 0, 'GitHub Pages verifier must inspect local internal links');
console.log(`GitHub Pages project-path checks passed for ${files.length} HTML files, ${localAssetCount} local assets, and ${localInternalLinkCount} internal links.`);
