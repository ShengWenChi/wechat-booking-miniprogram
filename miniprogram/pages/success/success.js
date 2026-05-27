// pages/success/success.js
const { formatDisplayDate } = require('../../utils/date');

Page({
  data: {
    reservationId: '',
    dateDisplay: '',
    slotLabel: '',
    people: 1,
  },

  onLoad(options) {
    const { id, date, slotLabel, people } = options;
    this.setData({
      reservationId: id,
      dateDisplay: formatDisplayDate(date),
      slotLabel: decodeURIComponent(slotLabel || ''),
      people: Number(people) || 1,
    });
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/home' });
  },

  goMyBookings() {
    wx.switchTab({ url: '/pages/myBookings/myBookings' });
  },
});
