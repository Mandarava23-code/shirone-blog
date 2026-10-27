---
title: Day05-操作系统目录结构
date: 2025-11-24 17:33:31
categories: Linux系统运维
---

### 0. 文件编辑时退出

#### 原因

vim编辑流程：
1. 从硬盘区域读取目标文件
2. 将其调取到内存区域
3. 创建一个目标文件的临时文件（.swp后缀）
4. 进行编辑操作
5. `:wq!`后将临时文件覆盖原文件
6. 将文件重新存回硬盘区域
>[!note]  
>文件在<mark style="background: #FF5582A6;">磁盘区域与内存区域</mark>之间转移的操作称为 **IO操作**

### 1. 文件编辑命令扩展

#### 1.1 echo

echo多出现于命令文本中，作为代码作用

#### 1.2 cat

- 查看文件内容：`cat 目标文件`
- **非交互式**编辑或追加内容到文件尾部：  
​	`cat >>目标文件<<EOF（任意字符）`  
​	<<：标准输入符  
​	EOF：开始标识符，文本输入时作为结束符

### 2. 文件查看命令信息扩展

- more/less：表示一行一行/一页一页地查看
- head：查看文件的前几行（默认前10行）
	- `head -n` 查看文件前n行
- tail：查看文件的后几行（默认后10行）
	- `tail -n` 查看文件后n行
	- `tail -f/tailf/tail -F` **追踪文件信息的变化**

### 3. 系统目录结构介绍

#### 3.1 系统目录结构对比

- windows目录形式：
```
​c:\windows\system
```
路径分隔符是"\\"，D、E等盘的目录结构类似

- Linux目录形式：
```
# 绝对路径方式
/etc/hosts

# 相对路径方式
hosts
./host         $$./表示当前路径
../../host     $$../表示上一级所在的目录
```
路径分隔符是"/"，<mark style="background: #FF5582A6;">Linux系统的一切目录都是从"/"根开始的</mark>

#### 3.2 系统目录作用简述

- **/root**：表示root用户的家目录
- **/home**：表示普通用户的家目录
- **/etc**：服务程序配置文件存储路径 //某些服务的配置文件在其子目录中
- **/boot**：系统运行启动文件存储路径（引导系统启动目录）
- **/tmp**：系统中临时存储数据信息目录（类似于回收站）
- **/var**：此目录中数据文件信息会经常变化（存储日志文件）
- **/opt**：类似于Windows系统中Program Files文件夹，安装第三方软件程序
- **/usr**：类似于Windows系统中Program Files文件夹，安装第三方软件程序
- **/dev**：用于存储硬件信息文件目录
	- /dev/sdb s硬盘接口 d磁盘 b字母排序
- **/bin**：用于存储二进制文件目录（存储命令文件）[binary]
- **/sbin**：用于存储二进制文件目录（存储管理员可以操作的命令文件）
- **/lib**：用于存储库文件目录
- **/lib64**：用于存储库文件目录 //库文件：可被直接调用的集成好的功能代码
- **/proc**：用于存储硬件配置信息或者内核配置信息（存储在内存空间）
- **/mnt**：实现存储设备挂载操作的目录（临时挂载点）
- **/media**：实现存储设备挂载操作的目录

#### 3.3 系统存储设备挂载概念

windows系统磁盘应用方法：  
硬件插入 -- 分区操作 -- 格式化操作 -- <mark style="background: #FF5582A6;">分配盘符</mark>

Linux系统磁盘应用方法：  
硬件插入 -- 分区操作 -- 格式化操作 -- <mark style="background: #FF5582A6;">挂载操作</mark>

- 挂载操作：给存储设备挂载一个空目录（磁盘与目录建立对应关系）
- 挂载操作实现：
	- 1. 将光盘放入光驱中
	- 2. 进行挂载操作 `mount 存储设备(/dev) 目标目录` 取消挂载 `umount 目标目录`
- 一个目录只能挂载一个存储设备

### 4. 系统重要文件说明

#### 4.1 网卡配置文件

/etc/sysconfig/network-scripts/ifcfg-ens33(ifcfg-en​t0)

- 网卡文件内容分析：  
TYPE=Ethernet​​	​	-- 指定网络通讯类型 以太网-Ethernet  
BOOTPROTO=none​​	​	-- 网卡地址获取方式：①DHCP：动态主机配置协议：②none/static：人为手动配置网卡地址信息  
DEFROUTE=yes​	​	-- 影响主机访问外网  
NAME=ens33​	​	-- 定义网卡名称信息  
DEVICE=ens33​	​	-- 定义网卡名称信息  
UUID=11bdb6db-0b5d-4483-8cf7-abbd308eb420​	​	-- 硬件标识信息  
ONBOOT=yes​	​	-- 设置网卡是否开机自动启动  
IPADDR=10.0.0.100​	​	-- 网卡地址信息  
PREFIX=24​	​	-- 网卡掩码信息  
GATEWAY=10.0.0.254​	​	-- 网卡网关信息  
DNS1=223.5.5.5​	​	-- 网卡DNS配置

>[!note]  
>记得重启网络服务使更改生效
>```
>systemctl restart network
>或者
>service network restart
>```
>重启单块网卡详见[[Day03-操作系统基础命令]]

#### 4.2 扩展知识：修改网卡名称

方法一：安装系统时，修改网卡名称  
`net.ifnames=0 biosdevname=0` -- 添加改名配置信息

方法二：系统安装后​修改网卡名称
1. 修改配置文件中的网卡名称
	1. cd /etc/sysconfig/network-scripts/
	2. vim ifcfg-网卡名称
	3. 改**NAME=**和**DEVICE=**
2. 修改网卡文件名称
	1. mv 原网卡文件名称 修改后网卡文件名称
3. 修改系统加载配置文件
	1. vim /etc/default/grub
	2. 在6gg后添加`net.ifnames=0 biosdevname=0`
4. 重新加载grub文件配置信息
	1. grub2-mkconfig -o /boot/grub2/grub.cfg
5. 重启系统
	1. reboot

#### 4.3 域名服务配置文件

/etc/resolv.conf

**作用**：会随着网卡配置信息改变，故多用于检测网卡的DNS设置是否正确

#### 4.4 主机域名解析配置文件

/etc/hosts

**作用**：可以实现名称和IP地址之间建立合理的对应关系，从而便于访问指定主机地址
- 学习中hosts文件可以作为攻击目标  
C:\Windows\System32\drivers\etc\hosts

>[!danger] 中间人攻击  
>云主机 -- 利用爬虫搭建京东相同的网站环境证书 -- 下单支付 -- 后端银行卡

因此出现了***HTTPS安全访问机制***

#### 4.5 主机名称配置文件

vim /etc/hostname -- 永久更改主机名称（需重启系统生效）  
hostname -- 临时修改主机名称（立即生效）

hostnamectl set-hostname -- 永久更改且立即生效
