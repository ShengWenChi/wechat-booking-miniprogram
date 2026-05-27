// utils/date.js - 日期工具函数

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

/**
 * 格式化日期为 YYYY-MM-DD
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 格式化为展示用字符串，例如 "3月8日 周六"
 */
const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAYS[d.getDay()];
  return `${month}月${day}日 ${weekday}`;
};

/**
 * 获取未来 N 天的日期列表
 */
const getNextNDays = (n = 14) => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = formatDate(d);
    days.push({
      date: dateStr,
      month: d.getMonth() + 1,
      day: d.getDate(),
      weekday: WEEKDAYS[d.getDay()],
      isToday: i === 0,
    });
  }
  return days;
};

/**
 * 判断日期是否是今天
 */
const isToday = (dateStr) => {
  return formatDate(new Date()) === dateStr;
};

/**
 * 格式化时间戳为 YYYY-MM-DD HH:mm
 */
const formatDateTime = (timestamp) => {
  const d = new Date(timestamp);
  return `${formatDate(d)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

module.exports = { formatDate, formatDisplayDate, getNextNDays, isToday, formatDateTime };
