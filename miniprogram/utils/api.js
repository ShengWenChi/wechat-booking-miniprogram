// utils/api.js - 统一请求封装
// ⚡ 开发测试时将 USE_MOCK 设为 true，不需要后端
const USE_MOCK = true;

// Mock 模式直接返回本地数据
if (USE_MOCK) {
  module.exports = require('./mock');
  // 跳出，不执行下方真实请求代码
} else {

const app = getApp();

const request = (method, path, data = {}) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.request({
      url: `${app.globalData.baseUrl}${path}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      success: (res) => {
        if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('openid');
          wx.reLaunch({ url: '/pages/home/home' });
          reject('未授权，请重新登录');
          return;
        }
        if (res.data && res.data.success !== undefined) {
          if (res.data.success) {
            resolve(res.data);
          } else {
            reject(res.data.message || '请求失败');
          }
        } else {
          resolve(res.data);
        }
      },
      fail: () => reject('网络请求失败，请检查网络连接'),
    });
  });
};

const api = {
  login: (code) => request('POST', '/auth/login', { code }),
  // 查询某日期某时间段的剩余名额
  // type: normal | changwan | xianban
  getAvailability: (date, start, end, type = 'normal') => {
    let url = `/timeslots/availability?date=${date}&type=${type}`;
    if (type === 'normal') url += `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    return request('GET', url);
  },
  getDayOverview: (date) => request('GET', `/timeslots/day-overview?date=${date}`),
  createReservation: (data) => request('POST', '/reservations', data),
  getMyReservations: () => request('GET', '/reservations/my'),
  cancelReservation: (id) => request('PUT', `/reservations/${id}/cancel`),
  getReservationDetail: (id) => request('GET', `/reservations/${id}`),
  adminLogin: (password) => request('POST', '/admin/login', { password }),
  adminGetReservations: (date) => request('GET', `/admin/reservations?date=${date}`),
  adminCancelReservation: (id) => request('PUT', `/admin/reservations/${id}/cancel`),
  adminGetSettings: () => request('GET', '/admin/settings'),
  adminUpdateSettings: (data) => request('PUT', '/admin/settings', data),
};

module.exports = api;

} // end of USE_MOCK else block
