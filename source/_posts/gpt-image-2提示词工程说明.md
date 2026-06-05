---
title: gpt-image-2提示词工程说明
date: 2026-06-04 23:34:40
tags: [prompt, 提示词, gpt-image-2, text-to-image]
sitemap: false
categories: [gpt-image-2, prompt]
---

本文主要记录如何基于 GPT Image 2 模型写出更好的提示词，生成更符合预期的图。

<!-- more -->

## 模型定位

`gpt-image-2` 是 OpenAI 的图像生成模型，适合用于文本生成图片、图片编辑、视觉概念探索、产品图、广告创意、UI/海报草图、角色与场景设计等任务。

相较于只堆关键词的提示词写法，`gpt-image-2` 更适合接收清晰、结构化、接近创意简报的自然语言描述。提示词应说明要生成什么、如何构图、采用什么风格、保留或排除哪些元素，以及是否需要图中文字。

## 核心写法

推荐把提示词拆成几个清晰部分：

```text
Goal: 这张图要用于什么目的
Subject: 主体是谁或是什么
Scene: 场景、环境、时间、背景
Composition: 景别、视角、构图、主体位置
Style: 视觉风格、媒介、质感
Lighting: 光线、色彩、氛围
Text: 需要出现在图中的文字
Constraints: 不要出现什么，哪些元素必须保持准确
```

如果不想写英文，也可以用中文结构：

```text
目标：……
主体：……
场景：……
构图：……
风格：……
光线：……
文字：……
约束：……
```

## 基础提示词公式

### 简洁公式

适合快速探索：

```text
主体 + 场景 + 风格 + 构图 + 光线 + 质量要求
```

示例：

```text
一只白色陶瓷咖啡杯放在木质桌面上，旁边有一本打开的书，清晨自然光，浅景深，写实摄影风格，画面干净，细节清晰。
```

### 完整公式

适合商业图、海报、产品图、人像和需要稳定复现的场景：

```text
用途 + 主体 + 主体细节 + 场景 + 构图 + 视角 + 镜头/景深 + 光线 + 色彩 + 风格 + 文字 + 约束
```

示例：

```text
为高端护肤品牌生成一张电商主图。主体是一瓶透明玻璃精华液，瓶身有银色泵头，放在浅灰色石材台面上。背景是柔和的浴室空间虚化。产品位于画面中央偏下，中近景，平视视角，浅景深。使用柔和侧光和轻微轮廓光，整体色调干净、冷静、专业。不要出现人物、杂乱背景、水印、logo 或额外文字。
```

## 重要提示词维度

### 主体

主体描述越具体，模型越容易生成稳定画面。

可描述：

- 类型：人物、动物、产品、建筑、室内、食物、服装等。
- 外观：颜色、材质、形状、尺寸、纹理、服饰。
- 状态：动作、姿势、表情、摆放方式。
- 数量：一个主体、两个主体、一组物品等。
- 关系：主体之间的位置、互动和遮挡关系。

示例：

```text
一位穿深绿色羊毛大衣的年轻女性，短发，站在雨后的城市街道上，低头看手机。
```

### 场景

场景决定画面的上下文和氛围。

可描述：

- 地点：室内、街道、森林、办公室、厨房、展厅、舞台等。
- 时间：清晨、黄昏、夜晚、雨后、冬季、节日等。
- 背景：墙面、家具、城市灯光、自然景观、装饰元素。
- 氛围：安静、温暖、科技感、复古、奢华、轻松等。

### 构图

构图能显著影响图片是否可用于实际场景。

常用表达：

- 居中构图
- 三分法构图
- 对称构图
- 留白充足
- 顶部留出标题空间
- 左侧留出文案空间
- 主体占画面约 60%
- 背景虚化
- 前景遮挡
- 平视、俯视、仰视、鸟瞰
- 全景、中景、近景、特写

示例：

```text
主体位于画面右侧，左侧保留大面积干净留白，用于后期添加标题。
```

### 风格

