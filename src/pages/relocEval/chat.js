// 引入工具函数
const storage = require('../../utils/storage');
const db = require('../../utils/database');

Page({
  data: {
    toolConfig: {
      type: 'relocEval',
      title: "迁址动力评估助手",
      placeholder: "请输入您想评估的企业名称...",
      welcomeMessage: "您好，我是企业选址动力评估助手，可以帮您评估指定企业近期迁址或对外投资的可能性。请告诉我您想要评估的企业名称。",
      avatarPath: "/assets/icons/tools/relocEval.svg",
      apiConfig: {
        chatUrl: "https://zhaohua-api.rainbowbridge.cn/api/v1/app/tool/reloceval/chat",
        resultUrl: "/pages/relocEval/result"
      },
      needResult: true,
      resultConfig: {
        hasResult: false,
        resultPage: '/pages/relocEval/result',
        dataKey: 'evaluation',
        needConfirm: true
      }
    }
  },

  onLoad: function (options) {
    this.chatPage = this.selectComponent('#chatPage');
    
    // 创建事件通道，用于接收结果页面的事件（用于重置聊天）
    this.resultEventChannel = this.getOpenerEventChannel();
    if (this.resultEventChannel) {
      this.resultEventChannel.on('backToChat', (data) => {
        console.log('Back to chat with data:', data);
        if (data && data.action === 'restart') {
          // 重置聊天组件
          this.chatPage.resetChat();
        }
      });
      
      // 处理从前一个页面传递的数据
      this.resultEventChannel.on('acceptDataFromOpenerPage', (data) => {
        console.log('获取到渠道数据:', data);
        
        // 如果有自定义输入，发送给聊天组件
        if (data && data.initialInput) {
          // 设置延迟，确保组件已初始化
          setTimeout(() => {
            if (this.chatPage && this.chatPage.data.pageReady) {
              this.chatPage.setData({
                inputValue: data.initialInput
              });
              
              // 自动发送也可以添加如下代码:
              // this.chatPage.sendMessage();
            } else {
              console.warn('聊天组件尚未准备好');
            }
          }, 500);
        }
      });
    }
    
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