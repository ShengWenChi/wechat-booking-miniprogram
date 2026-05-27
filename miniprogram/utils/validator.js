// utils/validator.js - 表单验证

const validatePhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone);
};

const validateName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 20;
};

const validateReservationForm = (form) => {
  const errors = {};
  if (!form.date) errors.date = '请选择预约日期';
  if (!form.timeSlotId) errors.timeSlotId = '请选择预约时间段';
  if (!form.peopleCount || form.peopleCount < 1) errors.peopleCount = '请选择人数';
  if (!validateName(form.name)) errors.name = '请输入真实姓名（2-20个字符）';
  if (!validatePhone(form.phone)) errors.phone = '请输入正确的手机号';
  return { isValid: Object.keys(errors).length === 0, errors };
};

module.exports = { validatePhone, validateName, validateReservationForm };
