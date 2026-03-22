#!/bin/bash

# ICY卡密验证系统 - 服务器部署脚本
# 使用方法: bash deploy.sh

set -e

echo "============================================"
echo "  ICY卡密验证系统 - 服务器部署"
echo "============================================"

# 配置
SERVER_IP="101.33.212.67"
DEPLOY_DIR="/var/www/kami-verify"
SERVER_USER="root"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用 root 用户或 sudo 运行此脚本"
    exit 1
fi

echo ""
echo "[1/5] 安装依赖..."
echo ""

# 安装Node.js (如果未安装)
if ! command -v node &> /dev/null; then
    echo "正在安装 Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi

# 安装PM2
if ! command -v pm2 &> /dev/null; then
    echo "正在安装 PM2..."
    npm install -g pm2
fi

# 安装Nginx
if ! command -v nginx &> /dev/null; then
    echo "正在安装 Nginx..."
    yum install -y nginx
fi

echo ""
echo "[2/5] 创建目录..."
echo ""

mkdir -p $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/dist

echo ""
echo "[3/5] 复制文件..."
echo ""

# 复制后端文件
cp -r src $DEPLOY_DIR/
cp -r node_modules $DEPLOY_DIR/ 2>/dev/null || true
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/ 2>/dev/null || true
cp verify_api.js $DEPLOY_DIR/
cp database_schema.sql $DEPLOY_DIR/

# 复制前端文件
cp -r dist/* $DEPLOY_DIR/dist/

echo ""
echo "[4/5] 配置服务..."
echo ""

# 复制Nginx配置
cp deploy/nginx.conf /etc/nginx/conf.d/kami-verify.conf

# 安装后端依赖
cd $DEPLOY_DIR
npm install --production

echo ""
echo "[5/5] 启动服务..."
echo ""

# 使用PM2启动后端
pm2 delete kami-api 2>/dev/null || true
pm2 start src/app.js --name kami-api

# 保存PM2配置
pm2 save
pm2 startup

# 重启Nginx
systemctl restart nginx

# 开放防火墙端口
firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

echo ""
echo "============================================"
echo "  部署完成!"
echo "============================================"
echo ""
echo "后台管理: http://$SERVER_IP/"
echo "API接口: http://$SERVER_IP:3000/api"
echo ""
echo "默认管理员账号:"
echo "  用户名: icy"
echo "  密码: cc020818"
echo ""
echo "请及时修改默认密码!"
echo ""
