# GitHub上传指南

## 📋 第一步: 在GitHub创建仓库

1. 登录GitHub: https://github.com/
2. 点击右上角「+」→「New repository」
3. 填写仓库信息:
   - Repository name: `kami-verify`
   - Description: `ICY卡密验证系统`
   - 选择「Public」或「Private」
   - **不要勾选**「Add a README file」
   - **不要勾选**「Add .gitignore」
4. 点击「Create repository」

---

## 🔧 第二步: 初始化Git并上传

### 在本地执行以下命令:

```bash
# 进入项目目录
cd "c:\Users\vb\Desktop\新建文件夹 (4)\kami-verify"

# 初始化Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: ICY卡密验证系统"

# 添加远程仓库（替换YOUR_USERNAME为你的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/kami-verify.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

---

## 🚀 第三步: 在腾讯云服务器克隆

### SSH连接到服务器:

```bash
ssh root@101.33.212.67
```

### 克隆仓库并部署:

```bash
# 安装Git（如果未安装）
yum install -y git

# 克隆仓库（替换YOUR_USERNAME为你的GitHub用户名）
cd /var/www
git clone https://github.com/YOUR_USERNAME/kami-verify.git

# 进入目录
cd kami-verify

# 安装后端依赖
npm install --production

# 构建前端
cd admin
npm install
npm run build
cd ..

# 启动后端服务
pm2 start src/app.js --name kami-api
pm2 save
pm2 startup

# 配置Nginx
cp deploy/nginx.conf /etc/nginx/conf.d/kami-verify.conf
nginx -t
systemctl restart nginx
```

---

## 📋 完整命令（复制粘贴）

### 本地Windows PowerShell:

```powershell
cd "c:\Users\vb\Desktop\新建文件夹 (4)\kami-verify"
git init
git add .
git commit -m "Initial commit: ICY卡密验证系统"
git remote add origin https://github.com/YOUR_USERNAME/kami-verify.git
git branch -M main
git push -u origin main
```

### 服务器Linux:

```bash
ssh root@101.33.212.67
yum install -y git nodejs npm -y
npm install -g pm2
cd /var/www
git clone https://github.com/YOUR_USERNAME/kami-verify.git
cd kami-verify
npm install --production
cd admin && npm install && npm run build && cd ..
pm2 start src/app.js --name kami-api
pm2 save
pm2 startup
cp deploy/nginx.conf /etc/nginx/conf.d/kami-verify.conf
nginx -t && systemctl restart nginx
```

---

## ⚠️ 注意事项

1. **替换YOUR_USERNAME**为你的GitHub用户名
2. 如果仓库是私有的，需要配置GitHub Token:
   ```bash
   git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/kami-verify.git
   ```
3. 确保服务器可以访问GitHub（可能需要配置代理）

---

## 🌐 访问地址

| 地址 | 说明 |
|------|------|
| http://101.33.212.67/ | 后台管理界面 |

**登录信息:**
- 用户名: `icy`
- 密码: `cc020818`
