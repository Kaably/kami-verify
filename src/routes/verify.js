const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../database/init');

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.ip;
}

function addLog(softwareId, userId, action, ip, userAgent, detail) {
  db.prepare(`INSERT INTO logs (software_id, user_id, action, ip, user_agent, detail) 
              VALUES (?, ?, ?, ?, ?, ?)`).run(softwareId, userId, action, ip, userAgent, detail);
}

function verifySoftware(appKey, secretKey) {
  return db.prepare('SELECT * FROM software WHERE app_key = ? AND secret_key = ? AND status = 1').get(appKey, secretKey);
}

router.post('/register', (req, res) => {
  const { app_key, secret_key, username, password, card_key, machine_code } = req.body;
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'];

  const software = verifySoftware(app_key, secret_key);
  if (!software) {
    return res.json({ code: 403, message: '软件验证失败' });
  }

  if (!username || !password || !card_key) {
    return res.json({ code: 400, message: '参数不完整' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? AND software_id = ?').get(username, software.id);
  if (existingUser) {
    return res.json({ code: 400, message: '用户名已存在' });
  }

  const card = db.prepare('SELECT * FROM cards WHERE card_key = ? AND software_id = ? AND status = 0').get(card_key, software.id);
  if (!card) {
    addLog(software.id, null, 'register_failed', ip, userAgent, `无效卡密: ${card_key}`);
    return res.json({ code: 400, message: '卡密无效或已使用' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  let expireAt = null;
  if (card.card_type === 'time') {
    const now = new Date();
    switch (card.duration_unit) {
      case 'day': now.setDate(now.getDate() + card.duration); break;
      case 'month': now.setMonth(now.getMonth() + card.duration); break;
      case 'year': now.setFullYear(now.getFullYear() + card.duration); break;
    }
    expireAt = now.toISOString();
  }

  const result = db.prepare(`INSERT INTO users (username, password, software_id, machine_code, expire_at) 
                             VALUES (?, ?, ?, ?, ?)`).run(username, hashedPassword, software.id, machine_code || null, expireAt);

  const now = new Date();
  db.prepare(`UPDATE cards SET status = 1, bind_user = ?, bind_machine = ?, activated_at = ?, expire_at = ? WHERE id = ?`)
    .run(username, machine_code || null, now.toISOString(), expireAt, card.id);

  addLog(software.id, result.lastInsertRowid, 'register', ip, userAgent, `注册成功, 卡密: ${card_key}`);

  res.json({
    code: 200,
    message: '注册成功',
    data: {
      username,
      expire_at: expireAt
    }
  });
});

router.post('/login', (req, res) => {
  const { app_key, secret_key, username, password, machine_code } = req.body;
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'];

  const software = verifySoftware(app_key, secret_key);
  if (!software) {
    return res.json({ code: 403, message: '软件验证失败' });
  }

  if (!username || !password) {
    return res.json({ code: 400, message: '参数不完整' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND software_id = ?').get(username, software.id);
  if (!user) {
    addLog(software.id, null, 'login_failed', ip, userAgent, `用户不存在: ${username}`);
    return res.json({ code: 400, message: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    addLog(software.id, user.id, 'login_failed', ip, userAgent, '密码错误');
    return res.json({ code: 400, message: '用户名或密码错误' });
  }

  if (user.status !== 1) {
    addLog(software.id, user.id, 'login_failed', ip, userAgent, '账号已禁用');
    return res.json({ code: 403, message: '账号已被禁用' });
  }

  if (user.expire_at && new Date(user.expire_at) < new Date()) {
    addLog(software.id, user.id, 'login_failed', ip, userAgent, '授权已过期');
    return res.json({ code: 403, message: '授权已过期' });
  }

  if (software.bind_machine === 1 && machine_code) {
    if (user.machine_code && user.machine_code !== machine_code) {
      addLog(software.id, user.id, 'login_failed', ip, userAgent, `机器码不匹配: ${machine_code}`);
      return res.json({ code: 403, message: '机器码不匹配，请联系管理员' });
    }
    
    if (!user.machine_code) {
      db.prepare('UPDATE users SET machine_code = ? WHERE id = ?').run(machine_code, user.id);
    }
  }

  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  addLog(software.id, user.id, 'login', ip, userAgent, '登录成功');

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      username: user.username,
      expire_at: user.expire_at,
      machine_code: user.machine_code
    }
  });
});

router.post('/recharge', (req, res) => {
  const { app_key, secret_key, username, card_key } = req.body;
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'];

  const software = verifySoftware(app_key, secret_key);
  if (!software) {
    return res.json({ code: 403, message: '软件验证失败' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND software_id = ?').get(username, software.id);
  if (!user) {
    return res.json({ code: 400, message: '用户不存在' });
  }

  const card = db.prepare('SELECT * FROM cards WHERE card_key = ? AND software_id = ? AND status = 0').get(card_key, software.id);
  if (!card) {
    return res.json({ code: 400, message: '卡密无效或已使用' });
  }

  let currentExpire = user.expire_at ? new Date(user.expire_at) : new Date();
  if (currentExpire < new Date()) {
    currentExpire = new Date();
  }

  switch (card.duration_unit) {
    case 'day': currentExpire.setDate(currentExpire.getDate() + card.duration); break;
    case 'month': currentExpire.setMonth(currentExpire.getMonth() + card.duration); break;
    case 'year': currentExpire.setFullYear(currentExpire.getFullYear() + card.duration); break;
  }

  db.prepare('UPDATE users SET expire_at = ? WHERE id = ?').run(currentExpire.toISOString(), user.id);
  db.prepare('UPDATE cards SET status = 1, bind_user = ?, activated_at = ? WHERE id = ?')
    .run(username, new Date().toISOString(), card.id);

  addLog(software.id, user.id, 'recharge', ip, userAgent, `充值成功, 卡密: ${card_key}`);

  res.json({
    code: 200,
    message: '充值成功',
    data: { expire_at: currentExpire.toISOString() }
  });
});

router.post('/info', (req, res) => {
  const { app_key, secret_key, username } = req.body;

  const software = verifySoftware(app_key, secret_key);
  if (!software) {
    return res.json({ code: 403, message: '软件验证失败' });
  }

  const user = db.prepare('SELECT username, machine_code, expire_at, created_at, last_login FROM users WHERE username = ? AND software_id = ?').get(username, software.id);
  if (!user) {
    return res.json({ code: 400, message: '用户不存在' });
  }

  res.json({
    code: 200,
    data: {
      ...user,
      software: {
        name: software.name,
        version: software.version,
        notice: software.notice
      }
    }
  });
});

router.post('/change-password', (req, res) => {
  const { app_key, secret_key, username, old_password, new_password } = req.body;
  const ip = getClientIP(req);

  const software = verifySoftware(app_key, secret_key);
  if (!software) {
    return res.json({ code: 403, message: '软件验证失败' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND software_id = ?').get(username, software.id);
  if (!user) {
    return res.json({ code: 400, message: '用户不存在' });
  }

  if (!bcrypt.compareSync(old_password, user.password)) {
    return res.json({ code: 400, message: '原密码错误' });
  }

  const hashedPassword = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);

  addLog(software.id, user.id, 'change_password', ip, req.headers['user-agent'], '修改密码成功');

  res.json({ code: 200, message: '密码修改成功' });
});

router.post('/software-info', (req, res) => {
  const { app_key, secret_key } = req.body;

  const software = db.prepare('SELECT name, version, notice, status FROM software WHERE app_key = ? AND secret_key = ?').get(app_key, secret_key);
  if (!software) {
    return res.json({ code: 403, message: '软件验证失败' });
  }

  if (software.status !== 1) {
    return res.json({ code: 403, message: '软件已停用' });
  }

  res.json({
    code: 200,
    data: {
      name: software.name,
      version: software.version,
      notice: software.notice
    }
  });
});

module.exports = router;
