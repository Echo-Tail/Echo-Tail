---
title: MAT中QQL语法使用教程
sitemap: false
date: 2025-05-24 09:28:52
tags: [MAT, QQL]
categories: [MAT]
---

本文主要记录 MAT（Memory Analyzer） 的 QQL（Object Query Language） 使用。

<!-- more -->

## 1. QQL语言在 MAT 中的作用

对象查询语言（OQL）是一种面向对象数据库的查询语言标准。了解到这即可，我们可以使用 SQL 查询的方式来在 MAT 中队 hprof 文件内的对象进行快速查询，从而快速定位问题。

## 2. QQL 语法

Memory Analyzer 内置了对象查询语言 (OQL)，允许使用自定义的类似 SQL 的查询语句来查询堆转储。只需将类视为表，将对象视为行，将字段视为列即可。基本语法如下：

```sql
SELECT * FROM [ INSTANCEOF ]	<class_name> [ WHERE <filter-expression>]
```

## 3. 基本查询语句

示例：查询所有类

```sql
select c from java.lang.Class c
```

## 4. 过滤条件查询

示例：查询名称包含"Service"的类

```sql
select c from java.lang.Class c where c.name.toString() like ".Service."
```

## 5. 继承关系查询

示例：查询所有继承自AbstractList的类

```sql
select c from java.lang.Class c where c extends java.util.AbstractList
```

## 6. 方法查询

示例：查询返回类型为String且参数为空的方法

```sql
select m from java.lang.reflect.Method m where m.returnType.name = "java.lang.String" and m.parameterTypes.length = 0
```

## 7. 字段查询

示例：查询所有静态字段

```sql
select f from java.lang.reflect.Field f where f.modifiers.toString().contains("static")
```

## 8. 对象引用查询

示例：查询引用特定字符串的对象

```sql
select ref from java.lang.Object ref where ref.toString() = "testString"
```

## 9. 堆内存分析

示例：查询占用内存最大的10个对象

```sql
select top 10 heap.objects("java.lang.Object", false, 10, "sizeof(o) desc")
```

## 10. 线程分析

示例：查询所有线程及其栈信息

```sql
select t, t.stackTrace from java.lang.Thread t
```

## 11. 集合分析

示例：查询ArrayList的大小分布

```sql
select l.size() from java.util.ArrayList l
```

## 12. 对象关系图

示例：查询对象引用链

```sql
select referrers(o) from java.lang.Object o where o.toString() = "targetObject"
```

## 13. 内存泄漏检测

示例：查询可能的内存泄漏对象

```sql
select o from java.lang.Object o where o.@retainedHeapSize > 1000000
```

## 14. 类加载器查询

示例：查询所有类加载器及其加载的类

```sql
select cl, cl.classes from java.lang.ClassLoader cl
```

这些QQL查询语句覆盖了MAT工具中最常用的分析场景，可以根据实际需求进行调整和组合使用。


****
## 参考文章

+ [Object Query Language](https://www.ibm.com/docs/en/networkmanager/4.2.0?topic=reference-object-query-language)
+ [OQL Syntax](https://help.eclipse.org/latest/index.jsp?topic=%2Forg.eclipse.mat.ui.help%2Freference%2Foqlsyntax.html)