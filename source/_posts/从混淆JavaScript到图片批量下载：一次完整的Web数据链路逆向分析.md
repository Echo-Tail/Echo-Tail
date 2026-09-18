---
title: 从混淆 JavaScript 到图片批量下载：一次完整的 Web 数据链路逆向分析
date: 2026-09-18 13:52:00
tags: [AI, 逆向工程, JavaScript, WebCrypto, 爬虫]
sitemap: false
categories: [AI, 逆向工程]
---


> 本文记录一次完整的前端 JavaScript 分析过程：从混淆代码、字符串解码、anti-debug 清理开始，一直到定位接口、还原 HKDF + AES-GCM 解密流程、确认 `postId` 作为 keyMaterial，最后用 Python 自动请求、解密并批量下载图片。
>
> 文章主要用于前端代码分析、调试与学习。请仅在你有权访问和分析的站点、项目或数据上使用本文中的方法。


<!-- more -->

---

## 1. 背景

最开始拿到的是一份高度混淆的 `main.js`。

代码里充斥着：

```js
_0x43ac("0xa1")
_0x2591b5()
_0x5gx8a(...)
_0x6mo8r(...)
```

同时还存在典型的 anti-debug 逻辑，例如动态构造：

```js
Function("debugger")
```

以及：

```js
Function("while (true) {}")
```

导致打开浏览器 F12 后很容易被 `debugger` 卡住。

最终目标不是单纯“让代码能跑”，而是：

1. 把字符串混淆还原；
2. 删除 anti-debug / self-defending / console protection；
3. 清理失效的 decoder 和 dead code；
4. 给业务变量和函数重命名；
5. 找到数据请求接口；
6. 找到加密数据的解密方式；
7. 用 Python 复现整个请求、解密、图片拼接和下载流程。

最终我们把一份难以阅读的混淆代码，整理成了比较清晰的业务逻辑。

---

## 2. 第一阶段：识别字符串解码器

原始代码里最常见的模式是：

```js
_0x43ac("0xa1")
_0x43ac("0xd1")
_0x43ac("0xec")
```

进一步分析发现：

- `_0x15ba()`：返回字符串池；
- `_0x43ac()`：根据十六进制索引，从字符串池解码字符串；
- 程序启动时还会旋转字符串数组；
- 使用的 Base64 字符表不是标准顺序。

字符串表的自定义 alphabet 为：

```text
abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=
```

而不是标准 Base64 常见的：

```text
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
```

经过分析后，能够得到类似：

```text
0x83 -> danger
0x84 -> setItem
0x8a -> call
0x90 -> constructo
0x9b -> string
0xa4 -> importKey
0xa8 -> AES-GCM
0xae -> SHA-256
0xb1 -> apply
0xbe -> ajax
0xc0 -> slice
0xc4 -> setInterva
0xd1 -> debu
0xda -> HKDF
0xdf -> subtle
0xec -> gger
```

这时候就能看出一些关键拼接：

```js
"debu" + "gger"
```

实际上就是：

```js
"debugger"
```

而：

```js
"constructo" + "r"
```

就是：

```js
"constructor"
```

这一步非常重要，因为后面的 anti-debug 逻辑从此不再是黑盒。

---

## 3. 第二阶段：字符串批量替换

仅仅手工看懂几组字符串没有意义，所以接下来需要批量把：

```js
_0x43ac("0xa1")
```

替换为：

```js
".u-totop"
```

同时还需要处理多级 alias，例如：

```js
var _0x2bbb7e = _0x43ac;
var _0x35967b = _0x2bbb7e;

_0x35967b("0xa1");
```

真正的调用链是：

```text
_0x35967b
    ↓
_0x2bbb7e
    ↓
_0x43ac
```

所以需要递归解析 alias。

一个实用的思路是：

```python
decoder_aliases = {"_0x43ac"}

changed = True

while changed:
    changed = False

    for left, right in assignments:
        if right in decoder_aliases and left not in decoder_aliases:
            decoder_aliases.add(left)
            changed = True
```

然后批量扫描：

```python
_0xXXXXXX("0xYY")
```

只要 `_0xXXXXXX` 属于 `decoder_aliases`，就替换成真实字符串。

---

## 4. 第三阶段：常量折叠

混淆器还会把简单数字写成：

```js
-0x75e * 0x4 + 0x24eb * 0x1 + -0x773 * 0x1
```

实际上结果就是：

