// pages/home/home.js
const app = getApp();

Page({
  data: {
    _logoTapCount: 0,
    _logoTapTimer: null,
    storeName: 'FluffyIce Studio',
    storeDesc: '用一颗颗小拼豆，拼出你的专属作品 ✨\n小班精品体验，每时间段限12人，让创意尽情绽放！',
    storeNotice: '周一至周五 13:00-21:00　|　周六日 12:00-20:00\n9111 Beckwith Rd, Unit 2030',
  },

  onLoad() {
    this.doLogin();
  },

  async doLogin() {
    try { await app.login(); } catch (e) { /* silent */ }
  },

  goBooking() {
    wx.switchTab({ url: '/pages/booking/booking' });
  },

  onLogoTap() {
    clearTimeout(this._logoTapTimer);
    this._logoTapCount = (this._logoTapCount || 0) + 1;
    if (this._logoTapCount >= 5) {
      this._logoTapCount = 0;
      wx.navigateTo({ url: '/pages/admin/admin' });
      return;
    }
    this._logoTapTimer = setTimeout(() => {
      this._logoTapCount = 0;
    }, 1500);
  },
});
