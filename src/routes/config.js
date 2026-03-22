const express = require('express');
const router = express.Router();
const { db } = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

router.get('/list', authMiddleware, (req, res) => {
  const configs = db.prepare('SELECT * FROM config').all();
  const configMap = {};
  configs.forEach(c => {
    configMap[c.key] = c.value;
  });
  res.json({ code: 200, data: configMap });
});

router.post('/update', authMiddleware, (req, res) => {
  const { configs } = req.body;

  if (!configs || typeof configs !== 'object') {
    return res.json({ code: 400, message: '参数格式错误' });
  }

  const stmt = db.prepare(`INSERT INTO config (key, value) VALUES (?, ?) 
                           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`);

  Object.entries(configs).forEach(([key, value]) => {
    stmt.run(key, value);
  });

  res.json({ code: 200, message: '配置更新成功' });
});

router.get('/public', (req, res) => {
  const configs = db.prepare(`SELECT key, value FROM config WHERE key IN ('site_name', 'site_notice', 'allow_register')`).all();
  const configMap = {};
  configs.forEach(c => {
    configMap[c.key] = c.value;
  });
  res.json({ code: 200, data: configMap });
});

module.exports = router;
