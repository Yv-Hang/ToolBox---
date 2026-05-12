import request from '@/utils/request.js';

const getCurrentUserId = () => {
  const user = uni.getStorageSync('current_user') || {};
  return user.id;
};

const requireUserId = (userId) => {
  const resolvedUserId = userId ?? getCurrentUserId();
  if (resolvedUserId === undefined || resolvedUserId === null || resolvedUserId === '') {
    uni.showToast({ title: '请先登录', icon: 'none' });
    throw new Error('Missing userId');
  }
  return resolvedUserId;
};

/**
 * 发送注册验证码
 */
export const sendRegisterCode = (email) => {
  return request({
    url: '/login/sendRegisterCode',
    method: 'POST',
    data: { email },
    contentType: 'form'
  });
};

/**
 * 发送登录验证码
 */
export const sendLoginCode = (email) => {
  return request({
    url: '/login/sendLoginCode',
    method: 'POST',
    data: { email },
    contentType: 'form'
  });
};

/**
 * 用户注册
 */
export const registerUser = (userData) => {
  return request({
    url: '/login/reg',
    method: 'POST',
    data: userData,
    contentType: 'form'
  });
};

/**
 * 用户登录
 */
export const loginUser = (loginData) => {
  const { usernameOrEmail, password, code } = loginData;
  return request({
    url: '/login/login',
    method: 'POST',
    data: { usernameOrEmail, password, code },
    contentType: 'form'
  });
};

/**
 * 归一化用户信息
 */
export const normalizeUser = (source = {}, fallback = {}) => ({
  id: source.id !== undefined && source.id !== null ? source.id : (fallback.id !== undefined && fallback.id !== null ? fallback.id : ''),
  username: source.username || source.userName || fallback.username || fallback.usernameOrEmail || '',
  email: source.email || fallback.email || '',
  token: source.token || source.accessToken || fallback.token || ''
});

/**
 * 获取用户个人信息
 */
export const getUserInfo = (userId) => {
  return request({
    url: '/user/info',
    method: 'GET',
    data: { userId: requireUserId(userId) },
    contentType: 'form'
  });
};

/**
 * 获取积分余额
 */
export const getBalance = (userId) => {
  return request({
    url: '/api/pay/balance',
    method: 'GET',
    data: { userId: requireUserId(userId) },
    contentType: 'form'
  });
};

/**
 * 购买会员
 */
export const buyMembership = (userId, membershipId) => {
  return request({
    url: '/api/pay/buy-membership',
    method: 'POST',
    data: { userId: requireUserId(userId), membershipId },
    contentType: 'form'
  });
};

/**
 * 卡密兑换积分
 */
export const redeemCardKey = (userId, cardKey) => {
  return request({
    url: '/api/pay/redeem',
    method: 'POST',
    data: { userId: requireUserId(userId), cardKey },
    contentType: 'form'
  });
};
