'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const parse5 = require('parse5');
const postcss = require('postcss');

const NORMALIZED_ASSET = Symbol('normalizedAsset');

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function normalizeAssetUrl(rawUrl, origin) {
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
    throw new TypeError('asset URL must be a non-empty string');
  }

  const base = new URL(origin);
  const parsed = new URL(rawUrl, base);
  let decoded;
  try {
    decoded = decodeURIComponent(parsed.pathname);
  } catch (error) {
    throw new Error(`asset URL contains invalid percent encoding: ${rawUrl}`, { cause: error });
  }

  if (decoded.includes('\0') || decoded.includes('\\')) {
    throw new Error(`asset URL contains a forbidden path character: ${rawUrl}`);
  }

  const absolutePath = decoded.startsWith('/') ? decoded : `/${decoded}`;
  const pathname = path.posix.normalize(absolutePath);
  if (!pathname.startsWith('/')) {
    throw new Error(`asset URL did not normalize to an absolute path: ${rawUrl}`);
  }

  return {
    [NORMALIZED_ASSET]: true,
    rawUrl,
    href: parsed.href,
    origin: parsed.origin,
    isLocal: parsed.origin === base.origin,
    pathname,
    basename: path.posix.basename(pathname),
    extension: path.posix.extname(pathname).toLowerCase()
  };
}

function candidateInside(rootDir, rawPath, requiredPrefix = '/', stripPrefix = '') {
  const root = path.resolve(rootDir);
  const asset = typeof rawPath === 'string'
    ? normalizeAssetUrl(rawPath, 'https://local.invalid/')
    : rawPath;
  if (!asset || asset[NORMALIZED_ASSET] !== true) {
    throw new TypeError('path must be a raw string or an asset returned by normalizeAssetUrl');
  }
  const prefix = path.posix.normalize(requiredPrefix.startsWith('/') ? requiredPrefix : `/${requiredPrefix}`);
  const prefixWithSlash = prefix.endsWith('/') ? prefix : `${prefix}/`;

  if (!asset.pathname.startsWith(prefixWithSlash)) {
    throw new Error(`path escapes required URL prefix ${prefixWithSlash}: ${asset.rawUrl}`);
  }

  let filesystemPath = asset.pathname;
  if (stripPrefix) {
    const normalizedStrip = path.posix.normalize(stripPrefix.startsWith('/') ? stripPrefix : `/${stripPrefix}`)
      .replace(/\/$/, '');
    if (filesystemPath !== normalizedStrip && !filesystemPath.startsWith(`${normalizedStrip}/`)) {
      throw new Error(`path does not start with removable URL prefix ${normalizedStrip}: ${asset.rawUrl}`);
    }
    filesystemPath = filesystemPath.slice(normalizedStrip.length) || '/';
  }

  const candidate = path.resolve(root, `.${filesystemPath}`);
  if (!inside(root, candidate)) {
    throw new Error(`path escapes allowlisted root: ${asset.rawUrl}`);
  }
  return { asset, candidate, root };
}

function assertRegularFile(root, candidate, asset) {
  const stat = fs.lstatSync(candidate);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`path must reference a regular non-symlink file: ${asset.rawUrl}`);
  }

  const realRoot = fs.realpathSync(root);
  const realCandidate = fs.realpathSync(candidate);
  if (!inside(realRoot, realCandidate)) {
    throw new Error(`real path escapes allowlisted root: ${asset.rawUrl}`);
  }
}

function resolveRegularFileInside(rootDir, rawPath, requiredPrefix = '/', stripPrefix = '') {
  const { asset, candidate, root } = candidateInside(rootDir, rawPath, requiredPrefix, stripPrefix);
  assertRegularFile(root, candidate, asset);
  return candidate;
}

function resolveRouteInside(rootDir, rawPath, requiredPrefix = '/', stripPrefix = '') {
  const { asset, candidate, root } = candidateInside(rootDir, rawPath, requiredPrefix, stripPrefix);
  const stat = fs.lstatSync(candidate);
  const routeFile = stat.isDirectory() ? path.join(candidate, 'index.html') : candidate;
  assertRegularFile(root, routeFile, asset);
  return routeFile;
}

