---
title: hexo升级8.0后npm install失败问题
sitemap: false
date: 2025-12-18 15:56:53
tags: [npm, hexo, strip-ansi, hexo-related-posts]
categories: [hexo]
---

本文主要记录 hexo 从 7.3.0 升级到 8.1.1 版本导致的一系列问题。

<!-- more -->

## 事故起因

由于 GitHub 的智能推送版本升级 Merged 提交，顺带就合并了：

![image5](/images/hexo升级8.0后npm_install失败问题/merged.png)

合并后然后顺带写了一篇文章，提交合并到 Github了，然后看了下 Action：

![image5](/images/hexo升级8.0后npm_install失败问题/hexo-related-posts.png)

淦，怎么 `npm install` 失败了 😭

## hexo-related-posts插件修复

从上面的 Action 日志可以看到 `hexo-related-posts@1.6.2` 支持的7.0 版本为 >= 7.1.1 所以这就是为什么更新到 8.0 后 `npm install` 失败了, 去插件作者那看看怎么个事：

![image5](/images/hexo升级8.0后npm_install失败问题/hexo-related-posts2.png)

😅,看来指望插件作者及时适配 hexo 8.0 版本是不可能了，那就卸载看下是否会有影响，从目前来看是每有影响的，没有用到这个插件功能。

## 故障再发

好消息是 `hexo-related-posts` 插件卸载后本地能正常运行了，但是 Action 又编译失败了，从图中看是 `hexo g` 失败了：

![image5](/images/hexo升级8.0后npm_install失败问题/strip-ansi.png)

这个报错咱也看不太懂，交给 VS Code 的智能 AI 吧：

![image5](/images/hexo升级8.0后npm_install失败问题/code-ai.png)

AI 👍！瞬间给我修好了，锁了下 `strip-ansi` 版本到 6.0，本地部署没问题后再推送到 Github，跑了下 Action，完美解决，流水线顺利通过

## 总结

看来很多插件，模块不能随便升级，会影响到其它依赖模块，另外，AI 真的能帮我们解决生活中的很多问题，当你对某个问题没有头绪的时候不妨丢给 AI 让 AI 来帮帮你吧，也许情况会好起来。