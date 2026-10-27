**CONTENT**

- [[#Reverse|Reverse]]
	- [[#Reverse#ez_uds|ez_uds]]
	- [[#Reverse#Illusion|Illusion]]

## Reverse

### ez_uds

题目说是uds诊断服务，并且给出了我们算法，那就很明了了，直接nc连接容器  
![](images/Pasted%20image%2020260328105344.png)  
可以看到题目给出了说明，我们输入2701  
![](images/Pasted%20image%2020260328105552.png)  
可以看到返回了6个字节，根据容器描述可知前两个字节其实是uds安全认证功能的响应头（67表示肯定响应，01表示我所请求的子功能，为请求种子），重要的是后面的4个字节作为了算法的seed，编写exp脚本，解出key
```python
seed = 0x6CEEF2B1
key = seed ^ 0xA5A5A5A5
key = ((key << 3) | (key >> 29)) & 0xFFFFFFFF
key = (key + 0x12345678) & 0xFFFFFFFF
print("%X" % key)
```
运行脚本得到key为5C8F0F1E，然后根据uds的格式，我们发送27025C8F0F1E，即可得到flag  
![](images/Pasted%20image%2020260328110628.png)

### Illusion

拖入ida，分析main函数  
![](images/Pasted%20image%2020260328111904.png)  
	这里的sub_140001930和sub_140001990其实分别是printf函数和scanf函数，对输入的字符串进行判断，以`xmctf{`开头，并在某个位置有一个`}`
>[!note] 如何判断是否是包装库函数
>1. 没有实质逻辑，没有计算，只有调用
>2. 参数没有被处理，传入的str字符串没有经过任何操作，原样传递
>3. 有调用CRT/标准库痕迹
>4. 调用链一层套一层
>5. 函数在程序中用途单一

>[!info] 最常见的CRT痕迹
>1. `_acrt_iob_func`
>```c
>_acrt_iob_func(0) // stdin  
>_acrt_iob_func(1) // stdout  
>_acrt_iob_func(2) // stderr
>```
>2. `__stdio_common_*`
>```c
>__stdio_common_vfprintf  
>__stdio_common_vsprintf  
>__stdio_common_vscanf
>```
>MSVC底层实现  
>3. `vfprintf / vprintf / vsprintf`
>```c
>vfprintf(...)
>```
>4. `strlen / memcpy / memset / strcmp`
>```c
>strlen
>memcpy
>memset
>strcmp
>```
>这里是因为函数字符串/内存处理  
>5. `__security_cookie / __chkstk`
>```c
>__security_cookie  
>__security_check_cookie  
>__chkstk
>```
>这里是MSVC编译/栈保护机制，虽然不是功能逻辑，但常和CRT一同出现  
>6. `GetProcAddress / LoadLibrary`（Windows API）
>```c
>LoadLibraryA
>GetProcAddress
>```
>动态加载函数  
>7. MessageBoxA
>```c
>MessageBoxA(...)
>```
>windows的GUI输出

![](images/Pasted%20image%2020260328114146.png)  
这里是字符串长度检查，它要求输入长度必须为25个字符，这里的do...while循环手动实现了strlen功能，先自增1，然后和指向n28024地址的指针做加法运算，然后*解引用，只要其中存储了有字符，不为0，则继续while循环，直到遇到末尾截断符`\0`停止，此时n25存储的值便为字符串长度  
![](images/Pasted%20image%2020260328115200.png)  
这里便是核心判断区域，if是核心判断函数，而sub_140001440就是核心算法了，根据函数内部变量特征判断为RC4流加密，编写对应exp脚本，运行发现有乱码，回去看原算法，发现RC4算法里有一段非标准的RC4初始化，尝试动调拿到正常的s盒，发现被反动调了  
![](images/Pasted%20image%2020260328122441.png)  
只能静态分析了，找到对应位置，查看存储内容，修改脚本后运行  
![](images/Pasted%20image%2020260328122711.png)
