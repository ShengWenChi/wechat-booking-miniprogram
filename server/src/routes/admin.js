// server/src/routes/admin.js
const express = require('express');
const jwt = require('jsonwebtoken');
const Reservation = require('../models/Reservation');
const StoreSettings = require('../models/StoreSettings');
const { authAdmin } = require('../middleware/auth');
const router = express.Router();

const TYPE_LABELS = { normal: '普通', changwan: '畅玩', xianban: '限板' };

/**
 * POST /api/admin/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: '请输入密码' });
    }
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }
    const token = jwt.sign(
      { role: 'admin' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.json({ success: true, data: { token } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/reservations?date=YYYY-MM-DD
 * 获取某天预约列表及统计
 */
router.get('/reservations', authAdmin, async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: '请提供日期' });

    const raw = await Reservation.find({ date })
      .populate('userId', 'nickname')
      .sort({ startTime: 1, createdAt: 1 });

    // 展开用户昵称到顶层
    const reservations = raw.map(r => ({
      ...r.toObject(),
      userName: r.userId?.nickname || '用户',
    }));

    // 统计：按类型分组（仅 confirmed）
    const confirmed = reservations.filter(r => r.status === 'confirmed');
    const stats = {
      total: confirmed.length,
      totalPeople: confirmed.reduce((s, r) => s + r.peopleCount, 0),
      normal: confirmed.filter(r => r.bookingType === 'normal').length,
      changwan: confirmed.filter(r => r.bookingType === 'changwan').length,
      xianban: confirmed.filter(r => r.bookingType === 'xianban').length,
    };

    res.json({ success: true, data: { reservations, stats } });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/reservations/:id/cancel
 */
router.put('/reservations/:id/cancel', authAdmin, async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ success: false, message: '预约不存在' });
    if (reservation.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: '该预约已处理' });
    }
    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    reservation.cancelledBy = 'admin';
    await reservation.save();
    res.json({ success: true, message: '预约已取消' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/settings
 */
router.get('/settings', authAdmin, async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne({ key: 'main' });
    if (!settings) settings = await StoreSettings.create({ key: 'main' });
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/settings
 */
router.put('/settings', authAdmin, async (req, res, next) => {
  try {
    const allowed = ['storeName', 'storeDesc', 'storeAddress', 'businessHours',
      'cancelDeadlineHours', 'advanceBookingDays', 'announcement', 'isOpen'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const settings = await StoreSettings.findOneAndUpdate(
      { key: 'main' },
      update,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
