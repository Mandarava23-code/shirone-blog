## Web 1

简单的入门题，网址打开让我们直接找FLAG

那么F12查元素，注意到一个非常明显的FLAG格式

![[../images/Pasted image 20251111083236.png]]

<mark style="background: #CACFD9A6;">NSSCTF{b0d9b5c2-f8ba-4d02-a521-a192ca74fd5e}</mark>

## Web 2

根据网页提示利用hackbar学会get、post请求以及修改cookie

分析下列代码：

```php
<?php
$_COOKIE['nssctf'] = 'Nssctf'&&isset($_COOKIE['nssctf']);<?php   if(isset($_POST['post'])&&isset($_GET['get'])&&isset($_COOKIE['cookie'])){       if($_POST['post']='p0st'&&$_GET['get']='g3t'&&$_COOKIE['cookie']='C00kie'){
​	​	echo $FLAG;
​	​}
}
?>
```

>[!info]  
>isset函数检测变量是否已声明且值不为 `null`，结果返回布尔值

可知只有在POST、GET、COOKIE已声明且不为Null && post=p0st，get=g3t，cookie=C00kie才能echo出FLAG

利用hackbar执行

![[../images/Pasted image 20251111084434.png]]

<mark style="background: #CACFD9A6;">NSSCTF{63ec620e-b3d6-4163-a89a-965f3a03c2bb}</mark>

## P3

根据题目提示，先用bp抓包，并将请求方式改为NSSCTF，由此引出<mark style="background: #ABF7F7A6;">请求行</mark>的概念

>[!info]  
>HTTP请求的第一行叫做 **请求行**  
>格式为三个部分组成，并用空格分隔：  
>**`<方法> <请求目标> <HTTP版本>`**
>
> - 方法：  
> ​	​- 表示客户端希望服务器执行的操作  
> ​	- 最常见的有：`GET`（获取资源）、`POST`（提交数据）、`PUT`（更新资源）、​	​	​ `DELETE`（删除资源）、`HEAD`（获取响应头）等
><br/>
> - 请求目标：  
> ​	- 通常是你想要访问的资源的路径，如`/index.html`  
> ​	- 某些情况下（如使用代理时），也可以是完整的URL，如​	​	​	              `http://www.example.com/index.html`
> <br/>
> - HTTP版本：  
> ​	- 声明客户端使用的HTTP协议版本，以便服务器能够以兼容的方式响应  
> ​	- 常见的有：`HTTP/1.1`（目前最广泛使用的）、`HTTP/2`（二进制协议，性能更​	​	​ 好）、`HTTP/3`（基于QUIC协议）

![[../images/Pasted image 20251110130735.png]]

得知要用HTTP/2访问

![[../images/Pasted image 20251110130943.png]]

又需要我们用Nss浏览器访问，由此引出<mark style="background: #ABF7F7A6;">请求头</mark>的概念

>[!info]  
>**请求头** 是 HTTP 请求中起始行之后、空行之前的部分。它由一系列 `key: value` 对组成，<mark style="background: #ABF7F7A6;">每一行一个</mark>。这些头字段允许客户端向服务器传递关于请求的附加信息、客户端自身的信息、以及对响应的期望等。
>
>**格式**：`key: value`
>
>**作用**：  
>1.描述消息体（如类型、长度、编码）  
>​2.进行条件请求（如缓存验证）  
>​3.控制缓存行为  
>​4.进行身份认证  
>​5.告知服务器客户端的偏好（如语言、字符集）  
>​6.用于安全策略（如 CORS）

[[../../网络安全/HTTP|HTTP]]

![[../images/Pasted image 20251110141713.png]]

按照要求伪造ip进行HTTP请求，得到flag

>[!info]  
>常用的伪造IP的HTTP请求头
>
>Web应用程序为了获取客户端的真实IP，可能会<mark style="background: #ABF7F7A6;">检查多个HTTP请求头</mark>。常见的用于标识客户端IP的头包括：
>
>1.`X-Forwarded-For` (XFF)
>
>2.`X-Real-IP`
>
>2.`X-Originating-IP`
>
>2.`X-Remote-IP`
>
>2.`Client-IP`
>
>2.`Forwarded` (较新的标准)
>
>**关键点：** 如果Web应用程序的代码（或其使用的框架、反向代理配置）**<mark style="background: #ABF7F7A6;">错误地信任了这些可以被用户控制的头</mark>**，而没有进行严格的验证，那么攻击者就可以通过设置这些头来伪造IP。

