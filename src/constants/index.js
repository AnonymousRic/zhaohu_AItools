/**
 * 常量定义聚合文件
 * 统一导出所有常量，方便管理
 */

// 导入其他常量文件
const apiConstants = require('./api');
const uiConstants = require('./ui');

// 工具ID常量
const TOOL_IDS = {
  FIND_PROJECT: 'findProject',
  FIND_VENUE: 'findVenue',
  RELOC_EVAL: 'relocEval',
  INDUSTRY_ANALYSIS: 'industryAnalysis'
};

// 工具名称常量
const TOOL_NAMES = {
  [TOOL_IDS.FIND_PROJECT]: '找项目助手',
  [TOOL_IDS.FIND_VENUE]: '找载体助手',
  [TOOL_IDS.RELOC_EVAL]: '迁址动力评估',
  [TOOL_IDS.INDUSTRY_ANALYSIS]: '产业链分析'
};

// 工具页面路径常量
const TOOL_PATHS = {
  [TOOL_IDS.FIND_PROJECT]: '/pages/findProject/index',
  [TOOL_IDS.FIND_VENUE]: '/pages/findVenue/index',
  [TOOL_IDS.RELOC_EVAL]: '/pages/relocEval/index',
  [TOOL_IDS.INDUSTRY_ANALYSIS]: '/pages/industryAnalysis/index'
};

// 工具欢迎语常量
const TOOL_WELCOME_MESSAGES = {
  [TOOL_IDS.FIND_PROJECT]: '你好，我是招华找项目助手，可以根据您的需求智能匹配适合的招商项目。请告诉我您想了解什么类型的项目？',
  [TOOL_IDS.FIND_VENUE]: '你好，我是招华找载体助手，可以帮您查找合适的产业园区、厂房或办公空间。请告诉我您的需求？',
  [TOOL_IDS.RELOC_EVAL]: '你好，我是招华迁址动力评估助手，可以帮您分析企业迁址的可行性和动力。请介绍一下您的企业情况和迁址考虑？',
  [TOOL_IDS.INDUSTRY_ANALYSIS]: '你好，我是招华产业链分析助手，可以为您提供产业上下游关系分析。请告诉我您想了解哪个行业的产业链？'
};

// 工具输入提示常量
const TOOL_INPUT_PLACEHOLDERS = {
  [TOOL_IDS.FIND_PROJECT]: '请描述您想查找的项目类型、投资规模等...',
  [TOOL_IDS.FIND_VENUE]: '请描述您需要的场地面积、区域位置等...',
  [TOOL_IDS.RELOC_EVAL]: '请描述您的企业现状和迁址需求...',
  [TOOL_IDS.INDUSTRY_ANALYSIS]: '请输入您想了解的产业名称...'
};

// API相关常量，从api.js引入
const API = apiConstants.API_CONFIG;

// 本地存储键常量
const STORAGE_KEYS = {
  CHAT_HISTORY: 'chat_history',
  RECENT_TOOLS: 'recent_tools',
  USER_INFO: 'user_info',
  AUTH_TOKEN: 'auth_token'
};

// 统一导出
module.exports = {
  // 工具相关常量
  TOOL_IDS,
  TOOL_NAMES,
  TOOL_PATHS,
  TOOL_WELCOME_MESSAGES,
  TOOL_INPUT_PLACEHOLDERS,
  
  // API相关常量
  API,
  
  // 存储相关常量
  STORAGE_KEYS,
  
  // 导出其他常量文件中的内容
  ...apiConstants,
  ...uiConstants
}; 