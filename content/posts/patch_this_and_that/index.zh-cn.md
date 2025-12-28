
---
title: "缝缝补补又一年——CentOS更新OpenSSH小记"
date: 2025-12-29T01:27:58+08:00
draft: false
toc: false
images:
tags:
  - daydream
description: "经常会有老机器需要进行SSH连接，而默认连接会出现不支持该密钥的提示，此时使用 `HostKeyAlgorithms` 和 `PubkeyAcceptedKeyTypes` 参数指定支持就好了。很少有教程专门讲这一点，还得翻SSH官方命令手册去看，而且讲怎么升级的教程就更少了，所以NCC这次就正好补一补空白"
---

## 背景

NCC有一些很老的机器，老嵌入式设备和一些CentOS虚拟机，这次就遇到学校安装candence virtuoso软件的机器。原先是RHEL6，在NCC进行换源之后变成了CentOS6.5 。但是仍然有一个大麻烦，SSH版本太老，只支持DSS密钥，当现代终端连接时会出现如下提示：

```powershell
PS C:\Users\NanCunChild> ssh 192.168.114.246
Unable to negotiate with 192.168.114.246 port 22: no matching host key type found. Their offer: ssh-rsa,ssh-dss
```

先说解决方案，一次性使用的话直接输入：

```powershell
ssh -o HostKeyAlgorithms=+ssh-dss -o PubkeyAcceptedKeyTypes=+ssh-dss xxx.xxx.xxx.xxx
```

如果需要经常连接，可以在本机 `.ssh/config` 中将其进行标记，这样以后都会允许DSS密钥：

```text
Host {IP} HostKeyAlgorithms +ssh-dss PubkeyAcceptedKeyTypes +ssh-dss
```

如果是那些神神叨叨的网络安全研究人员，此时就会建议你直接升级OpenSSH，以支持最新的加密。但是这个也是最麻烦的，之后NCC给大家整活演示一下。

## SSH的历史

### 1. 开天辟地：嗅探器危机与 Tatu 的反击 (1995)

- **背景：** 1995 年春，芬兰赫尔辛基理工大学（Helsinki University of Technology）。当时互联网是基于信任的，大家都用 **rlogin** 和 **Telnet**。

- **事件：** 研究员 **Tatu Ylönen** 发现学校网络遭到大规模的密码嗅探攻击（Password Sniffing）。黑客潜伏在网络节点，截获明文传输的用户名和密码。

- **诞生：** Tatu 没有坐以待毙，他在几个月内写出了 **SSH-1**。它的核心逻辑很简单但革命性：**先建立加密隧道，再在隧道里跑认证和数据。**

- **发布：** 1995 年 7 月，SSH-1 作为一个自由软件发布。到年底，它已经有了 20,000 个用户，迅速成为 Unix 系统的标配。

### 2. 分裂与商业化：自由软件的困境

- Tatu 随后成立了 _SSH Communications Security_ 公司，随着 SSH 的普及，后续版本的许可证变得越来越严格，并逐渐走向商业闭源。

- 这导致开源社区无法继续自由使用 SSH 的最新版本。此时，SSH 分裂为“商业版”和“最后留存的自由版”。

### 3. 救世主 OpenBSD：OpenSSH 的诞生 (1999)

这是 OpenSSH 真正统治世界的关键转折点。现在仍然能看到一个特别丑的黄色大河豚web网页可以下载OpenSSH，这就是OpenBSD整的版本。

- **Björn Grönvall** 基于 SSH 1.2.12（最后一个真正自由的版本）维护了一个叫 **OSSH** 的分支。

- **OpenBSD 的介入：** 以“代码洁癖”和“安全至上”著称的 OpenBSD 团队（由 Theo de Raadt 领导）注意到了 OSSH。他们决定 fork 这个项目，并进行了彻底的代码审计。

- **大清洗：** OpenBSD 开发者移除了所有不必要的代码、修复了潜在的缓冲区溢出漏洞，并将其重新命名为 **OpenSSH**。

- **结果：** 1999 年 12 月，随 OpenBSD 2.6 发布的 OpenSSH 迅速被移植到 Linux（Red Hat, Debian 等）。因为它**完全免费、代码极其干净、且没有专利纠纷**，它迅速击败了商业版 SSH，成为了事实上的全球标准。

