---
title: Hexo博客迁移腾讯云教程
date: 2026-06-04 23:32:40
tags: [hexo, 腾讯云, Linux, blog]
sitemap: false
categories: [blog, hexo]
---

本文记录在 GitHub 上部署的 Hexo 博客迁移到腾讯云服务器的过程。

<!-- more -->

## 第 1 步：在服务器上安装 Git 和 Nginx

在腾讯云服务器的终端中执行：

```shell
sudo apt update
sudo apt install git nginx -y
```

安装完成后，执行以下命令检查是否成功：

```shell
git --version
nginx -v
```

然后创建 git 用户

```
sudo adduser git
```

执行 `sudo adduser git` 后：

1. 输入密码（自己设定一个，记住它）
2. 确认密码
3. 出现 `Full Name []:` → **直接按回车**
4. 出现 `Room Number []:` → **直接按回车**
5. 出现 `Work Phone []:` → **直接按回车**
6. 出现 `Home Phone []:` → **直接按回车**
7. 出现 `Other []:` → **直接按回车**
8. 最后出现 `Is the information correct? [Y/n]` → 输入 `Y` 按回车

这样用户 `git` 就创建好了。

**完成后请执行以下检查：**

```shell
id git
```

如果显示类似 `uid=1001(git) gid=1001(git) ...` 的信息，说明创建成功。

## 第 2 步：创建 SSH 公钥存放目录

请依次执行以下命令：

```shell
sudo mkdir -p /home/git/.ssh
sudo touch /home/git/.ssh/authorized_keys
sudo chmod 700 /home/git/.ssh
sudo chmod 600 /home/git/.ssh/authorized_keys
sudo chown -R git:git /home/git/.ssh
```

执行完后，请运行检查命令：

```shell
sudo ls -la /home/git/.ssh/
```

执行这个命令，应该能看到文件列表。

## 第 3 步：添加你的本地公钥到服务器

这一步需要你在**本地电脑**上操作（不是服务器）。

### 3.1 查看本地是否有 SSH 公钥

在**你本地电脑的终端**（Windows 用 Git Bash 或 PowerShell，Mac/Linux 直接用终端）执行：

```shell
cat ~/.ssh/id_ed25519.pub
```

### 3.2 根据结果操作

**情况 A**：如果显示了一串以 `ssh-rsa` 开头、以邮箱结尾的内容 → 复制这整段内容走第 4 步

**情况 B**：如果显示 `No such file or directory` → 需要先生成公钥，执行：

```shell
ssh-keygen -t ed25519 -C "你的邮箱地址"
```

可以设置密钥口令；如果是个人电脑且能妥善保护本机，也可以留空，然后再执行 `cat ~/.ssh/id_ed25519.pub` 复制内容。

## 第 4 步：将公钥写入服务器

在**服务器终端**执行以下命令(you ssh key 替换成你上面的复制的内容)，将你的公钥写入 `authorized_keys`：

```shell
echo "you ssh key" | sudo tee -a /home/git/.ssh/authorized_keys
```

执行后，确认写入成功：

```shell
sudo cat /home/git/.ssh/authorized_keys
```

应该能看到你刚才发的那串公钥。

## 第 5 步：测试本地到服务器的 SSH 连接

在**你本地电脑的终端**执行：

```shell
ssh git@你的服务器公网IP
```

**注意**：把 `你的服务器公网IP` 换成你腾讯云的实际 IP 地址。

### 预期结果：

- 如果是第一次连接，会提示确认指纹，输入 `yes` 回车
- 如果连接成功，会出现类似 `Welcome to Ubuntu` 的信息，然后显示 `$` 或 `~$` 提示符

### 退出连接：

```shell
exit
```

## 第 6 步：创建 Git 裸仓库和网站目录

在**服务器终端**依次执行以下命令：

```shell
# 创建网站根目录
sudo mkdir -p /var/www/blog
sudo chown git:git /var/www/blog

# 切换到 git 用户主目录，创建裸仓库
sudo -u git bash -c "cd /home/git && git init --bare blog.git"
```

执行完后，验证创建成功：

```shell
ls -la /home/git/site.git/
```

应该能看到 `hooks`、`info`、`objects`、`refs` 等目录。

## 第 7 步：配置 Git Hooks（自动部署脚本）

在**服务器终端**执行：

```shell
sudo vi /home/git/site.git/hooks/post-receive
```

按 `i` 进入编辑模式，粘贴以下内容：

```shell
#!/bin/bash
git --work-tree=/var/www/blog --git-dir=/home/git/site.git checkout -f
```

粘贴后，按 `Esc` 键，输入 `:wq` 回车保存退出。

