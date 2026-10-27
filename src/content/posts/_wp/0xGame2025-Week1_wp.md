## Web

### 1. Lemon

打开环境，发现右键和F12都会被弹窗阻止，那直接yakit抓包，然后在底部找到flag  
![[images/Pasted image 20251121212741.png]]

<mark style="background: #CACFD9A6;">0xGame{Welc0me_t0_0xG@me_2025_Web!!!}</mark>

### 2. Http的真理，我已解明

按照环境提示，依次进行操作，得到flag  
![[images/Pasted image 20251121213705.png]]

<mark style="background: #CACFD9A6;">0XGame{Congratuation_You_Are_Http_God!!!}</mark>

~~ps：cookie笑死我了，cookie的Sean是我高中上一届的好朋友~~

### 3. 留言板（粉）

打开环境发现404 not found，那直接dirsearch扫描目录  
![[images/Pasted image 20251121230441.png]]

主要的/login.php抓包之后没思路不会做，就挨个看看目录里都是啥，然后发现/Dockerfile目录里直接有flag🤣  
![[images/Pasted image 20251121230620.png]]

<mark style="background: #CACFD9A6;">0xGame{1a903b96-173a-8b3d-8a37-a81934dc4187_xxe114514}</mark>  
~~(这个这个，真是这么做的吗)~~

## MISC

### 1. Sign_in

`MGhRa3dve0dvdm0wd29fZDBfMGhRNHczXzJ5MjVfQHhuX3JAbXVfUHliX3BlWH0=`解码  
看到=补位，直接base64解码看看，出来还是一堆密文`0hQkwo{Govm0wo_d0_0hQ4w3_2y25_@xn_r@mu_Pyb_peX}`  
利用flag头0xGame，发现字母表偏移16位，cyberchef解码得flag  
![[images/Pasted image 20251121235043.png]]

<mark style="background: #CACFD9A6;">0xGame{Welc0me_t0_0xG4m3_2o25_@nd_h@ck_For_fuN}</mark>

### 2. 公众号原稿

根据题目提示，先看文档内，找不到什么信息。再修改为.zip文件，发现docProps有gift.xml，vscode打开找到flag  
![[images/Pasted image 20251122001333.png]]

<mark style="background: #CACFD9A6;">0xGame{omg!Y0u_f0und_m3!_C0ngr4tul4t10ns!}</mark>

>[!note]  
>docx的本质就是一个压缩包

### 3. Zootopia

用随波逐流一把梭，看看图片隐写内容，第一行就找到flag了  
![[images/Pasted image 20251122005441.png]]

<mark style="background: #CACFD9A6;">0xGame{W1_Need_t0_t@k3_a_break}</mark>

## Reverse

### 1. SignIn

签到题，ida打开，直接查字符串，找到flag  
![[images/Pasted image 20251121140740.png]]

<mark style="background: #CACFD9A6;">0xGame{G00d$!gn1n_&_N0w_5t4rt_y0ur_R3V3R5E}</mark>

### 2. EasyXor

ida分析代码，看for循环内容
```c
for ( i = 0; i <= 43; ++i )
  {
    flag = s[i];
    key = key;                                  // "raputa0xGame2025"
    i_1 = i;
    v6 = strlen(key);                           // "raputa0xGame2025"
    if ( (char)(flag ^ key[i_1 % v6]) + i != str[i] ) //此处的v6即为16，循环异或
    {
      puts("Please try again!");
      exit(0);
    }
  }
  puts("Good job!");
  return 0;
```
提取一下str的字符内容，编写逆向脚本，运行得到flag  
![[images/Pasted image 20251121144352.png]]

<mark style="background: #CACFD9A6;">0xGame{6c74d39f-723f-42e7-9d7a-18e9508a655b}</mark>

### 3. DyDebug

根据题目提示进行动调，分析伪代码，在if处下断点，在寄存器eax处找到flag  
![[images/Pasted image 20251121171636.png]]

<mark style="background: #CACFD9A6;">0xGame{91f2c64e-057d-4191-8868-9a8c0847b2c0}</mark>

### 4. BaseUpx

查壳发现是upx加壳了，利用脱壳软件脱壳  
![[images/Pasted image 20251121172306.png]]

发现就是一个base64加密，密文在注释已经有了  
![[images/Pasted image 20251121173009.png]]

复制到cyberchef，base64解码得到flag  
![[images/Pasted image 20251121173207.png]]

<mark style="background: #CACFD9A6;">0xGame{W0w_u_4r3_7h3_G0d_0f_upx&b4s364_D3s1gn}</mark>
