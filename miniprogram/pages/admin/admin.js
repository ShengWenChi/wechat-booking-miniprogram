// pages/admin/admin.js
const api = require('../../utils/api');
const { formatDate, formatDisplayDate } = require('../../utils/date');

const TYPE_LABELS = { normal: '普通', changwan: '畅玩', xianban: '限板' };
const START_HOUR = 9;
const END_HOUR = 22;
const HOUR_PX = 90; // px per hour in timeline

Page({
  data: {
    isLoggedIn: false,
    adminPassword: '',
    loginLoading: false,

    currentDate: formatDate(new Date()),
    currentDateDisplay: '',
    loading: false,

    stats: null,
    specialEvents: [],   // changwan + xianban
    timelineEvents: [],  // normal, with layout computed
    cancelledList: [],
    timeLabels: [],
    heatData: [],
    totalHeightPx: 0,
    containerStyle: '',
  },

  onLoad() {
    // 每次进入都需重新登录
    this.updateDateDisplay();
  },

  onUnload() {
    // 离开页面清除 token，下次进入重新验证
    wx.removeStorageSync('adminToken');
  },

  updateDateDisplay() {
    this.setData({ currentDateDisplay: formatDisplayDate(this.data.currentDate) });
  },

  onPasswordInput(e) {
    this.setData({ adminPassword: e.detail.value });
  },

  async adminLogin() {
    if (!this.data.adminPassword) {
      wx.showToast({ title: '请输入管理密码', icon: 'none' });
      return;
    }
    this.setData({ loginLoading: true });
    try {
      const res = await api.adminLogin(this.data.adminPassword);
      wx.setStorageSync('adminToken', res.data.token);
      this.setData({ isLoggedIn: true, adminPassword: '' });
      this.loadDayData(this.data.currentDate);
    } catch (e) {
      wx.showToast({ title: e || '密码错误', icon: 'none' });
    } finally {
      this.setData({ loginLoading: false });
    }
  },

  adminLogout() {
    wx.removeStorageSync('adminToken');
    this.setData({ isLoggedIn: false });
  },

  async loadDayData(date) {
    this.setData({ loading: true });
    try {
      const res = await api.adminGetReservations(date);
      const { reservations, stats } = res.data;
      const layout = this.computeTimeline(reservations || []);
      this.setData({ stats, ...layout });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  computeTimeline(reservations) {
    const confirmed = reservations.filter(r => r.status === 'confirmed');
    const cancelledList = reservations.filter(r => r.status === 'cancelled');

    // 仅畅玩单独展示（无固定时间）
    const specialEvents = confirmed
      .filter(r => r.bookingType === 'changwan')
      .map(r => ({ ...r, typeLabel: TYPE_LABELS[r.bookingType] || r.bookingType }));

    // 普通 + 限板 都进时间轴（限板有具体时间）
    const normalConfirmed = confirmed.filter(r => r.bookingType !== 'changwan');
    let events = normalConfirmed.map(r => {
      const [sh, sm] = r.startTime.split(':').map(Number);
      const [eh, em] = r.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      const top = Math.max(0, Math.round((startMin - START_HOUR * 60) / 60 * HOUR_PX));
      const height = Math.max(44, Math.round((endMin - startMin) / 60 * HOUR_PX));
      const typeLabel = TYPE_LABELS[r.bookingType] || '';
      return { ...r, top, height, startMin, endMin, col: 0, numCols: 1, typeLabel };
    }).sort((a, b) => a.startMin - b.startMin);

    // 分配列（重叠检测）
    const cols = [];
    for (const e of events) {
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        const last = cols[c][cols[c].length - 1];
        if (last.endMin <= e.startMin) {
          cols[c].push(e);
          e.col = c;
          placed = true;
          break;
        }
      }
      if (!placed) {
        e.col = cols.length;
        cols.push([e]);
      }
    }
    const numCols = Math.max(cols.length, 1);
    events.forEach(e => {
      e.posStyle = `top:${e.top}px;height:${e.height}px;left:calc(${e.col / numCols * 100}% + 2px);width:calc(${100 / numCols}% - 4px);`;
    });

    // 时间刻度
    const timeLabels = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const top = (h - START_HOUR) * HOUR_PX;
      timeLabels.push({ label: `${h}:00`, top, posStyle: `top:${top}px;` });
    }

    // 容量热力图（每小时）
    const heatData = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      const slotStart = `${String(h).padStart(2, '0')}:00`;
      const slotEnd = `${String(h + 1).padStart(2, '0')}:00`;
      let count = 0;
      for (const r of confirmed) {
        if (r.bookingType === 'changwan' || r.bookingType === 'xianban') {
          count += r.peopleCount;
        } else if (r.bookingType === 'normal' && r.startTime < slotEnd && r.endTime > slotStart) {
          count += r.peopleCount;
        }
      }
      const pct = Math.min(100, Math.round(count / 12 * 100));
      const level = pct >= 75 ? 'high' : pct >= 40 ? 'mid' : pct > 0 ? 'low' : 'empty';
      heatData.push({ h, label: String(h), count, pct, level, fillStyle: `height:${pct}%;` });
    }

    const totalHeightPx = (END_HOUR - START_HOUR) * HOUR_PX;
    const containerStyle = `height:${totalHeightPx}px;`;

    return { specialEvents, timelineEvents: events, cancelledList, timeLabels, heatData, totalHeightPx, containerStyle };
  },

  prevDay() {
    const d = new Date(this.data.currentDate);
    d.setDate(d.getDate() - 1);
    const date = formatDate(d);
    this.setData({ currentDate: date });
    this.updateDateDisplay();
    this.loadDayData(date);
  },

  nextDay() {
    const d = new Date(this.data.currentDate);
    d.setDate(d.getDate() + 1);
    const date = formatDate(d);
    this.setData({ currentDate: date });
    this.updateDateDisplay();
    this.loadDayData(date);
  },

  adminCancelReservation(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '取消预约',
      content: '确认取消该用户的预约？',
      confirmColor: '#FF3B30',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.adminCancelReservation(id);
            wx.showToast({ title: '已取消', icon: 'success' });
            this.loadDayData(this.data.currentDate);
          } catch (e) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      },
    });
  },
});
