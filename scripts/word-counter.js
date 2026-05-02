/* global hexo */

'use strict';

const rBacktick = /^((?:[^\S\r\n]*>){0,3}[^\S\r\n]*)(`{3,}|~{3,})[^\S\r\n]*((?:.*?[^`\s])?)[^\S\r\n]*\n((?:[\s\S]*?\n)?)(?:(?:[^\S\r\n]*>){0,3}[^\S\r\n]*)\2[^\S\r\n]?(\n+|$)/gm;
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter('zh-CN', { granularity: 'word' })
  : null;

const config = Object.assign({
  symbols          : true,
  time             : true,
  total_symbols    : true,
  total_time       : true,
  exclude_codeblock: false,
  wpm              : 275,
  suffix           : 'mins.'
}, hexo.config.symbols_count_time);

hexo.config.symbols_count_time = config;

function wordCount(content) {
  const text = String(content || '').replace(/\]\((.*?)\)/g, ']');

  if (segmenter) {
    let count = 0;
    for (const item of segmenter.segment(text)) {
      if (item.isWordLike) count++;
    }
    return count;
  }

  const words = text.match(/[\p{L}\p{N}_]+/gu);
  return words ? words.length : 0;
}

function getSymbols(post) {
  return post.length || 0;
}

function getFormatTime(minutes, suffix) {
  const hours = Math.floor(minutes / 60);
  let mins = Math.floor(minutes - (hours * 60));
  if (mins < 1) mins = 1;
  return hours < 1 ? mins + ' ' + suffix : hours + ':' + ('00' + mins).slice(-2);
}

function symbolsCount(post) {
  let result = getSymbols(post);
  if (result > 9999) {
    result = Math.round(result / 1000) + 'k';
  } else if (result > 999) {
    result = (Math.round(result / 100) / 10) + 'k';
  }
  return result;
}

function symbolsTime(post, awl, wpm = config.wpm, suffix = config.suffix) {
  return getFormatTime(Math.round(getSymbols(post) / wpm), suffix);
}

function getSymbolsTotal(site) {
  let total = 0;
  site.posts.forEach(post => {
    total += getSymbols(post);
  });
  return total;
}

function symbolsCountTotal(site) {
  const total = getSymbolsTotal(site);
  return total < 1000000
    ? Math.round(total / 1000) + 'k'
    : (Math.round(total / 100000) / 10) + 'm';
}

function symbolsTimeTotal(site, awl, wpm = config.wpm, suffix = config.suffix) {
  return getFormatTime(Math.round(getSymbolsTotal(site) / wpm), suffix);
}

if (config.symbols) {
  hexo.extend.helper.register('symbolsCount', symbolsCount);
  hexo.extend.helper.register('wordcount', symbolsCount);
}

if (config.time) {
  hexo.extend.helper.register('symbolsTime', symbolsTime);
  hexo.extend.helper.register('min2read', symbolsTime);
}

if (config.total_symbols) {
  hexo.extend.helper.register('symbolsCountTotal', symbolsCountTotal);
  hexo.extend.helper.register('totalcount', symbolsCountTotal);
}

if (config.total_time) {
  hexo.extend.helper.register('symbolsTimeTotal', symbolsTimeTotal);
}

if (config.symbols || config.time || config.total_symbols || config.total_time) {
  hexo.extend.filter.register('after_post_render', data => {
    let content = data._content;
    if (config.exclude_codeblock) content = content.replace(rBacktick, '');
    data.length = wordCount(content);
  }, 0);
}
