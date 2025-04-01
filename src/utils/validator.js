/**
 * 数据验证工具函数
 * 提供常用的数据验证和格式检查功能
 */

/**
 * 验证手机号格式
 * @param {String} phone - 手机号
 * @returns {Boolean} 是否为有效手机号
 */
const isValidPhone = (phone) => {
  const regEx = /^1[3-9]\d{9}$/;
  return regEx.test(phone);
};

/**
 * 验证邮箱格式
 * @param {String} email - 邮箱
 * @returns {Boolean} 是否为有效邮箱
 */
const isValidEmail = (email) => {
  const regEx = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regEx.test(email);
};

/**
 * 验证身份证号格式
 * @param {String} idCard - 身份证号
 * @returns {Boolean} 是否为有效身份证号
 */
const isValidIdCard = (idCard) => {
  const regEx = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  return regEx.test(idCard);
};

/**
 * 验证URL格式
 * @param {String} url - URL地址
 * @returns {Boolean} 是否为有效URL
 */
const isValidUrl = (url) => {
  const regEx = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|info|name|museum|coop|aero|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
  return regEx.test(url);
};

/**
 * 检查字符串是否为空
 * @param {String} str - 字符串
 * @returns {Boolean} 是否为空字符串
 */
const isEmpty = (str) => {
  return str === null || str === undefined || str.trim() === '';
};

/**
 * 检查对象是否为空
 * @param {Object} obj - 对象
 * @returns {Boolean} 是否为空对象
 */
const isEmptyObject = (obj) => {
  return obj === null || obj === undefined || Object.keys(obj).length === 0;
};

/**
 * 检查数组是否为空
 * @param {Array} arr - 数组
 * @returns {Boolean} 是否为空数组
 */
const isEmptyArray = (arr) => {
  return arr === null || arr === undefined || arr.length === 0;
};

/**
 * 检查是否为数字
 * @param {*} value - 要检查的值
 * @returns {Boolean} 是否为数字
 */
const isNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * 检查是否为整数
 * @param {*} value - 要检查的值
 * @returns {Boolean} 是否为整数
 */
const isInteger = (value) => {
  return Number.isInteger(Number(value));
};

/**
 * 检查是否为布尔值
 * @param {*} value - 要检查的值
 * @returns {Boolean} 是否为布尔值
 */
const isBoolean = (value) => {
  return typeof value === 'boolean';
};

/**
 * 检查是否为对象
 * @param {*} value - 要检查的值
 * @returns {Boolean} 是否为对象
 */
const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * 检查是否为数组
 * @param {*} value - 要检查的值
 * @returns {Boolean} 是否为数组
 */
const isArray = (value) => {
  return Array.isArray(value);
};

/**
 * 检查是否为函数
 * @param {*} value - 要检查的值
 * @returns {Boolean} 是否为函数
 */
const isFunction = (value) => {
  return typeof value === 'function';
};

/**
 * 检查是否为日期对象
 * @param {*} value - 要检查的值
 * @returns {Boolean} 是否为日期对象
 */
const isDate = (value) => {
  return value instanceof Date && !isNaN(value);
};

/**
 * 验证密码强度
 * 要求: 最少8位, 包含大小写字母和数字
 * @param {String} password - 密码
 * @returns {Boolean} 是否为强密码
 */
const isStrongPassword = (password) => {
  const regEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return regEx.test(password);
};

/**
 * 验证字符串最小长度
 * @param {String} str - 字符串
 * @param {Number} length - 最小长度
 * @returns {Boolean} 是否满足最小长度
 */
const minLength = (str, length) => {
  return str && str.length >= length;
};

/**
 * 验证字符串最大长度
 * @param {String} str - 字符串
 * @param {Number} length - 最大长度
 * @returns {Boolean} 是否满足最大长度
 */
const maxLength = (str, length) => {
  return str && str.length <= length;
};

/**
 * 验证字符串长度范围
 * @param {String} str - 字符串
 * @param {Number} min - 最小长度
 * @param {Number} max - 最大长度
 * @returns {Boolean} 是否在长度范围内
 */
const lengthBetween = (str, min, max) => {
  return str && str.length >= min && str.length <= max;
};

// 统一导出
module.exports = {
  isValidPhone,
  isValidEmail,
  isValidIdCard,
  isValidUrl,
  isEmpty,
  isEmptyObject,
  isEmptyArray,
  isNumber,
  isInteger,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isDate,
  isStrongPassword,
  minLength,
  maxLength,
  lengthBetween
}; 