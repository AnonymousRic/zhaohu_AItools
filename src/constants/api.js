/**
 * API相关常量定义
 */

// API基础配置
const API_CONFIG = {
  BASE_URL: 'https://api.example.com',
  TIMEOUT: 180000, // 修改为180秒（3分钟）超时
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000
};

// API请求方法
const REQUEST_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

// API响应状态码
const RESPONSE_CODE = {
  SUCCESS: 0,
  ERROR: 1,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

// 错误�?
const ERROR_CODE = {
  NETWORK_ERROR: 1001,  // 网络请求失败
  UNAUTHORIZED: 1002,   // 用户未授权
  PARSE_ERROR: 1003,    // 数据解析错误
  TIMEOUT: 1004,        // 操作超时
  CANCEL: 1005,         // 请求取消
  BUSINESS_ERROR: 1006, // 业务逻辑错误
  PARAM_ERROR: 1007,    // 参数错误
  SERVER_ERROR: 1008,   // 服务器错误
  UNKNOWN_ERROR: 1009   // 未知错误
};

// 统一导出
module.exports = {
  API_CONFIG,
  REQUEST_METHOD,
  RESPONSE_CODE,
  ERROR_CODE
}; 
