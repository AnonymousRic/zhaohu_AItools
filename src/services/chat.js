/**
 * 聊天服务
 * 负责处理与AI对话相关的API请求
 */

// 引入请求工具
const request = require('../utils/request');
const storage = require('../utils/storage');

// 本地存储键
const CHAT_HISTORY_KEY = 'chat_history';
const RECENT_TOOLS_KEY = 'recent_tools';

/**
 * 发送聊天消息到AI服务
 * @param {String} message - 用户消息文本
 * @param {String} toolId - 工具ID
 * @param {Array} history - 历史消息记录
 * @returns {Promise} 返回AI响应
 */
const sendMessage = async (message, toolId, history = []) => {
  try {
    // 构建请求参数
    const data = {
      message,
      toolId,
      history: history || []
    };
    
    // 发送请求
    return await request.post('/api/chat/send', data);
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error;
  }
};

/**
 * 获取指定工具的聊天历史
 * @param {String} toolId - 工具ID
 * @returns {Array} 聊天历史记录
 */
const getChatHistory = async (toolId) => {
  try {
    // 从本地存储获取历史记录
    const allHistory = await storage.get(CHAT_HISTORY_KEY, {});
    
    // 返回指定工具的历史记录，如果不存在则返回空数组
    return allHistory[toolId] || [];
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    return [];
  }
};

/**
 * 保存聊天历史
 * @param {String} toolId - 工具ID
 * @param {Array} history - 新的历史记录
 * @returns {Promise} 保存结果
 */
const saveChatHistory = async (toolId, history) => {
  try {
    // 从本地存储获取所有历史记录
    const allHistory = await storage.get(CHAT_HISTORY_KEY, {});
    
    // 更新指定工具的历史记录
    allHistory[toolId] = history;
    
    // 保存回本地存储
    return await storage.set(CHAT_HISTORY_KEY, allHistory);
  } catch (error) {
    console.error('保存聊天历史失败:', error);
    throw error;
  }
};

/**
 * 清除指定工具的聊天历史
 * @param {String} toolId - 工具ID，如果不指定则清除所有历史
 * @returns {Promise} 清除结果
 */
const clearChatHistory = async (toolId = null) => {
  try {
    if (toolId) {
      // 清除指定工具的历史记录
      const allHistory = await storage.get(CHAT_HISTORY_KEY, {});
      
      if (allHistory[toolId]) {
        delete allHistory[toolId];
        return await storage.set(CHAT_HISTORY_KEY, allHistory);
      }
      
      return Promise.resolve();
    } else {
      // 清除所有聊天历史
      return await storage.remove(CHAT_HISTORY_KEY);
    }
  } catch (error) {
    console.error('清除聊天历史失败:', error);
    throw error;
  }
};

/**
 * 记录工具使用情况
 * @param {Object} toolInfo - 工具信息
 * @param {String} toolInfo.id - 工具ID
 * @param {String} toolInfo.name - 工具名称
 * @param {String} toolInfo.path - 工具页面路径
 * @returns {Promise} 记录结果
 */
const recordToolUsage = async (toolInfo) => {
  try {
    // 获取现有记录
    const recentTools = await storage.get(RECENT_TOOLS_KEY, []);
    
    // 构建新的记录项
    const newRecord = {
      ...toolInfo,
      timestamp: Date.now() // 记录使用时间
    };
    
    // 过滤掉相同ID的旧记录
    const filteredTools = recentTools.filter(item => item.id !== toolInfo.id);
    
    // 添加新记录到最前面
    filteredTools.unshift(newRecord);
    
    // 限制记录数量为5条
    const limitedTools = filteredTools.slice(0, 5);
    
    // 保存到本地存储
    return await storage.set(RECENT_TOOLS_KEY, limitedTools);
  } catch (error) {
    console.error('记录工具使用情况失败:', error);
    throw error;
  }
};

/**
 * 获取最近使用的工具列表
 * @returns {Promise<Array>} 最近使用的工具列表
 */
const getRecentTools = async () => {
  try {
    return await storage.get(RECENT_TOOLS_KEY, []);
  } catch (error) {
    console.error('获取最近使用工具失败:', error);
    return [];
  }
};

// 统一导出
module.exports = {
  sendMessage,
  getChatHistory,
  saveChatHistory,
  clearChatHistory,
  recordToolUsage,
  getRecentTools
}; 