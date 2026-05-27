// server/src/routes/reservations.js
const express = require('express');
const Reservation = require('../models/Reservation');
const StoreSettings = require('../models/StoreSettings');
const { authUser } = require('../middleware/auth');
const router = express.Router();

const TOTAL_CAPACITY = 12;

async function countOccupied(date, checkStart, checkEnd) {
  const reservations = await Reservation.find(
    { date, status: 'confirmed' },
    'bookingType startTime endTime peopleCount'
  );
  let occupied = 0;
  for (const r of reservations) {
    if (r.bookingType === 'changwan') {
      occupied += r.peopleCount;
    } else if ((r.bookingType === 'normal' || r.bookingType === 'xianban') && r.startTime && r.endTime) {
      if (r.startTime < checkEnd && r.endTime > checkStart) {
        occupied += r.peopleCount;
      }
    }
  }
  return occupied;
}

/**
 * POST /api/reservations
 */
router.post('/', authUser, async (req, res, next) => {
  try {
    const { date, bookingType = 'normal', startTime, endTime, peopleCount, remark } = req.body;
    const { userId, openid } = req.user;

    if (!date || !peopleCount) {
      return res.status(400).json({ success: false, message: '缺少必填字段' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: '日期格式错误' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(date) < today) {
      return res.status(400).json({ success: false, message: '不能预约过去的日期' });
    }

    let checkStart, checkEnd;
    if (bookingType === 'changwan') {
      checkStart = '00:00';
      checkEnd = '23:59';
    } else {
      // normal 和 xianban 都需要 startTime/endTime
      if (!startTime || !endTime) {
        return res.status(400).json({ success: false, message: '请选择开始和结束时间' });
      }
      if (startTime >= endTime) {
        return res.status(400).json({ success: false, message: '结束时间必须晚于开始时间' });
      }
      checkStart = startTime;
      checkEnd = endTime;
    }

    // 检查容量（时间重叠逻辑）
    const occupied = await countOccupied(date, checkStart, checkEnd);
    if (occupied + peopleCount > TOTAL_CAPACITY) {
      const remaining = Math.max(0, TOTAL_CAPACITY - occupied);
      return res.status(400).json({
        success: false,
        message: remaining > 0
          ? `名额不足，该时间段仅剩 ${remaining} 个位置`
          : '该时间段已满，请换个时间',
      });
    }

    const reservation = await Reservation.create({
      userId,
      openid,
      date,
      bookingType,
      startTime: bookingType !== 'changwan' ? startTime : null,
      endTime: bookingType !== 'changwan' ? endTime : null,
      peopleCount,
      remark: remark || '',
    });

    res.status(201).json({ success: true, data: reservation, message: '预约成功！' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reservations/my
 */
router.get('/my', authUser, async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ openid: req.user.openid })
      .sort({ date: -1, createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: reservations });
  } catch (err) { next(err); }
});

/**
 * GET /api/reservations/:id
 */
router.get('/:id', authUser, async (req, res, next) => {
  try {
    const reservation = await Reservation.findOne({ _id: req.params.id, openid: req.user.openid });
    if (!reservation) return res.status(404).json({ success: false, message: '预约不存在' });
    res.json({ success: true, data: reservation });
  } catch (err) { next(err); }
});

/**
 * PUT /api/reservations/:id/cancel
 */
router.put('/:id/cancel', authUser, async (req, res, next) => {
  try {
    const reservation = await Reservation.findOne({ _id: req.params.id, openid: req.user.openid });
    if (!reservation) return res.status(404).json({ success: false, message: '预约不存在' });
    if (reservation.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: '该预约无法取消' });
    }

    // 普通预约检查取消截止时间，畅玩/限板可随时取消
    if (reservation.bookingType === 'normal' && reservation.startTime) {
      const settings = await StoreSettings.findOne({ key: 'main' });
      const deadlineHours = settings?.cancelDeadlineHours || 2;
      const startDateTime = new Date(`${reservation.date}T${reservation.startTime}:00`);
      if ((startDateTime - new Date()) / 3600000 < deadlineHours) {
        return res.status(400).json({
          success: false,
          message: `需在开始前 ${deadlineHours} 小时取消`,
        });
      }
    }

    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    reservation.cancelledBy = 'user';
    await reservation.save();

    res.json({ success: true, message: '预约已取消' });
  } catch (err) { next(err); }
});

module.exports = router;
