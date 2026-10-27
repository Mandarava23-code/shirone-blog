## 进程虚拟地址空间

段视图用于<mark style="background: #FF5582A6;">进程</mark>的<mark style="background: #FF5582A6;">内存</mark>区域的 <mark style="background: #FF5582A6;">rwx权限划分</mark>  
节视图用于 <mark style="background: #FF5582A6;">ELF文件</mark> 编译链接时 与 在<mark style="background: #FF5582A6;">磁盘</mark>上存储时 的<mark style="background: #FF5582A6;">文件结构</mark>的组织

.bss段 可以存储未初始化的全局变量（其不占用磁盘空间，但仍需占用内存空间）  
.rodata节 专门用于储存程序中的只读（r--）数据 （rodata -> read only data)

//局部变量会存放在stack中，malloc从Heap段申请字节空间（**可以在任意时刻归还给系统，并让它可以被任意其他部分重新分配使用**）

## 程序的编译与链接

### 大端序与小端序

- 小端序
	- 低地址存放数据低位、高地址存放数据高位
	- 我们所需要关注的主要格式
- 大端序
	- 低地址存放数据高位、高地址存放数据低位

//内存分布上，大小端序仅影响多字节元素内部的字节排列；数组内元素固定从低地址到高地址存入；而不同的元素按先后顺序固定从高地址向低地址存入
