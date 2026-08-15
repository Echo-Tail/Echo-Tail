---
title: hermes update 卡住排查：从 22 分钟到 30 秒
date: 2026-08-15 22:50:00
tags: [AI, AI Agent, Hermes, 运维, 性能排查]
sitemap: false
categories: [AI, Hermes]
---

平时我更新 Hermes Agent 都是直接跑 `hermes update`，几秒钟拉代码、一两分钟装完依赖，没什么存在感。直到有一天它开始"卡住"：终端停在 `Updating Node.js dependencies...` 一行字上，几分钟没有任何动静，像死机一样。

这篇文章记录完整的排查过程：怎么定位卡点、为什么网络没问题却还是慢、以及最后怎么把一次更新压到 30 秒内。

<!-- more -->

## 现象：每次更新都卡在同一个地方

先看日志。Hermes 的更新日志在 `~/.hermes/logs/update.log`，每次更新都会有记录：

```
=== hermes update started 2026-08-15T22:20:52 ===
◆ Pre-update snapshot: 20260815-142052-pre-update
→ Fetching updates...
→ Warming npx cache for agent-browser...
→ Updating Node.js dependencies...
(node:2701746) MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
```

两次更新（22:20 和 22:26）都死在同一行：`Updating Node.js dependencies...`，后面只有一条 Node 的警告，再无输出。更早一次大更新更夸张，从 21:12 跑到 21:34，整整 22 分钟，期间拉下了 22931 个新提交。

## 排查：把更新拆成一个个环节实测

`hermes update` 的完整流程是：git 拉代码 → 更新前快照备份 → uv 同步 Python 依赖 → npm 装前端依赖 → 构建 Web UI → 同步技能。既然日志显示卡在 npm 环节，那就把每个环节单独跑一遍，用秒表说话：

| 环节 | 实测耗时 |
| --- | ---: |
| git fetch（GitHub 直连） | 约 1 秒 |
| npx 预热 agent-browser 缓存 | 约 2 秒 |
| npm ci（装 524 个包） | 10~13 秒 |
| uv self update | 0 秒（managed 安装直接跳过） |
| PyPI 连通性 | 约 0.5 秒 |

结论很反直觉：**网络不是瓶颈**。GitHub 直连 1 秒、npm 走腾讯云镜像 10 秒装完 524 个包，所有环节单独跑都快得离谱。

## 根因：npm ci 是"删光重装"，不是增量更新

问题出在 npm 这一步的行为上。Hermes 更新时用的是 `npm ci`，它和 `npm install` 最大的区别是：**先把 node_modules 整个删掉，再按 lockfile 全量重装**。在依赖树大变更（比如一次拉了几千个提交）之后，这一步必然发生，而且期间终端几乎不输出进度。

三个因素叠加，就构成了"卡死"的错觉：

1. **全量重装**：删除旧 node_modules + 重新下载安装 500+ 包，IO 和网络压力都在这一刻集中爆发；
2. **内存吃紧**：这台机器只有 3.6G 内存，跑着 Hermes 网关、Node、Python 全栈，npm 重装时再叠上浏览器的占用，系统开始 swap，进度肉眼不可见；
3. **输出黑洞**：npm 的进度输出不会写进 update.log，终端上只有一行 "Updating Node.js dependencies..."，看起来就像永远停在那里。

## 解法：四条实操建议

1. **保持高频小更新**。隔几天更新一次，每次只有几十个提交，npm 依赖基本不变，30 秒内完成。攒几千个提交再一次性更新，等于把所有成本集中支付一次。

2. **卡住时先等 2~3 分钟**。npm 有超时重试机制，瞬时网络抖动会自动恢复。不要急着 Ctrl+C，中断反而可能留下半更新的 node_modules。

3. **单独预装依赖再更新**。如果确认卡在 npm 环节，可以手动先跑一次，更新时会直接复用：

```bash
cd ~/.hermes/hermes-agent
~/.hermes/node/bin/npm ci --no-fund --no-audit --prefer-offline \
  --progress=false --workspace ui-tui --workspace web --include-workspace-root
```

4. **更新前关掉浏览器等重负载进程**，给 npm 重装留出内存余量。

另外提醒一点：更新完成后，运行中的 Hermes 网关不会自动重启，新代码要到下次重启才生效。记得另开一个终端执行 `hermes gateway restart`。

## 结果

按上面的方法，最新一次更新从执行到完成不到 30 秒：git 拉取 1 秒、快照几秒、依赖装完 10 秒、其余环节全部命中缓存跳过。

这次排查最大的收获不是省了几分钟，而是一个方法论：**遇到"卡住"先看日志定位环节，再把每个环节单独实测，用数据代替猜测**。慢和卡之间，往往只差一个没输出的等待。
