---
title: Day07-操作系统基础优化
date: 2025-11-27 16:02:52
categories: Linux系统运维
---

### 0. 环境变量/别名功能

全局配置和局部配置的冲突问题  
结论：
- 局部配置：**~/.bash_profile**优先于**~/.bashrc**
- 全局配置：**/etc/bashrc**优先于**/etc/profile**
- 局部变量设置优先于全局设置

PS：`\` 转义字符，还原命令本身作用

### 1. 系统基础管理优化

#### 1.1 时间同步优化

- 实现时间同步：
	1. 修改设置好时区：`timedatectl set-timezone Asia/Shanghai`
	2. 同步时间：
		- 手工同步：`yum install -y ntpdate` `ntpdate ntp.aliyun.com`
		- 自动同步：`timedatectl set-ntp 1` 启用后还未同步则 `systemctl start chronyd`
	3. 观察Local time Time zone NTP enabled NTP synchronized是否正确

#### 1.2 系统字符编码优化

作用：避免系统字符出现乱码

- localectl set-locale LANG=zh_CN.utf8

#### 1.3 系统软件下载优化

1. 下载软件程序慢
2. 下载的软件没有  
 设置镜像源（阿里云/清华源）mirrors.aliyun.com

扩展：
- `yum repolist` 查看应用的仓库

#### 1.4 系统软件安全功能优化

- selinux：限制root用户操作行为
	- 临时关闭：`setenforce 0` （`getenforce`查看是否关闭）
	- 永久关闭：
		1. `vim /etc/selinux/config` 编辑
		2. 修改7gg为disabled
- firewalld：防火墙服务，实现外网访问隔离
	- 临时关闭：`systemctl stop firewalld.service`
	- 永久关闭：`systemctl disable firewalld.service`
	- 查看状态：`systemctl is-active firewalld.service` `systemctl is-enabled firewalld.service`

#### 1.5 系统远程连接优化

1. `vim /etc/ssh/sshd_config` 编辑配置信息
2. 79gg 修改为no //已使用password验证，GSSAPI验证功能没必要开启，会影响速度
3. 115gg 去掉注释，改为no //关掉反向DNS验证 //#内容为默认开启
>[!note]  
>正向DNS： 域名 -> IP地址  
>反向DNS： IP地址 -> 域名
4. `systemctl restart sshd` 重启服务
