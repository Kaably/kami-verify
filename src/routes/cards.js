const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const { db } = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

function generateCardKey(prefix = 'KAMI') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = prefix + '-';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) key += '-';
  }
  return key;
}

router.get('/list', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, software_id, status, keyword } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `SELECT c.*, s.name as software_name FROM cards c 
             LEFT JOIN software s ON c.software_id = s.id WHERE 1=1`;
  let countSql = 'SELECT COUNT(*) as total FROM cards WHERE 1=1';
  const params = [];
  const countParams = [];

  if (software_id) {
    sql += ' AND c.software_id = ?';
    countSql += ' AND software_id = ?';
    params.push(software_id);
    countParams.push(software_id);
  }

  if (status !== undefined && status !== '') {
    sql += ' AND c.status = ?';
    countSql += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }

  if (keyword) {
    sql += ' AND (c.card_key LIKE ? OR c.bind_user LIKE ?)';
    countSql += ' AND (card_key LIKE ? OR bind_user LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
    countParams.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), parseInt(offset));

  const cards = db.prepare(sql).all(...params);
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({
    code: 200,
    data: {
      list: cards,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

router.post('/generate', authMiddleware, (req, res) => {
  const { software_id, count = 1, duration = 30, duration_unit = 'day', card_type = 'time', prefix = 'KAMI', remark = '' } = req.body;

  if (!software_id) {
    return res.json({ code: 400, message: '请选择软件' });
  }

  const software = db.prepare('SELECT id FROM software WHERE id = ?').get(software_id);
  if (!software) {
    return res.json({ code: 400, message: '软件不存在' });
  }

  const cards = [];
  const stmt = db.prepare(`INSERT INTO cards (card_key, software_id, card_type, duration, duration_unit, remark) 
                           VALUES (?, ?, ?, ?, ?, ?)`);

  for (let i = 0; i < count; i++) {
    let cardKey;
    do {
      cardKey = generateCardKey(prefix);
    } while (db.prepare('SELECT id FROM cards WHERE card_key = ?').get(cardKey));

    stmt.run(cardKey, software_id, card_type, duration, duration_unit, remark);
    cards.push(cardKey);
  }

  res.json({
    code: 200,
    message: `成功生成 ${count} 张卡密`,
    data: { cards }
  });
});

router.post('/delete', authMiddleware, (req, res) => {
  const { ids } = req.body;

  if (!ids || !ids.length) {
    return res.json({ code: 400, message: '请选择要删除的卡密' });
  }

  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM cards WHERE id IN (${placeholders}) AND status = 0`).run(...ids);
  
  res.json({ code: 200, message: '删除成功' });
});

router.post('/export', authMiddleware, (req, res) => {
  const { software_id, status } = req.body;
  
  let sql = 'SELECT card_key, card_type, duration, duration_unit, status, remark FROM cards WHERE 1=1';
  const params = [];

  if (software_id) {
    sql += ' AND software_id = ?';
    params.push(software_id);
  }

  if (status !== undefined) {
    sql += ' AND status = ?';
    params.push(status);
  }

  const cards = db.prepare(sql).all(...params);
  
  const csv = '卡密,类型,时长,单位,状态,备注\n' + 
    cards.map(c => `${c.card_key},${c.card_type},${c.duration},${c.duration_unit},${c.status === 0 ? '未使用' : c.status === 1 ? '已使用' : '已禁用'},${c.remark || ''}`).join('\n');
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=cards.csv');
  res.send('\ufeff' + csv);
});

router.get('/stats', authMiddleware, (req, res) => {
  const { software_id } = req.query;
  
  let whereClause = '1=1';
  const params = [];
  
  if (software_id) {
    whereClause += ' AND software_id = ?';
    params.push(software_id);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM cards WHERE ${whereClause}`).get(...params).count;
  const unused = db.prepare(`SELECT COUNT(*) as count FROM cards WHERE ${whereClause} AND status = 0`).get(...params).count;
  const used = db.prepare(`SELECT COUNT(*) as count FROM cards WHERE ${whereClause} AND status = 1`).get(...params).count;
  const disabled = db.prepare(`SELECT COUNT(*) as count FROM cards WHERE ${whereClause} AND status = 2`).get(...params).count;

  res.json({
    code: 200,
    data: { total, unused, used, disabled }
  });
});

module.exports = router;
