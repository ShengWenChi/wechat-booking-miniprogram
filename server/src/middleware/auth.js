// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');

// 用户鉴权中间件
const authUser = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录，请先登录' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, openid }
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'token 已过期，请重新登录' });
  }
};

// 管理员鉴权中间件
const authAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    req.admin = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: '管理员认证失败' });
  }
};

module.exports = { authUser, authAdmin };