```js
0
```

比如 anti-debug 入口原本是：

```js
_0x283666(
    -0x75e * 0x4 +
    0x24eb * 0x1 +
    -0x773 * 0x1
);
```

折叠后：

```js
_0x283666(0);
```

类似地：

```js
setInterval(..., 0x1abc + 0x3 * 0x255 + 0xa1 * -0x23);
```

最终可以还原为：

```js
setInterval(..., 3000);
```

这一步让 anti-debug 行为变得非常明显。

---

## 5. 第四阶段：识别 anti-debug

经过字符串解码和常量折叠后，核心 anti-debug 逻辑变成了：

```js
function _0x2591b5(arg) {
    function _0x283666(counter) {
        if (typeof counter === "string") {
            return function() {}
                ["constructor"]("while (true) {}")
                ["apply"]("counter");
        } else {
            ("" + counter / counter).length !== 1 ||
            counter % 20 === 0
                ? function() {
                    return true;
                }
                ["constructor"]("debugger")
                ["call"]("action")
                : function() {
                    return false;
                }
                ["constructor"]("debugger")
                ["apply"]("stateObject");
        }

        _0x283666(++counter);
    }

    try {
        if (arg) {
            return _0x283666;
        } else {
            _0x283666(0);
        }
    } catch (e) {}
}
```

并且它还会周期执行：

```js
setInterval(_0x2591b5, 3000);
```

这就是打开 F12 后不断被 `debugger` 卡住的根源。

除此之外，还有：

- self-defending；
- `toString().search(...)` 自检；
- console 方法重写；
- `console.log / warn / info / error / trace` 包装。

清理这些保护代码后，业务逻辑终于开始变得清晰。

---

## 6. 第五阶段：清理 decoder 和 dead code

字符串调用全部解完后：

```js
_0x15ba()
_0x43ac()
```

已经失去用途。

所以可以进一步删除：

```text
字符串池
字符串数组 rotation bootstrap
decoder 函数
decoder alias
0x 索引 lookup object
```

随后又清理了明显无引用的对象，例如：

```js
var _0x33525c = {
    _0x2929db: "0x9d",
    _0x20e094: "0xd0",
    ...
};
```

因为这些对象原本只是：

```text
对象属性
   ↓
十六进制字符串
   ↓
decoder
   ↓
真实字符串
```

字符串解码完成后，它们全部变成 dead code。

最终 `_0x...` 标识符从大量残留，逐步减少到个位数，再把几个 self-defending wrapper factory 删除后，业务代码已经基本脱离混淆层。

---

## 7. 语义重命名

接下来最有价值的一步，是根据上下文给变量重命名。

例如：

```text
_0x9fea6   -> cookieName
_0x109940  -> cookieValue
_0x2b1888  -> expireHours
_0x3b9439  -> expiresAt
_0x4952c2  -> cookieText
```

点赞逻辑：

```text
_0x2f9f14 -> likeButton
_0x59c6d8 -> itemId
_0xc16962 -> likeState
```

解密部分：

```text
_0x333dbf -> encryptedBase64
_0x1b6091 -> keyMaterial
_0x550d91 -> encryptedBytes
_0x25d198 -> salt
_0xeabe19 -> iv
_0xc6d5ae -> ciphertext
_0x467433 -> hkdfBaseKey
_0x458d0d -> aesKey
_0x4a5b01 -> plaintextBuffer
```

函数：

```text
_0x5gx8a -> fetchPostDataWithRetry
_0x6mo8r -> decryptPayload
```

这时候，原本看起来像“天书”的代码已经能直接阅读。

---

## 8. 找到内容请求接口

还原后发现一个很关键的函数：

```js
function fetchPostDataWithRetry(
    postId,
    loadContext,
    retryCount
) {
    $.ajax({
        url: "/app/post/p?id=" + postId,
        timeout: 3000,

        success: function(response) {
            loadData(
                postId,
                response.data,
                loadContext,
                true
            );

            sessionStorage.setItem(
                "mzt_cache_" + postId,
                response.data
            );
        },

        error: function() {
            if (retryCount < 2) {
                retryCount++;

                fetchPostDataWithRetry(
                    postId,
                    loadContext,
                    retryCount
                );
            }
        }
    });
}
```

也就是说接口是：

```text
GET /app/post/p?id=<postId>
```

例如：

```text
https://kkmzt.com/app/post/p?id=168998
```

