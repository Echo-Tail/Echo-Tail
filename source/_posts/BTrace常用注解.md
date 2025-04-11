---
title: BTrace常用注解
sitemap: false
date: 2025-04-11 21:20:16
tags:
  - BTrace
categories: [Java, BTrace]
---

本文主要记录 BTrace 的一些常用注解

<!-- more -->

## @BTrace

标记类为 `BTrace 脚本​`​，所有 BTrace 脚本必须包含此注解。

## @OnMethod

`指定要拦截的方法​​`
语法：`@OnMethod(clazz=<cname_spec>[, method=<mname_spec>]? [, type=<signature>]? [, location=<location_spec>]?)`

+ cname_spec = <class_name> | +<class_name> | /regex/
+ class_name 是一个完全限定的类名
+ +class_name 是以 "+"为前缀的完全限定类名；表示前缀类名的所有子类和实现者
+ /regex/ 是一个标准的正则表达式，用于识别类名
+ mname_spec = <method_name> | /regex/
+ method_name 是一个简单的方法名称（没有签名或返回类型）
+ signature = <return_type> ((arg_type(,arg_type)*)?
+ return_type 是在 java 中编写的方法返回类型（如 void、java.lang.String）。
+ arg_type 是用 Java 编写的参数类型

示例：
`@OnMethod(clazz="java.lang.Thread", method="start")`

## @Self

`​获取当前对象实例`​​（非静态方法可用）

## @Return

`​​获取方法返回值​`

## @Duration

`获取方法执行耗时​​`（纳秒）

## @Location

指定拦截点位置​​
可选值：
- `Kind.ENTRY`（方法入口）
- `Kind.RETURN`（方法返回）
- `Kind.THROW`（异常抛出）
- `Kind.LINE`（指定行号）

## @Field

`访问类/对象的字段​`

示例：
`@Field("name") String fieldName`

## 示例脚本

```java
@BTrace
public class SampleTracer {
    // 监控ArrayList的add方法
    @OnMethod(
        clazz="java.util.ArrayList", 
        method="add", 
        location=@Location(Kind.RETURN)
    )
    public static void onAdd(
        @Self Object self,
        @Return boolean result,
        @Duration long time
    ) {
        println("=== ArrayList.add() called ===");
        println(strcat("Class: ", name(classOf(self))));
        println(strcat("Time(ms): ", str(time / 1000000)));
        println(strcat("Result: ", str(result)));
    }

    // 每3秒打印JVM信息
    @OnTimer(3000)
    public static void onTimer() {
        println("=== System Info ===");
        println(strcat("Heap: ", str(heapUsage())));
        println(strcat("Threads: ", str(threadCount())));
    }
}
```

## 重要限制​​

禁止修改程序状态​​（只能只读观察）
​​不能创建新对象​​（除BTrace工具类外）
​​不能抛异常或捕获异常​​
​​不能调用实例方法​​（静态方法除外）

## 常用内置方法​

| 方法               | 用途                   |
| ------------------ | ---------------------- |
| `println()`        | 输出信息到BTrace控制台 |
| `str()`/`strcat()` | 字符串转换与拼接       |
| `jstack()`         | 打印堆栈跟踪           |
| `heapUsage()`      | 获取堆内存使用情况     |
| `threadCount()`    | 获取活动线程数         |

