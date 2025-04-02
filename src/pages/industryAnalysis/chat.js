// 引入工具函数
const storage = require('../../utils/storage');
const db = require('../../utils/database');
const { TOOL_IDS, TOOL_NAMES } = require('../../constants/index');

Page({
  data: {
    toolConfig: {
      type: 'industryAnalysis',
      title: "产业链分析助手",
      placeholder: "请输入您想分析的产业链...",
      welcomeMessage: "您好，我是产业链分析助手，可以帮您分析特定产业的现状、特征和趋势。请告诉我您想了解的产业链。",
      avatarPath: "/assets/icons/tools/industryAnalysis.svg",
      toolName: "产业链分析助手",
      toolType: "industryAnalysis",
      apiConfig: {
        chatUrl: "https://zhaohua-api.rainbowbridge.cn/api/v1/app/tool/industryanalysis/chat",
        resultUrl: "/pages/industryAnalysis/result"
      },
      needResult: true,
      resultConfig: {
        hasResult: false,
        resultPage: '/pages/industryAnalysis/result',
        dataKey: 'analysis',
        needConfirm: true
      }
    }
  },

  onLoad: function (options) {
    this.chatPage = this.selectComponent("#chatPage");
    
    // 检查是否需要加载历史记录
    if (options.historyId) {
      console.log('需要加载历史记录ID:', options.historyId);
      
      // 从本地存储获取聊天历史
      const chatHistory = wx.getStorageSync('chatHistory') || [];
      
      // 查找对应的历史记录
      const historyItem = chatHistory.find(item => item.id === options.historyId);
      
      if (historyItem) {
        console.log('找到对应的历史记录:', historyItem);
        
        // 如果找到历史记录，添加到聊天页面
        if (this.chatPage) {
          // 清空现有消息
          this.chatPage.resetChat();
          
          // 添加历史消息
          if (historyItem.userMessage) {
            // 添加用户消息
            const userMsg = {
              id: Date.now() - 1000, // 确保ID比系统消息小
              type: 'user',
              content: historyItem.userMessage,
              time: historyItem.timestamp ? this.chatPage.formatTime(new Date(historyItem.timestamp)) : this.chatPage.formatTime(new Date())
            };
            
            this.chatPage.setData({
              messages: [...this.chatPage.data.messages, userMsg]
            });
          }
          
          if (historyItem.aiResponse) {
            // 添加AI回复（使用历史时间戳+1秒，确保显示在用户消息之后）
            const timestamp = historyItem.timestamp ? (historyItem.timestamp + 1000) : Date.now();
            this.chatPage.addSystemMessageWithTime(historyItem.aiResponse, new Date(timestamp));
          }
        } else {
          console.error('未找到聊天页面组件');
        }
      } else {
        console.warn('未找到ID为', options.historyId, '的历史记录');
      }
    }
  }
}) 