实际请求结果：

```json
{
  "data": "rCU5qOU0nEsyTfeYLX7yGVHpqA4XA8TlQFRjhMTsfV..."
}
```

`data` 字段不是普通 JSON，而是一段 Base64。

---

## 9. 分析 response.data

Base64 解码后：

```text
decoded byte length: 385
```

根据 `decryptPayload()` 的代码：

```js
salt = encryptedBytes.slice(0, 16);

iv = encryptedBytes.slice(16, 28);

ciphertext = encryptedBytes.slice(28);
```

所以二进制结构是：

```text
+----------------------+----------------------+----------------------+
| salt                 | iv                   | ciphertext           |
+----------------------+----------------------+----------------------+
| 16 bytes             | 12 bytes             | remaining bytes      |
+----------------------+----------------------+----------------------+
| byte 0 ~ 15          | byte 16 ~ 27         | byte 28 ~ end        |
+----------------------+----------------------+----------------------+
```

某次真实请求中：

```text
salt:
ac2539a8e5349c4b324df7982d7ef219

iv:
51e9a80e1703c4e540546384
```

---

## 10. decryptPayload() 的完整逻辑

清理后的核心函数可以理解为：

```js
async function decryptPayload(
    encryptedBase64,
    keyMaterial
) {
    try {
        const encryptedBytes =
            Uint8Array.from(
                atob(encryptedBase64),
                char => char.charCodeAt(0)
            );

        const salt =
            encryptedBytes.slice(0, 16);

        const iv =
            encryptedBytes.slice(16, 28);

        const ciphertext =
            encryptedBytes.slice(28);

        const textEncoder =
            new TextEncoder();

        const hkdfBaseKey =
            await crypto.subtle.importKey(
                "raw",
                textEncoder.encode(keyMaterial),
                "HKDF",
                false,
                ["deriveKey"]
            );

        const aesKey =
            await crypto.subtle.deriveKey(
                {
                    name: "HKDF",
                    hash: "SHA-256",
                    salt: salt,
                    info: new Uint8Array(0)
                },
                hkdfBaseKey,
                {
                    name: "AES-GCM",
                    length: 256
                },
                false,
                ["decrypt"]
            );

        const plaintextBuffer =
            await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                aesKey,
                ciphertext
            );

        return JSON.parse(
            new TextDecoder().decode(
                plaintextBuffer
            )
        );

    } catch (e) {
        return [];
    }
}
```

流程就是：

```text
Base64
   ↓
Uint8Array
   ↓
拆 salt / iv / ciphertext
   ↓
keyMaterial
   ↓
HKDF-SHA256
   ↓
AES-256-GCM key
   ↓
AES-GCM decrypt
   ↓
UTF-8
   ↓
JSON.parse()
```

---

## 11. 最大的问题：keyMaterial 到底是什么？

最开始只有：

```js
decryptPayload(
    encryptedBase64,
    keyMaterial
)
```

但不知道 `keyMaterial` 从哪里来。

继续寻找 `loadData()` 后，终于发现：

```js
async function loadData(
    _0x12b633,
    _0x36aba2
) {
    ...

    _0x5162ec =
        await _0x6mo8r(
            _0x36aba2,
            _0x12b633
        );

    ...
}
```

对应：

```text
_0x12b633 = postId
_0x36aba2 = encryptedData
```

所以真正逻辑是：

```js
const imageNames =
    await decryptPayload(
        encryptedData,
        postId
    );
```

也就是说：

> `postId` 本身，就是 HKDF 的 `keyMaterial`。

对于：

```text
https://kkmzt.com/photo/168998
```

keyMaterial 就是字符串：

```text
"168998"
```

注意 JavaScript 中使用了：

```js
TextEncoder().encode(keyMaterial)
```

因此 Python 里应使用：

```python
b"168998"
```

而不是把它当整数处理。

---

## 12. Python 复现 HKDF + AES-GCM 解密

需要：

```bash
pip install requests cryptography
```

核心代码：

```python
import base64
import json

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def decrypt_payload(
    encrypted_base64: str,
    post_id: str
):
    encrypted_bytes = base64.b64decode(
        encrypted_base64
    )

    salt = encrypted_bytes[:16]
    iv = encrypted_bytes[16:28]
    ciphertext = encrypted_bytes[28:]

    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        info=b"",
    )

    aes_key = hkdf.derive(
        str(post_id).encode("utf-8")
    )

    aesgcm = AESGCM(aes_key)

    plaintext = aesgcm.decrypt(
        iv,
        ciphertext,
        None
    )

    text = plaintext.decode("utf-8")

    return json.loads(text)
```

