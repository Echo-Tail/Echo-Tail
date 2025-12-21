---
title: you-get 使用教程
date: 2025-12-21 22:05:40
tags: [Python, you-get]
sitemap: false
categories: [Python]
---

本文主要记录开源工具 `you-get` 的使用。

<!-- more -->

## 环境要求

*Python version <= 3.10*

## 安装

这里只介绍 pip 安装

```shell
$ pip3 install you-get
```

## 下载视频

下载指定 url 视频：

```shell
$ you-get http://www.fsf.org/blogs/rms/20140407-geneva-tedx-talk-free-software-free-society
```

使用 `--info`/`-i` 以查看所有可用画质与格式:

```shell
$ you-get -i 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
```

标有`DEFAULT` 为默认画质。如认同，可下载:

```shell
$ you-get 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
```

如您希望其他格式(mp4)，请使用其他提示选项:

```shell
$ you-get --itag=18 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
```

## 在Google Videos搜索并下载

`you-get`可以吃任何东西. 如果不是合法的URL, `you-get`将在Google查找并下载最相关视频. (可能不是最心仪的，但是很有可能)

```shell
$ you-get "Richard Stallman eats"
```

## 暂停与恢复下载

可以使用Ctrl+C 暂停下载.

临时的`.download`文件将保存于输出目录。下次使用`you-get`传入相同参数时，下载将从上次继续开始. 如果下载已经完成 (临时的`.download` 扩展名消失), `you-get`将忽略下载.

用`--force`/`-f`强行重下载. (**注意:** 将覆盖同名文件或临时文件!)

## 设置输出文件名或路径

使用`--output-dir`/`-o` 设定路径, `--output-filename`/`-O` 设定输出文件名:

```shell
$ you-get -o ~/Videos -O zoo.webm 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
```

## 代理设置

使用 `--http-proxy`/`-x`为`you-get`设置HTTP代理:

```shell
$ you-get -x 127.0.0.1:8087 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
```

然而系统代理 (即系统变量`http_proxy`) 自动使用. 使用`--no-proxy`强行关闭.

**提示:**

- 如果经常使用代理 (网络封锁了部分网站), 考虑将`you-get`和 [proxychains](https://github.com/rofl0r/proxychains-ng) 一同使用，并设置`alias you-get="proxychains -q you-get"` (于命令行).
- 对于某些网站(例如Youku), 如果你需要下载仅供中国大陆观看的视频, 可以使用 `--extractor-proxy`/`-y`单独为解析器设置代理. 可以使用 `-y proxy.uku.im:8888` (鸣谢： [Unblock Youku](https://github.com/zhuzhuor/Unblock-Youku) 项目).

## 观看视频

使用 `--player`/`-p` 将视频喂进播放器, 例如 `mplayer` 或者 `vlc`,而不是下载:

```shell
$ you-get -p vlc 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
```

或者你想在浏览器中观看而不希望看广告或评论区:

```shell
$ you-get -p chromium 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
```

**提示:**

- 可以使用 `-p` 开启下载工具,例如 `you-get -p uget-gtk 'https://www.youtube.com/watch?v=jNQXAC9IVRw'`, 虽然有可能不灵.

## 加载cookie

并非所有视频可供任何人观看。如果需要登录以观看 (例如, 私密视频), 可能必须将浏览器cookie通过`--cookies`/`-c` 加载入 `you-get`.

**注意:**

- 目前我们支持两种cookie格式：Mozilla `cookies.sqlite` 和 Netscape `cookies.txt`.

## 复用解析数据

使用 `--url`/`-u` 获得页面所有可下载URL列表. 使用 `--json`以获得JSON格式.

**警告:**

- 目前此功能**未定型**,JSON格式未来有可能变化.