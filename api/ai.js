import request from '@/utils/request.js';

const getCurrentUserId = () => {
  const user = uni.getStorageSync('current_user') || {};
  return user.id;
};

const requireUserId = (userId) => {
  const resolvedUserId = userId !== undefined && userId !== null ? userId : getCurrentUserId();
  if (resolvedUserId === undefined || resolvedUserId === null || resolvedUserId === '') {
    uni.showToast({ title: '请先登录', icon: 'none' });
    throw new Error('Missing userId');
  }
  // 确保返回的是数字类型
  return Number(resolvedUserId);
};

/**
 * 获取可用AI模型列表
 */
export const getAIModels = () => {
  return request({
    url: '/api/ai/models',
    method: 'GET',
    contentType: 'form'
  });
};

/**
 * 生成文案
 * @param {Object} params - { userId, purpose, keywords, style, wordCount, count, model }
 */
export const generateCopywriting = (params) => {
  const { purpose, keywords, style, wordCount, count, language, model, userId } = params;
  const finalUserId = requireUserId(userId);

  // 确保参数类型正确
  const requestData = {
    userId: finalUserId,  // 已经在requireUserId中转换为数字类型
    purpose: String(purpose),
    keywords: String(keywords),
    style: String(style),
    wordCount: Number(wordCount) || 300,
    count: Number(count) || 1,
    language: String(language || '简体中文'),
    model: String(model || '')
  };
  
  // 调试信息
  console.log('=== 生成文案请求参数 ===');
  console.log('请求URL:', '/api/ai/copywriting');
  console.log('请求方式:', 'POST');
  console.log('参数类型:', 'query (application/x-www-form-urlencoded)');
  console.log('完整参数:', requestData);
  console.log('userId类型:', typeof requestData.userId, '值:', requestData.userId);
  
  return request({
    url: '/api/ai/copywriting',
    method: 'POST',
    data: requestData,
    contentType: 'form'
  });
};

/**
 * 获取生成历史
 * @param {Object} params - { userId, page, size }
 */
export const getHistory = ({ page = 1, size = 10, userId } = {}) => {
  return request({
    url: '/api/ai/history',
    method: 'GET',
    data: { 
      userId: requireUserId(userId),
      page, 
      size 
    },
    contentType: 'form'
  });
};

/**
 * 获取对话详情
 * @param {Object} params - { id, userId }
 */
export const getHistoryDetail = ({ id, userId }) => {
  return request({
    url: `/api/ai/history/${id}`,
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
 * 扣减积分
 */
export const deductPoints = ({ amount, remark, userId }) => {
  return request({
    url: '/api/pay/deduct',
    method: 'POST',
    data: {
      userId: requireUserId(userId),
      amount,
      remark
    },
    contentType: 'form'
  });
};

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
