---
title: 【算法解析】最长连续序列 - LeetCode 128题
description: https://leetcode.cn/problems/longest-consecutive-sequence
sitemap: false
date: 2026-03-11 20:46:10
tags: [LeetCode, 数组]
categories: [LeetCode]
---

本文主要记录学习 LeetCode128 题的解题思路。

<!-- more -->

给定一个未排序的整数数组 `nums` ，找出数字连续的最长序列（不要求序列元素在原数组中连续）的长度。

请你设计并实现时间复杂度为 `O(n)` 的算法解决此问题。

**示例 1**：

```
输入：nums = [100,4,200,1,3,2]
输出：4
解释：最长数字连续序列是 [1, 2, 3, 4]。它的长度为 4。
```

**示例 2：**

```
输入：nums = [0,3,7,2,5,8,4,6,0,1]
输出：9
```

**示例 3：**

```
输入：nums = [1,0,1,2]
输出：3
```

**提示：**

+ `0 <= nums.length <= 10^5`
+ `-10^9 <= nums[i] <= 10^9`

**要求**：算法的时间复杂度应为 O(n)。

## 解题思路

这道题的难点在于要求时间复杂度为 O(n)。如果直接使用排序，时间复杂度会达到 O(n log n)，不满足题目要求。我们需要一种更高效的方法。

### 哈希表法（最优解）

我们可以利用哈希表（在Python中是set）的O(1)查找特性来解决这个问题：

1. 将所有数字放入哈希集合中，便于O(1)时间检查数字是否存在
2. 遍历数组中的每个数字
3. 对于每个数字num，检查num-1是否在集合中：
    - 如果num-1存在，说明num不是连续序列的起点，跳过
    - 如果num-1不存在，说明num是一个连续序列的起点
4. 从num开始，不断检查num+1, num+2, ... 是否在集合中，计算序列长度
5. 更新最大长度

这种方法的精妙之处在于，我们只从连续序列的起点开始计算，避免了重复计算。每个数字最多被访问两次，因此总的时间复杂度是O(n)。

### 代码实现

```java
public int longestConsecutive(int[] nums) {
    Set<Integer> num_set = new HashSet<Integer>();
    for (int num : nums) {
        num_set.add(num);
    }

    int longestStreak = 0;

    for (int num : num_set) {
        // 查找这个数前面一个数是否存在，即num-1在序列中是否存在。
        // 存在那这个数肯定不是开头，直接跳过
        if (!num_set.contains(num - 1)) {
            int currentNum = num;
            int currentStreak = 1;
            // 计算从当前数字开始的连续序列长度
            while (num_set.contains(currentNum + 1)) {
                currentNum += 1;
                currentStreak += 1;
            }
			// 更新最大长度
            longestStreak = Math.max(longestStreak, currentStreak);
        }
    }

    return longestStreak;
}
```

