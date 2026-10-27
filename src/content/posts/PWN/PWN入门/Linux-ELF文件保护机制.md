---
title: Linux ELF文件保护机制
date: 2026-07-23 21:47:37
categories: PWN
---

Linux ELF文件的保护机制主要有四种：Canary、NX、PIE、RELRO

## 一、Canary

Linux Canary是一种用于检测缓冲区溢出漏洞的安全机制，它在函数返回值之前添加的一串随机数（不超过机器字长）（也叫做cookie），末位为`/x00`（提供了覆盖最后一字节输出泄露Canary的可能）。如果出现缓冲区溢出攻击，覆盖内容覆盖到Canary处，就会改变原本该处的数值。<mark style="background: #FF5582A6;">当程序执行到此处时，会检查Canary值是否跟开始的值一样，如果不一样，程序会崩溃，从而达到保护返回地址的目的</mark>。Canary的确切位置会因为系统不同和编译器而异，但<mark style="background: #FF5582A6;">通常存储在栈帧的底部，位于局部变量和函数的返回地址之间</mark>，以防止缓冲区溢出攻击。

## 二、NX

NX即**No-eXecute**(不可执行)的意思，NX(DEP)的基本原理是<mark style="background: #FF5582A6;">将数据所在内存页标识为不可执行，当程序溢出成功转入shellcode时，程序会尝试在数据页面上执行指令，此时CPU就会抛出异常，而不是去执行恶意指令</mark>。

>[!info]  
>这里的“标识”，指的是内存页表项中的一个比特位。在x86架构中叫NX位；而ARM架构中叫XN

正常在栈溢出时通过跳转指令跳转至shellcode，但是NX开启后CPU会对数据区域进行检查，当发现正常程序不执行，并跳转至其他地址后会抛出异常，接下来不会继续执行shellcode，而是去转入异常处理，处理后会禁止shellcode继续执行。  

>[!note]  
>NX所做的就是将栈的权限改为可读写（RW），但是不可执行，当你把shellcode直接写在栈上时，由于NX的存在，运行shellcode时程序会直接崩溃终止  

//绕过的方法就是ROP（面向返回编程）

## 三、PIE（ASLR）

PIE（Position-Independent Executable）是让<mark style="background: #FF5582A6;">程序自身</mark>随机化，如代码段`.text`、数据段`.data`,`.bss`；ASLR（address space layout randomization）是让<mark style="background: #FF5582A6;">外部环境</mark>随机化，如共享库`libc`、栈、堆、`mmap`区域。

一般情况下，NX和ASLR会同时启用。ASLR有三种情况：
- 0 - 表示关闭进程地址空间随机化
- 1 - 表示将mmap的基地址，栈基地址和.so地址随机化
- 2 - 表示在1的基础上，增加heap的地址随机化

***该保护能够使每次运行的程序地址发生改变，防止根据固定地址来编写exp执行攻击***

## 四、RELRO

Relocation Read-Only (RELRO)可以使程序某些部分成为<mark style="background: #FF5582A6;">只读</mark>的。它分为两种:**Partial RELRO**和**Full RELRO**，即：**部分RELRO**和**完全RELRO**。

- 部分RELRO：GCC的默认设置，使.got表只读，几乎所有的二进制文件都至少使用部分RELRO，但这样仅能防止全局变量上的缓冲区溢出导致的.got表覆盖
- 完全RELRO：整个GOT只读，从而无法被覆盖，但这样会大大增加程序的启动时间，因为程序在启动之前需要解析所有的符号

## 五、FORTIFY

fortify是轻微的检查，用于检查是否存在缓冲区溢出的错误。适用于程序采用大量的字符串或者内存操作函数，如：
- memcpy()
- memset()
- strcpy()
- strcat()
- sprintf()
- vsprintf()
- gets()

`FORTIFY_SOURCE`只能检查简单、直接、编译器“能够看见”的越界，而且<mark style="background: #FF5582A6;">当检查到缓冲区溢出时，程序会直接崩溃并终止，不仅仅是停止写入</mark>。
