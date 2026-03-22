const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const cardRoutes = require('./routes/cards');
const softwareRoutes = require('./routes/software');
const verifyRoutes = require('./routes/verify');
const userRoutes = require('./routes/users');
const logRoutes = require('./routes/logs');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
});
app.use('/api/', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/software', softwareRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/config', configRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 卡密验证系统已启动: http://localhost:${PORT}`);
    console.log(`📚 API文档: http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
