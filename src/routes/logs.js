const express = require('express');
const router = express.Router();
const { db } = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

router.get('/list', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, software_id, action, start_date, end_date } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `SELECT l.*, s.name as software_name FROM logs l 
             LEFT JOIN software s ON l.software_id = s.id WHERE 1=1`;
  let countSql = 'SELECT COUNT(*) as total FROM logs WHERE 1=1';
  const params = [];
  const countParams = [];

  if (software_id) {
    sql += ' AND l.software_id = ?';
    countSql += ' AND software_id = ?';
    params.push(software_id);
    countParams.push(software_id);
  }

  if (action) {
    sql += ' AND l.action = ?';
    countSql += ' AND action = ?';
    params.push(action);
    countParams.push(action);
  }

  if (start_date) {
    sql += ' AND DATE(l.created_at) >= ?';
    countSql += ' AND DATE(created_at) >= ?';
    params.push(start_date);
    countParams.push(start_date);
  }

  if (end_date) {
    sql += ' AND DATE(l.created_at) <= ?';
    countSql += ' AND DATE(created_at) <= ?';
    params.push(end_date);
    countParams.push(end_date);
  }

  sql += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), parseInt(offset));

  const logs = db.prepare(sql).all(...params);
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({
    code: 200,
    data: {
      list: logs,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

router.get('/stats', authMiddleware, (req, res) => {
  const { software_id, days = 7 } = req.query;

  let whereClause = '1=1';
  const params = [];

  if (software_id) {
    whereClause += ' AND software_id = ?';
    params.push(software_id);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  whereClause += ' AND created_at >= ?';
  params.push(startDate.toISOString().split('T')[0]);

  const dailyStats = db.prepare(`
    SELECT DATE(created_at) as date, 
           COUNT(*) as total,
           SUM(CASE WHEN action = 'login' THEN 1 ELSE 0 END) as logins,
           SUM(CASE WHEN action = 'register' THEN 1 ELSE 0 END) as registers
    FROM logs 
    WHERE ${whereClause}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all(...params);

  const actionStats = db.prepare(`
    SELECT action, COUNT(*) as count
    FROM logs
    WHERE ${whereClause}
    GROUP BY action
    ORDER BY count DESC
  `).all(...params);

  res.json({
    code: 200,
    data: {
      daily: dailyStats,
      actions: actionStats
    }
  });
});

router.post('/clear', authMiddleware, (req, res) => {
  const { days = 30 } = req.body;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

  const result = db.prepare('DELETE FROM logs WHERE created_at < ?').run(cutoffDate.toISOString());
  
  res.json({
    code: 200,
    message: `已清理 ${result.changes} 条日志记录`
  });
});

module.exports = router;
