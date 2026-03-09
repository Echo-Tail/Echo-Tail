---
title: LeetCode-1.两数之和
description: https://leetcode.cn/problems/two-sum/
sitemap: false
date: 2026-03-09 20:54:10
tags: [LeetCode, 数组]
categories: [LeetCode]
---

本文主要记录学习LeetCode1题的解题思路。

<!-- more -->

给定一个整数数组 `nums` 和一个整数目标值 `target`，请你在该数组中找出 **和为目标值** *`target`* 的那 **两个** 整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案，并且你不能使用两次相同的元素。

你可以按任意顺序返回答案。

**示例 1：**

> **输入：**nums = [2,7,11,15], target = 9
**输出：**[0,1]
**解释：** 因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。

**示例 2：**

> **输入：** nums = [3,2,4], target = 6
**输出：** [1,2]

**示例 3：**

> **输入：** nums = [3,3], target = 6
**输出：** [0,1]

**提示：**

+ `2 <= nums.length <= 104`
+ `-10^9 <= nums[i] <= 10^9`
+ `-10^9 <= target <= 10^9`
+ **只会存在一个有效答案**

**进阶：**你可以想出一个时间复杂度小于 `O(n2)` 的算法吗？

## 解题思路

**关键约束**：

- 每个输入**恰好有一个解**（无需处理多解/无解情况）
- 不能重复使用**同一个元素**（下标必须不同）
- 需返回**原始下标**（不能排序后丢失位置信息）

### 暴力枚举

通过双重 for 循环遍历来找到唯一解

**代码实现（Java）**

```java
public int[] twoSum(int[] nums, int target) {
    int n = nums.length;
    for (int i = 0; i < n; ++i) {
        for (int j = i + 1; j < n; ++j) {
            if (nums[i] + nums[j] == target) {
                return new int[]{i, j};
            }
        }
    }
    return new int[0];
}
```

### 哈希表

**用空间换时间**：遍历时记录已访问元素的值和下标，对当前元素 `nums[i]`，直接查询 `target - nums[i]` 是否已存在。

### 算法步骤

1. 创建空哈希表 `map`（键：数值，值：下标）
2. 遍历数组 `nums`，对每个位置 `i`：
    - 计算补数 `complement = target - nums[i]`
    - 检查 `complement` 是否在 `map` 中：
        - ✅ 存在 → 返回 `[map.get(complement), i]`
        - ❌ 不存在 → 将 `(nums[i], i)` 存入 `map`
3. 题目保证有解，无需处理无结果情况

**代码实现（Java）**

```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) {
            return new int[]{map.get(complement), i}; // 找到解
        }
        map.put(nums[i], i); // 记录当前值和下标
    }
    return new int[]{}; // 题目保证有解，此行不会执行
}
```

