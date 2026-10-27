**CONTENT**

- [[#PWN|PWN]]
	- [[#PWN#Ret2text|Ret2text]]
	- [[#PWN#echo|echo]]
	- [[#PWN#我把她弄丢了|我把她弄丢了]]
	- [[#PWN#签个到吧|签个到吧]]

## PWN

### Ret2text

![](images/Pasted%20image%2020260329204447.png)  
先案例，查一下附件信息，然后发现没有栈溢出保护，开启了堆栈不可执行，代码段基址固定，所以这就是一道简单的ROP栈溢出题目，ida分析一下  
查字符串可以看到有一个/bin/sh的字符串，八成是我们需要利用的后门  
![723](images/Pasted%20image%2020260329230619.png)  
点进去发现确实如此，那么我们现在去main函数找找栈溢出漏洞位置  
![](images/Pasted%20image%2020260329231332.png)  
可以看到，很典型的栈溢出漏洞，buf数组在栈上只分配了32字节的空间，但是read函数却尝试读取256字节，远远超出了buf数组的长度，导致了栈溢出漏洞，找一下调用后门函数的地址0x4011A8，编写exp脚本  
![](images/Pasted%20image%2020260330000425.png)  
运行后发现程序直接崩溃并且返回了EOF，来回看了好几遍发现没有问题啊，网上查了一下才发现是<mark style="background: #FF5582A6;">“栈对齐”问题</mark>，出现这个问题的原因是<mark style="background: #FF5582A6;">64位Linux下，调用某些函数时，要求栈顶地址必须是16字节对齐的</mark>，解决方法也很简单，在覆盖返回地址前再使用`ret`指令垫8个字节的偏移量，这样就可以使原来错位的栈重新对齐到16字节  
具体操作就是：
1. 利用`ROPgadget`寻找程序中任意一个`ret`指令的地址，具体命令如下
```bash
ROPgadget --binary ./pwn --only "ret"
```
1. 我们将查找到的`ret`指令地址加在填充字节和返回地址之间
2. 运行exp，将payload打过去  
拿到sh权限后，抓取flag内容即可  
![](images/Pasted%20image%2020260330002051.png)

### echo

这题没有附件且nc连接后什么说明都没有，那我们先ls一下，看一下当前目录下有什么，结果发现ls命令被过滤了  
![](images/Pasted%20image%2020260330012049.png)  
但是没有关系，只要有这个报错信息就说明我们是在bash，那就可以使用bash的内置命令echo做到同样的效果  
![](images/Pasted%20image%2020260330012322.png)  
利用通配符和echo可以匹配当前目录下的所有文件及目录，将其输出出来。接着发现cat也被过滤，同样的，我们利用输入重定向`< /flag`配合命令替换`$()`，可以将flag中的内容输出出来，以此绕过了ls和cat的过滤，达到相同结果

### 我把她弄丢了

先nc一下，可以看到题目描述，接着我们ls看一下，发现没有回显，说明我们不在shell这种可交互环境里，需要我们根据给出的附件，寻找漏洞，拿到shell权限，依旧先分析附件  
![](images/Pasted%20image%2020260330021743.png)  
无栈溢出保护，推测是栈溢出题目，ida分析  
![](images/Pasted%20image%2020260330021019.png)  
查字符串可以找到/bin/sh的文本，而且在左侧的shell函数里确实调用了system函数，但是system并没有直接调用sh，所以我们先记下sh文本所在地址0x402008，然后记下调用system函数的地址0x40120F。接着去vuln函数分析本题漏洞  
![](images/Pasted%20image%2020260330021247.png)  
很清楚的看到啊，本题的漏洞在于read函数过量读取输入导致的栈溢出，编写exp发送payload  
![](images/Pasted%20image%2020260330022937.png)  
注意这里的exp脚本中，多了rdi的地址和system函数的地址，是因为本题附件中并未直接使用system函数调用sh，而是将这些东西拆开来分散在各个地方，所以我们需要构造合理的ROP链，让system函数调用sh命令，所以我们需要提前使用指令`ROPgadget --binary ./pwn | grep "pop rdi ; ret"`查找<mark style="background: #FF5582A6;">将栈上数据弹出给rdi并且及时ret跳过无效指令的地址</mark>，记下它的地址，此时我们构造的payload逻辑是这样的：
1. 通过无意义的A字节填充入栈至溢出，并且正好填充到ret命令要读取的地址
2. 将`pop rdi;ret`填入，覆盖掉原本函数ret时读取到的跳转地址
3. CPU跳转后执行`pop rdi`，从栈上读取一个地址，而我们将sh的地址填入，CPU就会将`/bin/sh`这个数据存入rdi
4. 接着CPU执行`ret`，又从栈上读取一个地址，而我们将调用system的地址填入，此时CPU就会帮我们执行system函数  
而system函数执行时会从rdi寄存器读取参数，由此便达到了调用system函数执行/bin/sh的目的，这其实就是PWN中ROP链的构造方式  
![](images/Pasted%20image%2020260330030623.png)  
运行脚本，读取flag

### 签个到吧

真·签到题，会nc，会一点点基础Linux指令就能做出来的题目，没什么好说的  
![](images/Pasted%20image%2020260330014135.png)
