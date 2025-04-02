// 引入工具函数
const storage = require('../../../utils/storage');
const request = require('../../../utils/request');
const db = require('../../../utils/database');
const { TOOL_IDS, TOOL_NAMES, TOOL_PATHS } = require('../../../constants/index');

Component({
  properties: {
    // 工具基本信息配置
    toolConfig: {
      type: Object,
      value: {
        type: 'chat', // 工具类型
        title: '', // 页面标题
        placeholder: '', // 输入框占位文本
        welcomeMessage: '', // 欢迎消息
        avatarPath: '/assets/icons/ai_avatar.svg', // 默认AI头像路径
        needResult: false, // 是否需要最终结果
        resultConfig: {
          // 结果配置
          needConfirm: false, // 是否需要用户确认后查看结果
          hasResult: false, // 是否已有结果
          resultPage: '', // 结果页面路径
          dataKey: 'data' // 传递给结果页的数据键名
        }
      }
    }
  },

  data: {
    messages: [],
    inputValue: '',
    loading: false,
    isKeyboardShow: false,
    keyboardHeight: 0,
    keyboardTransformStyle: '',
    resultData: null, // 存储API返回的结果数据
    scrollToView: '', // 滚动到指定消息
    pageReady: false, // 标记页面是否已准备好
    currentRequestId: null, // 用于识别响应是否属于当前请求
    storageKey: '', // 存储消息的键名
    resultStorageKey: '', // 存储结果数据的键名
    requestStatusKey: '' // 存储请求状态的键名
  },

  lifetimes: {
    attached: function() {
      // 标记组件已初始化但未完全准备好
      this.isInitialized = false;
      
      // 获取工具标识符
      const toolId = this.properties.toolConfig.title || 'generic';
      this.storageKey = `chat_messages_${toolId}`;
      this.resultStorageKey = `chat_result_${toolId}`;
      this.requestStatusKey = `request_status_${toolId}`;
      
      // 检查是否有未完成的请求
      this.checkPendingRequests();
      
      // 尝试从存储中恢复消息和结果数据
      this.loadMessagesFromStorage();
      
      // 如果没有恢复到任何消息，则添加欢迎消息
      if (this.data.messages.length === 0) {
        this.addSystemMessage(this.properties.toolConfig.welcomeMessage);
      }
    },
    
    ready: function() {
      // 组件已完全渲染，设置准备完成标志
      this.isInitialized = true;
      
      // 设置页面准备好标志
      this.setData({
        pageReady: true
      });
      
      console.log("聊天组件已完全初始化");
    },
    
    detached: function() {
      // 页面卸载前保存当前状态
      this.saveMessagesToStorage();
      
      // 页面卸载时，如果有正在进行的请求，记录其状态
      if (this.data.loading && this.currentRequestId) {
        wx.setStorage({
          key: this.requestStatusKey,
          data: {
            requestId: this.currentRequestId,
            timestamp: Date.now(),
            lastMessage: this.data.messages[this.data.messages.length - 1]
          }
        });
        console.log('保存了未完成的请求状态', this.currentRequestId);
      }
    }
  },

  pageLifetimes: {
    hide: function() {
      // 页面隐藏时保存状态
      this.saveMessagesToStorage();
    },
    
    unload: function() {
      // 页面卸载时保存状态
      this.saveMessagesToStorage();
    }
  },

  methods: {
    // 发送消息
    sendMessage: function() {
      if (!this.data.inputValue.trim() || this.data.loading) return;
      
      const userMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: this.data.inputValue,
        time: this.formatTime(new Date())
      };
      
      // 更新消息列表并清空输入框
      this.setData({
        messages: [...this.data.messages, userMessage],
        inputValue: '',
        loading: true,
        scrollToView: 'msg_' + userMessage.id
      });
      
      // 记录工具使用
      this.recordToolUsage();
      
      // 调用API
      this.callAPI(userMessage.content);
    },

    // 重置聊天
    resetChat: function() {
      this.setData({
        messages: [],
        inputValue: '',
        loading: false,
        resultData: null
      });
      
      // 添加欢迎消息
      this.addSystemMessage(this.properties.toolConfig.welcomeMessage);
    },

    // 调用API
    callAPI: function(userInput) {
      const { apiConfig } = this.properties.toolConfig;
      
      // 如果未配置API，直接返回
      if (!apiConfig || !apiConfig.url) {
        this.addSystemMessage('API配置不完整，无法处理请求');
        this.setData({ loading: false });
        return;
      }
      
      // 添加调试消息
      console.log("准备调用API，输入:", userInput);
      
      // 构建请求数据 - 更新以匹配Coze API格式
      let requestData = {
        workflow_id: apiConfig.workflowId,
        additional_messages: [
          {
            role: "user",
            content_type: "text",
            content: userInput
          }
        ],
        parameters: {}
      };
      
      // 记录当前请求ID，用于识别响应是否属于当前请求
      const requestId = Date.now().toString();
      this.currentRequestId = requestId;
      
      // 保存请求状态到本地存储
      wx.setStorage({
        key: this.requestStatusKey,
        data: {
          requestId: requestId,
          timestamp: Date.now(),
          userInput: userInput,
          lastMessage: this.data.messages.length > 0 ? this.data.messages[this.data.messages.length - 1] : null
        }
      });
      
      // 将当前状态保存到本地存储
      this.saveMessagesToStorage();
      
      // 发送请求
      wx.request({
        url: apiConfig.url,
        method: apiConfig.method || 'POST',
        header: {
          'Authorization': `Bearer ${apiConfig.authToken}`,
          'Content-Type': 'application/json'
        },
        data: requestData,
        timeout: 180000, // 180秒超时（3分钟）
        responseType: 'text', // 确保返回文本而不是JSON，因为SSE是文本格式
        success: (res) => {
          console.log("API响应完整数据:", JSON.stringify(res));
          
          // 检查这个响应是否是最新的请求
          if (this.currentRequestId !== requestId) {
            console.log('收到旧请求的响应，忽略');
            return;
          }
          
          // 处理API响应
          this.handleApiResponse(res);
          
          // 保存更新后的消息和结果数据
          this.saveMessagesToStorage();
          
          // 清除请求状态
          wx.removeStorage({ 
            key: this.requestStatusKey,
            success: () => console.log('请求已完成，状态已清除')
          });
        },
        fail: (error) => {
          console.error('API请求失败:', error);
          
          // 检查这个响应是否是最新的请求
          if (this.currentRequestId !== requestId) {
            console.log('收到旧请求的响应，忽略');
            return;
          }
          
          // 识别超时错误并提供更清晰的消息
          let errorMsg = JSON.stringify(error);
          let friendlyMsg = '请求失败: ';
          
          if (error.errMsg && error.errMsg.includes('timeout')) {
            friendlyMsg = '请求超时: 服务器响应时间过长，请稍后再试。';
          } else if (error.errMsg && error.errMsg.includes('fail')) {
            friendlyMsg = '网络错误: 无法连接到服务器，请检查网络连接后再试。';
          }
          
          // 添加错误消息
          this.addSystemMessage(friendlyMsg);
          
          this.setData({
            loading: false
          });
          
          // 保存更新后的消息
          this.saveMessagesToStorage();
          
          // 清除请求状态
          wx.removeStorage({ 
            key: this.requestStatusKey,
            success: () => console.log('请求失败，状态已清除')
          });
        },
        complete: () => {
          // 确保请求完成后总是取消加载状态
          if (this.data.loading) {
            this.setData({
              loading: false
            });
          }
        }
      });
    },

    // 处理API响应
    handleApiResponse: function(res) {
      const { apiConfig, resultConfig } = this.properties.toolConfig;
      let responseContent = '抱歉，无法处理您的请求，请稍后再试。';
      let resultData = null;
      
      // 如果响应是SSE格式，使用专门的SSE处理函数
      if (apiConfig.isSSE) {
        this.handleSSEResponse(res, resultConfig.dataKey);
        return;
      }
      
      // 如果有自定义的响应解析器，使用它
      if (apiConfig.responseParser && typeof apiConfig.responseParser === 'function') {
        try {
          const parsedResult = apiConfig.responseParser(res);
          responseContent = parsedResult.content || responseContent;
          resultData = parsedResult.data || null;
        } catch (e) {
          console.error('自定义响应解析器出错:', e);
        }
      } else {
        // 默认响应处理
        if (res.statusCode === 200) {
          if (res.data && res.data.output) {
            responseContent = res.data.output;
            
            // 提取结果数据
            if (resultConfig.dataKey && res.data[resultConfig.dataKey]) {
              resultData = res.data[resultConfig.dataKey];
            }
          }
        } else if (res.data && res.data.msg) {
          responseContent = `API错误: ${res.data.msg}`;
        }
      }
      
      // 添加系统回复消息（使用改进的消息处理）
      this.addSystemMessage(responseContent);
      
      // 找到最后一条用户消息
      const lastUserMessage = this.findLastUserMessage();
      if (lastUserMessage) {
        // 记录对话到聊天历史
        this.recordChatConversation(lastUserMessage.content, responseContent);
        console.log('已记录对话历史:', {
          user: lastUserMessage.content.substring(0, 20) + '...',
          ai: responseContent.substring(0, 20) + '...'
        });
      } else {
        console.warn('未找到最后一条用户消息，无法记录对话历史');
      }
      
      // 处理结果数据
      if (resultData) {
        this.setData({
          resultData: resultData
        });
        
        // 保存结果数据到本地存储
        wx.setStorage({
          key: this.resultStorageKey,
          data: resultData
        });
        
        // 如果需要确认跳转到结果页
        if (resultConfig.needConfirm) {
          setTimeout(() => {
            this.addSystemMessage('是否查看详细的结果报告？');
            
            // 添加"查看报告"按钮
            const viewReportMsg = {
              id: Date.now().toString(),
              type: 'system',
              content: '查看详细报告',
              time: this.formatTime(new Date()),
              isAction: true
            };
            
            this.setData({
              messages: [...this.data.messages, viewReportMsg],
              scrollToView: 'msg_' + viewReportMsg.id
            });
            
            // 保存更新后的消息到本地存储
            this.saveMessagesToStorage();
          }, 1000);
        } else if (resultConfig.resultPage) {
          // 直接跳转到结果页面
          setTimeout(() => {
            this.navigateToResult();
          }, 1000);
        }
      }
    },

    // 处理SSE响应
    handleSSEResponse: function(res, dataKey) {
      let responseContent = '抱歉，无法处理您的请求，请稍后再试。';
      let resultData = null;
      let hasFoundData = false;
      let hasCompletedMessage = false;
      
      if (res.data && typeof res.data === 'string') {
        // 尝试解析SSE格式的响应
        try {
          // 按行分割SSE响应
          const lines = res.data.split('\n');
          let fullContent = '';
          let foundError = false;
          
          for (const line of lines) {
            // 处理错误事件
            if (line.startsWith('event: conversation.chat.failed')) {
              foundError = true;
              console.log('发现错误事件');
              continue;
            }
            
            // 获取错误信息
            if (foundError && line.startsWith('data: ')) {
              try {
                const errorData = JSON.parse(line.substring(6));
                if (errorData.code && errorData.msg) {
                  responseContent = `API错误: ${errorData.msg} (${errorData.code})`;
                  console.error('API错误:', errorData);
                }
              } catch (e) {
                console.error('解析错误信息失败:', e);
              }
              break;
            }
            
            // 处理消息增量事件
            if (line.startsWith('event: conversation.message.delta')) {
              console.log('收到消息增量');
              continue;
            }
            
            // 处理消息完成事件
            if (line.startsWith('event: conversation.message.completed')) {
              hasCompletedMessage = true;
              console.log('消息完成事件');
              continue;
            }
            
            // 处理需要操作事件
            if (line.startsWith('event: conversation.chat.requires_action')) {
              console.log('需要操作事件');
              continue;
            }
            
            // 处理常规消息数据
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              try {
                const jsonData = JSON.parse(data);
                
                // 处理assistant的标准文本回复
                if (jsonData.role === 'assistant' && 
                    jsonData.type === 'answer' && 
                    jsonData.content) {
                  fullContent = jsonData.content;
                  console.log('收到assistant回复:', fullContent.substring(0, 30));
                }
                
                // 处理verbose类型消息，可能包含结构化数据
                if (jsonData.role === 'assistant' && 
                    jsonData.type === 'verbose' && 
                    jsonData.content) {
                  try {
                    const verboseData = JSON.parse(jsonData.content);
                    console.log('verbose数据类型:', verboseData.msg_type);
                    
                    // 检查是否包含推荐结果数据
                    if (verboseData.data && typeof verboseData.data === 'string') {
                      try {
                        if (verboseData.data.includes('projects') || verboseData.data.includes('venues')) {
                          const parsedResultData = JSON.parse(verboseData.data);
                          
                          // 检查数据结构中是否包含实际数据
                          if (parsedResultData.projects && Array.isArray(parsedResultData.projects) && parsedResultData.projects.length > 0) {
                            resultData = parsedResultData.projects;
                            hasFoundData = true;
                            console.log('找到项目数据:', resultData.length);
                          } else if (parsedResultData.venues && Array.isArray(parsedResultData.venues) && parsedResultData.venues.length > 0) {
                            resultData = parsedResultData.venues;
                            hasFoundData = true;
                            console.log('找到载体数据:', resultData.length);
                          }
                        }
                      } catch (e) {
                        console.error('解析结果数据失败:', e);
                      }
                    }
                  } catch (e) {
                    console.error('解析verbose内容失败:', e);
                  }
                }
                
                // 处理需要操作的事件数据
                if (jsonData.status === 'requires_action' && jsonData.required_action) {
                  console.log('需要执行操作:', jsonData.required_action);
                }
              } catch (e) {
                console.error('解析JSON数据失败:', e);
              }
            }
          }
          
          if (fullContent) {
            responseContent = fullContent;
          }
        } catch (e) {
          console.error('处理SSE响应失败:', e);
        }
      }
      
      // 添加系统回复消息
      this.addSystemMessage(responseContent);
      
      // 找到最后一条用户消息
      const lastUserMessage = this.findLastUserMessage();
      if (lastUserMessage) {
        // 记录对话到聊天历史
        this.recordChatConversation(lastUserMessage.content, responseContent);
      }
      
      const { resultConfig } = this.properties.toolConfig;
      
      // 如果找到了结果数据，处理结果
      if (hasFoundData && resultData) {
        this.setData({
          resultData: resultData
        });
        
        // 保存结果数据到本地存储
        wx.setStorage({
          key: this.resultStorageKey,
          data: resultData,
          success: () => {
            console.log('SSE响应结果数据保存成功');
          }
        });
        
        // 如果需要确认跳转到结果页
        if (resultConfig.needConfirm) {
          setTimeout(() => {
            this.addSystemMessage('是否查看详细的结果报告？');
            
            // 添加"查看报告"按钮
            const viewReportMsg = {
              id: Date.now().toString(),
              type: 'system',
              content: '查看详细报告',
              time: this.formatTime(new Date()),
              isAction: true
            };
            
            this.setData({
              messages: [...this.data.messages, viewReportMsg],
              scrollToView: 'msg_' + viewReportMsg.id
            });
            
            // 保存更新后的消息到本地存储
            this.saveMessagesToStorage();
          }, 1000);
        } else if (resultConfig.resultPage) {
          // 直接跳转到结果页面
          setTimeout(() => {
            this.navigateToResult();
          }, 1000);
        }
      }
    },

    // 找到最后一条用户消息
    findLastUserMessage: function() {
      for (let i = this.data.messages.length - 1; i >= 0; i--) {
        if (this.data.messages[i].type === 'user') {
          return this.data.messages[i];
        }
      }
      return null;
    },
    
    // 记录对话到聊天历史
    recordChatConversation: function(userMessage, aiResponse) {
      const { toolName, toolType } = this.properties.toolConfig;
      if (!toolName || !toolType) {
        console.error('工具配置信息不完整，无法记录对话历史');
        return;
      }
      
      // 获取当前日期和时间，精确到分钟
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // 生成唯一ID
      const historyId = `chat_${Date.now().toString()}`;
      
      // 准备历史记录数据
      const historyItem = {
        id: historyId,
        title: userMessage.length > 20 ? userMessage.substring(0, 20) + '...' : userMessage,
        description: aiResponse.length > 50 ? aiResponse.substring(0, 50) + '...' : aiResponse,
        userMessage: userMessage,  // 保存完整的用户消息
        aiResponse: aiResponse,    // 保存完整的AI回复
        toolType: toolType,
        toolName: toolName,
        time: dateStr,
        timestamp: now.getTime(),
        url: `/pages/${toolType}/chat?historyId=${historyId}`
      };
      
      console.log('记录聊天历史项:', historyItem);
      
      // 获取现有历史记录
      let chatHistory = wx.getStorageSync('chatHistory') || [];
      
      // 添加新记录到历史记录开头
      chatHistory.unshift(historyItem);
      
      // 限制最多保存100条历史记录
      if (chatHistory.length > 100) {
        chatHistory = chatHistory.slice(0, 100);
      }
      
      // 保存到本地存储
      wx.setStorageSync('chatHistory', chatHistory);
      console.log(`已记录对话历史: ${userMessage} (${toolName})`);
      
      // 尝试同时保存到数据库（如果可用）
      try {
        const db = require('../../../utils/database.js');
        if (db && db.recordChatHistory && typeof db.recordChatHistory === 'function') {
          db.recordChatHistory(historyItem).catch(err => {
            console.error('保存对话历史到数据库失败:', err);
          });
        }
      } catch (e) {
        console.error('尝试保存到数据库时出错:', e);
      }
    },

    // 添加系统消息
    addSystemMessage: function(content) {
      // 处理消息格式化
      const { formattedContent, recommendations } = this.formatMessageContent(
        content,
        this.properties.toolConfig.type
      );
      
      const message = {
        id: Date.now().toString(),
        type: 'system',
        content: formattedContent, // 使用处理后的内容
        recommendations: recommendations,
        time: this.formatTime(new Date())
      };
      
      this.setData({
        messages: [...this.data.messages, message],
        scrollToView: 'msg_' + message.id
      });
    },
    
    // 添加系统消息（支持指定时间）
    addSystemMessageWithTime: function(content, timestamp) {
      // 处理消息格式化
      const { formattedContent, recommendations } = this.formatMessageContent(
        content,
        this.properties.toolConfig.type
      );
      
      const message = {
        id: Date.now().toString(),
        type: 'system',
        content: formattedContent, // 使用处理后的内容
        recommendations: recommendations,
        time: this.formatTime(timestamp || new Date())
      };
      
      this.setData({
        messages: [...this.data.messages, message],
        scrollToView: 'msg_' + message.id
      });
    },

    // 格式化时间
    formatTime: function(date) {
      const now = new Date();
      const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
      
      if (isToday) {
        // 今天的消息只显示时分
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      } else {
        // 非今天的消息显示完整日期和时间
        return date.toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    },

    // 清空输入框
    clearInput: function() {
      this.setData({
        inputValue: ''
      });
    },

    // 处理输入框内容变化
    onInputChange: function(e) {
      this.setData({
        inputValue: e.detail.value
      });
      
      // 如果用户输入"查看报告"，自动跳转到结果页
      const { resultConfig } = this.properties.toolConfig;
      if (resultConfig.needConfirm && this.data.resultData && e.detail.value.trim() === '查看报告') {
        this.navigateToResult();
        this.setData({
          inputValue: ''
        });
      }
    },

    // 导航到结果页面
    navigateToResult: function() {
      const { resultConfig } = this.properties.toolConfig;
      
      if (!this.data.resultData) {
        this.addSystemMessage('暂无结果数据，请先完成对话。');
        return;
      }
      
      if (!resultConfig.resultPage) {
        this.addSystemMessage('未配置结果页面路径。');
        return;
      }
      
      // 根据dataKey名称构建传递参数
      const dataKey = resultConfig.dataKey || 'data';
      const params = {};
      params[dataKey] = this.data.resultData;
      
      wx.navigateTo({
        url: resultConfig.resultPage,
        success: (res) => {
          res.eventChannel.emit('acceptDataFromOpenerPage', params);
        }
      });
    },

    // 返回上一页
    goBack: function() {
      wx.navigateBack();
    },

    // 输入框获取焦点
    onInputFocus: function(e) {
      // 确保获取到有效的键盘高度
      const keyboardHeight = e.detail.height || 216; // 如果没有高度信息，使用默认高度
      
      // 立即应用一次样式变更
      this.setData({
        isKeyboardShow: true,
        keyboardHeight: keyboardHeight,
        keyboardTransformStyle: `transform: translateY(-${keyboardHeight}px);`
      });
      
      // 延迟10ms再次应用，确保初始样式已被渲染
      setTimeout(() => {
        if (this.data.isKeyboardShow) {
          this.setData({
            keyboardTransformStyle: `transform: translateY(-${keyboardHeight}px);`
          });
        }
      }, 10);
      
      // 再延迟100ms应用，解决某些设备上的延迟问题
      setTimeout(() => {
        if (this.data.isKeyboardShow) {
          this.setData({
            keyboardTransformStyle: `transform: translateY(-${keyboardHeight}px);`
          });
        }
      }, 100);
      
      // 针对首次打开可能出现的问题，再增加一次延迟应用
      setTimeout(() => {
        if (this.data.isKeyboardShow) {
          this.setData({
            keyboardTransformStyle: `transform: translateY(-${keyboardHeight}px);`
          });
        }
      }, 300);
    },
    
    // 输入框失去焦点
    onInputBlur: function() {
      this.setData({
        isKeyboardShow: false,
        keyboardTransformStyle: ''
      });
      
      // 确保样式被正确应用
      setTimeout(() => {
        if (!this.data.isKeyboardShow) {
          this.setData({
            keyboardTransformStyle: ''
          });
        }
      }, 50);
    },
    
    // 点击页面空白处关闭键盘
    onPageTap: function(e) {
      // 如果键盘已显示，任何点击都应该关闭键盘
      if (this.data.isKeyboardShow) {
        // 收起键盘并重置输入框位置
        wx.hideKeyboard({
          complete: (res) => {
            this.setData({
              isKeyboardShow: false,
              keyboardTransformStyle: ''
            });
          }
        });
      }
    },
    
    // 复制消息文本
    copyMessageText: function(e) {
      const content = e.currentTarget.dataset.content;
      if (content) {
        wx.setClipboardData({
          data: content,
          success: () => {
            wx.showToast({
              title: '已复制文本',
              icon: 'success',
              duration: 1500
            });
          }
        });
      }
    },
    
    // 点击操作按钮
    onActionTap: function(e) {
      const { content } = e.currentTarget.dataset;
      if (content === '查看详细报告') {
        this.navigateToResult();
      }
    },

    // 检查是否有未完成的请求
    checkPendingRequests: function() {
      wx.getStorage({
        key: this.requestStatusKey,
        success: (res) => {
          if (res.data && res.data.requestId) {
            const pendingRequest = res.data;
            const timePassed = Date.now() - pendingRequest.timestamp;
            
            // 如果请求发起时间在3分钟内，显示等待消息
            if (timePassed < 180000) {
              this.addSystemMessage('正在处理您的上一个请求，请稍候...');
              this.setData({ loading: true });
            } else {
              // 如果超过3分钟，认为请求已超时
              this.addSystemMessage('您的上一个请求似乎已超时，您可以重新发送');
              // 清除请求状态
              wx.removeStorage({ key: this.requestStatusKey });
            }
          }
        }
      });
    },

    // 清除聊天历史
    clearChatHistory: function() {
      // 清除消息
      this.setData({
        messages: [],
        resultData: null,
        inputValue: ''
      });
      
      // 添加欢迎消息
      this.addSystemMessage(this.properties.toolConfig.welcomeMessage);
      
      // 清除本地存储
      wx.removeStorage({ key: this.storageKey });
      wx.removeStorage({ key: this.resultStorageKey });
      wx.removeStorage({ key: this.requestStatusKey });
      
      console.log('聊天历史已清除');
    },

    // 从本地存储加载消息
    loadMessagesFromStorage: function() {
      // 加载消息
      wx.getStorage({
        key: this.storageKey,
        success: (res) => {
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            console.log('从存储中恢复了消息:', res.data.length);
            this.setData({
              messages: res.data
            });
            
            // 滚动到最后一条消息
            if (res.data.length > 0) {
              this.setData({
                scrollToView: 'msg_' + res.data[res.data.length - 1].id
              });
            }
          }
        },
        fail: (error) => {
          console.log('没有找到存储的消息或读取失败:', error);
        }
      });
      
      // 加载结果数据
      wx.getStorage({
        key: this.resultStorageKey,
        success: (res) => {
          if (res.data) {
            console.log('从存储中恢复了结果数据');
            this.setData({
              resultData: res.data
            });
          }
        }
      });
    },

    // 保存消息到本地存储
    saveMessagesToStorage: function() {
      const { messages, resultData } = this.data;
      
      // 保存消息
      wx.setStorage({
        key: this.storageKey,
        data: messages,
        success: () => {
          console.log('消息保存成功');
        },
        fail: (error) => {
          console.error('消息保存失败:', error);
        }
      });
      
      // 保存结果数据
      if (resultData) {
        wx.setStorage({
          key: this.resultStorageKey,
          data: resultData,
          success: () => {
            console.log('结果数据保存成功');
          }
        });
      }
    },

    /**
     * 格式化消息内容，处理Markdown和推荐卡片
     * @param {string} content 消息内容
     * @param {string} toolType 工具类型，用于判断是否需要提取推荐卡片
     * @returns {object} 包含格式化后的内容和推荐内容
     */
    formatMessageContent(content, toolType) {
      const result = {
        formattedContent: content,
        recommendations: []
      };
      
      // 处理文本中的Markdown加粗语法 - 在内容中直接替换文本
      let formattedText = content;
      
      // 处理标准Markdown加粗 **文本**
      if (formattedText.includes('**')) {
        formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '✦$1✦');
      }
      
      // 已经更新了formattedText，赋值给结果
      result.formattedContent = formattedText;
      
      // 仅针对找项目和找载体处理推荐卡片
      if ((toolType === 'findProject' || toolType === 'findVenue') && content.includes('推荐')) {
        try {
          // 使用正则表达式提取推荐方案
          const recommendations = [];
          
          // 尝试查找推荐块 - 匹配不同的推荐标题格式
          const recommendationMatch = content.match(/((?:推荐方案|推荐项目|推荐载体|为您推荐)[：:]\s*[\r\n]*)(.+)$/s);
          
          if (recommendationMatch) {
            const recommendHeader = recommendationMatch[1];
            const recommendationsText = recommendationMatch[2];
            
            // 首先保留介绍文本，移除推荐部分
            result.formattedContent = content.substring(0, content.indexOf(recommendHeader));
            
            // 尝试分割多个推荐项
            // 匹配数字编号(1. 2. 等)或项目符号(- * •)或分隔线开头的段落
            const recItems = recommendationsText.split(/(?:\n\s*\d+[\.\、]\s*|\n\s*[-\*\•]\s*|\n\s*[-—]{2,}\s*\n)/);
            
            for (let i = 0; i < recItems.length; i++) {
              const recItem = recItems[i].trim();
              if (recItem) {
                // 尝试分离标题和内容 - 查找冒号或换行作为分隔符
                const titleMatch = recItem.match(/^([^:：\n\r]+)[:：\n\r]/);
                if (titleMatch) {
                  const title = titleMatch[1].trim();
                  let content = recItem.substring(titleMatch[0].length).trim();
                  
                  // 如果内容为空，则将整个项作为内容
                  if (!content) {
                    content = recItem;
                  }
                  
                  recommendations.push({
                    title: title || '推荐方案',
                    content: content
                  });
                } else {
                  // 如果无法分离标题和内容，尝试用第一句话作为标题
                  const firstSentenceMatch = recItem.match(/^([^。！？.!?]+[。！？.!?])/);
                  if (firstSentenceMatch) {
                    const title = firstSentenceMatch[1].trim();
                    const content = recItem.substring(title.length).trim();
                    recommendations.push({
                      title: title,
                      content: content || recItem
                    });
                  } else {
                    // 都不匹配时使用默认标题
                    recommendations.push({
                      title: '推荐方案',
                      content: recItem
                    });
                  }
                }
              }
            }
          }
          
          result.recommendations = recommendations;
        } catch (err) {
          console.error('解析推荐内容时出错:', err);
        }
      }
      
      return result;
    },

    // 更新addMessage方法，与addSystemMessage保持一致
    addMessage(content, type = 'system') {
      const time = this.formatTime(new Date());
      const id = Date.now().toString();
      
      // 处理消息格式化
      let processedContent = content;
      let recommendations = [];
      
      if (type === 'system') {
        // 对系统消息进行格式化处理
        const { formattedContent, recommendations: recs } = this.formatMessageContent(
          content, 
          this.data.toolConfig.type
        );
        processedContent = formattedContent;
        recommendations = recs;
      }
      
      const message = {
        id,
        type,
        content: processedContent,
        recommendations,
        time,
        isAction: type === 'action'
      };
      
      const messages = [...this.data.messages, message];
      this.setData({
        messages,
        scrollToView: `msg_${id}`
      });
      
      // 保存消息历史
      wx.setStorage({
        key: this.data.storageKey,
        data: messages
      });
      
      return message;
    },

    // 记录工具使用
    recordToolUsage() {
      // 获取当前工具信息
      const { toolName, toolType } = this.properties.toolConfig;
      
      // 检查wx对象和getCurrentInstance是否可用
      const page = getCurrentPages()[getCurrentPages().length - 1];
      
      // 如果在index页或有navigateBack，记录工具使用
      if (page && page.route && page.route.includes('index')) {
        if (page.recordToolUse && typeof page.recordToolUse === 'function') {
          page.recordToolUse(toolName, `/pages/${toolType}/chat`);
        }
      } else {
        // 如果不在index页，尝试调用全局方法或存储到本地
        try {
          const indexPage = getCurrentPages().find(p => p.route && p.route.includes('index/index'));
          if (indexPage && indexPage.recordToolUse) {
            indexPage.recordToolUse(toolName, `/pages/${toolType}/chat`);
          } else {
            // 本地存储记录，下次进入首页时可以读取
            const now = new Date();
            // 格式化日期和时间，精确到分钟
            const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            // 获取现有记录
            let recentTools = wx.getStorageSync('recentToolsUsage') || [];
            
            const newTool = {
              id: Date.now(),
              name: toolName,
              date: dateStr,
              path: `/pages/${toolType}/chat`,
              timestamp: now.getTime() // 添加时间戳
            };
            
            // 添加新记录到列表开头
            recentTools.unshift(newTool);
            
            // 限制最多保存5条
            if (recentTools.length > 5) {
              recentTools = recentTools.slice(0, 5);
            }
            
            // 保存到本地存储
            wx.setStorageSync('recentToolsUsage', recentTools);
            
            console.log(`使用工具: ${toolName}, 路径: /pages/${toolType}/chat, 时间: ${dateStr}, 时间戳: ${now.getTime()}`);
          }
        } catch (err) {
          console.error('记录工具使用失败:', err);
        }
      }
    }
  }
}) 
