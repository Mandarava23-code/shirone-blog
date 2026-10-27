---
title: pwntools语法
date: 2026-08-02 20:35:47
categories: PWN
---

## 框架

```Python
from pwn import * #导入pwntools模块
```

```Python
context(arch = 'i386', os = 'linux') #设置目标机的信息
```

```Python
r = remote('exploitme.example.com', 31337)
'''
用来建立一个远程连接，url或ip作为地址，然后指明端口
这里也可以仅仅是用本地文件，调式时更方便
'''
r = process("./pwn") #pwn即为文件名，这使得改变远程和本地十分方便
```

```Python
asm(shellcraft.sh())
'''
asm()函数接收一个字符串作为参数，得到汇编码的机器代码
例如：
>>> asm('mov eax, 0')
'\xb8\x00\x00\x00\x00'
shellcraft模块是shellcode的模块，包含一些生成shellcode的函数
其中的子模块声明架构，比如shellcraft.arm是ARM架构的、shellcraft.i386是Intel 80386架构的、以及有一个shellcraft.common是所有架构通用的
如果已经设置了上下文架构，即context中的arch，则功能函数可以省略架构声明,因为shellcraft会自动指向对应的架构模块
所以这里的shellcraft.sh()则是执行/bin/sh的shellcode，完整调用应该是shellcraft.amd64.sh()
'''
```

```Python
r.send() #将shellcode发送到远程连接
```

>[!note] send与sendline  
>sendline和send的区别在于多一个换行符`\n`，什么时候必须使用sendline？当程序用`gets()`、`scanf()`这类**等待换行符才能结束输入**的函数读取时，如果没有`\n`，程序会一直阻塞等待输入结束

```Python
r.interactive() #将控制权交给用户
```

## Context设置

`context`是pwntools用来设置环境的功能。在很多时候，由于二进制文件的情况不同，我们可能需要进行一些环境设置才能够正常运行exp，比如有一些需要进行汇编的情况，但是32位和64位的汇编不同，如果不设置context会导致一些问题  
一般来说我们设置context只需要简单的一句话：
```Python
context(os = 'linux', arch = 'amd64', log_level = 'debug')
```
这句话的意思是：
1. os设置系统为linux系统，在完成CTF题目的时候，大部分pwn题目的系统都是linux
2. arch设置架构为amd64，可以简单的认为设置为64位的模式，对应的32位模式位'i386'
3. log_level设置日志输出的等级为debug，这句话在调试的时候一般会设置，这样pwntools会将完整的IO过程都打印下来，使得调试更加方便，可以避免在完成CTF题目时出现一些和IO相关的错误

## 数据打包

数据打包，即将整数值转换为32位或者64位地址一样的表示方式，比如0x40010表示为\x10\x00\x40一样，这使得我们构造payload变得方便，用法：
- `p32/p64`：打包一个整数，分别打包为32位或64位
- `u32/u64`：解包一个字符串，得到整数
```Python
payload = p32(0xdeadbeaf) #pack 32 bits number
```

## 数据输出

如果需要输出一些信息，最好使用pwntools自带的，因为和pwntools本来的格式吻合，看起来也比较舒服，用法：
```Python
some_str = "hello,world"
log.info(some_str)
```
其中的info代表的是log等级，也可以使用其他log等级

## Cyclic Pattern

Cyclic pattern是一个强大的功能，大概意思就是，使用pwntools生成一个pattern，pattern就是指一个字符串，而这个字符串<mark style="background: #FF5582A6;">每四个字节（32位系统）都是唯一</mark>的特殊字符串，**任意截取连续的4个字节都是独一无二的**，所以可以通过其中的一部分数据去定位到他在这个字符串中的位置（**cyclic 的内容是 ASCII 可打印字符**，所以最终地址永远会落在用户态地址范围内，而不会和程序代码段重合，所以大概率不可执行）  
在我们完成栈溢出题目的时候，使用pattern可以大大的减少计算溢出点的时间。用法：
```Python
cyclic(0x100) #生成一个0x100大小的pattern，即一个特殊的字符串
cyclic_find(0x61616161) #找到该数据在pattern中的位置（或者cyclic -l 0x61616161）
cyclic_find('aaaa') #查找位置也可以使用字符串去定位
```
比如，我们在栈溢出的时候，首先构造`cyclic(0x100)`，或者更长长度的pattern，进行输入，输入后pc的值变为了0x61616161，那么我们通过`cyclic_find(0x61616161)`，就可以得到从哪一个字节开始会控制pc寄存器了，避免了很多没必要的计算

## 汇编与shellcode

有时我们需要在写exp的时候用到简单的shellcode，pwntools提供了简单shellcode的支持，最常用的也是最简单的shellcode：  
`shellcraft`：shellcode的生成器，即调用`/bin/sh`可以通过shellcraft得到  
并且调用shellcraft时最好先设置好context，如果没声明则需要  
32位：`shellcraft.i386.linux.sh()`  
64位：`shellcraft.amd64.linux.sh()`
```Python
print(shellcraft.sh()) #打印出shellcode
```
不过我们看到的shellcode还是汇编代码，不是能使用的机器码，所以还需要一次汇编
```Python
print(asm(shellcraft.sh())) #打印出汇编后的shellcode
```
asm可以对汇编代码进行汇编，不过pwntools目前的asm实现有一些缺陷，比如不能支持相对跳转等等，只能进行简单的汇编操作，如果需要更复杂的一些汇编功能，可以使用Keystone-engine项目  
asm也是架构相关，所以一定要先设置context，避免一些意想不到的错误

## ELF文件操作

```Python
In [1]: from pwn import *
In [2]: elf = ELF('./pwn')
[*] '/home/pwn'
    Arch:     amd64-64-little
    RELRO:    No RELRO
    Stack:    No canary found
    NX:       NX enabled
    PIE:      No PIE(0x400000)
In [3]: callsys_addr = elf.symbols['callsystem']
In [4]: print callsys_addr
4195734
In [6]: a = hex(callsys_addr)
In [7]: print a
0x400596
```
可见python时，ELF相当于checksec，但其主要是获取信息，一些地址等
```Python
>>> e = ELF('/bin/cat') #加载任意二进制文件，并解析成一个Python对象
>>> print hex(e.address) #文件装载的基地址
0x400000
>>> print hex(e.symbols['write']) #函数地址，symbols，got，plt均是列表
0x401680
>>> print hex(e.got['write']) #GOT表的地址
0x60b070
>>> print hex(e.plt['write']) #PLT表的地址
0x401680
>>> print hex(e.search('/bin/sh').next()) #字符串/bin/sh的地址字符串加()
```
