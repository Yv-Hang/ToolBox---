const BASE_URL = 'http://127.0.0.1:8080';

/**
 * 序列化对象为 form-urlencoded 字符串
 */
const buildFormData = (data = {}) => {
  return Object.keys(data)
    .filter(key => data[key] !== undefined && data[key] !== null && data[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');
};

/**
 * 统一请求工具
 */
const request = (options) => {
  const { url, method = 'GET', data = {}, header = {}, contentType = 'json' } = options;
  const normalizedMethod = String(method).toUpperCase();
  
  // 设置默认 Content-Type
  const headers = { ...header };
  if (contentType === 'form') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else if (contentType === 'json') {
    headers['Content-Type'] = 'application/json';
  }

  const shouldAppendQuery = (normalizedMethod === 'GET' || contentType === 'form') && data && typeof data === 'object' && !Array.isArray(data);
  const queryString = shouldAppendQuery ? buildFormData(data) : '';
  const finalUrl = queryString ? `${url}${url.includes('?') ? '&' : '?'}${queryString}` : url;

  // 如果是 form 类型且参数已在 URL 中，body 传空对象
  const finalData = shouldAppendQuery ? {} : data;

  return new Promise((resolve, reject) => {
    // 调试信息
    console.log('=== 发起请求 ===');
    console.log('URL:', `${BASE_URL}${finalUrl}`);
    console.log('Method:', normalizedMethod);
    console.log('Data:', finalData);
    console.log('Headers:', headers);
    
    uni.request({
      url: `${BASE_URL}${finalUrl}`,
      method: normalizedMethod,
      data: finalData,
      header: headers,
      success: (res) => {
        console.log('=== 响应结果 ===');
        console.log('statusCode:', res.statusCode);
        console.log('data:', res.data);
        
        const { statusCode, data: resData } = res;
        
        // 兼容不同的成功状态码
        const isSuccess = statusCode >= 200 && statusCode < 300;
        const isPlainObject = resData !== null && typeof resData === 'object' && !Array.isArray(resData);
        const hasBizCode = isPlainObject && Object.prototype.hasOwnProperty.call(resData, 'code');
        const bizSuccess = resData === '' || resData === null || typeof resData === 'undefined' || !hasBizCode || resData.code === 0 || resData.code === 200;

        if (isSuccess && bizSuccess) {
          resolve(resData === '' || resData === null || typeof resData === 'undefined' ? {} : resData);
        } else {
          const errMsg = resData?.msg || resData?.message || '请求失败';
          uni.showToast({ title: errMsg, icon: 'none' });
          reject(new Error(errMsg));
        }
      },
      fail: (err) => {
        console.error('=== 请求失败 ===');
        console.error(err);
        uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
        reject(err);
      }
    });
  });
};

export default request;
