// pages/myBookings/myBookings.js
const app = getApp();
const api = require('../../utils/api');
const { formatDisplayDate, formatDateTime } = require('../../utils/date');

const TYPE_LABELS = { normal: '普通', changwan: '畅玩', xianban: '限板' };

Page({
  data: {
    bookings: [],
    filteredList: [],
    loading: true,
    filterStatus: 'all',
    tabs: [
      { key: 'all',       label: '全部' },
      { key: 'confirmed', label: '待体验' },
      { key: 'completed', label: '已完成' },
      { key: 'cancelled', label: '已取消' },
    ],
  },

  onLoad() { this.loadBookings(); },
  onShow() { this.loadBookings(); },

  async loadBookings() {
    this.setData({ loading: true });
    try {
      const res = await api.getMyReservations();
      const bookings = (res.data || []).map(b => ({
        ...b,
        typeLabel: TYPE_LABELS[b.bookingType] || '普通',
        dateDisplay: formatDisplayDate(b.date),
        createdAtDisplay: formatDateTime(b.createdAt),
        canCancel: b.status === 'confirmed' && this.canCancelBooking(b),
      }));
      this.setData({ bookings });
      this.applyFilter(this.data.filterStatus, bookings);
    } catch (e) {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  canCancelBooking(booking) {
    // 畅玩、限板可随时取消
    if (booking.bookingType !== 'normal') return true;
    if (!booking.startTime) return true;
    const slotDate = new Date(`${booking.date}T${booking.startTime}:00`);
    return (slotDate - new Date()) / 3600000 > 2;
  },

  onTabChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ filterStatus: key });
    this.applyFilter(key, this.data.bookings);
  },

  applyFilter(key, bookings) {
    const list = key === 'all' ? bookings : bookings.filter(b => b.status === key);
    this.setData({ filteredList: list });
  },

  async cancelBooking(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '取消预约',
      content: '确定要取消此次预约吗？',
      confirmColor: '#E57373',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.cancelReservation(id);
            wx.showToast({ title: '预约已取消', icon: 'success' });
            this.loadBookings();
          } catch (e) {
            wx.showToast({ title: e || '取消失败', icon: 'none' });
          }
        }
      },
    });
  },

  goBooking() {
    wx.switchTab({ url: '/pages/booking/booking' });
  },

  onPullDownRefresh() {
    this.loadBookings().then(() => wx.stopPullDownRefresh());
  },
});