## DSS的不安全性

### 1. 算力维度的直观解释：1024 位的纸老虎

DSS（Digital Signature Standard）在 FIPS 186-2 标准中被强制限制密钥长度为 **1024 位** (L=1024, N=160)。

- **技术原理：** DSA 的安全性基于**离散对数问题 (Discrete Logarithm Problem, DLP)**。

- **算力对比（直观例子）：**

    - **1998年：** 破解 1024 位可能需要举全球算力耗时几十年。

    - **2015年（Logjam 攻击）：** 研究表明，国家级攻击者（如 NSA）有能力预先计算出常用 1024 位素数的“查找表”。一旦表建好，破解一个个体连接只需几分钟。

    - **2025年：** 随着云计算和专用硬件（FPGA/ASIC）的发展，1024 位 DLP 的破解难度对于拥有超级计算机的组织来说，就像是**用推土机撞烂木门**一样简单。

- **结论：** 1024 位的锁在今天就是“防君子不防小人”。而 DSA 协议设计导致它**无法**简单地增加密钥长度到 2048 位以上（虽然 FIPS 186-3 后来允许了，但 OpenSSH 的 `ssh-dss` 实现一直停留在 1024 位以保持兼容性，直到被废弃）。

### 2. 致命的随机数缺陷 (The Nonce Failure)

这是 DSA 真正的死穴，也是它比 RSA 脆弱得多的原因。

- **原理：** DSA 在签名时需要生成一个随机数 $k$（Nonce）。

- 公式（数学展示）：

    签名过程涉及计算 $s = k^{-1}(H(m) + x \cdot r) \mod q$。

    这里 $x$ 是你的私钥。

- 灾难场景：

    如果你的服务器或电脑的随机数生成器（RNG）不好（比如嵌入式设备熵不足），导致你在两次不同的签名中使用了相同的 $k$。

    攻击者拿到这两个签名 $(r, s_1)$ 和 $(r, s_2)$，只需要做小学级别的代数运算，就能直接计算出你的私钥 $x$。

- **案例：** 著名的 **索尼 PS3 破解事件** 就是因为索尼的 ECDSA 实现中，$k$ 是个常数……导致私钥直接被黑客算出来了。RSA 对随机数就没有这么敏感，随机数差一点只是容易被猜，而不是直接暴露私钥。

## 救火与预防

CentOS 6 默认的 OpenSSH 版本很老（比如 5.3），不支持 Ed25519，甚至不支持很多现代加密套件。

```bash
[nancunchild@work-eda ~]$ ssh -version
OpenSSH_5.3p1, OpenSSL 1.0.1e-fips 11 Feb 2013

[nancunchild@work-eda ~]$ ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ""
unknown key type ed25519
```

**核心问题：** `yum update` 已经没用了（vault都没人管了），且系统自带的 OpenSSL 都是太古版本，而新版 OpenSSH 需要新版 OpenSSL。

只能 **旁路编译安装** 来解决问题了。这一步可以自己做一个docker容器跑系统环境进行编译，也可以直接大胆动手在生产机上面编译。docker好处是好管理没有奇奇怪怪的依赖，直接上手的好处是好测试，跑通了就能用了。

## 旧瓶装新酒

> 写在动手之前
> 记得一定、一定要有备用连接方式！我们接下来做的一切都是在修改SSH本身，这是站在桥上换桥板的工作！请务必使用任何可能的备用方式作为SSH弄坏时的兜底，VNC，Telnet等都可以！NCC是因为能直接连上PVE的web终端，而且做好了快照所以直接动手了。请参照者一定三思！

网安工程师们站着说话不腰疼，给这个CentOS6更新软件谈何容易。这玩意官方都没在维护了，vault规范在这些年间都更换过标准和URL，这次真得技术考古。

首先我们确定目标，需要在这个机器上编译安装一个SSHD，那么我们就需要对应的glibc，而且在编译它之前我们还需要编译新的OpenSSL来支持加密算法，不然SSHD没有依赖。

那还说啥，整呗（NCC全程使用root账户操作，不要这样学NCC ）：

