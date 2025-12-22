---
title: 写一个Singleton示例
sitemap: false
date: 2025-12-22 15:26:12
tags: [单例, 面试, Java, Singleton]
categories: [面试]
---

本文主要记录在 Java 中单例的写法。

<!-- more -->

## 什么是Singleton

+ Singleton：在 Java 中指单例设计模式，它是软件开发中最常用的设计模式之一
+ 单：唯一
+ 例：实例

+ 单例设计模式，即某个类在整个系统中只能有一个实例对象被获取和使用的代码模式。
+ 例如：代表 JVM 运行环境的 Runtime 类。

## 几种常见形式

+ 饿汉式：直接创建对象，不存在线程安全问题
    + 直接实例化饿汉式（简洁直观）
    + 枚举式（最简洁）
    + 静态代码块饿汉式（适合复杂实例化）
+ 懒汉式：延迟创建对象
    + 线程不安全（适用于单线程）
    + 线程安全（适用于多线程）
    + 静态内部类形式（适用于多线程）

### 饿汉式

直接实例化：

```java
/**
 * 饿汉式单例
 * 直接创建实例对象，不管你是否需要这个对象
 *
 * (1) 构造器私有化
 * (2) 自行创建，并且用静态变量保存
 * (3) 向外提供这个实例
 * (4) 强调这是一个单例，我们可以用final修饰
 */
public class Singleton1 {
    public static final Singleton1 INSTANCE = new Singleton1();
    private Singleton1() {}
}
```

枚举单例：

```java
/**
 * 枚举单例
 */
public enum Singleton2 {
    INSTANCE
}
```

静态代码块单例：

```java
/**
 * 静态代码块单例
 */
public class Singleton3 {
    public static final Singleton3 INSTANCE;
    static {
        INSTANCE = new Singleton3();
    }
    private Singleton3() {}
}
```

### 懒汉式

线程不安全：

```java
/**
 * 懒汉式单例
 *   延迟创建这个实例对象
 *
 * (1) 构造器私有化
 * (2) 拥有一个静态变量保存这个实例对象
 * (3) 提供一个静态方法，获取这个实例对象
 * (4) 线程不安全
 */
public class Singleton4 {
    static Singleton4 instance;
    private Singleton4() {}

    public static Singleton4 getInstance() {
        if (instance == null) {
            instance =  new Singleton4();
        }
        return instance;
    }
}
```

线程安全：

```java
/**
 * 懒汉式单例
 *   延迟创建这个实例对象
 *   线程安全, volatile防止指令重排
 */
public class Singleton5 {
    static volatile Singleton5 instance;
    private Singleton5() {}

    public static Singleton5 getInstance() {
        if (instance == null) {
            synchronized (Singleton5.class) {
                if (instance == null) {
                    instance = new Singleton5();
                }
            }
        }
        return instance;
    }
}
```

静态内部类单例：

```java
/**
 * 懒汉式单例
 *   延迟创建这个实例对象
 *   线程安全
 */
public class Singleton6 {
    private Singleton6() {}

    public static Singleton6 getInstance() {
        return SingletonHolder.INSTANCE;
    }

    private static class SingletonHolder {
        private static final Singleton6 INSTANCE = new Singleton6();
    }
}
```

