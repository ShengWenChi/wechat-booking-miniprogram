// app.js
// ⚡ 与 utils/api.js 中的 USE_MOCK 保持一致
const USE_MOCK = true;

App({
  globalData: {
    userInfo: null,
    openid: null,
    baseUrl: 'https://your-api-domain.com/api', // 上线时替换为真实后端地址
    storeName: '拼豆小屋',
  },

  onLaunch() {
    if (USE_MOCK) {
      // Mock 模式：直接设置假 openid，跳过微信登录
      this.globalData.openid = 'mock_openid_123';
      this.globalData.nickname = '测试用户';
      wx.setStorageSync('token', 'mock_token');
      wx.setStorageSync('openid', 'mock_openid_123');
    } else {
      this.checkLogin();
    }
  },

  checkLogin() {
    const token = wx.getStorageSync('token');
    const openid = wx.getStorageSync('openid');
    if (token && openid) {
      this.globalData.openid = openid;
    }
  },

  // 登录并获取 openid（真实模式）
  login() {
    if (USE_MOCK) {
      this.globalData.openid = 'mock_openid_123';
      return Promise.resolve({ token: 'mock_token', openid: 'mock_openid_123' });
    }
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            wx.request({
              url: `${this.globalData.baseUrl}/auth/login`,
              method: 'POST',
              data: { code: res.code },
              success: (result) => {
                if (result.data.success) {
                  const { token, openid, nickname } = result.data.data;
                  wx.setStorageSync('token', token);
                  wx.setStorageSync('openid', openid);
                  this.globalData.openid = openid;
                  this.globalData.nickname = nickname || '';
                  resolve({ token, openid, nickname });
                } else {
                  reject(result.data.message);
                }
              },
              fail: reject,
            });
          } else {
            reject('login failed');
          }
        },
        fail: reject,
      });
    });
  },
});
