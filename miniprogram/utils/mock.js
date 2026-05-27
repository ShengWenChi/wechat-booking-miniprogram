// utils/mock.js - 测试用 Mock 数据
const { formatDate } = require('./date');

const today = formatDate(new Date());
const day3 = formatDate(new Date(Date.now() + 86400000 * 2));

const mockMyBookings = [
  {
    _id: 'res001',
    date: today,
    bookingType: 'normal',
    startTime: '14:00',
    endTime: '16:30',
    peopleCount: 2,
    status: 'confirmed',
    remark: '',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'res002',
    date: day3,
    bookingType: 'changwan',
    startTime: null,
    endTime: null,
    peopleCount: 1,
    status: 'confirmed',
    remark: '第一次来，很期待！',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'res003',
    date: formatDate(new Date(Date.now() - 86400000 * 3)),
    bookingType: 'xianban',
    startTime: '15:00',
    endTime: '18:00',
    peopleCount: 1,
    status: 'completed',
    remark: '',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    _id: 'res004',
    date: formatDate(new Date(Date.now() - 86400000 * 7)),
    bookingType: 'normal',
    startTime: '19:00',
    endTime: '21:00',
    peopleCount: 3,
    status: 'cancelled',
    remark: '',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

const mockAdminReservations = [
  { _id: 'r1', userName: '小明', bookingType: 'normal',   startTime: '10:00', endTime: '12:00', peopleCount: 2, status: 'confirmed', contactInfo: '小明 138xxxx1234', remark: '' },
  { _id: 'r2', userName: '小红', bookingType: 'changwan', startTime: null,    endTime: null,    peopleCount: 1, status: 'confirmed', contactInfo: '小红', remark: '第一次来' },
  { _id: 'r3', userName: '小刚', bookingType: 'xianban',  startTime: '14:00', endTime: '17:00', peopleCount: 1, status: 'confirmed', contactInfo: '小刚 139xxxx5678', remark: '限板预约' },
  { _id: 'r4', userName: '小花', bookingType: 'normal',   startTime: '15:00', endTime: '18:00', peopleCount: 3, status: 'confirmed', contactInfo: '', remark: '' },
];

const mockAdminStats = {
  total: 4,
  totalPeople: 7,
  normal: 2,
  changwan: 1,
  xianban: 1,
};

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

const mockApi = {
  login: async () => {
    await delay();
    return { success: true, data: { token: 'mock_token', openid: 'mock_openid_123', nickname: '测试用户' } };
  },
  getAvailability: async (date, start, end, type = 'normal') => {
    await delay(500);
    if (type === 'changwan') {
      const occupied = 3;
      const remaining = Math.max(0, 12 - occupied);
      return { success: true, data: { totalCapacity: 12, occupied, remaining, isFull: remaining <= 0 } };
    }
    // 用和 getDayOverview 相同的 pattern，找所选时段内峰值占用
    const pattern = [1, 4, 12, 7, 5, 2, 1, 0]; // 对应 13-20 点
    const BASE_H = 13;
    const startH = parseInt(start.split(':')[0]);
    const endH = parseInt(end.split(':')[0]) + (parseInt(end.split(':')[1]) > 0 ? 1 : 0);
    let maxOccupied = 0;
    for (let h = startH; h < endH; h++) {
      const idx = h - BASE_H;
      if (idx >= 0 && idx < pattern.length) {
        maxOccupied = Math.max(maxOccupied, pattern[idx]);
      }
    }
    const remaining = Math.max(0, 12 - maxOccupied);
    return { success: true, data: { totalCapacity: 12, occupied: maxOccupied, remaining, isFull: remaining <= 0 } };
  },
  getDayOverview: async (date) => {
    await delay(400);
    // 模拟一天的小时容量，部分满员部分有空位
    const pattern = [1, 4, 12, 7, 5, 2, 1, 0, 0];
    const hours = pattern.slice(0, 8).map((occupied, i) => {
      const h = 13 + i;
      const remaining = Math.max(0, 12 - occupied);
      const pct = Math.round(occupied / 12 * 100);
      const level = remaining === 0 ? 'full' : remaining <= 3 ? 'high' : remaining <= 6 ? 'mid' : 'low';
      return {
        time: `${String(h).padStart(2, '0')}:00`,
        label: String(h),
        occupied, remaining,
        isFull: remaining === 0,
        pct, level,
      };
    });
    return { success: true, data: { hours } };
  },
  createReservation: async () => {
    await delay(800);
    return { success: true, data: { _id: 'new_res_' + Date.now() }, message: '预约成功！' };
  },
  getMyReservations: async () => {
    await delay(600);
    return { success: true, data: mockMyBookings };
  },
  cancelReservation: async () => {
    await delay(500);
    return { success: true, message: '预约已取消' };
  },
  adminLogin: async (password) => {
    await delay(500);
    if (password === '0416') return { success: true, data: { token: 'mock_admin_token' } };
    return Promise.reject('密码错误');
  },
  adminGetReservations: async () => {
    await delay(600);
    return { success: true, data: { reservations: mockAdminReservations, stats: mockAdminStats } };
  },
  adminCancelReservation: async () => { await delay(400); return { success: true }; },
  adminGetSettings: async () => { await delay(300); return { success: true, data: { storeName: 'FluffyIce Studio', cancelDeadlineHours: 2 } }; },
  adminUpdateSettings: async () => { await delay(300); return { success: true }; },
};

module.exports = mockApi;