---

## 13. 解密结果是什么？

以：

```text
postId = 168998
```

为例，最终得到：

```json
[
  "08h01dn5y2.jpg",
  "08h02vbi9z.jpg",
  "08h03tce7u.jpg",
  "08h04d1g3z.jpg",
  "08h05segb4.jpg",
  "08h06jkm7m.jpg",
  "08h07utu08.jpg",
  "08h08c1lc1.jpg",
  "08h09nc9c6.jpg",
  "08h10yolr9.jpg",
  "08h11zl1mj.jpg",
  "08h12fd63n.jpg",
  "08h13wfe5f.jpg",
  "08h14kncg2.jpg",
  "08h15d3h8j.jpg",
  "08h16xb72d.jpg",
  "08h17wzny5.jpg",
  "08h18oq3gg.jpg",
  "08h19m71ga.jpg",
  "08h20e46na.jpg"
]
```

也就是说，服务器并没有直接返回完整图片 URL，而是返回：

```text
加密后的图片文件名列表
```

---

## 14. 图片 URL 是怎么拼出来的？

继续看 `loadData()`：

```js
const firstImageSrc =
    $("figure img").attr("src");

const imageBase =
    firstImageSrc.substring(
        0,
        firstImageSrc.lastIndexOf("/")
    ) + "/";
```

然后：

```js
imageNames.forEach(
    function(filename, index) {
        state.images[index] =
            imageBase + filename;
    }
);
```

这一步非常关键。

它不是根据：

```text
postId
```

计算年月路径。

也不是硬编码：

```text
2026/03
```

而是：

> 直接从文章页第一张 `<figure><img>` 的 `src` 里取目录。

例如文章：

```text
https://kkmzt.com/photo/168998
```

第一张图片：

```text
https://f.meizitu.net/image/2026/03/08h01dn5y2.jpg
```

截掉最后一个 `/` 之后的文件名：

```text
https://f.meizitu.net/image/2026/03/
```

然后：

```text
imageBase
+
08h02vbi9z.jpg
```

得到：

```text
https://f.meizitu.net/image/2026/03/08h02vbi9z.jpg
```

所以年月是动态的。

不同文章可能是：

```text
/image/2025/12/
/image/2026/01/
/image/2026/03/
/image/2026/09/
```

程序根本不需要关心日期。

---

## 15. Python 自动提取图片目录

可以直接请求文章页：

```python
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse


def get_image_base(article_url):
    response = requests.get(article_url)
    response.raise_for_status()

    soup = BeautifulSoup(
        response.text,
        "html.parser"
    )

    img = soup.select_one(
        "figure img"
    )

    src = img.get("src")

    full_src = urljoin(
        article_url,
        src
    )

    parsed = urlparse(
        full_src
    )

    base_path = (
        parsed.path
        .rsplit("/", 1)[0]
        + "/"
    )

    return (
        f"{parsed.scheme}://"
        f"{parsed.netloc}"
        f"{base_path}"
    )
```

对于：

```text
https://kkmzt.com/photo/168998
```

会得到：

```text
https://f.meizitu.net/image/2026/03/
```

---

## 16. 最终版：输入 postId 自动下载全部图片

下面给出一个完整示例。

安装依赖：

```bash
pip install requests beautifulsoup4 cryptography
```

代码：