然后执行：

```
sudo chmod +x /home/git/site.git/hooks/post-receive
sudo chown git:git /home/git/site.git/hooks/post-receive
```

验证权限设置正确：

```
sudo ls -la /home/git/site.git/hooks/post-receive
```

应该显示 `-rwxr-xr-x` 开头（`x` 表示可执行）。

## 第 8 步：配置 Nginx

在**服务器终端**执行：

```shell
sudo vi /etc/nginx/sites-available/hexo
```

按 `i` 进入编辑模式，粘贴以下内容（把 `example.com` 换成你的域名）：

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/blog;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

粘贴后，按 `Esc` 键，输入 `:wq` 回车保存退出。

然后执行：

```shell
sudo ln -s /etc/nginx/sites-available/hexo /etc/nginx/sites-enabled/
sudo nginx -t
```

如果显示 `syntax is ok` 和 `test is successful`，继续执行：

```shell
sudo systemctl reload nginx
```

## 第 9 步：配置本地 Hexo 部署

这一步在**你本地电脑**操作。

### 9.1 安装 Git 部署插件

在你本地博客目录下打开终端，执行：

```shell
npm install hexo-deployer-git --save
```

### 9.2 修改站点配置文件

打开你本地博客目录下的 `_config.yml` 文件，找到 `deploy` 部分，修改为：

```yaml
deploy:
  type: git
  repo: git@你的服务器公网IP:/home/git/site.git
  branch: master
```

**注意**：把 `你的服务器公网IP` 换成实际的 IP 地址。

### 9.3 修改 url 配置（因为你有域名）

在同一个 `_config.yml` 文件中，找到 `url` 配置：

```yaml
url: https://example.com
```

## 第 10 步：执行部署

在**你本地电脑**的博客目录下，依次执行：

```
hexo clean
hexo g
hexo d
```

执行 `hexo d` 时会要求确认服务器指纹，输入 `yes` 回车。

### 部署成功后，验证：

1. 在浏览器访问 `http://你的服务器公网IP` 或 `http://example.com`（如果域名已经解析）

2. 在服务器上确认文件已同步：

    ```shell
    sudo ls -la /var/www/blog/
    ```

## 第 11 步：修复权限问题

在**服务器终端**执行：

```shell
sudo chmod 755 /var/www/blog
sudo chmod -R 755 /var/www/blog/*
```

然后重新加载 Nginx：

```shell
sudo systemctl reload nginx
```

## 第 12 步：上传证书到服务器

### 12.1 创建证书目录

在**服务器终端**执行：

```shell
sudo mkdir -p /etc/nginx/ssl/example.com
```

### 12.2 上传证书文件

你需要把证书文件上传到服务器。可以用以下任一方式：

**方法 A（如果你用 scp 命令，在本地电脑执行）：**

```shell
scp /本地路径/你的证书文件.pem git@你的服务器IP:/tmp/
scp /本地路径/你的私钥文件.key git@你的服务器IP:/tmp/
```

**方法 B（如果你用 WinSCP、FileZilla 等 SFTP 工具）：**
直接上传到 `/tmp/` 目录

### 12.3 移动证书到正确位置

上传后，在**服务器终端**执行：

```shell
sudo mv /tmp/你的证书文件.pem /etc/nginx/ssl/example.com/fullchain.pem
sudo mv /tmp/你的私钥文件.key /etc/nginx/ssl/example.com/privkey.pem
sudo chmod 600 /etc/nginx/ssl/example.com/privkey.pem
```

## 第 13 步：配置 Nginx 使用 HTTPS

在**服务器终端**执行：

```shell
sudo vi /etc/nginx/sites-available/hexo
```

按 `i` 进入编辑模式，**删除原有内容**，粘贴以下完整配置：

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/example.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/example.com/privkey.pem;

    root /var/www/blog;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

粘贴后，按 `Esc` 键，输入 `:wq` 回车保存退出。

然后执行：

```shell
sudo nginx -t
```

## 第 14 步：重启 Nginx 并测试

在**服务器终端**执行：

```shell
sudo systemctl restart nginx
```

然后检查 Nginx 状态：

```shell
sudo systemctl status nginx
```

**确认显示 `active (running)` 后**，在浏览器访问：

- `https://example.com`
- `http://example.com`（应该自动跳转到 HTTPS）

## 后续建议

### 1. 设置定时更新（可选）

如果服务器重启后需要保持 Nginx 自动启动：

```shell
sudo systemctl enable nginx
```

### 2. 后续发布流程

以后更新博客，只需要在本地执行

```shell
hexo clean && hexo g && hexo d
```

就会自动推送到服务器并生效。