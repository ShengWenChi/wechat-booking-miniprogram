// server/src/routes/auth.js
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

/**
 * POST /api/auth/login
 * 微信小程序登录，code换openid，返回JWT
 */
router.post('/login', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: '缺少 code 参数' });

    // 向微信服务器换取 openid
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WX_APPID,
        secret: process.env.WX_SECRET,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });

    const { openid, errcode, errmsg } = wxRes.data;
    if (errcode) {
      return res.status(400).json({ success: false, message: `微信登录失败: ${errmsg}` });
    }

    // 查找或创建用户
    let user = await User.findOne({ openid });
    if (!user) {
      user = await User.create({ openid });
    }

    // 签发 JWT
    const token = jwt.sign(
      { userId: user._id, openid },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: { token, openid, userId: user._id },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