```python
import base64
import json
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


BASE_URL = "https://kkmzt.com"


def make_session():
    session = requests.Session()

    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 "
            "(Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/152.0.0.0 "
            "Safari/537.36"
        )
    })

    return session


def get_image_base(
    session,
    post_id
):
    article_url = (
        f"{BASE_URL}/photo/{post_id}"
    )

    response = session.get(
        article_url,
        timeout=10
    )

    response.raise_for_status()

    soup = BeautifulSoup(
        response.text,
        "html.parser"
    )

    img = soup.select_one(
        "figure img"
    )

    if not img:
        raise RuntimeError(
            "figure img not found"
        )

    src = urljoin(
        article_url,
        img.get("src")
    )

    parsed = urlparse(src)

    base_path = (
        parsed.path
        .rsplit("/", 1)[0]
        + "/"
    )

    image_base = (
        f"{parsed.scheme}://"
        f"{parsed.netloc}"
        f"{base_path}"
    )

    return image_base, article_url


def fetch_encrypted_data(
    session,
    post_id,
    article_url
):
    api_url = (
        f"{BASE_URL}/app/post/p"
        f"?id={post_id}"
    )

    response = session.get(
        api_url,
        headers={
            "X-Requested-With":
                "XMLHttpRequest",

            "Referer":
                article_url,
        },
        timeout=10,
    )

    response.raise_for_status()

    return response.json()["data"]


def decrypt_image_list(
    encrypted_base64,
    post_id
):
    encrypted_bytes = (
        base64.b64decode(
            encrypted_base64
        )
    )

    salt = encrypted_bytes[:16]

    iv = encrypted_bytes[
        16:28
    ]

    ciphertext = encrypted_bytes[
        28:
    ]

    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        info=b"",
    )

    aes_key = hkdf.derive(
        str(post_id)
        .encode("utf-8")
    )

    plaintext = AESGCM(
        aes_key
    ).decrypt(
        iv,
        ciphertext,
        None
    )

    return json.loads(
        plaintext.decode("utf-8")
    )


def download_images(
    session,
    filenames,
    image_base,
    output_dir,
    article_url
):
    output_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    for index, filename in enumerate(
        filenames,
        start=1
    ):
        image_url = urljoin(
            image_base,
            filename
        )

        output_path = (
            output_dir
            / f"{index:02d}_{filename}"
        )

        print(
            f"[{index:02d}] "
            f"{image_url}"
        )

        response = session.get(
            image_url,
            headers={
                "Referer":
                    article_url
            },
            timeout=20
        )

        response.raise_for_status()

        output_path.write_bytes(
            response.content
        )


def main():
    if len(sys.argv) < 2:
        print(
            "Usage: "
            "python download.py POST_ID"
        )

        sys.exit(1)

    post_id = sys.argv[1]

    session = make_session()

    image_base, article_url = (
        get_image_base(
            session,
            post_id
        )
    )

    print(
        "Image base:",
        image_base
    )

    encrypted_data = (
        fetch_encrypted_data(
            session,
            post_id,
            article_url
        )
    )

    filenames = (
        decrypt_image_list(
            encrypted_data,
            post_id
        )
    )

    print(
        "Images:",
        len(filenames)
    )

    download_images(
        session,
        filenames,
        image_base,
        Path("downloads") / post_id,
        article_url,
    )


if __name__ == "__main__":
    main()
```

运行：

```bash
python download.py 168998
```

最后：

```text
downloads/
└── 168998/
    ├── 01_08h01dn5y2.jpg
    ├── 02_08h02vbi9z.jpg
    ├── 03_08h03tce7u.jpg
    ├── ...
    └── 20_08h20e46na.jpg
```

---

## 17. 完整数据链路总结

最后把整个过程压缩成一张图：

```text
用户访问文章
https://kkmzt.com/photo/168998
            │
            ├─────────────────────────────┐
            │                             │
            ▼                             ▼
取 figure img                   GET /app/post/p?id=168998
            │                             │
            ▼                             ▼
获取 CDN 图片目录                  JSON response
            │                             │
            │                       response.data
            │                             │
            │                             ▼
            │                          Base64
            │                             │
            │                             ▼
            │                   salt / iv / ciphertext
            │                             │
            │                             ▼
            │                   postId = keyMaterial
            │                             │
            │                             ▼
            │                       HKDF-SHA256
            │                             │
            │                             ▼
            │                       AES-256-GCM
            │                             │
            │                             ▼
            │                         JSON array
            │                             │
            │                             ▼
            │                       图片文件名数组
            │                             │
            └──────────────┬──────────────┘
                           │
                           ▼
                  imageBase + filename
                           │
                           ▼
                  完整图片 CDN URL
                           │
                           ▼
                       批量下载
```

---

## 18. 这次分析里最值得记住的几点

### 18.1 不要一开始就死磕完整业务逻辑

面对混淆代码，优先拆：

```text
字符串池
decoder
alias
常量表达式
anti-debug
```

只要这些基础层拆掉，业务逻辑通常会自动浮现。

---

### 18.2 anti-debug 很多时候只是“壳”

最开始最显眼的是：

```js
debugger
while(true){}
console hook
```

但这些代码和真正业务功能没有关系。

删除后剩下的核心其实很简单：

```text
请求
缓存
解密
图片展示
点赞
Cookie
```

