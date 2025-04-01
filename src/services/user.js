/**
 * 用户服务
 * 处理用户相关的数据和逻辑
 */

// 引入请求工具和存储工具
const request = require('../utils/request');
const storage = require('../utils/storage');
const { STORAGE_KEYS } = require('../constants/index');

// 用户信息存储键
const USER_INFO_KEY = STORAGE_KEYS.USER_INFO;
const AUTH_TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;

/**
 * 用户登录
 * @param {Object} options - 登录参数
 * @param {Boolean} options.withUserInfo - 是否获取用户信息
 * @returns {Promise} 登录结果Promise
 */
const login = async (options = {}) => {
  try {
    // 获取微信登录凭证
    const { code } = await getLoginCode();
    
    // 请求服务器登录接口
    const loginResult = await request.post('/api/user/login', { code });
    
    // 保存token到本地
    if (loginResult && loginResult.token) {
      await storage.set(AUTH_TOKEN_KEY, loginResult.token);
    }
    
    // 如果需要获取用户信息
    if (options.withUserInfo && loginResult.code === 0) {
      await getUserInfo();
    }
    
    return loginResult;
  } catch (error) {
    console.error('用户登录失败:', error);
    throw error;
  }
};

/**
 * 获取微信登录凭证
 * @returns {Promise} 登录凭证Promise
 */
const getLoginCode = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve({ code: res.code });
        } else {
          reject(new Error('获取登录凭证失败'));
        }
      },
      fail: reject
    });
  });
};

/**
 * 获取用户信息
 * @returns {Promise} 用户信息Promise
 */
const getUserInfo = async () => {
  try {
    // 从服务器获取用户信息
    const userInfo = await request.get('/api/user/info');
    
    // 保存用户信息到本地
    if (userInfo) {
      await storage.set(USER_INFO_KEY, userInfo);
    }
    
    return userInfo;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};

/**
 * 获取本地存储的用户信息
 * @returns {Promise<Object|null>} 用户信息Promise
 */
const getLocalUserInfo = async () => {
  try {
    return await storage.get(USER_INFO_KEY, null);
  } catch (error) {
    console.error('获取本地用户信息失败:', error);
    return null;
  }
};

/**
 * 更新用户信息
 * @param {Object} userInfo - 新的用户信息
 * @returns {Promise} 更新结果Promise
 */
const updateUserInfo = async (userInfo) => {
  try {
    // 调用更新接口
    const result = await request.post('/api/user/update', userInfo);
    
    // 更新成功后更新本地存储
    if (result && result.code === 0) {
      const localUserInfo = await getLocalUserInfo();
      await storage.set(USER_INFO_KEY, {
        ...(localUserInfo || {}),
        ...userInfo
      });
    }
    
    return result;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
};

/**
 * 退出登录
 * @returns {Promise} 退出结果Promise
 */
const logout = async () => {
  try {
    // 调用登出接口
    const result = await request.post('/api/user/logout');
    
    // 清除本地存储的用户信息和token
    await storage.remove(USER_INFO_KEY);
    await storage.remove(AUTH_TOKEN_KEY);
    
    return result;
  } catch (error) {
    console.error('退出登录失败:', error);
    throw error;
  }
};

/**
 * 检查用户是否已登录
 * @returns {Promise<Boolean>} 登录状态Promise
 */
const isLoggedIn = async () => {
  try {
    const token = await storage.get(AUTH_TOKEN_KEY, null);
    const userInfo = await storage.get(USER_INFO_KEY, null);
    
    return !!token && !!userInfo;
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return false;
  }
};

/**
 * 获取用户授权信息
 * @param {String} scope - 需要获取权限的scope
 * @returns {Promise} 授权结果Promise
 */
const getUserAuthSetting = (scope) => {
  return new Promise((resolve) => {
    wx.getSetting({
      success: (res) => {
        resolve(res.authSetting[scope] || false);
      },
      fail: () => {
        resolve(false);
      }
    });
  });
};

/**
 * 请求用户授权
 * @param {String} scope - 需要获取权限的scope
 * @returns {Promise} 授权结果Promise
 */
const requestUserAuth = (scope) => {
  return new Promise((resolve, reject) => {
    wx.authorize({
      scope,
      success: resolve,
      fail: reject
    });
  });
};

// 统一导出
module.exports = {
  login,
  getUserInfo,
  getLocalUserInfo,
  updateUserInfo,
  logout,
  isLoggedIn,
  getUserAuthSetting,
  requestUserAuth
}; 