![[../images/Pasted image 20251111001956.png]]

<mark style="background: #CACFD9A6;">NSSCTF{b1a5e89a-365e-4ffa-ab87-ce2350fdc7cb}</mark>

## P4

发现已经给出flag的后半部分 <mark style="background: #CACFD9A6;">dd4fbf8e29}</mark>

注意到网址为/p3.php，不是网站的根目录，用yakit抓包，访问根目录

![[../images/Pasted image 20251111084629.png]]

渲染后，分析php代码发现，将被重定向到p1.php，且给出一个 `a=index` 便可以得到flag的从第0位开始的前11个字符，即flag的前半部分

>[!info]  
>302 FOUND会重定向到服务器返回的<mark style="background: #ABF7F7A6;">Location头部中的URL</mark>

![[../images/Pasted image 20251111084713.png]]

<mark style="background: #CACFD9A6;">NSSCTF{4d0a</mark>

继续访问p1.php这个网址

![[../images/Pasted image 20251111084753.png]]

发现将被重定向到p2.php，且post一个name=p1，可以得到第11位开始的11个字符，post一下，看wp发现POST请求需要一个<mark style="background: #FF5582A6;">​Content-Type头</mark>

Content-Type头就是告诉服务器“我发送的数据是什么格式的”，否则无法解析


>[!info]  
>常用 <mark style="background: #ABF7F7A6;">Content-Type</mark> 类型：
>
>​1.`application/x-www-form-urlencoded`(最常用)
>- **用途**：标准的 HTML 表单默认编码
>- **数据格式**：`key1=value1&key2=value2`，特殊字符会被 URL 编码
>
>2.`multipart/form-data`
>- **用途**：用于上传文件，或者表单中包含文件时使用
>- **特点**：数据会被分成多个部分，每个部分有边界分隔
>
>3.`application/json`
>- **用途**：传输 JSON 格式的数据，现代 API 最常用的格式


添加Content-Type头后 POST `name=p1`

![[../images/Pasted image 20251111084925.png]]

得到中部flag <mark style="background: #CACFD9A6;">d754-226b-4</mark> ，再访问p2.php网址

![[../images/Pasted image 20251111084949.png]]

发现将重定向到p3.php，且给出一个cookie `name=p2` 就会给出flag第22位开始的11个字符,根据提示给出cookie

![[../images/Pasted image 20251111085038.png]]

找到最后一部分flag <mark style="background: #CACFD9A6;">0bc-a3d5-84</mark> 组合得到完整的flag

<mark style="background: #CACFD9A6;">NSSCTF{4d0ad754-226b-40bc-a3d5-84dd4fbf8e29}</mark>

## P5

网址内容为where i am？F12没看到什么东西，抓包也没发现线索，于是用dirsearch扫描网址路径

>[!tip]  
>当遇到这种<mark style="background: #ABF7F7A6;">没有明显的入口点或者中发现题目条件不足时</mark>我们需要考虑使用扫描器

![[../images/Pasted image 20251111021220.png]]

只需要看状态码200（即请求成功）的目录

>[!info]  
>状态码403代表拒绝访问

先看`/admin.php`，分析php代码
```php
<?php  
error_reporting(0);  ​	​	​	​	​	​	//不报告任何错误
highlight_file(__FILE__);  ​	​	​	​	​	//语法高亮显示当前php文件的源代码
if ($_POST['adm1n'] === 'ok!') {  ​	​	​	//如果POST参数admin=ok！执行语句
    echo substr(getenv('FLAG'), 0, 22);  ​	//输出FLAG的前22个字符
}
```

- \==\=为严格比较，要求值和类型都匹配

- getenv('FLAG')为获取环境变量FLAG的值

- substr(...,0,22)为截取前22个字符

>[!info] substr函数  
>格式：substr(string,start,length)
>
>*string*：必须，需要截取的字符串
>
>*start*：必须，规定从字符串的哪里开始  
>​​​	- 正数，从字符串的指定位置开始  
>​	- 负数，从字符串结尾开始的指定位置开始  
>​	- 0，从字符串的第一个字符处开始
>
>*length*：可选，规定字符串返回的长度，默认为到字符串结尾  
>​	- 正数，从*start*参数所在的位置返回的长度  
>​	- 负数，从字符串末端返回的长度

利用hackbar插件POST `adm1n=ok!`

![[../images/Pasted image 20251111024502.png]]

得到前半段flag <mark style="background: #CACFD9A6;">NSSCTF{b1f2fde0-e2b8-4</mark> ，再访问/robots.txt

![[../images/Pasted image 20251111030045.png]]

>[!info]  
>robots.txt代表网站爬虫协议
>
>`User-agent: *`代表的是所有类型
>
>- Disallow用于控制网络爬虫的访问权限，表示这些目录是不可爬取的
>- Allow代表可以爬取


所有Disallow泄露了一个路径/you_never_know_this/，访问这个路径，根据提示我们使用githack调用git来管理版本

![[../images/Pasted image 20251111032908.png]]

去本地文件夹中找到名为pass.php的一段代码

![[../images/Pasted image 20251111033008.png]]

利用hackbar，向pass.php中发送POST请求，POST secr3t=hhhhha，得到flag后半部分 <mark style="background: #CACFD9A6;">7f5-9a41-4d5cf9c7e853}</mark> 组合得到完整flag

<mark style="background: #CACFD9A6;">NSSCTF{b1f2fde0-e2b8-47f5-9a41-4d5cf9c7e853}</mark>

## P6

打开环境后发现需要登录，随便输个123，然后用yakit抓包，之后导入字典，爆破密码，找到响应大小不同的包，找到我们需要的flag，且正确密码为qwertyuiop

![[../images/Pasted image 20251111103230.png]]

<mark style="background: #CACFD9A6;">NSSCTF{2318f220-4a42-4904-9d99-709cc1f5df68}</mark>

## P7

```php
<?php  
highlight_file(__FILE__);  
  
eval($_POST['hhh']);​	//常见一句话木马
```

>[!info]  
>eval()函数能够<mark style="background: #ABF7F7A6;">动态地将字符串作为代码执行</mark>

常见的一句话木马，利用蚁剑连接到这个木马，最后在根目录的README中找到flag线索

![[../images/Pasted image 20251111103853.png]]

根据提示先去对应目录下找前一半flag，然后发现有非常多的子目录

利用蚁剑自带的虚拟终端在目录下找flag.txt这个文件，利用find指令进行查找

`find . -name flag.txt`​
- `.` 处为查找路径，由于我们已经cd到需要的目录了，​此处直接写了 `.`
- `-name flag.txt` 处为查找文件名称
>[!info]  
>不知道文件名时，可通过通配符 `?` 进行模糊查找 拓展：`*` 代表所有
>
>如fl??.???可以匹配到flag.txt

![[../images/Pasted image 20251111105004.png]]

前一半flag <mark style="background: #CACFD9A6;">NSSCTF{fef5fe60-85f2-4</mark>

后半flag被隐藏在1000个txt文件的某一个之中，通过grep命令进行查找

`grep -r -E "[0-9a-f]{8,}\}" ./`

解析：
- `-r` 代表递归搜索，grep默认搜索一个文件，而我们要搜索的是一个文件夹
- `-E` 代表搜索指定的正则表达式
- `" "` 正则表达式
- `"[0-9a-f]{8,}\}"` 分解：  
​	​1. `[0-9a-f]`：匹配十六进制字符（0-9及a-f）  
​	​2. `{8,}`：匹配前面的字符至少8次或更多次  
​	​3. `\}`：匹配字面的右花括号}（\为转义字符）
- `./` 处为搜索目录，此处代表当前目录及其子目录

![[../images/Pasted image 20251111112700.png]]

找到后半flag <mark style="background: #CACFD9A6;">8a8-954f-5f694ca21d38}</mark> 组合得到完整flag

