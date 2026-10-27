---
title: PWN中常见的C语言函数简析
date: 2026-10-12 20:19:29
categories: PWN
---

## read函数

`read` 是 Linux 系统调用，用于从文件描述符读取数据

### 函数定义与参数说明

```c
#include <unistd.h>
ssize_t read(int fd, void *buf, size_t count);
```
- `fd`：文件描述符，表示需要读取的文件或设备。通常通过`open`函数获取
    - 常见值：`0` = stdin, `1` = stdout, `2` = stderr
- `buf`：指向用户分配的缓冲区，用于存储读取到的数据，即读入数据存放的内存地址
    - 常见值：任意可写地址
- `count`：期望读取的字节数，表示最多读取 `count` 个字节
    - 常见值：正整数  
**返回值**：
- 成功时，返回实际读取的字节数。如果返回值为 `0`，表示已到达文件末尾
- 失败时，返回 `-1`，并设置 `errno` 指示具体错误  
**关键语义**：
- `count` 是上限，不是保证值。`read` 可能只读取部分字节就返回，比如<mark style="background: #FF5582A6;">终端输入遇到换行符</mark>

### x86-64系统调用约定

`read` 是系统调用，不是普通函数。Linux x86-64下，系统调用 `syscall` 指令，参数放在寄存器中：

| 寄存器 | 参数              |
| --- | --------------- |
| rax | 系统调用号(read = 0) |
| rdi | fd              |
| rsi | buf             |
| rdx | count           |

## write函数

`write` 是 Linux 系统调用，用于向文件描述符写入数据，不追加 `\n`

### 函数定义与参数说明

```c
#include <unistd.h>
ssize_t write(int fd, const void *buf, size_t count);
```
- `fd`：文件描述符，表示需要读取的文件或设备
- `buf`：指向待写入数据的内存地址
- `count`：最多写入的字节数  
**返回值**：
- 成功时，返回实际写入的字节数，可能小于 `count`
- 失败时，返回 `-1`，并设置 `errno`  
**关键语义**：
- `count` 是上限，不是保证值。`write` 可能只写入部分字节就返回，例如达到文件大小限制

### x86-64系统调用约定

`write` 是系统调用，不是普通函数。Linux x86-64下，系统调用 `syscall` 指令，参数放在寄存器中：

| 寄存器 | 参数               |
| --- | ---------------- |
| rax | 系统调用号(write = 1) |
| rdi | fd               |
| rsi | buf              |
| rdx | count            |

### 注意点

PWN中泄露地址时，`count` 通常取 `8`，接收端按语义处理 `recv(8)`，因为数据量小、缓冲区充足，实际上通常写满，且 `write` 不遇 `\x00` 停止、不加换行

## puts函数

`puts` 用于输出以 `\x00` 结尾的字符串，并自动追加 `\n`

### 函数定义与参数说明

```c
#include <stdio.h>
int puts(const char *s);
```
- `s`：指向以 `\x00` 结尾的字符串  
**返回值**：
- 成功时，返回非负值
- 失败时，返回EOF（即 `-1`）  
**关键语义**：
- 从 `s` 开始逐字节输出，遇到 `\x00` 停止
- 在输出内容后追加 `\n`

### x86-64函数调用约定

`puts` 是普通函数，参数放在寄存器中：

| 寄存器 | 参数  |
| --- | --- |
| rdi | s   |

### 注意点

PWN中泄露 64 位地址时，因高2字节为 `\x00`，而 `puts` 遇 `\x00` 停止，所以只会泄露6字节的有效地址，则接收端应 `recv(6).ljust(8, b'\x00')` 补零

## gets函数

`gets` 是 libc 函数，从 stdin 读取一行字符串，直到遇到换行符或EOF，但**不检查缓冲区大小**

### 函数定义与参数说明

```c
#include <stdio.h>
char *gets(char *s);
```
- `s`：读入数据存放的内存地址  
**返回值**：
- 成功时，返回 `s`
- 失败或遇到EOF时，返回 `NULL`  
**关键语义**：
- 从 stdin 逐字节读取，直到遇到 `\n` 或EOF
- 遇到 `\n` 时，`\n` 被读取并替换为 `\x00`
- 不检查缓冲区大小
- 不保留 `\n`

### x86-64函数调用约定

`gets` 是普通函数，参数放在寄存器中：

| 寄存器 | 参数  |
| --- | --- |
| rdi | s   |

## system函数

`system` 是 libc 函数，用于执行 shell 命令

### 函数定义与参数说明

