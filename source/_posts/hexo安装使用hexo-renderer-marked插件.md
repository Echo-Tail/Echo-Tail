---
title: hexo安装使用hexo-renderer-marked插件
sitemap: false
date: 2025-04-05 12:12:22
tags:
  - hexo
  - image
categories: [blog]
---

本文主要介绍在使用hexo中对于hexo-renderer-marked插件的使用。

<!-- more -->

## 安装

```shell
npm install hexo-renderer-marked --save
```

+ Hexo 4: >= 2.0
+ Hexo 3: >= 0.2
+ Hexo 2: 0.1.x

## 选项

参考 github 中的介绍：https://github.com/hexojs/hexo-renderer-marked

```yml
# _config.yml
post_asset_folder: true
marked:
  prependRoot: true
  postAsset: true
```

启用后，资源图片将会被自动解析为其对应文章的路径。 例如： `image.jpg` 位置为 `/2020/01/02/foo/image.jpg` ，这表示它是 `/2020/01/02/foo/` 文章的一张资源图片， `![](image.jpg)` 将会被解析为 `<img src="/2020/01/02/foo/image.jpg">` 。

这是一张图片，相对于这篇文章位置为`![image](image.png)`

![image](image.png)

