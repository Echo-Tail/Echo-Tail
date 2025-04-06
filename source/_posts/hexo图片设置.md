---
title: hexo图片设置
sitemap: false
date: 2024-09-04 20:44:07
tags:
  - hexo
  - image
categories: [blog]
---

本文主要记录博客搭配 Typora 进行文章撰写过程中图片资源的设置操作

<!-- more -->

## _config.yml 的设置

将 `post_asset_folder` 的值设置为 true 则会在你通过 `hexo new post xxx` 时创建一个同名文件夹用于存放资源文件，你可以通过`asset_img`标签在博客中引用资源文件。例如：`{% asset_img image.png %}`

![image](/images/hexo图片设置/image.png)

当然这种方式会在每个 `_posts` 文件下新建一个与 md 文件同名的资源文件夹，为了方便统一管理，我们可能还是更希望图片单独放在一个独立位置，而不是与 md 文件并列存在，我们可以将资源文件夹迁移到 `source/images` 目录下,引用方式为 `![](/images/hexo图片设置/image2.png)`

![image](/images/hexo图片设置/image2.png)