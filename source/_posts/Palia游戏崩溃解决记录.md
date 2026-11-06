---
title: Palia 游戏崩溃解决记录
date: 2026-11-06 09:45:00
tags: [Palia, 游戏, 排障, 显卡驱动]
categories: [游戏]
sitemap: false
---

昨天晚上本来打算和牛嫂一起玩 **Palia**，结果她那边一进游戏就崩，弹出来的是 D3D12Core 的崩溃报告：

![Palia Crash Reporter：An Unreal process has crashed: UE-Palia，堆栈指向 npu_d3d12_umd 与 D3D12Core](/images/Palia游戏崩溃解决记录/error.jpg)

<!-- more -->

我一开始完全没头绪，就先拿豆包问了一轮。它给的判断是：这次更新之后 DX12 渲染路径有兼容性 bug，优先把游戏切到 DX11 启动。大意如下——

> **报错分析**
>
> 弹窗是 `An Unreal process has crashed: UE-Palia`，堆栈里是 **npu_d3d12_umd / D3D12Core**，基本可以判定是更新后 DX12 渲染路径的兼容性问题。你之前能正常玩、更新后直接崩，属于新版本与显卡驱动 / DX12 的适配问题。
>
> **方案 1：强制用 DX11 启动（优先试，成功率最高）**
>
> Steam：库 → Palia 右键 → 属性 → 通用 → 启动选项，填 `-dx11`，保存后直接启动。
>
> Epic / 独立客户端：Epic 在设置里勾选“附加命令行参数”填 `-dx11`；独立客户端改配置文件 `%localappdata%\Palia\Saved\Config\WindowsClient\Engine.ini`，加上
>
> ```
> [/Script/WindowsTargetPlatform.WindowsTargetSettings]
> DefaultGraphicsRHI=DefaultGraphicsRHI_DX11
> ```
>
> 保存后重启电脑再开游戏。
>
> **方案 2：验证游戏文件完整性**
>
> 更新补丁有可能把文件写坏。Steam：库 → Palia 右键 → 属性 → 已安装文件 → 验证游戏文件的完整性；Epic：库里 Palia 三个点 → 管理 → 验证。
>
> **方案 3：排查显卡驱动与叠加层冲突**
>
> 关掉所有游戏叠加：GeForce Experience 覆盖、MSI Afterburner、OBS、RivaTuner、Wallpaper Engine，这些都很容易触发 D3D12 崩溃。驱动更到最新；如果刚更完驱动就出问题，可以回退到上一个稳定版。也可以右键 `Palia.exe` → 属性 → 兼容性 → 勾选“以管理员身份运行”。
>
> **方案 4：清理着色器缓存**
>
> 把 `%LOCALAPPDATA%\D3DSCache` 里的内容全部删掉，重启电脑再启动游戏。
>
> **补充**
>
> 切到 DX11 之后如果能进游戏，可以在游戏内“画面设置 → 高级”里看到 DirectX 版本选项，之后来回切换测试。DX11 性能略低于 DX12，但稳定性好很多，等官方修完 DX12 的 bug 再切回去。

我按第一条做了：启动项加上 `-dx11`，顺手把 N 卡驱动也更新到最新。**还是崩。**

那就用土办法，直接 Google “Palia D3D12Core crash”。搜到一篇 Intel 社区的帖子：<https://community.intel.com/t/palia-crash-in-dx12-intel-arc-b580/135967/1>。帖子本身也只是报障，没什么解法，但下面的回复里提到了 GitHub 上有一个跟进 issue：[DX12 Error on Palia (Steam/Palia Launcher) causing black screen or crash · Issue #1280](https://github.com/IGCIT/Intel-GPU-Community-Issue-Tracker-IGCIT/issues/1280)。

翻到这里我突然想起来：牛嫂那台机器是**双显卡**，一块 N 卡加一块 Intel 核显，而 issue 里反馈崩溃的几乎都是 Intel 显卡。抱着最后的希望去更新了 Intel 显卡驱动——**居然就好了**。

折腾一晚上的结论有点反直觉：报错堆栈里的 `npu_d3d12_umd` 属于 D3D12 的用户态驱动层，说明崩溃出在显卡驱动这一侧，而不是游戏逻辑里。我一开始只在 N 卡上找原因，真正崩的其实是另一块卡。双显卡机器上碰到这类渲染崩溃，先把两块显卡（尤其是核显）的驱动都对齐到最新，再去怀疑游戏本身的 DX 版本，可能会省掉很多弯路。
