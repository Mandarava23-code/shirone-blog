# 完整的HTTP请求

## 1. 请求行（Request Line）

**位置**：第一行  
**格式**：`<方法> <请求目标> <HTTP版本>`  
**作用**：定义请求的基本动作  
**示例：**

```
text

GET /index.html HTTP/1.1
```

**详细解释：**

- **方法：**
    
    - 表示客户端希望服务器执行的操作
        
    - 最常见的有：`GET`（获取资源）、`POST`（提交数据）、`PUT`（更新资源）、`DELETE`（删除资源）、`HEAD`（获取响应头）等
        
- **请求目标：**
    
    - 通常是你想要访问的资源的路径，例如 `/index.html`（单空格就为根目录）
        
    - 在某些情况下（例如使用代理时），它也可能是完整的URL，如 `http://www.example.com/index.html`
        
- **HTTP版本：**
    
    - 声明客户端使用的HTTP协议版本，以便服务器能够以兼容的方式响应。
        
    - 常见的有：`HTTP/1.1`（目前最广泛使用的）、`HTTP/2`（二进制协议，性能更好）、`HTTP/3`（基于QUIC协议）。

## 2. 请求头（Request Headers）

**位置**：请求行之后，空行之前  
**格式**：一系列 `key: value` 对  
**作用**：提供请求的元数据和上下文信息  
**常见请求头示例**：

```
text

Host: www.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: text/html,application/xhtml+xml
Accept-Language: zh-CN,zh;q=0.9
Content-Type: application/json
Authorization: Bearer token123
Cookie: sessionid=abc123
```

### 1. 基础信息头

这些头提供了关于请求本身的<mark style="background: #ABF7F7A6;">最基本信息</mark>

- **`Host`**: **（HTTP/1.1 必需字段）**
    
    - 指定请求的服务器的<mark style="background: #ABF7F7A6;">域名和端口号</mark>
        
    - 示例：`Host: www.example.com:443`
        
- **`User-Agent`**:
    
    - 描述发起请求的客户端软件<mark style="background: #ABF7F7A6;">（浏览器、操作系统、应用程序）</mark>的身份
        
    - 示例：`User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`
        
- **`Accept`**:
    
    - 告知服务器客户端能够处理<mark style="background: #ABF7F7A6;">哪些类型</mark>的响应内容（MIME 类型）
        
    - 示例：`Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8`
        

### 2. 内容协商头

客户端用它来声明自己的<mark style="background: #ABF7F7A6;">偏好</mark>，服务器可以根据这些信息返回最合适的内容

- **`Accept-Language`**:
    
    - 声明客户端偏好的<mark style="background: #ABF7F7A6;">自然语言</mark>
        
    - 示例：`Accept-Language: zh-CN, zh;q=0.9, en;q=0.8`
        
- **`Accept-Encoding`**:
    
    - 声明客户端能够理解的<mark style="background: #ABF7F7A6;">内容编码方式（通常是压缩算法）</mark>。这可以节省带宽
        
    - 示例：`Accept-Encoding: gzip, deflate, br`
        

### 3. 缓存控制头

用于<mark style="background: #ABF7F7A6;">验证缓存</mark>的有效性或直接<mark style="background: #ABF7F7A6;">控制缓存</mark>行为

- **`If-Modified-Since`**:
    
    - 条件请求。如果请求的资源<mark style="background: #ABF7F7A6;">在指定的日期之后没有被修改过</mark>，服务器将返回 `304 Not Modified`，而不是资源本身
        
    - 示例：`If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT`
        
- **`If-None-Match`**:
    
    - 条件请求。携带之前服务器返回的 `ETag` 值。<mark style="background: #ABF7F7A6;">如果资源的 `ETag` 没变</mark>，服务器返回 `304 Not Modified`
        
    - 示例：`If-None-Match: "737060cd8c284d8af7ad3082f209582d"`
        
- **`Cache-Control`**:
    
    - 用于指定请求/响应链中的所有<mark style="background: #ABF7F7A6;">缓存机制都必须遵守的指令</mark>
        
    - 示例（表示不要使用缓存）：`Cache-Control: no-cache`
        

### 4. 请求体描述头

当请求带有消息体（如 POST、PUT 请求）时，这些头用于<mark style="background: #ABF7F7A6;">描述消息体的信息</mark>

- **`Content-Type`**:
    
    - 指定请求体的媒体类型（MIME 类型）。<mark style="background: #FF5582A6;">对于 POST 请求非常重要</mark>
        
    - 示例（提交表单）：`Content-Type: application/x-www-form-urlencoded`
        
    - 示例（提交 JSON）：`Content-Type: application/json`
        
    - 示例（上传文件）：`Content-Type: multipart/form-data; boundary=something`
        
- **`Content-Length`**:
    
    - 以<mark style="background: #ABF7F7A6;">字节为单位</mark>，指明请求体的长度
        
    - 示例：`Content-Length: 348`
        

### 5. 身份认证头

用于向服务器<mark style="background: #ABF7F7A6;">证明客户端的身份</mark>