---

### 18.3 不要看到 AES 就以为 key 一定藏得很深

这次最有意思的一点就是：

```text
keyMaterial = postId
```

并没有复杂的 secret。

真正起作用的是：

```text
postId
+
随机 salt
+
HKDF-SHA256
```

共同派生 AES key。

---

### 18.4 图片年月路径不应该写死

错误思路：

```python
image_base = (
    "https://f.meizitu.net/"
    "image/2026/03/"
)
```

正确思路：

```text
读取文章页第一张图
↓
截取最后一个 / 之前的目录
↓
作为 imageBase
```

这样跨年份、跨月份都能工作。

---

## 19. 最终结论

最终我们完整还原出了这套逻辑：

```text
文章 ID
↓
请求加密图片列表
↓
Base64
↓
16-byte salt
↓
12-byte IV
↓
AES-GCM ciphertext
↓
postId 作为 HKDF keyMaterial
↓
HKDF-SHA256
↓
AES-256-GCM 解密
↓
JSON.parse
↓
图片文件名数组
↓
从文章首图提取 CDN 目录
↓
拼接完整 URL
↓
批量下载
```

从最开始的一份高度混淆、带 anti-debug 的 JavaScript，到最后能够用几十行 Python 完整复现数据链路，这个过程最核心的不是“破解某一个算法”，而是逐层把混淆和业务逻辑分离：

```text
混淆层
→ 保护层
→ 请求层
→ 加密层
→ 业务层
```

只要层次拆清楚，复杂代码就会变得非常普通。


## 20. 浏览器端分析过程：如何从 DevTools 一步步定位调用链

静态去混淆解决的是“代码能不能看懂”，而浏览器 DevTools 解决的是：

> 这段代码在页面里到底什么时候执行、请求了什么接口、返回了什么数据、哪个函数继续处理了这些数据。

这部分非常重要，因为很多时候单看一个 JS 文件，只能看到：

```js
loadData(postId, response.data);
```

却找不到：

```js
function loadData(...) { ... }
```

这时浏览器就是最快的定位工具。

### 20.1 Network：先找真实接口

打开目标文章页，例如：

```text
https://kkmzt.com/photo/168998
```

按 `F12` 打开 DevTools，切到 `Network`，刷新页面，然后搜索：

```text
post
/app/post/p
```

可以定位到：

```text
https://kkmzt.com/app/post/p?id=168998
```

点开请求后，重点看：

```text
Headers
Response
Preview
Initiator
```

其中 `Response` 会看到：

```json
{
  "data": "rCU5qOU0nEsyTfeYLX7yGVHpqA4XA8Tl..."
}
```

这一步先确认两件事：

1. 接口返回的是 JSON；
2. `data` 字段不是明文，而是一段长 Base64 字符串。

### 20.2 Initiator：找是谁发起请求

Network 请求详情里的 `Initiator` 非常有用，它通常能告诉你：

> 哪个 JS 文件、哪一行代码触发了这个请求。

如果点进去看到：

```js
$.ajax({
  url: "/app/post/p?id=" + postId,
  ...
});
```

那么就能直接定位到数据加载函数。

### 20.3 Sources：全局搜索函数和算法特征

如果代码里看到：

```js
loadData(...)
```

但当前文件里没有定义它，可以在 `Sources` 面板按：

```text
Ctrl + Shift + F
```

全局搜索：

```text
loadData
```

同样可以搜：

```text
_0x6mo8r
HKDF
AES-GCM
deriveKey
mzt_cache_
/app/post/p?id=
```

这些字符串比 `_0x123abc` 这种变量名更适合作为锚点，因为它们往往代表真实 API 或算法名称。

### 20.4 Console：确认全局函数

可以直接输入：

```js
typeof loadData
```

如果返回：

```text
"function"
```

说明当前页面环境里确实存在这个函数。

还可以试：

```js
loadData.toString()
```

如果原始函数可见，浏览器会打印函数源码。

同理可以检查：

```js
typeof _0x6mo8r
_0x6mo8r.toString()
```

### 20.5 Console：直接验证接口

也可以直接请求：

```js
fetch("/app/post/p?id=168998")
  .then(r => r.json())
  .then(console.log);
```

如果返回：

```js
{
  data: "rCU5qOU0nEsyTfeY..."
}
```

说明接口不依赖额外复杂参数。

