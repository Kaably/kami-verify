#!/bin/bash
# ICY卡密验证系统 - 软件一键加密功能部署脚本

echo "========================================="
echo "开始部署软件一键加密功能"
echo "========================================="

# 1. 创建必要的目录
echo "[1/6] 创建上传和加密目录..."
mkdir -p /var/www/kami-verify/uploads
mkdir -p /var/www/kami-verify/encrypted
chown -R nginx:nginx /var/www/kami-verify/uploads
chown -R nginx:nginx /var/www/kami-verify/encrypted
chmod 755 /var/www/kami-verify/uploads
chmod 755 /var/www/kami-verify/encrypted

# 2. 更新数据库表结构
echo "[2/6] 更新数据库表结构..."
cd /var/www/kami-verify

# 3. 重启后端服务
echo "[3/6] 重启后端服务..."
pm2 restart kami-verify || pm2 start src/app.js --name kami-verify

# 4. 更新Nginx配置（增加上传大小限制）
echo "[4/6] 更新Nginx配置..."
cat > /etc/nginx/conf.d/kami.conf << 'EOF'
server {
    listen 80;
    server_name 101.33.212.67;

    client_max_body_size 100M;

    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    location /uploads {
        alias /var/www/kami-verify/uploads;
        internal;
    }

    location /encrypted {
        alias /var/www/kami-verify/encrypted;
        internal;
    }
}
EOF

nginx -t && systemctl reload nginx

# 5. 检查服务状态
echo "[5/6] 检查服务状态..."
pm2 status
systemctl status nginx --no-pager -l

echo "========================================="
echo "部署完成！"
echo "访问地址: http://101.33.212.67/"
echo "========================================="
