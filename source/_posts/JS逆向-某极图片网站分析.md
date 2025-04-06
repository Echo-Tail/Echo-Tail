---
title: JS逆向-某极图片网站分析
sitemap: false
date: 2025-04-06 10:35:21
tags:
  - JS逆向
  - 爬虫
categories: [JS逆向]
---

本文主要记录一个简单网站的逆向过程。

<!-- more -->

## 分析源网络监听

![image1](/images/JS逆向-某极图片网站分析/image1.png)

从图中可以看到静态网页中已经包含了需要的图片数据，所以不是动态加载的

## 筛选切换分析

通过页面元素可以看到图片列表存在两个，一个隐藏，一个显示。通过切换观察元素变化可以看到切换时对一个列表进行了隐藏，对另外一个元素进行了显示。我们可以在父元素节点中对节点的子属性修改进行监听：

![image2](/images/JS逆向-某极图片网站分析/image2.png)

![image3](/images/JS逆向-某极图片网站分析/image3.png)


然后切换筛选类型，可以看到存在断点命中，并且通过堆栈分析可以找到 js 动态变化点是一个 `weekHotList` 函数

![image4](/images/JS逆向-某极图片网站分析/image4.png)

然后分析 `weekHotList` 函数可以看到是一个 ajax 函数请求，由此我们只需构造请求参数即可拿到筛选的数据：

![image5](/images/JS逆向-某极图片网站分析/image5.png)

## 接口参数分析

上面分析出了接口，发现还缺少 `categoryId` 和 `page` 两个参数，第二个参数见名知意肯定是图片的页数，第一个应该是图片的类别，不确定是写死的还是动态变化的，函数上下文中没有传参，大概率是直接写死的，我们直接全局搜索下这个 `categoryId` 发现确实写死的：

![image6](/images/JS逆向-某极图片网站分析/image6.png)

到此，这个 `weekHotList` 参数都已知来源，分析完毕。

<p hidden>逆向网站地址为: https://pic.yesky.com/c/6_25152.shtml</p>



