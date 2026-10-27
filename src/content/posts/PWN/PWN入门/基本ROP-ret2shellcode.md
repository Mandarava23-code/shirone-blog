---
title: 基本ROP-ret2shellcode
date: 2026-08-07 18:16:21
categories: PWN
---

## 原理

ret2shellcode，即控制程序执行shellcode代码。shellcode指的是完成某个功能的汇编代码，常见的功能主要是获取目标系统的shell。**一般来说，shellcode需要我们自己填充。这其实是另外一种典型的利用方法，即此时我们需要自己去填充一些可执行的代码**

## 利用前提

1. 程序存在溢出，并且还要能够控制返回地址
2. 程序运行时，shellcode所在区域要拥有执行权限（NX保护关闭、bss段可执行）
3. 操作系统还需要关闭ASLR（地址空间布局随机化）保护

## 攻击步骤

1. 先使用cyclic测试出溢出点，构造初步的payload
2. 确定程序中的溢出位，看是否可在bss段传入数据
3. 使用GDB的vmmap查看进程的完整内存布局（一般用户提交的变量在bss段中）
4. 先发送为shellcode的数据写入到bss段
5. 将程序溢出到上一步用户提交变量的地址

## 示例

>[!info] .bss段不可执行  
>在现在较高版本的Ubuntu上，.bss段权限已经被设定为不可执行。所以shellcode在.bss段上的已经无法成功攻击了  
>但是`mprotect()`函数可以动态修改.bss段属性，使得.bss段恢复可执行权限

>[!info] str.ljust()函数  
>语法：  
>`str.ljust(width[, fillchar])`  
>简单来说，str.ljust()函数其实就是使用fillchar将str补齐为width长度个字符
