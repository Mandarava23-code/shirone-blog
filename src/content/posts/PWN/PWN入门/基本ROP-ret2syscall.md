---
title: 基本ROP-ret2syscall
date: 2026-08-09 21:43:23
categories: PWN
---

## 原理

ret2syscall就是<mark style="background: #FF5582A6;">调用系统函数</mark>以达到getshell的目的  
在计算机中，系统调用是一种编程方式，计算机程序从该程序中向执行其的操作系统内核请求服务，这可能包括与硬件相关的服务（例如，访问硬盘驱动器），创建和执行新进程以及诸如进程调度之类的集成内核服务进行通信。系统调用提供了进程与操作系统之间的基本接口  
因此，我们要做的是：让程序调用execve("/bin/sh", NULL, NULl)函数即可拿到shell

## 攻击步骤

调用此函数的具体步骤如下（32位）：
- <mark style="background: #FF5582A6;">eax应该为0xb</mark>
- <mark style="background: #FF5582A6;">ebx应该指向/bin/sh的地址，其实执行sh的地址也可以</mark>
- <mark style="background: #FF5582A6;">ecx应该为0</mark>
- <mark style="background: #FF5582A6;">edx应该为0</mark>
- <mark style="background: #FF5582A6;">执行int 0x80触发中断即可执行execve()获取shell</mark>  
系统在运行的时候会使用以上4个寄存器，所以上面的内容我们也可以写为int 0x80(eax, ebx, ecx, edx)。只要我们把对应获取shell的系统调用参数放到对应寄存器中，那么我们再执行int 0x80就可以执行对应的系统调用  

而我们如何控制这些寄存器的值？  
在学习汇编函数时，最常用的就是push、pop、ret指令，而这里我们将使用pop和ret的组合来控制寄存器的值以及执行方向
```
pop eax #系统调用号载入，execve为0xb
pop ebx #第一个参数，/bin/sh的string
pop ecx #第二个参数，0
pop edx #第三个参数，0
```
这样，寄存器的值就可以控制了，然后使用gadgets让这一连串的pop命令顺序连接执行，最后使用的ret指令，进而控制程序执行流程

## 示例

>[!info] NX保护  
>当NX保护开启时，就表示题目给了你全部system("/bin/sh")或部分"/bin/sh"；如果关闭，表示需要你自己去构造shellcode(ret2shellcode)

在寻找这些gadgets时我们常使用ROPgadgets这个工具
```
ROPgadgets --binary ./pwn --only 'pop|ret' | grep 'eax'
ROPgadgets --binary ./pwn --string '/bin/sh'
```

>[!info] 系统调用号  
>在Linux中，每个系统调用被赋予一个系统调用号。这样，通过独一无二的号就可以关联系统调用。当用户空间的进程执行一个系统调用的时候，这个系统调用号就用来指明到底是要执行哪个系统调用；进程不会提及系统调用的名称

>[!info] pwntools中的`flat()`函数  
>`flat()`函数用于将多个数据拼接成字节串，适合构造ROP链、格式化字符串payload或任意二进制数据

解析payload中的`flat(['a' * 112, pop_eax_ret, 0xb, pop_edx_ecx_ebx_ret, 0, 0, bin_sh, int_0x80])`  
通过`flat()`函数将这些数据拼接成字节串。首先，这里的‘a’ * 112就是很明显的缓冲区溢出覆盖到返回地址。然后分析堆栈及地址对应指令  
{% asset_img Pasted_image_20260814042819.png %}  
可以看见，通过112字节a的覆盖，接下来ret的数据是[pop_eax_ret]，也就是说，我们执行了这个地址中的指令，然后将esp+4，指向0xb。而[pop_eax_ret]中的指令则是pop eax，所以我们会将当前esp指向的0xb弹栈到eax中，并将esp+4，指向[pop_edx_ecx_ebx_ret]，紧接着执行ret。此时同上，执行这个地址中的指令，接着esp+4，由此可知，我们将0弹栈道edx，0弹栈到ecx，[bin_sh]中存储的字符串"/bin/sh"弹栈到ebx中。最后直接执行`int 0x80`触发系统调用，完成ret2syscall攻击
