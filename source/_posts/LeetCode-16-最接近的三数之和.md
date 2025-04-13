---
title: LeetCode-16-最接近的三数之和
description: https://leetcode.cn/problems/3sum-closest/description
sitemap: false
date: 2025-04-13 08:50:40
tags:
  - LeetCode
  - 数组
categories: [LeetCode]
---

本文主要记录学习 LeetCode16 题的解题思路。

<!-- more -->

给你一个长度为 n 的整数数组 nums 和 一个目标值 target。请你从 nums 中选出三个整数，使它们的和与 target 最接近。

返回这三个数的和。

假定每组输入只存在恰好一个解。

**示例 1：**

> **输入：** nums = [-1,2,1,-4], target = 1
**输出：** 2
**解释：** 与 target 最接近的和是 2 (-1 + 2 + 1 = 2)。

**示例 2：**

> **输入：** nums = [0,0,0], target = 1
**输出：** 0
**解释：** 与 target 最接近的和是 0（0 + 0 + 0 = 0）。

**提示：**

+ 3 <= nums.length <= 1000
+ -1000 <= nums[i] <= 1000
+ -104 <= target <= 104

## 解题思路

**​1.​排序数组​​：** 先对数组进行排序，方便使用双指针法。
​**2.​固定一个数，双指针找另外两个数​​：**
+ 遍历数组，固定 `nums[i]` 作为第一个数。

+ 使用双指针 `left`（初始 `i+1`）和 `right`（初始 `nums.length - 1`）在剩余部分寻找另外两个数。

**3.计算和并更新最接近的和：**

+ 计算当前三数之和 `sum = nums[i] + nums[left] + nums[right]`。
+ 如果 `sum == target`，直接返回 `sum`（因为题目保证唯一解）。
+ 否则，比较 `sum` 和 `target` 的差值，更新最接近的和 `closestSum`。
+ 根据 `sum` 和 `target` 的大小关系移动指针：
    + 如果 `sum < target`，`left++`（需要更大的数）。
    + 如果 `sum > target`，`right--`（需要更小的数）。

**4.优化：** 可以跳过重复的 `nums[i]` 以减少不必要的计算。

## 代码实现

```java
public int threeSumClosest(int[] nums, int target) {
    Arrays.sort(nums);
    int best = 10000000;
    int length = nums.length;
    for (int i = 0; i < length; i++) {
        // 保证和上一次枚举的元素不相等
        if (i > 0 && nums[i] == nums[i - 1]) {
            continue;
        }
        int a = nums[i];
        int j = i + 1;
        int k = length - 1;
        while (j < k) {
            int sum = nums[i] + nums[j] + nums[k];
            if (sum == target) {
                return target;
            }
            // 如果和比 target 大则 c 的位置需要往左移动，减少和的大小
            // 根据差值的绝对值来更新答案
            if (Math.abs(sum - target) < Math.abs(best - target)) {
                best = sum;
            }
            if (sum > target) {
                // 如果和大于 target，移动 c 对应的指针
                int k0 = k - 1;
                // 移动到下一个不相等的元素
                while (j < k0 && nums[k0] == nums[k]) {
                    --k0;
                }
                k = k0;
            } else {
                // 如果和小于 target，移动 b 对应的指针
                int j0 = j + 1;
                // 移动到下一个不相等的元素
                while (j0 < k && nums[j0] == nums[j]) {
                    ++j0;
                }
                j = j0;
            }
        }
    }
    return best;
}
```