---
title: Hexo常用命令整理
sitemap: false
date: 2026-05-02 22:23:22
tags: [hexo]
categories: [hexo]
---

本文主要记录 hexo 的一些常用命令

<!-- more -->

作为一个轻量级静态博客框架，Hexo 以其简单高效深受开发者喜爱。本文整理了 Hexo 日常使用中最常见、最实用的命令，帮助你快速上手和提高效率。

---

## Hexo 初始化与安装

### 1. 安装 Hexo CLI

```bash
npm install -g hexo-cli
```

### 2. 初始化博客项目

```bash
hexo init blog
cd blog
npm install
```

---

## 常用基础命令

### 1. 启动本地服务器

```bash
hexo server
```

或简写：

```bash
hexo s
```

默认访问地址：[http://localhost:4000](http://localhost:4000)

👉 常用参数：

```bash
hexo s -p 5000     # 指定端口
hexo s -i 0.0.0.0  # 外部可访问
```

---

### 2. 新建文章

```bash
hexo new "我的第一篇博客"
```

简写：

```bash
hexo n "文章标题"
```

👉 指定类型：

```bash
hexo new post "文章"
hexo new page "about"
hexo new draft "草稿"
```

---

### 3. 生成静态文件

```bash
hexo generate
```

简写：

```bash
hexo g
```

👉 常用参数：

```bash
hexo g -d   # 生成并部署
hexo g -w   # 监视文件变化
```

---

### 4. 部署到远程仓库（如 GitHub）

```bash
hexo deploy
```

简写：

```bash
hexo d
```

👉 一键生成+部署：

```bash
hexo d -g
```

---

### 5. 清除缓存

```bash
hexo clean
```

👉 当页面异常或样式错乱时非常有用！

---

## 组合命令（高频使用）

这些是日常最常用的组合：

```bash
hexo clean && hexo g && hexo s
```

👉 解释：

* 清缓存
* 生成页面
* 启动本地服务

或者部署：

```bash
hexo clean && hexo g && hexo d
```

---

## 草稿相关命令

### 1. 新建草稿

```bash
hexo new draft "草稿文章"
```

### 2. 预览草稿

```bash
hexo s --draft
```

### 3. 发布草稿

```bash
hexo publish "草稿文章"
```

---

## 配置与调试

### 1. 查看帮助

```bash
hexo help
```

### 2. 查看版本

```bash
hexo version
```

---

## 常见问题小技巧

✅ **修改配置后不生效？**

```bash
hexo clean
```

---

✅ **部署失败？**

检查 `_config.yml` 中的 deploy 配置，例如：

```yaml
deploy:
  type: git
  repo: https://github.com/你的用户名/你的仓库.git
  branch: main
```

---

✅ **更换主题后样式错乱？**

```bash
hexo clean && hexo g
```

---

## 总结

Hexo 命令并不复杂，核心就这几个：

* `hexo n`：写文章
* `hexo s`：本地预览
* `hexo g`：生成页面
* `hexo d`：部署上线
* `hexo clean`：清缓存

熟练掌握之后，你可以非常高效地维护自己的博客 🚀

---



