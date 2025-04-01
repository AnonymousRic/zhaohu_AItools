/**
 * API接口配置
 * 统一管理项目中所有的API接口地址
 */

// 引入请求工具
const request = require('../utils/request');
const { API } = require('../constants/index');

// API请求基础路径
const BASE_URL = API.BASE_URL || 'https://api.example.com';

/**
 * API接口路径配置
 */
const API_URLS = {
  // 聊天相关接口
  CHAT: {
    SEND_MESSAGE: '/api/chat/send',
    GET_HISTORY: '/api/chat/history'
  },
  
  // 用户相关接口
  USER: {
    LOGIN: '/api/user/login',
    LOGOUT: '/api/user/logout',
    GET_INFO: '/api/user/info',
    UPDATE_INFO: '/api/user/update'
  },
  
  // 项目相关接口
  PROJECT: {
    LIST: '/api/project/list',
    DETAIL: '/api/project/detail',
    SEARCH: '/api/project/search'
  },
  
  // 载体相关接口
  VENUE: {
    LIST: '/api/venue/list',
    DETAIL: '/api/venue/detail',
    SEARCH: '/api/venue/search'
  },
  
  // 收藏相关接口
  FAVORITE: {
    ADD: '/api/favorite/add',
    REMOVE: '/api/favorite/remove',
    LIST: '/api/favorite/list'
  },
  
  // 历史记录相关接口
  HISTORY: {
    ADD: '/api/history/add',
    CLEAR: '/api/history/clear',
    LIST: '/api/history/list'
  }
};

/**
 * 构建完整的API URL
 * @param {String} path - API路径
 * @returns {String} 完整的API URL
 */
const buildUrl = (path) => {
  return `${BASE_URL}${path}`;
};

/**
 * 聊天相关API
 */
const chatApi = {
  /**
   * 发送聊天消息
   * @param {Object} data - 请求参数
   * @param {String} data.message - 消息内容
   * @param {String} data.toolId - 工具ID
   * @param {Array} data.history - 历史消息
   * @returns {Promise} 请求Promise
   */
  sendMessage: (data) => {
    return request.post(API_URLS.CHAT.SEND_MESSAGE, data);
  },
  
  /**
   * 获取聊天历史
   * @param {Object} params - 请求参数
   * @param {String} params.toolId - 工具ID
   * @returns {Promise} 请求Promise
   */
  getHistory: (params) => {
    return request.get(API_URLS.CHAT.GET_HISTORY, params);
  }
};

/**
 * 用户相关API
 */
const userApi = {
  /**
   * 用户登录
   * @param {Object} data - 请求参数
   * @param {String} data.code - 微信登录code
   * @returns {Promise} 请求Promise
   */
  login: (data) => {
    return request.post(API_URLS.USER.LOGIN, data);
  },
  
  /**
   * 用户登出
   * @returns {Promise} 请求Promise
   */
  logout: () => {
    return request.post(API_URLS.USER.LOGOUT);
  },
  
  /**
   * 获取用户信息
   * @returns {Promise} 请求Promise
   */
  getInfo: () => {
    return request.get(API_URLS.USER.GET_INFO);
  },
  
  /**
   * 更新用户信息
   * @param {Object} data - 请求参数
   * @returns {Promise} 请求Promise
   */
  updateInfo: (data) => {
    return request.post(API_URLS.USER.UPDATE_INFO, data);
  }
};

/**
 * 项目相关API
 */
const projectApi = {
  /**
   * 获取项目列表
   * @param {Object} params - 请求参数
   * @returns {Promise} 请求Promise
   */
  getList: (params) => {
    return request.get(API_URLS.PROJECT.LIST, params);
  },
  
  /**
   * 获取项目详情
   * @param {Object} params - 请求参数
   * @param {String} params.id - 项目ID
   * @returns {Promise} 请求Promise
   */
  getDetail: (params) => {
    return request.get(API_URLS.PROJECT.DETAIL, params);
  },
  
  /**
   * 搜索项目
   * @param {Object} params - 请求参数
   * @param {String} params.keyword - 搜索关键词
   * @returns {Promise} 请求Promise
   */
  search: (params) => {
    return request.get(API_URLS.PROJECT.SEARCH, params);
  }
};

/**
 * 载体相关API
 */
const venueApi = {
  /**
   * 获取载体列表
   * @param {Object} params - 请求参数
   * @returns {Promise} 请求Promise
   */
  getList: (params) => {
    return request.get(API_URLS.VENUE.LIST, params);
  },
  
  /**
   * 获取载体详情
   * @param {Object} params - 请求参数
   * @param {String} params.id - 载体ID
   * @returns {Promise} 请求Promise
   */
  getDetail: (params) => {
    return request.get(API_URLS.VENUE.DETAIL, params);
  },
  
  /**
   * 搜索载体
   * @param {Object} params - 请求参数
   * @param {String} params.keyword - 搜索关键词
   * @returns {Promise} 请求Promise
   */
  search: (params) => {
    return request.get(API_URLS.VENUE.SEARCH, params);
  }
};

/**
 * 收藏相关API
 */
const favoriteApi = {
  /**
   * 添加收藏
   * @param {Object} data - 请求参数
   * @param {String} data.id - 收藏项ID
   * @param {String} data.type - 收藏类型
   * @returns {Promise} 请求Promise
   */
  add: (data) => {
    return request.post(API_URLS.FAVORITE.ADD, data);
  },
  
  /**
   * 移除收藏
   * @param {Object} data - 请求参数
   * @param {String} data.id - 收藏项ID
   * @returns {Promise} 请求Promise
   */
  remove: (data) => {
    return request.post(API_URLS.FAVORITE.REMOVE, data);
  },
  
  /**
   * 获取收藏列表
   * @param {Object} params - 请求参数
   * @returns {Promise} 请求Promise
   */
  getList: (params) => {
    return request.get(API_URLS.FAVORITE.LIST, params);
  }
};

/**
 * 历史记录相关API
 */
const historyApi = {
  /**
   * 添加历史记录
   * @param {Object} data - 请求参数
   * @returns {Promise} 请求Promise
   */
  add: (data) => {
    return request.post(API_URLS.HISTORY.ADD, data);
  },
  
  /**
   * 清除历史记录
   * @param {Object} data - 请求参数
   * @returns {Promise} 请求Promise
   */
  clear: (data) => {
    return request.post(API_URLS.HISTORY.CLEAR, data);
  },
  
  /**
   * 获取历史记录列表
   * @param {Object} params - 请求参数
   * @returns {Promise} 请求Promise
   */
  getList: (params) => {
    return request.get(API_URLS.HISTORY.LIST, params);
  }
};

// 统一导出
module.exports = {
  API_URLS,
  buildUrl,
  chat: chatApi,
  user: userApi,
  project: projectApi,
  venue: venueApi,
  favorite: favoriteApi,
  history: historyApi
}; 