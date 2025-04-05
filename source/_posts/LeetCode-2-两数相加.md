---
title: LeetCode-2.两数相加
description: https://leetcode.cn/problems/add-two-numbers/
sitemap: false
date: 2025-04-05 17:30:10
tags:
  - LeetCode
  - 链表
categories: [LeetCode]
---

本文主要记录学习LeetCode2题的解题思路。

<!-- more -->

给你两个 非空 的链表，表示两个非负的整数。它们每位数字都是按照 逆序 的方式存储的，并且每个节点只能存储 一位 数字。

请你将两个数相加，并以相同形式返回一个表示和的链表。

你可以假设除了数字 0 之外，这两个数都不会以 0 开头。

**示例 1：**

> **输入：** l1 = [2,4,3], l2 = [5,6,4]
**输出：** [7,0,8]
**解释：** 342 + 465 = 807.

**示例 2：**

> **输入：**l1 = [0], l2 = [0]
**输出：** [0]

**示例 3：**

> **输入：** l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]
**输出：** [8,9,9,9,0,0,0,1]

**提示：**

+ 每个链表中的节点数在范围 `[1, 100]` 内 
+ `0 <= Node.val <= 9`
+ 题目数据保证列表表示的数字不含前导零

## 解题思路

​1. ​模拟竖式加法​​：
+ 同步遍历两个链表，逐位相加，记录进位（carry）。
+ 注意处理链表长度不一致的情况（短链表补零）。

​2. ​进位处理​​：
+ 最后一位相加可能产生新的进位（如 999 + 1 = 1000），需额外添加节点。

## 代码实现

```java
public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0); // 虚拟头节点
    ListNode curr = dummy;
    int carry = 0;
    while (l1 != null || l2 != null || carry != 0) {
        int sum = carry;
        if (l1 != null) { sum += l1.val; l1 = l1.next; }
        if (l2 != null) { sum += l2.val; l2 = l2.next; }
        carry = sum / 10;
        curr.next = new ListNode(sum % 10);
        curr = curr.next;
    }
    return dummy.next;
}
```