// 引入工具函数
const storage = require('../../utils/storage');
const db = require('../../utils/database');

Page({
  data: {
    toolConfig: {
      type: 'findVenue',
      title: "找载体助手",
      placeholder: "请输入您的载体需求...",
      welcomeMessage: "您好，我是找载体助手，可以根据您的需求推荐合适的载体。请问您有什么需要查找的载体类型或要求吗？",
      avatarPath: "/assets/icons/tools/findVenue.svg",
      apiConfig: {
        url: "https://api.coze.cn/v1/workflows/chat",
        method: "POST",
        workflowId: "7486308411508998183",
        authToken: "pat_qDM3tPe7y6slRlIOnrUOhh22uiSZ4tUuAa3sM3oXyf8fbb0jleIvgjywhCHouXWG",
        isSSE: true
      },
      resultConfig: {
        dataKey: "venues",
        resultPage: "/pages/findVenue/result",
        hasResult: false,
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
              time: this.chatPage.formatTime(new Date())
            };
            
            this.chatPage.setData({
              messages: [...this.chatPage.data.messages, userMsg]
            });
          }
          
          if (historyItem.aiResponse) {
            // 添加AI回复
            this.chatPage.addSystemMessage(historyItem.aiResponse);
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