如果返回 `401` 或 `403`，则需要进一步检查 Cookie、Referer、Authorization 或其他请求头。

### 20.6 Console：验证图片基础目录

文章页可以直接执行：

```js
$("figure img").attr("src")
```

例如返回：

```text
https://f.meizitu.net/image/2026/03/08h01dn5y2.jpg
```

然后：

```js
const src = $("figure img").attr("src");
src.substring(0, src.lastIndexOf("/")) + "/";
```

得到：

```text
https://f.meizitu.net/image/2026/03/
```

这验证了 `loadData()` 并没有写死年份和月份，而是从页面现有图片 URL 中提取目录。

### 20.7 找到关键调用关系

最终定位到：

```js
async function loadData(postId, encryptedData) {
  const imageNames = await _0x6mo8r(
    encryptedData,
    postId
  );
}
```

于是调用关系就明确了：

```text
encryptedData = response.data
postId = HKDF keyMaterial
```

即：

```js
decryptPayload(response.data, postId)
```

### 20.8 浏览器端分析流程总结

实际分析时可以按这个顺序：

```text
Network
  ↓
找到 /app/post/p?id=...
  ↓
看 Response
  ↓
看 Initiator
  ↓
跳到请求发起代码
  ↓
看到 loadData(...)
  ↓
Sources 全局搜索 loadData
  ↓
找到 _0x6mo8r 调用
  ↓
确认参数关系
  ↓
Console 验证函数与图片目录
```

静态分析与动态分析结合，效率通常比只靠其中一种方式高很多。

## 21. 完整 Python 一键下载脚本

下面是最终完整版本，功能包括：

```text
输入 postId
↓
请求文章页
↓
自动提取第一张 figure img 的目录
↓
请求 /app/post/p?id=...
↓
Base64 解码
↓
拆 salt / iv / ciphertext
↓
postId 作为 HKDF keyMaterial
↓
HKDF-SHA256
↓
AES-256-GCM 解密
↓
JSON 图片文件名数组
↓
拼接完整 CDN URL
↓
批量下载
↓
生成 manifest.json
```

安装依赖：

```bash
pip install requests beautifulsoup4 cryptography
```

完整代码：