- **`Authorization`**:
    
    - 包含用于认证用户<mark style="background: #ABF7F7A6;">代理的凭证</mark>，例如 Bearer Token 或基本认证
        
    - 示例（Bearer Token）：`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
        
    - 示例（基本认证）：`Authorization: Basic YWxhZGRpbjpvcGVuc2VzYW1l`
        

### 6. 其他重要头

- **`Connection`**:
    
    - 控制<mark style="background: #ABF7F7A6;">当前事务完成后</mark>，网络连接是否保持打开。`keep-alive` 表示保持，`close` 表示关闭。
        
    - 示例：`Connection: keep-alive`
        
- **`Cookie`**:
    
    - 将之前由服务器通过 `Set-Cookie` 响应头发送的 Cookie 回传给服务器。
        
    - 示例：`Cookie: name=value; theme=light`
        
- **`Referer`**:
    
    - 表示当前请求是<mark style="background: #ABF7F7A6;">从哪个页面链接</mark>过来的。
        
    - 示例：`Referer: https://www.example.com/previous-page.html`

## 3. 空行（Empty Line）

**位置**：请求头之后  
**作用**：标识请求头结束，<mark style="background: #ABF7F7A6;">分隔头部和消息体</mark>  
**格式**：一个单独的CRLF（回车换行）

## 4. 消息体（Message Body）

**位置**：空行之后  
**作用**：包含要<mark style="background: #ABF7F7A6;">发送</mark>给服务器的数据（可选）  
**内容**：表单数据、JSON、XML、文件等

**示例**：

```
json

{
  "username": "john",
  "password": "secret123"
}
```

# 完整的HTTP响应

- [[#1. 状态行（Status Line）|1. 状态行（Status Line）]]
- [[#2. 响应头（Response Headers）|2. 响应头（Response Headers）]]
	- [[#2. 响应头（Response Headers）#基础信息头|基础信息头]]
	- [[#2. 响应头（Response Headers）#内容描述头|内容描述头]]
	- [[#2. 响应头（Response Headers）#缓存控制头|缓存控制头]]
	- [[#2. 响应头（Response Headers）#其他重要头|其他重要头]]
- [[#3. 空行（Empty Line）|3. 空行（Empty Line）]]
- [[#4. 消息体（Message Body）|4. 消息体（Message Body）]]

## 1. 状态行（Status Line）

**位置**：第一行  
**格式**：`<HTTP版本> <状态码> <原因短语>`  
**作用**：告知客户端请求的处理结果

**示例**：

```
text

HTTP/1.1 200 OK

text

HTTP/1.1 404 Not Found

text

HTTP/1.1 500 Internal Server Error
```

## 2. 响应头（Response Headers）

**位置**：状态行之后，空行之前  
**格式**：一系列 `字段名: 值` 对  
**作用**：提供关于响应的元数据信息

**常见响应头分类**：

### 基础信息头

- **`Server`**: 服务器软件信息  
    `Server: nginx/1.18.0`
    
- **`Date`**: 响应生成时间  
    `Date: Wed, 21 Oct 2023 07:28:00 GMT`
    

### 内容描述头

- **`Content-Type`**: 响应体的媒体类型  
    `Content-Type: text/html; charset=utf-8`
    
- **`Content-Length`**: 响应体的长度（字节）  
    `Content-Length: 1234`
    
- **`Content-Encoding`**: 内容编码方式（压缩）  
    `Content-Encoding: gzip`
    

### 缓存控制头

- **`Cache-Control`**: 缓存指令  
    `Cache-Control: max-age=3600`
    
- **`ETag`**: 资源版本标识符  
    `ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"`
    
- **`Last-Modified`**: 资源最后修改时间  
    `Last-Modified: Tue, 15 Nov 2022 08:12:31 GMT`
    

### 其他重要头

- **`Set-Cookie`**: 服务器向客户端设置 Cookie  
    `Set-Cookie: sessionId=abc123; Path=/; HttpOnly`
    
- **`Location`**: 重定向目标 URL（用于 3xx 响应）  
    `Location: https://example.com/new-page`
    
- **`Access-Control-Allow-Origin`**: CORS 跨域权限  
    `Access-Control-Allow-Origin: *`
    

## 3. 空行（Empty Line）

**位置**：响应头之后  
**作用**：标识响应头结束，分隔头部和消息体  
**格式**：一个单独的 CRLF（回车换行）

## 4. 消息体（Message Body）

**位置**：空行之后  
**作用**：包含服务器返回的实际数据（可选）  
**内容**：HTML 页面、JSON 数据、图片、文件等

# Web

## 1. 请求方式

- GET请求：最常见的请求方式，它用于获取资源，GET请求的参数是放在URL中
- POST请求：用于向服务器提交数据，POST请求的参数是放在请求体中
- PUT请求：用于更新或者创建资源，PUT请求是幂等的
- DELETE请求：用于从服务器删除指定的资源

## 2. HTTP认证

![](images/Pasted%20image%2020251126110511.png)  
发现身份认证是以base64编码的形式，所以利用yakit自带的base64编码功能，再导入常用密码字典，爆破密码，得到flag  
![](images/Pasted%20image%2020251126110931.png)
