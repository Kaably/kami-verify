const express = require('express');
const router = express.Router();
const { db } = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

router.get('/list', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, software_id, keyword, status } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `SELECT u.*, s.name as software_name FROM users u 
             LEFT JOIN software s ON u.software_id = s.id WHERE 1=1`;
  let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  const params = [];
  const countParams = [];

  if (software_id) {
    sql += ' AND u.software_id = ?';
    countSql += ' AND software_id = ?';
    params.push(software_id);
    countParams.push(software_id);
  }

  if (keyword) {
    sql += ' AND u.username LIKE ?';
    countSql += ' AND username LIKE ?';
    params.push(`%${keyword}%`);
    countParams.push(`%${keyword}%`);
  }

  if (status !== undefined && status !== '') {
    sql += ' AND u.status = ?';
    countSql += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }

  sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), parseInt(offset));

  const users = db.prepare(sql).all(...params);
  const { total } = db.prepare(countSql).get(...countParams);

  users.forEach(u => delete u.password);

  res.json({
    code: 200,
    data: {
      list: users,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

router.post('/update-status', authMiddleware, (req, res) => {
  const { id, status } = req.body;

  if (!id || status === undefined) {
    return res.json({ code: 400, message: '参数不完整' });
  }

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
  res.json({ code: 200, message: '更新成功' });
});

router.post('/extend', authMiddleware, (req, res) => {
  const { id, days } = req.body;

  if (!id || !days) {
    return res.json({ code: 400, message: '参数不完整' });
  }

  const user = db.prepare('SELECT expire_at FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.json({ code: 400, message: '用户不存在' });
  }

  let expireAt = user.expire_at ? new Date(user.expire_at) : new Date();
  if (expireAt < new Date()) {
    expireAt = new Date();
  }
  expireAt.setDate(expireAt.getDate() + parseInt(days));

  db.prepare('UPDATE users SET expire_at = ? WHERE id = ?').run(expireAt.toISOString(), id);
  res.json({ code: 200, message: '续期成功', data: { expire_at: expireAt.toISOString() } });
});

router.post('/unbind-machine', authMiddleware, (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.json({ code: 400, message: '参数不完整' });
  }

  db.prepare('UPDATE users SET machine_code = NULL WHERE id = ?').run(id);
  res.json({ code: 200, message: '解绑成功' });
});

router.post('/delete', authMiddleware, (req, res) => {
  const { ids } = req.body;

  if (!ids || !ids.length) {
    return res.json({ code: 400, message: '请选择要删除的用户' });
  }

  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...ids);
  res.json({ code: 200, message: '删除成功' });
});

router.post('/reset-password', authMiddleware, (req, res) => {
  const { id, new_password } = req.body;

  if (!id || !new_password) {
    return res.json({ code: 400, message: '参数不完整' });
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, id);
  res.json({ code: 200, message: '密码重置成功' });
});

module.exports = router;