风格应明确但不要互相冲突。不要同时要求“写实摄影、扁平插画、油画、动漫风”，除非是有意混合。

常用风格：

- photorealistic，写实摄影
- cinematic，电影感
- editorial photography，杂志摄影
- product photography，产品摄影
- studio lighting，棚拍
- minimal illustration，极简插画
- 3D render，三维渲染
- watercolor，水彩
- oil painting，油画
- anime style，动漫风
- cyberpunk，赛博朋克
- vintage poster，复古海报

如果追求真实照片效果，建议直接写：

```text
photorealistic, natural skin texture, realistic lighting
```

或中文：

```text
写实摄影风格，真实光线，自然皮肤纹理。
```

### 光线和色彩

光线会影响真实感、情绪和质感。

常用表达：

- soft natural light，柔和自然光
- golden hour light，黄金时刻光线
- backlighting，逆光
- rim light，轮廓光
- side lighting，侧光
- studio softbox lighting，摄影棚柔光箱
- neon lighting，霓虹光
- high contrast，高对比
- low contrast，低对比
- warm tones，暖色调
- cool tones，冷色调
- muted colors，低饱和色
- vibrant colors，高饱和色

## 约束条件写法

`gpt-image-2` 不一定需要单独的“反向提示词”参数。更稳妥的做法是把限制写进提示词的 `Constraints` 部分。

常用约束：

```text
No watermark. No extra text. No logos. No distorted hands. No duplicated subjects. No blurry details.
```

中文写法：

```text
不要水印，不要额外文字，不要 logo，不要畸形手部，不要重复主体，不要模糊细节。
```

如果某个元素非常重要，使用正向约束比单纯否定更有效：

```text
The product label must be clean and centered. The background must remain simple and uncluttered.
```

## 图中文字

如果需要模型在图中生成文字，应明确说明：

- 文字内容，用引号包起来。
- 文字位置。
- 字体风格。
- 大小和颜色。
- 是否需要避免其他文字。

示例：

```text
Create a clean poster for a coffee shop. Add the headline "MORNING BREW" at the top center in large bold white sans-serif letters. Add no other text.
```

中文示例：

```text
生成一张咖啡店海报。顶部居中显示标题“早安咖啡”，使用大号白色无衬线粗体字。画面中不要出现其他文字。
```

注意：

- 图中文字越短越稳定。
- 长段落、小字号和密集信息图更容易出错。
- 如果文字准确性非常重要，优先生成无文字底图，再用设计工具或代码叠加文字。

## 图片编辑提示词

编辑图片时，应同时说明“要改什么”和“要保留什么”。保留项越明确，越容易避免主体漂移。

### 基础编辑模板

```text
Change [需要修改的部分] to [目标效果].
Keep [需要保留的部分] unchanged, including [主体、姿态、脸部、衣服、光线、构图、相机角度].
Do not change [禁止改变的部分].
```

中文模板：

```text
将[需要修改的部分]改为[目标效果]。
保持[主体、姿态、脸部、衣服、光线、构图、相机角度]不变。
不要改变[禁止改变的部分]。
```

### 示例

```text
Change only the background to a modern bright office. Keep the person, face, pose, clothing, camera angle, and lighting unchanged. Do not add text, logos, or extra people.
```

中文示例：

```text
只把背景改成明亮的现代办公室。保持人物、脸部、姿势、服装、相机角度和光线不变。不要添加文字、logo 或其他人物。
```

## 质量参数建议

生成图片时，除了提示词本身，还要结合模型参数。

### quality

可按用途选择：

- `low`：适合快速草图、批量探索、低成本迭代。
- `medium`：适合常规图片、社媒素材、普通产品图。
- `high`：适合商业图、人像、复杂细节、文字、信息图和最终交付。

### size

根据实际用途选择比例：

- 方图：头像、产品主图、社交媒体封面。
- 横图：网页头图、横幅、演示文稿。
- 竖图：海报、手机壁纸、短视频封面。

### background

如果 API 支持透明背景，可用于：

- 商品抠图
- 贴纸
- 图标
- 角色素材
- UI 元素

