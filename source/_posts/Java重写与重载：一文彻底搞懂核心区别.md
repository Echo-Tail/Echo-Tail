---
title: Java重写与重载：一文彻底搞懂核心区别
description: 
sitemap: false
date: 2026-03-18 20:11:10
tags: [Java, 面试]
categories: [面试]
---

本文主要记录 Java 中重载与重写的区别。

<!-- more -->

## 🌟 一句话灵魂总结

- **重载（Overload）**：**同一个类**里“同名不同参”的方法们（编译时决定）  
- **重写（Override）**：**父子类之间**“签名完全相同”的方法覆盖（运行时动态绑定）

------

## 🔍 方法重载（Overload）—— “一词多义”的编译时多态

### ✅ 核心规则

- **位置**：必须在**同一个类**中
- **方法名**：必须相同
- **参数列表**：**必须不同**（类型/数量/顺序任一不同）
- **返回类型**：可不同（但**不能仅靠返回类型区分**！）
- **访问修饰符/异常**：无限制
- **多态类型**：**编译时多态**（静态绑定）

### 💡 代码示例

```java
public class Calculator {
    
    // 重载1：两个int参数
    public int add(int a, int b) {
        return a + b;
    }
    
    // 重载2：参数类型不同（double）
    public double add(double a, double b) {
        return a + b;
    }
    
    // 重载3：参数数量不同
    public int add(int a, int b, int c) {
        return a + b + c;
    }
    
    // 重载4：参数顺序不同（谨慎使用！可读性差）
    public void print(String name, int age) {
        System.out.println(name + " is " + age);
    }
    public void print(int age, String name) {
        System.out.println(age + " years old: " + name);
    }
    
    // ❌ 编译错误！仅返回类型不同不能构成重载
    // public String add(int a, int b) { return ""; } 
}
```

### 🌰 使用场景

```java
Calculator calc = new Calculator();
calc.add(2, 3);        // 调用 int add(int, int)
calc.add(2.5, 3.1);    // 调用 double add(double, double)
calc.add(1, 2, 3);     // 调用 int add(int, int, int)
```

------

## 🦁 方法重写（Override）—— “青出于蓝”的运行时多态

### ✅ 核心规则

- **位置**：**子类重写父类**方法
- **方法签名**：**必须完全一致**（方法名+参数列表）
- **返回类型**：相同 或 **协变返回**（子类返回类型是父类返回类型的子类）
- **访问修饰符**：**不能更严格**（如父类`protected` → 子类不能`private`）
- **异常**：不能抛出**新的/更广的检查异常**
- **关键注解**：强烈建议加 `@Override`（编译器校验，防手误！）
- **多态类型**：**运行时多态**（动态绑定）

### 💡 代码示例

```java
// 父类
class Animal {
    public void makeSound() {
        System.out.println("Animal makes a sound");
    }
    
    public Animal createOffspring() {
        return new Animal();
    }
    
    // private/final/static 方法不能被重写！
    private void secret() {}
    final void fixed() {}
    static void staticMethod() {}
}

// 子类
class Dog extends Animal {
    
    @Override // 安全卫士！写错方法名/参数会直接编译报错
    public void makeSound() { // 访问修饰符可更宽松（如父类protected→子类public）
        System.out.println("Dog barks: Woof!");
    }
    
    // 协变返回：返回类型是父类返回类型的子类
    @Override
    public Dog createOffspring() { 
        return new Dog();
    }
    
    // ❌ 编译错误！缩小访问权限
    // private void makeSound() {}
    
    // ❌ 编译错误！抛出更广的检查异常
    // @Override
    // public void makeSound() throws Exception {}
}
```

### 🌰 多态演示

```java
Animal myPet = new Dog(); // 向上转型
myPet.makeSound(); 
// 输出: Dog barks: Woof! （运行时根据实际对象类型调用）
```

------

## 📊 终极对比表（建议收藏！）

| 维度               | 方法重载（Overload）                    | 方法重写（Override）      |
| ------------------ | --------------------------------------- | ------------------------- |
| **发生位置**       | 同一个类内                              | 父子类之间                |
| **参数列表**       | **必须不同**                            | **必须相同**              |
| **返回类型**       | 无关（不能仅靠它区分）                  | 相同 或 协变返回          |
| **访问修饰符**     | 无限制                                  | 不能比父类更严格          |
| **异常**           | 无限制                                  | 不能抛出新/更广的检查异常 |
| **多态时机**       | 编译时（静态绑定）                      | 运行时（动态绑定）        |
| **关键注解**       | 无                                      | `@Override`（强烈推荐）   |
| **设计目的**       | 提供多种调用方式                        | 扩展/修改父类行为         |
| **能否重写static** | ❌（static方法属于类，可“隐藏”但非重写） | ❌                         |

------

## ⚠️ 高频误区避坑指南

1. **“返回类型不同就是重载？”**
    → 错！仅返回类型不同会导致编译错误（如前面Calculator示例）。

2. **“子类写个同名static方法叫重写？”**
    → 错！static方法属于类，子类同名方法是**隐藏（Hiding）**，非重写。调用时看引用类型：

    ```java
    Animal.staticMethod(); // 调用Animal的static
    Dog.staticMethod();    // 调用Dog的static
    ```

3. **“private/final方法能重写？”**
    → 不能！编译直接报错。它们在子类中是“新方法”，与父类无关。

4. **“不加@Override会怎样？”**
    → 可能手误写错方法名/参数，导致“本想重写却变成重载”，逻辑错误难排查！**务必加！**

------

## 💎 总结与思考

| 场景                         | 该用谁？                     |
| ---------------------------- | ---------------------------- |
| 同一个类需要多种参数调用方式 | ✅ 重载                       |
| 子类需要定制父类行为         | ✅ 重写                       |
| 想实现“接口统一，实现各异”   | ✅ 重写（配合多态）           |
| 构造函数提供多种初始化方式   | ✅ 重载（构造函数不能重写！） |

> **记住这个比喻**：
> 📚 **重载** = 同一个人有多个“技能”（同一类多种方法）
> 🌱 **重写** = 孩子继承并“改良”了父母的技能（子类优化父类方法）

理解重载与重写，是掌握Java多态、设计模式的基石。下次写代码时，不妨自问一句：
❓“我这是在扩展功能（重载），还是在定制行为（重写）？”

------

**互动时间**：你在项目中遇到过因混淆重载/重写导致的Bug吗？欢迎在评论区分享～
✨ 觉得有收获？点赞+收藏，下期聊聊《Java中equals与==的终极辨析》！

