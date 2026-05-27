// server/src/models/TimeSlot.js
const mongoose = require('mongoose');

/**
 * 时间段模板（全局配置，每天都适用）
 * 具体某天某时段的已预约数通过聚合 Reservation 计算
 */
const timeSlotSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true }, // e.g. "10:00"
    endTime: { type: String, required: true },   // e.g. "12:00"
    maxPeople: { type: Number, required: true, default: 8 },
    isEnabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
