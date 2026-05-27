// server/src/models/StoreSettings.js
const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true },  // singleton key = 'main'
    storeName: { type: String, default: '拼豆小屋' },
    storeDesc: { type: String, default: '' },
    storeAddress: { type: String, default: '' },
    businessHours: { type: String, default: '10:00-18:00' },
    // 提前取消截止（小时）
    cancelDeadlineHours: { type: Number, default: 2 },
    // 可预约未来天数
    advanceBookingDays: { type: Number, default: 14 },
    // 公告
    announcement: { type: String, default: '' },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
