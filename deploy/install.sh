#!/bin/bash

echo "=========================================="
echo "   卡密验证系统 - 一键部署脚本"
echo "=========================================="

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
  echo "请使用 root 用户运行此脚本"
  exit 1
fi

# 安装 Node.js
echo ">>> 安装 Node.js 18..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
  yum install -y nodejs
fi
echo "Node.js 版本: $(node -v)"

# 安装 PM2
echo ">>> 安装 PM2..."
npm install -g pm2

# 安装 Nginx
echo ">>> 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
  yum install -y epel-release
  yum install -y nginx
fi

# 创建项目目录
echo ">>> 创建项目目录..."
mkdir -p /var/www/kami-verify

# 复制 Nginx 配置
echo ">>> 配置 Nginx..."
cp /var/www/kami-verify/deploy/nginx.conf /etc/nginx/conf.d/kami-verify.conf

# 启动 Nginx
systemctl enable nginx
systemctl restart nginx

# 配置防火墙
echo ">>> 配置防火墙..."
firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

echo ""
echo "=========================================="
echo "   部署环境准备完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 上传项目文件到 /var/www/kami-verify"
echo "2. 运行: cd /var/www/kami-verify && npm install --production"
echo "3. 运行: cd admin && npm install && npm run build"
echo "4. 运行: pm2 start src/app.js --name kami-api"
echo ""
