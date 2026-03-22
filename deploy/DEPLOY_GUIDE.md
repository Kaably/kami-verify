# ICY卡密验证系统 - 服务器部署指南

## 📋 部署前准备

### 服务器要求
- 操作系统: CentOS 7+ / Ubuntu 18.04+
- 内存: 最低 1GB
- 端口: 80, 3000 需要开放

### 需要上传的文件

```
kami-verify/
├── src/                    # 后端源码
├── dist/                   # 前端构建文件
├── package.json
├── package-lock.json
├── verify_api.js           # DLL验证接口
├── database_schema.sql
└── deploy/
    ├── nginx.conf
    └── deploy.sh
```

---

## 🚀 方法一: 自动部署 (推荐)

### 1. 上传整个项目到服务器

```bash
# 在本地打包
cd kami-verify
tar -czvf kami-verify.tar.gz src dist package*.json verify_api.js database_schema.sql deploy

```

### 2. 上传到服务器

```bash
scp kami-verify.tar.gz root@101.33.212.67:/root/
```

### 3. 在服务器上执行部署脚本

```bash
ssh root@101.33.212.67
cd /root
tar -xzvf kami-verify.tar.gz
cd kami-verify
chmod +x deploy/deploy.sh
bash deploy/deploy.sh
```

---

## 🔧 方法二: 手动部署

### 1. 安装依赖

```bash
# 安装 Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装 PM2
npm install -g pm2

# 安装 Nginx
yum install -y nginx
```

### 2. 创建目录并上传文件

```bash
mkdir -p /var/www/kami-verify/dist
```

上传文件:
- `src/` → `/var/www/kami-verify/src/`
- `dist/` → `/var/www/kami-verify/dist/`
- `package.json` → `/var/www/kami-verify/`
- `verify_api.js` → `/var/www/kami-verify/`

### 3. 安装后端依赖

```bash
cd /var/www/kami-verify
npm install --production
```

### 4. 配置 Nginx

```bash
cp deploy/nginx.conf /etc/nginx/conf.d/kami-verify.conf
nginx -t
systemctl restart nginx
```

### 5. 启动后端服务

```bash
cd /var/www/kami-verify
pm2 start src/app.js --name kami-api
pm2 save
pm2 startup
```

### 6. 开放防火墙端口

```bash
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

---

## ✅ 验证部署

### 检查服务状态

```bash
pm2 status
systemctl status nginx
```

### 访问测试

- 后台管理: http://101.33.212.67/
- API接口: http://101.33.212.67:3000/api

### 默认登录信息

```
用户名: icy
密码: cc020818
```

⚠️ **请登录后立即修改默认密码！**

---

## 📱 常用命令

```bash
# 查看日志
pm2 logs kami-api

# 重启服务
pm2 restart kami-api

# 停止服务
pm2 stop kami-api

# 查看Nginx状态
systemctl status nginx

# 重新加载Nginx配置
nginx -s reload
```

---

## 🔐 安全建议

1. 修改默认管理员密码
2. 配置 HTTPS (可选)
3. 定期备份数据库文件 `data.db`
4. 设置服务器防火墙规则

---

## 📁 文件位置

| 文件 | 路径 |
|------|------|
| 后端代码 | `/var/www/kami-verify/src/` |
| 前端文件 | `/var/www/kami-verify/dist/` |
| 数据库 | `/var/www/kami-verify/src/data.db` |
| Nginx配置 | `/etc/nginx/conf.d/kami-verify.conf` |
| PM2日志 | `/root/.pm2/logs/` |
