// server/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const timeslotRoutes = require('./routes/timeslots');
const reservationRoutes = require('./routes/reservations');
const adminRoutes = require('./routes/admin');

const app = express();

// ── 中间件 ──────────────────────────────────────────
app.use(express.json());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));

// 限流：每IP每分钟最多60次请求
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(limiter);

// ── 数据库连接 ────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/perler_beads')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

// ── 路由 ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/timeslots', timeslotRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── 统一错误处理 ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