<mark style="background: #CACFD9A6;">NSSCTF{fef5fe60-85f2-48a8-954f-5f694ca21d38}</mark>

>[!todo]  
>学习Linux命令

## P8

```php
<?php  
highlight_file(__FILE__);  
error_reporting(0);  
  
$s = $_GET['a'];  
if(!is_numeric($s)){  
    if($s+1 === 1000){  	​	​	​	 
    if (isset($_POST['b']) && isset($_POST['c']) && $_POST['b'] != $_POST['c'] && md5($_POST['b']) == md5($_POST['c'])) {  
            die(getenv('FLAG'));  
        }  
    }  
}  
?>
```

>[!note] 代码分析：  
1.获取a的参数值赋给s  
2.检测s的参数值，若不为数字，执行语句  
3.检测s的参数值+1时恒等于1000，执行语句  
4.检测POST参数b和c的存在（默认不为null），**b的参数值≠c的参数值** 且 **b和c的md5哈希计算** 结果相同，执行语句  
5.输出环境变量FLAG

解析：
1. 考察is_numeric函数的变量判断，需要绕过这个函数，才能满足if条件，由于php解析数字时会从左往右检测，直到解析到不是数字为止，故可以通过GET 999abc绕过
2. 考察md5哈希碰撞，由于弱比较`==`，可以使用0e绕过，POST QNKCDZO和240610708进行绕过