```c
#include <stdlib.h>
int system(const char *command);
```
- `command`：要执行的命令字符串  
**返回值**：
- 成功时，返回命令的退出状态（通常为 `0` 表示成功）
- 失败时，返回 `-1`  
**关键语义**：
- 内部调用 `fork` + `execve("/bin/sh", ["sh", "-c", command], ...)`
- 参数是字符串指针，而不是字符串本身
- 需要 `/bin/sh` 字符串存在于可访问内存
- <mark style="background: #FF5582A6;">内部有 movaps 指令，要求 rsp 16字节对齐，否则崩溃</mark>

### x86-64 函数调用约定

`system` 是普通函数，参数放在寄存器中：

| 寄存器 | 参数      |
| --- | ------- |
| rdi | command |

### 注意点

PWN中getshell时用 `system("/bin/sh")`，若libc中无 `/bin/sh`，可考虑 `gets`/`read` 将其写入bss段再 `system(bss)`。ret2libc时需在 `system` 前加 `ret` gadget来调整栈对齐

## execve函数

### 函数定义与参数说明

```c
#include <unistd.h>
int execve(const char *pathname, char *const argv[], char *const envp[]);
```
- `pathname`：指向以 `\x00` 结尾的字符串，表示要执行的程序路径
- `argv`：指向一个以 `NULL` 结尾的指针数组，表示传给新程序的参数列表
    - `argv[0]`：程序名本身
    - 常见值：`["/bin/sh", NULL]` 表示程序名是/bin/sh，没有其他参数
- `envp`：指向一个以 `NULL` 结尾的指针数组，表示传给新程序的环境变量
    - 常见值：`NULL` 表示不传任何环境变量  
**返回值**：
- 成功时，不返回（当前进程的代码、数据、堆、栈全部被新程序替换，`execve` 之后的代码永远不会执行）
- 失败时，返回 `-1`，并设置 `errno`  
**关键语义**：
- 成功不返回，进程映像被新程序替换
- `argv` 和 `envp` 可以为 `NULL`
- `pathname` 必须是有效路径，否则 `execve` 返回 `-1`

### x86-64 系统调用约定

`execve` 是系统调用，Linux x86-64 下用 `syscall` 指令触发，参数放在寄存器中：

| 寄存器 | 参数                 |
| --- | ------------------ |
| rax | 系统调用号(execve = 59) |
| rdi | pathname           |
| rsi | argv               |
| rdx | envp               |

### 注意点

PWN中shellcode用 `execve("/bin/sh", 0, 0)` 起shell

## mprotect函数

`mprotect` 是 Linux 系统调用，用于修改内存页权限，PWN中主要用于让栈可执行

### 函数定义与参数说明

```c
#include <sys/mman.h>
int mprotect(void *addr, size_t len, int prot);
```
- `addr`：起始地址，**必须页对齐**（通常是 `0x1000` 的倍数）
- `len`：长度，**通常为页大小的倍数**
- `prot`：权限
    - 常见值：`7` = PROT_READ | PROT_WRITE | PROT_EXEC（RWX）  
**返回值**：
- 成功时，返回 `0`
- 失败时，返回 `-1`，并设置 `errno`

### x86-64 系统调用约定

`mprotect` 是系统调用，Linux x86-64 下用 `syscall` 指令触发，参数放在寄存器中：

| 寄存器 | 参数                   |
| --- | -------------------- |
| rax | 系统调用号(mprotect = 10) |
| rdi | addr                 |
| rsi | len                  |
| rdx | prot                 |

## 原始字节 与 文本

在pwn题中一般是两大类输入方式

### A.原始字节输入（发bytes）  

程序直接把这些字节写进内存，不解析内容：  

| 函数                   | 说明         |     |
| -------------------- | ---------- | --- |
| read(0, buf, n)      | 读n字节原始数据   |     |
| gets(buf)            | 读到换行，原始字节  |     |
| fgets(buf, n, stdin) | 同 gets，有长度 |     |
| recv / recvfrom      | 网络原始字节     |     |
| memcpy前的输入           | 原样拷贝       |     |

这类题目，构造的payload就是内存布局本身，必须发原始字节

### B.文本输入（发ASCII字符串）  

程序把你发的字节当字符串解析，再转换成数值/逻辑：  

| 函数                      | 说明      |     |
| ----------------------- | ------- | --- |
| scanf("%d/%f/%s", ...)  | 按格式解析文本 |     |
| atoi/atof/strtol/strtod | 字符串转数字  |     |
| strcmp(buf, "password") | 字符串比较   |     |
| system / execve 前的命令拼接  | 文本      |     |  

这类题目，发送的是人类可读的ASCII，程序自主解析

其中scanf函数是读到空白字符就截断，和gets不同  
<mark style="background: #FF5582A6;">scanf是从第一个非空白字符开始读，遇到任意空白就停止，并在末尾补`\x00`</mark>  
scanf读取到非法类型字符时也会停下来
