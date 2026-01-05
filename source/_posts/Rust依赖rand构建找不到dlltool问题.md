---
title: Rust依赖rand构建找不到dlltool问题
sitemap: false
description: 添加 rand 依赖然后执行 cargo build 报错找不到 dlltool 可执行程序
date: 2026-01-05 15:09:30
tags: [Rust, dlltool.exe, cargo, rand]
categories: [Rust]
---

本文主要记录添加 `rand` 依赖 `cargo build` 报错 <span style="color: #FA5C5C">error calling dlltool 'dlltool.exe': program not found</span> 问题

<!-- more -->

## 环境

+ Rust
+ Windows10
+ Visual Studio Code

## 问题背景

跟着《Rust 程序设计语言》开发猜数字游戏，需要添加 `rand` 依赖，然后执行 `cargo build` 构建，构建报错：

```powershell
PS D:\WorkSpace\VscodeProject\Rust\guessing_game> cargo build
   Compiling cfg-if v1.0.4
   Compiling zerocopy v0.8.31
   Compiling getrandom v0.3.4
   Compiling rand_core v0.9.3
error: error calling dlltool 'dlltool.exe': program not found

error: could not compile `getrandom` (lib) due to 1 previous error
warning: build failed, waiting for other jobs to finish...
```

## 问题原因

当使用 GNU (MinGW) 工具链进行编译时，若 dlltool 可执行文件缺失或未添加到系统 PATH 环境变量中，就会引发此问题。 

## 解决方案

1.  安装 [msys2](https://www.msys2.org/) ,然后允许msys2

2. 安装 toolchains 整个组件 

    ```shell
    pacman -S mingw-w64-x86_64-toolchain
    ```

3. 添加 msys2 的 `msys64\mingw64\bin` 路径到环境变量

4. 重启 Visual Studio Code，大功告成🎉