![[../images/Pasted image 20251113140533.png]]

获得flag

<mark style="background: #CACFD9A6;">NSSCTF{aea37f47-bec9-4559-9da8-64792dd05cdb}</mark>

## P9

```php
<?php  
highlight_file(__FILE__);  
error_reporting(0);  
  
$s = $_GET['a'];  
if(intval($s) < 666 && intval($s+1) > 667){  
    if (isset($_POST['b']) && isset($_POST['c']) && $_POST['b'] != $_POST['c'] && md5($_POST['b']) === md5($_POST['c'])) {  
        die(getenv('FLAG'));  
    }  
}  
?>
```

>[!note] 代码分析：
>
>1. intval()函数获取变量s的整数值
>2. isset()检测POST参数b和c的存在
>3. 满足b和c POST不同的同时，md5值严格相同
>4. 输出环境变量FLAG

解析：
1. 字符串+1会变成整型
2. intval()函数只会从左往右转为数字，而+1会考虑特殊形式的字符串（如科学计数法），可以通过这种字符串转换漏洞绕过
3. 此处的md5比较为`===`强比较,无法0e绕过，考虑数组绕过

![[../images/Pasted image 20251113143720.png]]

得到flag

<mark style="background: #CACFD9A6;">NSSCTF{c4aa7f6b-0417-464f-a7c9-c6075f912bde}</mark>

## P10

打开发现语句 where i am？，用dirsearch扫描目录

![[../images/Pasted image 20251113144216.png]]

扫描出一个robots.txt，为爬虫文件，打开看看

![[../images/Pasted image 20251113144405.png]]

发现隐藏目录，打开发现php代码

```php
<?php  
highlight_file(__FILE__);  
error_reporting(0);  
  
if($_REQUEST['a'] === 'hello'){  
    die('no');  
}  
if($_GET['a'] != 'hello') {  
    die('no');  
}  

$d = intval($_GET['data']);  
if ($d < 1000 || chr($d) !== 'A') {  
    die('no');  
} 
  
$a = $_GET['p'];  
$b = $_POST['s'];  
  
if ( sha1($a) === sha1($b) && $a != $b){  
    echo getenv('FLAG');  
}
?>
```

>[!info] $\_REQUEST超全局数组
>
>1.功能定义  
>`$_REQUEST` 是一个预定义的超全局数组，用于收集 HTML 表单提交的数据，它默认包含了 `$_GET`、`$_POST` 和 `$_COOKIE` 的数据
>
2.语法结构
>$\_REQUEST['要获取的参数名称']

>[!info] sha1函数
>
>1.功能定义  
>`sha1()` 是 PHP 的内置函数，用于计算字符串的 SHA-1（安全散列算法 1）哈希值。SHA-1 生成 40 位的十六进制散列值。
>
>2.语法结构  
>string sha1 ( string $str [, bool $raw_output = false ] )
>- **`$str`**：要计算哈希值的输入字符串
>- **`$raw_output`**：可选参数
>    - 如果为 `false`（默认），返回 40 字符十六进制数
>    - 如果为 `true`，返回 20 字节原始二进制数据

>[!note] 代码分析：  
>1.REQUEST数组收集a、GET、POST 和 COOKIE的数据，判断不为hello时才能继续执行  
>2.GET一个a，且a的值为hello才能继续执行  
>3.GET一个data，并将其整数化，赋值为变量d  
>4.要d>=1000且chr($d)='A'时才继续执行  
>5.GET一个p，赋值给变量a；POST一个s，赋值给变量b  
>6.判断a，b不同时，a与b的sha1计算值相同，输出flag

解析：
1. **<mark style="background: #FF5582A6;">在PHP中，默认情况下REQUEST的排序为 GPC ，新值会覆盖旧值</mark>**，因此可以通过这种方法绕过a的检测
2. chr()函数原理是字符超过255，就%256，再转换为对应ASCII码，故而符合条件的一个值为256\*4+65=1089
3. 注意到为强比较，尝试数组绕过

根据以上要点，利用hackbar给出对应值，获得flag

![[../images/Pasted image 20251113203625.png]]

<mark style="background: #CACFD9A6;">NSSCTF{edb97130-1897-4427-92f3-6554b2422931}</mark>
