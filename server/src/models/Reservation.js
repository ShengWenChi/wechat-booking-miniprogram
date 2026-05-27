// server/src/models/Reservation.js
const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    openid: { type: String, required: true },

    date: { type: String, required: true, index: true },

    // normal: 普通自定义时间段
    // changwan: 畅玩全天（无时间限制，占全天1位）
    // xianban: 限板（时间未知，预估2-3h，特殊标记，占全天1位）
    bookingType: {
      type: String,
      enum: ['normal', 'changwan', 'xianban'],
      default: 'normal',
    },

    // 仅 normal 类型有值，HH:mm 格式
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },

    peopleCount: { type: Number, required: true, min: 1, max: 20 },
    contactInfo: { type: String, default: '', maxlength: 50 },
    remark: { type: String, default: '', maxlength: 200 },

    status: {
      type: String,
      enum: ['confirmed', 'completed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },

    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ['user', 'admin'], default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);
