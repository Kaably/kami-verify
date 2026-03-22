# ICY卡密验证系统 - 宝塔面板部署指南

## 📋 准备工作

### 遇到的问题
- 本地 `localhost:8080` → 服务器 `101.33.212.67`
- 需要修改API地址配置

---

## 🔧 第一步: 修改API地址配置

**打开宝塔面板文件管理:**
1. 登录宝塔面板
2. 进入「文件」
3. 找到 `/var/www/kami-verify/dist/assets/` 目录
4. 找到类似 `index-xxxxx.js` 的文件
5. 编辑文件，搜索 `baseURL`
6. 将 `baseURL:"/api"` 改为 `baseURL:"http://101.33.212.67:3000/api"`

**或者直接使用终端:**
```bash
# SSH连接服务器
ssh root@101.33.212.67

# 修改前端API地址
cd /var/www/kami-verify/dist/assets
# 找到index文件
ls -la | grep index

# 编辑文件（替换xxxx为实际文件名）
sed -i 's|baseURL:"/api"|baseURL:"http://101.33.212.67:3000/api"|g' index-*.js
```

---

## 📁 第二步: 上传部署包

### 方法1: 使用宝塔面板文件管理上传

1. 登录宝塔面板: `http://101.33.212.67:8888`
2. 点击左侧「文件」菜单
3. 进入 `/root/` 目录
4. 点击「上传」按钮
5. 选择本地的 `kami-verify-deploy.zip` 文件
6. 等待上传完成

### 方法2: 使用宝塔面板终端上传

1. 登录宝塔面板
2. 点击左侧「终端」菜单
3. 执行以下命令:

```bash
# 安装lrzsz（如果未安装）
yum install -y lrzsz

# 使用宝塔面板的文件管理功能上传后，在终端解压
cd /root
unzip kami-verify-deploy.zip -d kami-verify
```

---

## 🚀 第三步: 执行部署

### 在宝塔面板终端执行:

```bash
# 进入目录
cd /root/kami-verify

# 添加执行权限
chmod +x deploy/deploy.sh

# 执行部署脚本
bash deploy/deploy.sh
```

---

## 🔍 第四步: 检查部署状态

### 在宝塔面板终端执行:

```bash
# 检查PM2状态
pm2 status

# 检查Nginx状态
systemctl status nginx

# 查看日志
pm2 logs kami-api --lines 50
```

---

## 🌐 第五步: 配置安全组

### 使用宝塔面板配置安全组:

1. 点击左侧「安全」菜单
2. 点击「防火墙」
3. 添加端口规则:
   - 緻加端口 `80` (HTTP)
   - 添加端口 `3000` (API)
   - 添加端口 `22` (SSH)
4. 点击「放行」

---

## ✅ 风险组端口配置（腾讯云控制台）

**如果宝塔面板无法配置，请在腾讯云控制台配置:**

1. 登录腾讯云控制台: https://console.cloud.tencent.com/
2. 进入「云服务器」→ 选择实例
3. 点击「安全组」标签
4. 点击「配置规则」
5. 添加入站规则:
   - 协议: TCP, 端口: 80, 来源: 0.0.0.0/0
   - 协议: TCP, 端口: 3000, 来源: 0.0.0.0/0
   - 协议: TCP, 端口: 22, 来源: 0.0.0.0/0
6. 点击「保存」

---

## 🌐 访问地址

| 地址 | 说明 |
|------|------|
| http://101.33.212.67/ | 后台管理界面 |
| http://101.33.212.67:3000/api | API接口 |

**登录信息:**
- 用户名: `icy`
- 密码: `cc020818`

---

## ⚠️ 重要提示

1. **首次部署需要删除旧数据库**
   ```bash
   rm -f /var/www/kami-verify/data/kami.db
   ```

2. **如果端口被占用**
   ```bash
   # 查看3000端口占用
   netstat -tlnp | grep 3000
   
   # 杀掉占用进程
   kill -9 [PID]
   ```

3. **重启服务**
   ```bash
   pm2 restart kami-api
   nginx -s reload
   ```

---

## 📱 埥看部署日志

```bash
# 宻时查看日志
pm2 logs kami-api

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log

# 查看Nginx访问日志
tail -f /var/log/nginx/access.log
```

---

## 🔧 常见问题解决

### 问题1: 端口被占用
```bash
# 查看3000端口占用
netstat -tlnp | grep 3000
# 杀掉进程
kill -9 [PID]
```

### 问题2: Nginx配置错误
```bash
# 测试Nginx配置
nginx -t
# 重启Nginx
systemctl restart nginx
```

### 问题3: PM2服务未启动
```bash
# 查看PM2列表
pm2 list
# 重启服务
pm2 restart kami-api
# 保存PM2配置
pm2 save
```

---

## 📁 文件位置

| 文件 | 路径 |
|------|------|
| 后端代码 | `/var/www/kami-verify/src/` |
| 前端文件 | `/var/www/kami-verify/dist/` |
| 数据库 | `/var/www/kami-verify/data/kami.db` |
| Nginx配置 | `/etc/nginx/conf.d/kami-verify.conf` |
| PM2日志 | `/root/.pm2/logs/` |