```bash
# 先编译新的OpenSSL
cd /usr/local/src 
wget https://www.openssl.org/source/openssl-1.1.1w.tar.gz 
tar -xzvf openssl-1.1.1w.tar.gz 
cd openssl-1.1.1w

./config --prefix=/opt/ssh-upgrade/openssl --openssldir=/opt/ssh-upgrade/openssl shared zlib 
make 
make install

# 再来OpenSSH
wget https://cdn.openbsd.org/pub/OpenBSD/OpenSSH/portable/openssh-9.8p1.tar.gz 
tar -xzvf openssh-9.8p1.tar.gz
cd openssh-9.8p1
./configure \ --prefix=/usr/local/openssh \ --sysconfdir=/etc/ssh \ --with-ssl-dir=/usr/local/ssl-new \ --with-zlib \ --with-pam \ --with-md5-passwords \ LDFLAGS="-L/usr/local/ssl-new/lib -Wl,-rpath=/usr/local/ssl-new/lib"
make
make install
```

其中居然只出现了一次路径报错和一次小依赖报错，然后make就这样成了，第一次如此顺利的编译哇！马上来试试：

```bash
/usr/local/openssh/bin/ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ""
```

此时会显示密钥的指纹信息，没有其它报错就说明成了。
但是！很重要的一点！我们目前只是编译好了这个软件，系统并没有默认来使用它，我们接下来开始换掉承重柱，编辑 `/etc/init.d/sshd` ，里面会有SSHD和KEYGEN两个变量，把它们都改为新路径，这里是 `/usr/local/openssh/sbin/sshd` 和 `/usr/local/openssh/bin/ssh-keygen` 。还有很多旧字段，NCC在这里简单列举一下：

注释掉：
RSAAuthentication
GSSAPIAuthentication
GSSAPICleanupCredentials
HostKey /etc/ssh/ssh_host_key
HostKey /etc/ssh/ssh_host_dsa_key

添加：
HostKey /etc/ssh/ssh_host_rsa_key 
HostKey /etc/ssh/ssh_host_ed25519_key

修改完成之后运行 `/usr/local/openssh/sbin/sshd -t` ，没有报错就成功啦！直接大胆 `service sshd restart` 就好啦！
NCC终端显示如下：

```bash
[root@work-eda openssh-9.8p1]# /usr/local/openssh/sbin/sshd -t
[root@work-eda openssh-9.8p1]# service sshd restart
Stopping sshd:                                             [  OK  ]
Starting sshd:                                             [  OK  ]
```

其实NCC还是想把它替代老的OpenSSL和OpenSSH的，只是担心原本yum管理的包手动去修改了可能造成问题。正规做法其实也是将它们都打包为rpm包，然后使用yum管理安装，直接改动将士yum数据库中软件不匹配。但是既然CentOS6已经死了，暴力操作也没什么问题：

```bash
mv /usr/bin/ssh /usr/bin/ssh.old 
mv /usr/sbin/sshd /usr/sbin/sshd.old 
mv /usr/bin/ssh-keygen /usr/bin/ssh-keygen.old
mv /usr/bin/scp /usr/bin/scp.old 
mv /usr/bin/sftp /usr/bin/sftp.old

ln -s /usr/local/openssh/bin/ssh /usr/bin/ssh
ln -s /usr/local/openssh/sbin/sshd /usr/sbin/sshd
ln -s /usr/local/openssh/bin/ssh-keygen /usr/bin/ssh-keygen
ln -s /usr/local/openssh/bin/scp /usr/bin/scp
ln -s /usr/local/openssh/bin/sftp /usr/bin/sftp
```

```bash
# 移动前
[nancunchild@work-eda ~]$ ssh -V
OpenSSH_5.3p1, OpenSSL 1.0.1e-fips 11 Feb 2013

# 移动并创建软链接后
[nancunchild@work-eda ~]$ ssh -V
OpenSSH_9.8p1, OpenSSL 1.1.1w  11 Sep 2023
```

在这里NCC能找到的也就只有 `OpenSSL 1.1.1w` 了，虽然已经出到了3.6.0，但是新版本重构太大没法在不改CentOS其它依赖的情况下跑起来。这次就算弄完啦，重启服务，再拍个快照就完成啦！

本文历史讲解和算法简介部分使用Gemini3.0Pro-Preview完成，感谢哈基米帮忙！感谢Google赞助！
