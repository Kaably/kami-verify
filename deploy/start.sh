#!/bin/bash

echo ">>> 启动卡密验证系统..."

cd /var/www/kami-verify

# 停止旧进程
pm2 stop kami-api 2>/dev/null || true
pm2 delete kami-api 2>/dev/null || true

# 启动后端服务
pm2 start src/app.js --name kami-api

# 保存 PM2 进程列表
pm2 save

# 设置开机自启
pm2 startup

echo ""
echo ">>> 服务状态:"
pm2 status

echo ""
echo ">>> 部署完成！"
echo "访问地址: http://你的服务器IP"
echo "默认账号: icy666"
echo "默认密码: cc020818"
