---
title: LeetCode-11.盛最多水的容器
sitemap: false
description: https://leetcode.cn/problems/container-with-most-water/description/
date: 2025-03-15 10:50:40
tags:
  - LeetCode
  - 双指针
categories: [LeetCode]
---
给定一个长度为 `n` 的整数数组 `height` 。有 `n` 条垂线，第 `i` 条线的两个端点是 `(i, 0)` 和 `(i, height[i])` 。

找出其中的两条线，使得它们与 `x` 轴共同构成的容器可以容纳最多的水。

返回容器可以储存的最大水量。

**说明：你不能倾斜容器。**
**示例 1：**
![image](LeetCode-11.盛最多水的容器/Pasted%20image%2020250315140105.png)
**输入：[1,8,6,2,5,4,8,3,7]**
**输出：49**
**解释：图中垂直线代表输入数组 [1,8,6,2,5,4,8,3,7]。在此情况下，容器能够容纳水（表示为蓝色部分）的最大值为 49。**

**示例 2：**

**输入：height = [1,1]**
**输出：1**

## 解题思路

双指针法：使用两个指针，一个指向数组的起始位置（left），另一个指向数组的末尾位置（right）。  
计算面积：计算当前两个指针所指向的线段与x轴构成的容器的面积，面积由较短的那条线的高度和两个指针之间的距离决定。  
移动指针：为了寻找可能更大的面积，移动较短的那条线的指针向内侧移动一位，因为移动较长的线的指针不会增加容器的高度，而移动较短的线的指针有可能找到更高的线，从而增加面积。  
更新最大面积：在每次移动指针后，计算新的面积，并更新最大面积。  
重复步骤：重复上述过程，直到两个指针相遇。
## 代码实现

```java
public int maxArea(int[] height) {
	int left = 0;
	int right = height.length - 1;
	int maxArea = 0;
	while (left < right) {
		int leftH = height[left];
		int rightH = height[right];
		if (leftH > rightH) {
			maxArea = Math.max(rightH * (right - left) , maxArea);
			right = right - 1;
		} else{
			maxArea = Math.max(leftH * (right - left) , maxArea);
			left = left + 1;
		}
	}
	return maxArea;
}
```

