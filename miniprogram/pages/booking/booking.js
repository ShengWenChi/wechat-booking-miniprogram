// pages/booking/booking.js
const app = getApp();
const api = require('../../utils/api');
const { getNextNDays } = require('../../utils/date');

Page({
  _rawHours: [], // 不放入 data，避免不必要的渲染

  data: {
    dateList: [],
    selectedDateIndex: 0,
    selectedDate: '',

    bookingType: 'normal',
    bookingTypes: [
      { key: 'normal',   label: '计时', price: '$11/hr', desc: '超时10min以内免费，超过10min按半小时计费' },
      { key: 'changwan', label: '畅玩', price: '',       desc: '营业时间内无任何限制，不限时不限量，all you can 拼' },
      { key: 'xianban',  label: '限板', price: '$30',    desc: '限一张板(52×52)，不可重复使用，图案之间需空1-2格，请合理安排空间' },
    ],
    changwanPrice: '$50',

    hourSlots: [],
    loadingOverview: false,

    startTime: '13:00',
    endTime: '15:00',
    xianbanEndTime: '16:00',

    businessHours: { open: '13:00', close: '21:00', label: '13:00 - 21:00' },

    availability: null,
    loadingAvail: false,

    peopleCount: 1,
    maxPeople: 12,

    durationLabel: '2小时',
    contactInfo: '',
    remark: '',
    submitting: false,
  },

  onLoad() {
    this.initDateList();
    this.ensureLogin().then(() => {
      if (app.globalData.nickname && !this.data.contactInfo) {
        this.setData({ contactInfo: app.globalData.nickname });
      }
    }).catch(() => {});
  },

  async ensureLogin() {
    if (!app.globalData.openid) {
      try { await app.login(); } catch (e) {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
    }
  },

  getDateInfo(date) {
    const [y, m, d] = date.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    const isWeekend = day === 0 || day === 6;
    return {
      businessHours: isWeekend
        ? { open: '12:00', close: '20:00', label: '12:00 - 20:00' }
        : { open: '13:00', close: '21:00', label: '13:00 - 21:00' },
      changwanPrice: isWeekend ? '$55' : '$50',
    };
  },

  getBusinessHours(date) {
    return this.getDateInfo(date).businessHours;
  },

  calcDurationLabel(start, end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) return '';
    if (mins % 60 === 0) return `${mins / 60}小时`;
    return `${Math.floor(mins / 60)}时${mins % 60}分`;
  },

  addHours(time, hours) {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + hours * 60;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  },

  initDateList() {
    const dateList = getNextNDays(14);
    const selectedDate = dateList[0].date;
    const { businessHours, changwanPrice } = this.getDateInfo(selectedDate);
    this.setData({
      dateList,
      selectedDate,
      selectedDateIndex: 0,
      businessHours,
      changwanPrice,
      startTime: businessHours.open,
      endTime: this.addHours(businessHours.open, 2),
      xianbanEndTime: this.addHours(businessHours.open, 3),
    });
    this.loadDayOverview(selectedDate);
  },

  selectDate(e) {
    const { index, date } = e.currentTarget.dataset;
    const { businessHours, changwanPrice } = this.getDateInfo(date);
    this.setData({
      selectedDateIndex: index,
      selectedDate: date,
      businessHours,
      changwanPrice,
      startTime: businessHours.open,
      endTime: this.addHours(businessHours.open, 2),
      xianbanEndTime: this.addHours(businessHours.open, 3),
      availability: null,
    });
    this.loadDayOverview(date);
  },

  async loadDayOverview(date) {
    this.setData({ loadingOverview: true, hourSlots: [] });
    try {
      const res = await api.getDayOverview(date);
      this._rawHours = res.data.hours || [];
      this.refreshHourSlots();
    } catch (e) {
      this._rawHours = [];
      this.setData({ hourSlots: [] });
    } finally {
      this.setData({ loadingOverview: false });
    }
    this.checkAvailability();
  },

  refreshHourSlots() {
    const { startTime, endTime, bookingType, xianbanEndTime } = this.data;
    const effectiveEnd = bookingType === 'xianban' ? xianbanEndTime : endTime;
    const hourSlots = this._rawHours.map(h => ({
      ...h,
      isSelected: h.time === startTime,
      isInRange: h.time >= startTime && h.time < effectiveEnd,
    }));
    this.setData({ hourSlots, durationLabel: this.calcDurationLabel(startTime, endTime) });
  },

  onHourTap(e) {
    const { time, isfull } = e.currentTarget.dataset;
    if (isfull) return;
    const update = { startTime: time, availability: null };
    if (this.data.bookingType === 'xianban') {
      update.xianbanEndTime = this.addHours(time, 3);
    } else if (this.data.bookingType === 'normal') {
      if (this.data.endTime <= time) {
        update.endTime = this.addHours(time, 2);
      }
    }
    this.setData(update);
    this.refreshHourSlots();
    this.checkAvailability();
  },

  selectBookingType(e) {
    const type = e.currentTarget.dataset.type;
    const update = { bookingType: type, availability: null, peopleCount: 1 };
    if (type === 'xianban') {
      update.xianbanEndTime = this.addHours(this.data.startTime, 3);
    }
    this.setData(update);
    this.refreshHourSlots();
    this.checkAvailability();
  },

  onStartTimeChange(e) {
    const startTime = e.detail.value;
    const update = { startTime, availability: null };
    if (this.data.bookingType === 'xianban') {
      update.xianbanEndTime = this.addHours(startTime, 3);
    } else if (this.data.endTime <= startTime) {
      update.endTime = this.addHours(startTime, 2);
    }
    this.setData(update);
    this.refreshHourSlots();
    this.checkAvailability();
  },

  onEndTimeChange(e) {
    this.setData({ endTime: e.detail.value, availability: null });
    this.refreshHourSlots();
    this.checkAvailability();
  },

  async checkAvailability() {
    const { selectedDate, bookingType, startTime, endTime, xianbanEndTime } = this.data;
    if (!selectedDate) return;
    const effectiveEnd = bookingType === 'xianban' ? xianbanEndTime : endTime;
    if (bookingType === 'normal' && startTime >= endTime) return;

    this.setData({ loadingAvail: true });
    try {
      const res = await api.getAvailability(selectedDate, startTime, effectiveEnd, bookingType);
      const avail = res.data;
      const maxPeople = Math.max(1, avail.remaining);
      const peopleCount = Math.min(this.data.peopleCount, maxPeople);
      this.setData({ availability: avail, maxPeople, peopleCount });
    } catch (e) {
      this.setData({ availability: null });
    } finally {
      this.setData({ loadingAvail: false });
    }
  },

  decreasePeople() {
    if (this.data.peopleCount <= 1) return;
    this.setData({ peopleCount: this.data.peopleCount - 1 });
  },

  increasePeople() {
    if (this.data.peopleCount >= this.data.maxPeople) {
      wx.showToast({ title: `最多可预约 ${this.data.maxPeople} 人`, icon: 'none' });
      return;
    }
    this.setData({ peopleCount: this.data.peopleCount + 1 });
  },

  onContactInfoInput(e) {
    this.setData({ contactInfo: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  async submitReservation() {
    const { selectedDate, bookingType, startTime, endTime, xianbanEndTime, peopleCount, contactInfo, remark, availability, businessHours } = this.data;

    if (!selectedDate) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }
    if (!contactInfo || !contactInfo.trim()) {
      wx.showToast({ title: '请填写联系方式', icon: 'none' });
      return;
    }
    if (bookingType === 'normal' && startTime >= endTime) {
      wx.showToast({ title: '结束时间需晚于开始时间', icon: 'none' });
      return;
    }
    if (bookingType === 'normal' && (startTime < businessHours.open || endTime > businessHours.close)) {
      wx.showToast({ title: `营业时间 ${businessHours.label}`, icon: 'none' });
      return;
    }
    if (availability && availability.isFull) {
      wx.showToast({ title: '该时间段已满，请换个时间', icon: 'none' });
      return;
    }
    if (!app.globalData.openid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const payload = { date: selectedDate, bookingType, peopleCount, contactInfo, remark };
      if (bookingType === 'normal') {
        payload.startTime = startTime;
        payload.endTime = endTime;
      } else if (bookingType === 'xianban') {
        payload.startTime = startTime;
        payload.endTime = xianbanEndTime;
      }

      const res = await api.createReservation(payload);
      const typeLabels = {
        normal: `${startTime}-${endTime}`,
        changwan: '畅玩全天',
        xianban: `限板 ${startTime}-${xianbanEndTime}`,
      };
      wx.navigateTo({
        url: `/pages/success/success?id=${res.data._id}&date=${selectedDate}&slotLabel=${encodeURIComponent(typeLabels[bookingType])}&people=${peopleCount}`,
      });
    } catch (e) {
      wx.showToast({ title: e || '预约失败，请重试', icon: 'none', duration: 2500 });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
