---
title: Next 主题安装及配置
tags: [hexo, next, next-theme, blog]
sitemap: false
categories: [blog]
---

本文主要记录 hexo 的 next 主题以及一些常用插件的安装

<!-- more -->

## 安装

```shell
npm install hexo-theme-next
```

## 自定义配置文件

为避免 git 冲突，我们不应该直接修改主题源码，可通过指定配置文件的方式来对主题进行配置，这里我们将 next 主题配置文件 `_config.yml` 拷贝重命名为 `_config.next.yml`放到站点根目录下

其他一些修改参考：[Custom File](https://theme-next.js.org/docs/advanced-settings/custom-files.html)

## 安装字数统计插件

```shell
npm install hexo-word-counter
hexo clean
```

## 安装热门文章插件

```shell
npm install hexo-related-posts
hexo clean
```

## 安装搜索插件

```shell
npm install hexo-generator-searchdb
hexo clean
```

## 安装网站地图插件

```shell
npm install hexo-generator-sitemap
hexo clean
```
