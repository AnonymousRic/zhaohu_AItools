/**
 * 网络请求工具函数
 * 统一处理微信小程序的网络请求，包括请求拦截、响应拦截、错误处理等
 */

// 请求基础URL
const BASE_URL = 'https://api.example.com';

// 请求超时时间（毫秒）
const TIMEOUT = 180000; // 改为180秒（3分钟），以便有足够时间处理Coze API响应

/**
 * 发送GET请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Object} options - 额外配置项
 * @returns {Promise} 返回请求Promise
 */
const get = (url, data = {}, options = {}) => {
  return request('GET', url, data, options);
};

/**
 * 发送POST请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Object} options - 额外配置项
 * @returns {Promise} 返回请求Promise
 */
const post = (url, data = {}, options = {}) => {
  return request('POST', url, data, options);
};

/**
 * 统一请求函数
 * @param {String} method - 请求方法
 * @param {String} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Object} options - 额外配置项
 * @returns {Promise} 返回请求Promise
 */
const request = (method, url, data = {}, options = {}) => {
  // 完整URL
  const fullUrl = /^https?:\/\//.test(url) ? url : `${BASE_URL}${url}`;

  // 合并默认配置和自定义配置
  const config = Object.assign(
    {
      timeout: TIMEOUT,
      header: {
        'content-type': 'application/json'
      }
    },
    options
  );

  // 显示加载状态
  if (!options.hideLoading) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
  }

  // 发送请求
  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method,
      data,
      timeout: config.timeout,
      header: config.header,
      success: (res) => {
        // 这里可以对响应结果进行统一处理
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          // 处理HTTP错误
          const error = new Error(`Request failed with status code ${res.statusCode}`);
          error.response = res;
          reject(error);
        }
      },
      fail: (err) => {
        reject(err);
      },
      complete: () => {
        // 隐藏加载状态
        if (!options.hideLoading) {
          wx.hideLoading();
        }
      }
    });
  });
};

/**
 * 上传文件
 * @param {String} url - 上传地址
 * @param {String} filePath - 文件路径
 * @param {String} name - 文件对应的key
 * @param {Object} formData - 额外的表单数据
 * @returns {Promise} 返回上传Promise
 */
const uploadFile = (url, filePath, name = 'file', formData = {}) => {
  // 完整URL
  const fullUrl = /^https?:\/\//.test(url) ? url : `${BASE_URL}${url}`;

  // 显示上传状态
  wx.showLoading({
    title: '上传中...',
    mask: true
  });

  return new Promise((resolve, reject) => {
    const uploadTask = wx.uploadFile({
      url: fullUrl,
      filePath,
      name,
      formData,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          let data = res.data;
          // 尝试解析JSON
          try {
            data = JSON.parse(data);
          } catch (e) {}
          resolve(data);
        } else {
          const error = new Error(`Upload failed with status code ${res.statusCode}`);
          error.response = res;
          reject(error);
        }
      },
      fail: (err) => {
        reject(err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });

    // 上传进度监听
    uploadTask.onProgressUpdate((res) => {
      console.log('上传进度', res.progress);
      // 这里可以实现上传进度条
    });
  });
};

// 统一导出
module.exports = {
  get,
  post,
  request,
  uploadFile
}; 