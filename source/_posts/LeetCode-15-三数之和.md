---
title: LeetCode-15.三数之和
sitemap: false
description: https://leetcode.cn/problems/3sum/description/
date: 2025-04-05 14:02:54
tags:
  - LeetCode
  - 双指针
  - 排序
categories: [LeetCode]
---

本文主要记录学习LeetCode15题的解题思路。

<!-- more -->

给你一个整数数组 nums ，判断是否存在三元组 [nums[i], nums[j], nums[k]] 满足 i != j、i != k 且 j != k ，同时还满足 nums[i] + nums[j] + nums[k] == 0 。请你返回所有和为 0 且不重复的三元组。

注意：答案中不可以包含重复的三元组。

**示例 1：**

> **输入：**nums = [-1,0,1,2,-1,-4]
> **输出：**[[-1,-1,2],[-1,0,1]]
> **解释：**
> nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0 。
> nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0 。
> nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0 。
> 不同的三元组是 [-1,0,1] 和 [-1,-1,2] 。
> 注意，输出的顺序和三元组的顺序并不重要。

**示例 2：**

> **输入：**nums = [0,1,1]
> **输出：**[]
> **解释：**唯一可能的三元组和不为 0 。

**示例 3：**

> **输入：**nums = [0,0,0]
> **输出：**[[0,0,0]]
> **解释：**唯一可能的三元组和为 0 。

**提示：**

+ 3 <= nums.length <= 3000
+ -105 <= nums[i] <= 105

## 解题思路

参考官方题解：https://leetcode.cn/problems/3sum/solutions/284681/san-shu-zhi-he-by-leetcode-solution/

## **核心思想**

**排序 + 双指针**
通过排序固定一个数，转化为两数之和问题，再用双指针高效查找。

## **关键步骤**

1. **排序数组**

    - 先对数组进行升序排序（`O(n log n)`），便于后续去重和双指针操作。

2. **遍历固定第一个数（`nums[i]`）**

    - 外层循环遍历 `i`（范围 `0` 到 `n-3`），固定 `nums[i]` 作为三数中的第一个数。
    - **去重**：若 `nums[i] == nums[i-1]`，跳过当前 `i`（避免重复解）。

3. **双指针查找剩余两数**

    - **初始化指针**：`left = i+1`，`right = n-1`。

    - **循环条件**：`left < right`，计算当前和 `sum = nums[i] + nums[left] + nums[right]`。

        - `sum == 0`：找到解，记录[nums[i], nums[left], nums[right]]

            + **去重**：跳过所有 `nums[left] == nums[left+1]` 和 `nums[right] == nums[right-1]` 的情况。

            - **移动指针**：`left++`，`right--`。

        - **`sum < 0`**：`left++`（需增大和）。

        - **`sum > 0`**：`right--`（需减小和）。

------

## 代码实现

```java
public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue; // 去重
        int left = i + 1, right = nums.length - 1;
        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];
            if (sum == 0) {
                res.add(Arrays.asList(nums[i], nums[left], nums[right]));
                while (left < right && nums[left] == nums[left + 1]) left++; // 去重
                while (left < right && nums[right] == nums[right - 1]) right--; // 去重
                left++;
                right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    return res;
}
```