提示词中也应明确：

```text
transparent background, isolated subject
```

或：

```text
透明背景，主体独立，无阴影或仅保留柔和接触阴影。
```

## 常用模板

### 产品摄影

```text
Create a photorealistic product photo of [产品]. The product is [材质、颜色、形状], placed on [台面/背景]. Use [构图] with [光线]. The mood is [品牌气质]. Keep the background clean. No watermark, no extra text, no logo unless specified.
```

中文：

```text
生成一张写实产品摄影图。主体是[产品]，[材质、颜色、形状]，放置在[台面/背景]上。采用[构图]，[光线]，整体气质为[品牌气质]。背景干净。不要水印、额外文字或未指定的 logo。
```

### 人像摄影

```text
Create a photorealistic portrait of [人物]. They are wearing [服装], with [表情/动作]. The scene is [地点/背景]. Use [景别] and [视角]. Lighting is [光线]. Keep natural skin texture and realistic proportions. No distorted hands, no extra people, no watermark.
```

中文：

```text
生成一张写实人像摄影图。人物是[身份/年龄/性别]，穿着[服装]，表情和动作为[描述]。场景是[地点/背景]。采用[景别]和[视角]，[光线]。保持自然皮肤纹理和真实人体比例。不要畸形手部、额外人物或水印。
```

### 海报

```text
Create a poster for [主题/活动/品牌]. The main visual is [主体]. Composition: [构图和留白]. Style: [风格]. Colors: [色彩]. Text: add "[标题]" in [位置、字体、颜色]. Add no other text. No watermark.
```

中文：

```text
生成一张[主题/活动/品牌]海报。主视觉是[主体]。构图：[构图和留白]。风格：[风格]。色彩：[色彩]。文字：在[位置]添加标题“[标题]”，使用[字体和颜色]。不要添加其他文字，不要水印。
```

### UI / App 概念图

```text
Create a clean UI mockup for [应用类型]. Show [核心页面/功能]. Use [布局] with [组件]. Style is [视觉风格]. Colors are [色彩系统]. The screen should look polished and usable. Avoid tiny unreadable text, distorted icons, and visual clutter.
```

中文：

```text
生成一个[应用类型]的干净 UI 概念图，展示[核心页面/功能]。采用[布局]，包含[组件]。视觉风格为[风格]，色彩系统为[颜色]。界面应精致、可用。避免过小不可读文字、畸形图标和视觉杂乱。
```

### 角色设计

```text
Create a character design of [角色]. Appearance: [外貌、服装、道具]. Pose: [姿势]. Background: [背景]. Style: [风格]. Show clear silhouette and readable details. No extra limbs, no duplicated characters, no watermark.
```

中文：

```text
生成一个[角色]设计图。外观：[外貌、服装、道具]。姿势：[姿势]。背景：[背景]。风格：[风格]。角色轮廓清晰，细节可读。不要多余肢体、重复角色或水印。
```

## 提示词迭代方法

1. 先用简洁提示词确定方向。
2. 固定主体和场景，再逐步调整构图、风格、光线。
3. 每次只改一到两个变量，方便判断影响。
4. 出现不需要的元素时，把它写进 `Constraints`。
5. 如果主体漂移，增加“保持主体特征不变”的描述。
6. 如果画面太普通，补充媒介、构图、光线和品牌气质。
7. 如果画面太混乱，减少风格词，增加留白、简洁背景和明确主体位置。

## 高质量提示词检查表

- 是否明确说明主体？
- 是否说明主体的颜色、材质、形状、姿态或表情？
- 是否说明场景和背景？
- 是否说明构图、视角或景别？
- 是否说明光线和色彩？
- 是否说明风格或媒介？
- 是否说明图中文字的内容、位置和样式？
- 是否写明不需要的元素？
- 如果是编辑图片，是否写明哪些内容必须保持不变？
- 如果用于商业交付，是否选择了合适的 `quality` 和 `size`？

## 参考文章

- https://developers.openai.com/api/docs/models/gpt-image-2
- https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
