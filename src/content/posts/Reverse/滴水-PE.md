---
title: 滴水-PE
date: 2026-03-03 02:36:12
categories: Reverse
---

## 1. PE文件结构

### 1.1 可执行文件

可执行文件指的是可以由操作系统进行加载执行的文件

可执行文件结构：
- Windows平台：PE(Portable Executable)文件结构
- Linux平台：ELF(Executable and Linking Format)文件结构

PE文件结构使用场景：
1. 病毒与反病毒
2. 外挂与反外挂
3. 加壳与脱壳（保护与破解）
4. 无源码修改功能、软件汉化等

### 1.2 如何识别PE文件

- PE文件的特征（PE指纹）  
分别打开.exe、.dll、.sys等文件，观察特征前2个字节
- 不能仅仅通过文件的后缀名来认定PE文件

### 1.3 PE文件的整体结构

{% asset_img Snipaste_2026-03-10_19-02-16.png %}

## 2. PE文件的两种状态

### 2.1 主要结构体

1. DOS部分：
	- **IMAGE_DOS_HEADER结构**：DOS MZ文件头，64 Byte
	- **DOS Stub**：DOS块（IMAGE_DOS_HEADER结构的最后一个成员指向了PE头开始的位置，由此可以判断DOS块的大小）
2. PE文件头：
	- **"PE",0,0**：PE文件头标志，4 Byte
	- **IMAGE_FILE_HEADER结构**：PE文件表头，标准PE头，20 Byte
	- **IMAGE_OPTIONAL_HEADER32结构**：IMAGE_NT_HEADERS结构，扩展PE头，32位的为224 Byte，可在标准PE头中找到扩展PE头的大小的成员进行更改
	- **16xIMAGE_DATA_DIRECTORY结构**：数据目录列表
3. 节表：
	- **nxIMAGE_SECTION_HEADER结构**：顺序排列的一系列节表数量和节的数量相对应，节表中每个成员占40 Byte
4. 节数据


