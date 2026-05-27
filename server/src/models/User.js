// server/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    openid: { type: String, required: true, unique: true, index: true },
    nickname: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    // 最近填写的姓名/手机（方便下次预填）
    lastUsedName: { type: String, default: '' },
    lastUsedPhone: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
