# 腾讯云服务器部署指南

## 第一步：准备服务器环境

### 1. 登录服务器

在腾讯云控制台，点击「登录」按钮，使用标准登录方式进入服务器终端。

### 2. 安装必要软件

```bash
# 切换到 root 用户
sudo su

# 安装 Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 验证安装
node -v
npm -v

# 安装 PM2 进程管理器
npm install -g pm2

# 安装 Nginx
yum install -y epel-release
yum install -y nginx

# 启动 Nginx
systemctl start nginx
systemctl enable nginx
```

### 3. 开放防火墙端口

```bash
# 开放 80 端口
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --reload

# 如果使用的是 firewalld 没有运行，可以跳过
```

### 4. 腾讯云安全组配置

在腾讯云控制台：
1. 进入「轻量应用服务器」→ 选择实例
2. 点击「防火墙」标签
3. 添加规则：端口 80，协议 TCP，来源 0.0.0.0/0

---

## 第二步：上传项目文件

### 方法一：使用 FTP 工具（推荐新手）

1. 下载 FileZilla 或 WinSCP
2. 连接信息在腾讯云控制台可以查看
3. 将整个 `kami-verify` 文件夹上传到 `/var/www/` 目录

### 方法二：使用 Git（推荐）

```bash
# 在服务器上执行
cd /var/www
git clone 你的仓库地址 kami-verify
```

### 方法三：使用 SCP 命令（本地执行）

```powershell
# 在本地 PowerShell 执行
scp -r "kami-verify" root@你的服务器IP:/var/www/
```

---

## 第三步：部署后端

```bash
cd /var/www/kami-verify

# 安装依赖
npm install --production

# 启动服务
pm2 start src/app.js --name kami-api

# 设置开机自启
pm2 save
pm2 startup
```

---

## 第四步：部署前端

```bash
cd /var/www/kami-verify/admin

# 安装依赖
npm install

# 构建生产版本
npm run build
```

---

## 第五步：配置 Nginx

```bash
# 创建配置文件
cat > /etc/nginx/conf.d/kami-verify.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        root /var/www/kami-verify/admin/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 删除默认配置
rm -f /etc/nginx/nginx.conf.default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

---

## 第六步：验证部署

1. 浏览器访问：`http://你的服务器公网IP`
2. 使用账号登录：`icy666` / `cc020818`

---

## 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs kami-api

# 重启服务
pm2 restart kami-api

# 停止服务
pm2 stop kami-api

# 重启 Nginx
systemctl restart nginx

# 查看 Nginx 日志
tail -f /var/log/nginx/error.log
```

---

## 绑定域名（可选）

如果你有域名：

1. 在腾讯云 DNS 解析中添加 A 记录，指向服务器 IP
2. 修改 Nginx 配置：

```bash
# 编辑配置
nano /etc/nginx/conf.d/kami-verify.conf

# 将 server_name _; 改为
server_name your-domain.com;
```

3. 申请免费 SSL 证书：

```bash
# 安装 certbot
yum install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

---

## 故障排查

### 无法访问网站

1. 检查服务是否运行：`pm2 status`
2. 检查端口是否监听：`netstat -tlnp | grep 3000`
3. 检查 Nginx 状态：`systemctl status nginx`
4. 检查防火墙：`firewall-cmd --list-all`
5. 检查腾讯云安全组是否开放 80 端口

### API 请求失败

1. 检查后端日志：`pm2 logs kami-api`
2. 检查 Nginx 错误日志：`tail -f /var/log/nginx/error.log`

### 数据库问题

数据库文件位置：`/var/www/kami-verify/data/kami.db`
