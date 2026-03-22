const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../database/init');
const { authMiddleware, generateToken } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.json({ code: 400, message: '用户名和密码不能为空' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  
  if (!admin) {
    return res.json({ code: 401, message: '用户名或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, admin.password);
  if (!isValid) {
    return res.json({ code: 401, message: '用户名或密码错误' });
  }

  db.prepare('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(admin.id);

  const token = generateToken(admin);
  
  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    }
  });
});

router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    code: 200,
    data: req.admin
  });
});

router.post('/change-password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.json({ code: 400, message: '参数不完整' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  
  if (!bcrypt.compareSync(oldPassword, admin.password)) {
    return res.json({ code: 400, message: '原密码错误' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashedPassword, req.admin.id);
  
  res.json({ code: 200, message: '密码修改成功' });
});

module.exports = router;
