/**
 * 本地存储工具函数
 * 统一处理微信小程序的本地存储，包括同步/异步读写、过期时间设置等
 */

// 存储键前缀，防止键名冲突
const KEY_PREFIX = 'zhaohua_ai_';

/**
 * 格式化存储键名
 * @param {String} key - 原始键名
 * @returns {String} 格式化后的键名
 */
const formatKey = (key) => {
  return `${KEY_PREFIX}${key}`;
};

/**
 * 设置本地存储（同步）
 * @param {String} key - 键名
 * @param {Any} data - 存储数据
 * @param {Number} expires - 过期时间（毫秒），默认不过期
 */
const setSync = (key, data, expires = null) => {
  const formatData = {
    data,
    createTime: Date.now()
  };
  
  // 设置过期时间
  if (expires) {
    formatData.expires = expires;
  }
  
  wx.setStorageSync(formatKey(key), formatData);
};

/**
 * 获取本地存储（同步）
 * @param {String} key - 键名
 * @param {Any} defaultValue - 默认值，当数据不存在或已过期时返回
 * @returns {Any} 存储数据或默认值
 */
const getSync = (key, defaultValue = null) => {
  const formatData = wx.getStorageSync(formatKey(key));
  
  // 存储数据不存在
  if (!formatData) {
    return defaultValue;
  }
  
  // 判断是否过期
  if (formatData.expires) {
    const now = Date.now();
    const expireTime = formatData.createTime + formatData.expires;
    
    if (now >= expireTime) {
      // 数据已过期，移除存储并返回默认值
      removeSync(key);
      return defaultValue;
    }
  }
  
  return formatData.data;
};

/**
 * 移除本地存储（同步）
 * @param {String} key - 键名
 */
const removeSync = (key) => {
  wx.removeStorageSync(formatKey(key));
};

/**
 * 清除所有本地存储（同步）
 */
const clearSync = () => {
  wx.clearStorageSync();
};

/**
 * 设置本地存储（异步）
 * @param {String} key - 键名
 * @param {Any} data - 存储数据
 * @param {Number} expires - 过期时间（毫秒），默认不过期
 * @returns {Promise} Promise对象
 */
const set = (key, data, expires = null) => {
  return new Promise((resolve, reject) => {
    const formatData = {
      data,
      createTime: Date.now()
    };
    
    // 设置过期时间
    if (expires) {
      formatData.expires = expires;
    }
    
    wx.setStorage({
      key: formatKey(key),
      data: formatData,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 获取本地存储（异步）
 * @param {String} key - 键名
 * @param {Any} defaultValue - 默认值，当数据不存在或已过期时返回
 * @returns {Promise} Promise对象，返回存储数据或默认值
 */
const get = (key, defaultValue = null) => {
  return new Promise((resolve) => {
    wx.getStorage({
      key: formatKey(key),
      success: (res) => {
        const formatData = res.data;
        
        // 判断是否过期
        if (formatData.expires) {
          const now = Date.now();
          const expireTime = formatData.createTime + formatData.expires;
          
          if (now >= expireTime) {
            // 数据已过期，移除存储并返回默认值
            remove(key).then(() => {
              resolve(defaultValue);
            });
            return;
          }
        }
        
        resolve(formatData.data);
      },
      fail: () => {
        resolve(defaultValue);
      }
    });
  });
};

/**
 * 移除本地存储（异步）
 * @param {String} key - 键名
 * @returns {Promise} Promise对象
 */
const remove = (key) => {
  return new Promise((resolve, reject) => {
    wx.removeStorage({
      key: formatKey(key),
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 清除所有本地存储（异步）
 * @returns {Promise} Promise对象
 */
const clear = () => {
  return new Promise((resolve, reject) => {
    wx.clearStorage({
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 获取本地存储信息
 * @returns {Promise} Promise对象，返回存储信息
 */
const getInfo = () => {
  return new Promise((resolve, reject) => {
    wx.getStorageInfo({
      success: resolve,
      fail: reject
    });
  });
};

// 统一导出
module.exports = {
  // 同步方法
  setSync,
  getSync,
  removeSync,
  clearSync,
  // 异步方法
  set,
  get,
  remove,
  clear,
  getInfo
}; 