function verifyContentHash(filePath, basename) {
  const match = basename.match(/-([a-f0-9]{8})\.(?:css|js)$/i);
  if (!match) {
    throw new Error(`asset filename lacks an 8-hex content hash: ${basename}`);
  }

  const actual = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').slice(0, 8);
  if (actual.toLowerCase() !== match[1].toLowerCase()) {
    throw new Error(`asset content hash mismatch for ${basename}: expected ${actual}`);
  }
}

function attributes(node) {
  return Object.fromEntries((node.attrs || []).map(attribute => [attribute.name.toLowerCase(), attribute.value]));
}

function parseHtmlResources(html, origin) {
  const document = parse5.parse(html);
  const canonicalHrefs = [];
  const stylesheets = [];
  const scripts = [];
  const bodyClasses = [];
  let dateModifiedCount = 0;

  function visit(node) {
    const attrs = attributes(node);
    if (node.tagName === 'body') {
      bodyClasses.push(...(attrs.class || '').split(/\s+/).filter(Boolean));
    }
    if ((attrs.itemprop || '').split(/\s+/).includes('dateModified')) {
      dateModifiedCount++;
    }

    if (node.tagName === 'link') {
      const rel = new Set((attrs.rel || '').toLowerCase().split(/\s+/).filter(Boolean));
      if (rel.has('canonical') && Object.hasOwn(attrs, 'href')) canonicalHrefs.push(attrs.href);
      if (rel.has('stylesheet') && Object.hasOwn(attrs, 'href')) {
        stylesheets.push(normalizeAssetUrl(attrs.href, origin));
      }
    } else if (node.tagName === 'script') {
      if (Object.hasOwn(attrs, 'src')) scripts.push(normalizeAssetUrl(attrs.src, origin));
    }

    for (const child of node.childNodes || []) visit(child);
  }

  visit(document);
  return { bodyClasses, canonicalHrefs, dateModifiedCount, stylesheets, scripts };
}

function parseSrcsetUrls(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('srcset must be a non-empty string when the attribute is present');
  }
  if (/(?:^|,)\s*data:/i.test(value)) {
    throw new Error('data: candidates in srcset are unsupported because embedded commas are ambiguous');
  }

  return value.split(',').map(candidate => {
    const url = candidate.trim().split(/\s+/)[0];
    if (!url) throw new Error('srcset contains an empty candidate');
    return url;
  });
}

function mediaScopeMatches(rule, mediaPattern) {
  let parent = rule.parent;
  let requestedScopeFound = mediaPattern === null;
  let minimumWidth = Number.NEGATIVE_INFINITY;
  let maximumWidth = Number.POSITIVE_INFINITY;

  while (parent) {
    if (parent.type === 'atrule' && parent.name.toLowerCase() === 'media') {
      if (parent.params.includes('\\') || /\bnot\b/i.test(parent.params) || parent.params.includes(',')) {
        return false;
      }
      if (mediaPattern) {
        const pattern = new RegExp(mediaPattern.source, mediaPattern.flags.replace('g', ''));
        if (pattern.test(parent.params)) requestedScopeFound = true;
      }

      const widthConditions = [...parent.params.matchAll(/\b(min|max)-width\s*:\s*([^)]+)/gi)];
      for (const [, boundary, rawWidth] of widthConditions) {
        const width = rawWidth.trim().match(/^([0-9]+(?:\.[0-9]+)?)px$/i);
        if (!width) return false;
        const pixels = Number(width[1]);
        if (boundary.toLowerCase() === 'min') minimumWidth = Math.max(minimumWidth, pixels);
        else maximumWidth = Math.min(maximumWidth, pixels);
      }
    }
    parent = parent.parent;
  }

  return requestedScopeFound && minimumWidth <= maximumWidth;
}

function findCssDeclaration(css, selector, property, value, mediaPattern = null) {
  const root = postcss.parse(css, { from: undefined, map: false });
  let found = false;

  root.walkRules(rule => {
    if (found) return;
    const selectors = rule.selectors || rule.selector.split(',').map(item => item.trim());
    if (!selectors.includes(selector) || !mediaScopeMatches(rule, mediaPattern)) return;

    for (const node of rule.nodes || []) {
      if (node.type === 'decl' && node.prop === property && node.value.trim() === value) found = true;
    }
  });

  return found;
}

module.exports = {
  findCssDeclaration,
  normalizeAssetUrl,
  parseHtmlResources,
  parseSrcsetUrls,
  resolveRegularFileInside,
  resolveRouteInside,
  verifyContentHash
};
