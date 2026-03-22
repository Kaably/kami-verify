const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const { db } = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

router.get('/list', authMiddleware, (req, res) => {
  const software = db.prepare('SELECT * FROM software ORDER BY created_at DESC').all();
  res.json({ code: 200, data: software });
});

router.post('/create', authMiddleware, (req, res) => {
  const { name, description, version, notice } = req.body;

  if (!name) {
    return res.json({ code: 400, message: '软件名称不能为空' });
  }

  const appKey = nanoid(16);
  const secretKey = nanoid(32);

  const result = db.prepare(`INSERT INTO software (name, app_key, secret_key, description, version, notice) 
                             VALUES (?, ?, ?, ?, ?, ?)`).run(name, appKey, secretKey, description, version || '1.0.0', notice);

  res.json({
    code: 200,
    message: '创建成功',
    data: {
      id: result.lastInsertRowid,
      app_key: appKey,
      secret_key: secretKey
    }
  });
});

router.post('/update', authMiddleware, (req, res) => {
  const { id, name, description, version, notice, status } = req.body;

  if (!id) {
    return res.json({ code: 400, message: '软件ID不能为空' });
  }

  const software = db.prepare('SELECT id FROM software WHERE id = ?').get(id);
  if (!software) {
    return res.json({ code: 400, message: '软件不存在' });
  }

  db.prepare(`UPDATE software SET name = COALESCE(?, name), description = COALESCE(?, description), 
              version = COALESCE(?, version), notice = COALESCE(?, notice), status = COALESCE(?, status) 
              WHERE id = ?`).run(name, description, version, notice, status, id);

  res.json({ code: 200, message: '更新成功' });
});

router.post('/delete', authMiddleware, (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.json({ code: 400, message: '软件ID不能为空' });
  }

  const cardCount = db.prepare('SELECT COUNT(*) as count FROM cards WHERE software_id = ?').get(id).count;
  if (cardCount > 0) {
    return res.json({ code: 400, message: '该软件下还有卡密，无法删除' });
  }

  db.prepare('DELETE FROM software WHERE id = ?').run(id);
  res.json({ code: 200, message: '删除成功' });
});

router.post('/reset-secret', authMiddleware, (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.json({ code: 400, message: '软件ID不能为空' });
  }

  const newSecretKey = nanoid(32);
  db.prepare('UPDATE software SET secret_key = ? WHERE id = ?').run(newSecretKey, id);

  res.json({
    code: 200,
    message: '密钥重置成功',
    data: { secret_key: newSecretKey }
  });
});

router.get('/detail/:id', authMiddleware, (req, res) => {
  const software = db.prepare('SELECT * FROM software WHERE id = ?').get(req.params.id);
  
  if (!software) {
    return res.json({ code: 404, message: '软件不存在' });
  }

  const cardStats = db.prepare(`SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as unused,
    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as used
    FROM cards WHERE software_id = ?`).get(req.params.id);

  res.json({
    code: 200,
    data: { ...software, stats: cardStats }
  });
});

module.exports = router;