```python
import argparse
import base64
import json
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


DEFAULT_BASE_URL = "https://kkmzt.com"


def make_session():
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/152.0.0.0 Safari/537.36"
        ),
        "Accept": "*/*",
    })
    return session


def fetch_article_image_base(session, base_url, post_id, timeout=10):
    article_url = base_url.rstrip("/") + f"/photo/{post_id}"
    print(f"[i] Fetch article page: {article_url}")

    response = session.get(article_url, timeout=timeout)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    img = soup.select_one("figure img")

    if not img:
        raise RuntimeError("Could not find first <figure><img>.")

    src = img.get("src")
    if not src:
        raise RuntimeError("The first figure img does not have src.")

    full_src = urljoin(article_url, src)
    parsed = urlparse(full_src)
    base_path = parsed.path.rsplit("/", 1)[0] + "/"
    image_base = f"{parsed.scheme}://{parsed.netloc}{base_path}"

    print(f"[+] First image src : {full_src}")
    print(f"[+] Image base URL  : {image_base}")

    return image_base, article_url


def fetch_encrypted_data(session, base_url, post_id, article_url, timeout=10):
    api_url = base_url.rstrip("/") + f"/app/post/p?id={post_id}"
    print(f"[i] Fetch API: {api_url}")

    response = session.get(
        api_url,
        headers={
            "Accept": "application/json, text/plain, */*",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": article_url,
        },
        timeout=timeout,
    )

    response.raise_for_status()
    payload = response.json()

    if not isinstance(payload, dict) or "data" not in payload:
        raise RuntimeError("API response does not contain data.")

    encrypted_base64 = payload["data"]

    if not isinstance(encrypted_base64, str):
        raise RuntimeError("response.data is not string.")

    return encrypted_base64


def decrypt_image_list(encrypted_base64, post_id):
    encrypted_bytes = base64.b64decode(
        encrypted_base64,
        validate=True,
    )

    if len(encrypted_bytes) < 29:
        raise ValueError("Encrypted payload is too short.")

    salt = encrypted_bytes[:16]
    iv = encrypted_bytes[16:28]
    ciphertext = encrypted_bytes[28:]

    print("\n===== Encryption layout =====")
    print(f"total      : {len(encrypted_bytes)} bytes")
    print(f"salt       : {len(salt)} bytes")
    print(f"iv         : {len(iv)} bytes")
    print(f"ciphertext : {len(ciphertext)} bytes")

    key_material = str(post_id).encode("utf-8")

    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        info=b"",
    )

    aes_key = hkdf.derive(key_material)
    aesgcm = AESGCM(aes_key)

    plaintext = aesgcm.decrypt(
        iv,
        ciphertext,
        None,
    )

    data = json.loads(plaintext.decode("utf-8"))

    if not isinstance(data, list):
        raise RuntimeError("Decrypted JSON is not a list.")

    return [
        item.strip()
        for item in data
        if isinstance(item, str) and item.strip()
    ]


def download_images(
    session,
    filenames,
    image_base,
    output_dir,
    article_url,
    timeout=20,
):
    output_dir.mkdir(parents=True, exist_ok=True)

    manifest = []
    success = 0

    for index, filename in enumerate(filenames, start=1):
        image_url = urljoin(image_base, filename)
        local_name = f"{index:02d}_{filename}"
        local_path = output_dir / local_name

        print(f"[{index:02d}/{len(filenames):02d}] {image_url}")

        try:
            response = session.get(
                image_url,
                headers={"Referer": article_url},
                timeout=timeout,
                stream=True,
            )
            response.raise_for_status()

            with local_path.open("wb") as f:
                for chunk in response.iter_content(chunk_size=1024 * 128):
                    if chunk:
                        f.write(chunk)

            size = local_path.stat().st_size
            success += 1

            manifest.append({
                "index": index,
                "filename": filename,
                "url": image_url,
                "local_file": local_name,
                "size": size,
                "status": "ok",
            })

        except Exception as exc:
            manifest.append({
                "index": index,
                "filename": filename,
                "url": image_url,
                "local_file": local_name,
                "size": 0,
                "status": "failed",
                "error": str(exc),
            })

    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"\n[+] Downloaded: {success}/{len(filenames)}")
    print(f"[+] Folder: {output_dir}")
    print(f"[+] Manifest: {manifest_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Fetch, decrypt and download post images."
    )

    parser.add_argument("post_id", help="Post ID")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--output", default=None)
    parser.add_argument("--timeout", type=float, default=10)

    args = parser.parse_args()

    output_dir = (
        Path(args.output)
        if args.output
        else Path("downloads") / str(args.post_id)
    )

    session = make_session()

    try:
        image_base, article_url = fetch_article_image_base(
            session,
            args.base_url,
            args.post_id,
            args.timeout,
        )

        encrypted_data = fetch_encrypted_data(
            session,
            args.base_url,
            args.post_id,
            article_url,
            args.timeout,
        )

        filenames = decrypt_image_list(
            encrypted_data,
            args.post_id,
        )

        print("\n===== Image URLs =====")
        for index, filename in enumerate(filenames, start=1):
            print(f"{index:02d}. {urljoin(image_base, filename)}")

        download_images(
            session,
            filenames,
            image_base,
            output_dir,
            article_url,
            timeout=max(args.timeout, 20),
        )

    except Exception as exc:
        print(f"\n[ERROR] {type(exc).__name__}: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
```

运行：

```bash
python download_post_images.py 168998
```

输出目录：

```text
downloads/
└── 168998/
    ├── 01_08h01dn5y2.jpg
    ├── 02_08h02vbi9z.jpg
    ├── ...
    ├── 20_08h20e46na.jpg
    └── manifest.json
```

## 22. 浏览器 JavaScript 与 Python 的对应关系

| 浏览器 JavaScript | Python |
|---|---|
| `$.ajax()` | `requests.get()` |
| `response.data` | `response.json()["data"]` |
| `atob()` | `base64.b64decode()` |
| `Uint8Array.slice()` | Python `bytes` 切片 |
| `TextEncoder()` | `.encode("utf-8")` |
| `crypto.subtle.importKey()` | HKDF 输入材料 |
| `crypto.subtle.deriveKey()` | `HKDF(...).derive()` |
| `AES-GCM decrypt` | `AESGCM(...).decrypt()` |
| `TextDecoder()` | `.decode("utf-8")` |
| `JSON.parse()` | `json.loads()` |
| `$("figure img").attr("src")` | BeautifulSoup `select_one()` |

这个映射很适合用来理解浏览器 Web Crypto API 与 Python `cryptography` 库之间的一一对应关系。
