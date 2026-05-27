// server/src/routes/timeslots.js
// 提供时间段名额查询（按时间重叠逻辑，总容量12位）
const express = require('express');
const Reservation = require('../models/Reservation');
const router = express.Router();

const TOTAL_CAPACITY = 12;

// 计算某日期某时间段内的最大并发占用人数（扫描线法）
async function countOccupied(date, checkStart, checkEnd) {
  const reservations = await Reservation.find(
    { date, status: 'confirmed' },
    'bookingType startTime endTime peopleCount'
  );

  // 畅玩全天固定占位（始终计入）
  let changwanOccupied = 0;
  for (const r of reservations) {
    if (r.bookingType === 'changwan') changwanOccupied += r.peopleCount;
  }

  // 收集范围内所有边界时间点（作为扫描点）
  const timePoints = new Set([checkStart]);
  for (const r of reservations) {
    if (r.bookingType !== 'changwan' && r.startTime && r.endTime) {
      if (r.startTime > checkStart && r.startTime < checkEnd) timePoints.add(r.startTime);
    }
  }

  // 在每个时间点求并发，取最大值
  let maxOccupied = changwanOccupied;
  for (const t of timePoints) {
    let occupied = changwanOccupied;
    for (const r of reservations) {
      if (r.bookingType !== 'changwan' && r.startTime && r.endTime) {
        if (r.startTime <= t && r.endTime > t) {
          occupied += r.peopleCount;
        }
      }
    }
    maxOccupied = Math.max(maxOccupied, occupied);
  }
  return maxOccupied;
}

/**
 * GET /api/timeslots/availability?date=YYYY-MM-DD&start=HH:mm&end=HH:mm&type=normal|changwan|xianban
 * 查询指定时间段剩余名额
 */
router.get('/availability', async (req, res, next) => {
  try {
    const { date, start, end, type = 'normal' } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: '请提供有效日期' });
    }

    let checkStart, checkEnd;
    if (type === 'changwan') {
      checkStart = '00:00';
      checkEnd = '23:59';
    } else {
      if (!start || !end) {
        return res.status(400).json({ success: false, message: '请提供开始和结束时间' });
      }
      checkStart = start;
      checkEnd = end;
    }

    const occupied = await countOccupied(date, checkStart, checkEnd);
    const remaining = Math.max(0, TOTAL_CAPACITY - occupied);

    res.json({
      success: true,
      data: {
        totalCapacity: TOTAL_CAPACITY,
        occupied,
        remaining,
        isFull: remaining <= 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/timeslots/day-overview?date=YYYY-MM-DD
 * 返回当天每小时的容量占用情况
 */
router.get('/day-overview', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: '请提供有效日期' });
    }
    // 本地时间判断周几，避免UTC偏差
    const [y, m, d] = date.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    const isWeekend = day === 0 || day === 6;
    const startH = isWeekend ? 12 : 13;
    const endH = isWeekend ? 20 : 21;

    const confirmed = await Reservation.find(
      { date, status: 'confirmed' },
      'bookingType startTime endTime peopleCount'
    );

    const hours = [];
    for (let h = startH; h < endH; h++) {
      const slotStart = `${String(h).padStart(2, '0')}:00`;
      const slotEnd = `${String(h + 1).padStart(2, '0')}:00`;
      let occupied = 0;
      for (const r of confirmed) {
        if (r.bookingType === 'changwan') {
          occupied += r.peopleCount;
        } else if (r.startTime && r.endTime) {
          if (r.startTime < slotEnd && r.endTime > slotStart) {
            occupied += r.peopleCount;
          }
        }
      }
      const remaining = Math.max(0, TOTAL_CAPACITY - occupied);
      const pct = Math.round(occupied / TOTAL_CAPACITY * 100);
      const level = remaining === 0 ? 'full' : remaining <= 3 ? 'high' : remaining <= 6 ? 'mid' : 'low';
      hours.push({
        time: slotStart,
        label: String(h),
        occupied,
        remaining,
        isFull: remaining === 0,
        pct,
        level,
      });
    }

    res.json({ success: true, data: { hours } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
