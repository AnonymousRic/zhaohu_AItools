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
    requestStatusKey: '', // 存储请求状态的键名
    backgroundJobKey: '', // 存储后台任务状态的键名
    isStopping: false, // 标记请求取消中状态
    requestTask: null, // 存储当前请求任务，用于取消
    isBackgroundProcessing: false, // 标记是否有后台处理中的任务
    hasNewResponse: false, // 标记是否有新响应但页面未展示
    pageVisible: true // 标记页面是否可见
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
      this.backgroundJobKey = `background_job_${toolId}`;
      
      // 检查是否是从历史记录打开的对话
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const isFromHistory = currentPage && currentPage.options && currentPage.options.historyId;
      
      // 如果不是从历史记录打开，则清除之前的消息
      if (!isFromHistory) {
        // 清除本地存储的消息
        wx.removeStorage({
          key: this.storageKey,
          complete: () => {
            console.log('首次进入工具，清除之前的消息');
            
            // 初始化消息数组为空
            this.setData({
              messages: []
            });
            
            // 添加欢迎消息
            this.addSystemMessage(this.properties.toolConfig.welcomeMessage);
          }
        });
      } else {
      // 检查是否有未完成的请求
      this.checkPendingRequests();
        
        // 检查是否有后台任务完成但未显示的消息
        this.checkBackgroundJobs();
      
      // 尝试从存储中恢复消息和结果数据
      this.loadMessagesFromStorage();
      
      // 如果没有恢复到任何消息，则添加欢迎消息
      if (this.data.messages.length === 0) {
        this.addSystemMessage(this.properties.toolConfig.welcomeMessage);
      }
      }
      
      // 初始化页面可见性状态
      this.pageVisible = true;
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
    show: function() {
      // 页面显示时，将页面可见性标记为true
      this.pageVisible = true;
      
      // 页面显示时，检查是否有后台任务完成
      this.checkBackgroundJobs();
    },
    
    hide: function() {
      // 页面隐藏时，将页面可见性标记为false
      this.pageVisible = false;
      
      // 页面隐藏时保存状态
      this.saveMessagesToStorage();
    },
    
    unload: function() {
      // 页面卸载时保存状态
      this.saveMessagesToStorage();
    }
  },

  methods: {
    // 检查后台任务状态
    checkBackgroundJobs: function() {
      try {
        const backgroundJob = wx.getStorageSync(this.backgroundJobKey);
        
        if (backgroundJob && backgroundJob.completed) {
          // 添加AI响应消息
          if (backgroundJob.response) {
            // 确保response是字符串
            let responseContent = backgroundJob.response;
            if (typeof responseContent !== 'string') {
              try {
                responseContent = JSON.stringify(responseContent);
              } catch (e) {
                responseContent = '收到响应，但格式无法显示';
                console.error('响应内容无法转换为字符串:', e);
              }
            }
            
            // 检查是否是系统格式消息
            if (responseContent && responseContent.trim().startsWith('{') && responseContent.trim().endsWith('}')) {
              try {
                const jsonData = JSON.parse(responseContent);
                // 如果是系统格式消息(如generate_answer_finish)，不显示
                if (jsonData.msg_type === 'generate_answer_finish') {
                  console.warn('检测到系统格式消息，尝试从原始响应中提取用户内容');
                  
                  // 尝试从原始响应中提取用户可读内容
                  if (backgroundJob.originalResponse) {
                    const events = backgroundJob.originalResponse.split('\n\n').filter(event => event.trim());
                    let extractedContent = '';
                    
                    // 直接提取所有delta事件的内容
                    for (const event of events) {
                      if (event.includes('event: conversation.message.delta')) {
                        const dataMatch = event.match(/data:\s*(.*)/);
                        if (dataMatch && dataMatch[1]) {
                          try {
                            const eventData = JSON.parse(dataMatch[1]);
                            if (eventData.content && typeof eventData.content === 'string') {
                              extractedContent += eventData.content;
                            }
                          } catch (e) {}
                        }
                      }
                    }
                    
                    if (extractedContent && extractedContent.length > 0) {
                      // 使用提取的内容替代系统消息
                      responseContent = extractedContent;
                      this.addSystemMessage(extractedContent);
                      
                      // 找到最后一条用户消息并记录对话
                      const lastUserMessage = this.findLastUserMessage();
                      if (lastUserMessage) {
                        this.recordChatConversation(lastUserMessage.content, extractedContent);
                      }
                      
                      // 继续处理结果数据部分
                      if (backgroundJob.resultData) {
                        this.setData({
                          resultData: backgroundJob.resultData
                        });
                      }
                      
                      // 发送完成通知
                      this.sendNotification(backgroundJob.toolName || '您的请求', false);
                      
                      // 重置状态并清除任务
                      this.setData({
                        loading: false,
                        isBackgroundProcessing: false
                      });
                      
                      // 清除后台任务状态
                      wx.removeStorage({
                        key: this.backgroundJobKey
                      });
                      
                      return;
                    }
                  }
                  
                  console.warn('忽略系统格式消息');
                  this.addSystemMessage('处理已完成，但未返回内容');
                  
                  // 发送完成通知
                  this.sendNotification(backgroundJob.toolName || '您的请求', false);
                  
                  // 重置状态
                  this.setData({
                    loading: false,
                    isBackgroundProcessing: false
                  });
                  // 清除后台任务状态
                  wx.removeStorage({
                    key: this.backgroundJobKey
                  });
                  return;
                }
              } catch (e) {
              }
            }
            
            // 添加系统消息
            this.addSystemMessage(responseContent);
            
            // 找到最后一条用户消息
            const lastUserMessage = this.findLastUserMessage();
            if (lastUserMessage) {
              // 记录对话到聊天历史
              this.recordChatConversation(lastUserMessage.content, responseContent);
            }
            
            // 重置加载和处理状态
            this.setData({
              loading: false,
              isBackgroundProcessing: false
            });
            
            // 如果有结构化数据，则处理
            if (backgroundJob.resultData) {
              this.setData({
                resultData: backgroundJob.resultData
              });
              
              // 保存结果数据
              wx.setStorage({
                key: this.resultStorageKey,
                data: backgroundJob.resultData
              });
              
              // 处理结果导航逻辑
              const { resultConfig } = this.properties.toolConfig;
              
              // 如果需要确认跳转到结果页
              if (resultConfig && resultConfig.needConfirm) {
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
              } else if (resultConfig && resultConfig.resultPage) {
                // 直接跳转到结果页面
                setTimeout(() => {
                  this.navigateToResult();
                }, 1000);
              }
            }
            
            // 发送通知
            this.sendNotification(backgroundJob.toolName || '您的请求', false);
            
            // 清除后台任务状态
            wx.removeStorage({
              key: this.backgroundJobKey
            });
          } else if (backgroundJob.error) {
            // 如果有错误消息
            this.addSystemMessage(`处理失败: ${backgroundJob.error}`);
            
            // 重置状态
            this.setData({
              loading: false,
              isBackgroundProcessing: false
            });
            
            // 发送错误通知
            this.sendNotification(backgroundJob.toolName || '您的请求', true);
            
            // 清除后台任务状态
            wx.removeStorage({
              key: this.backgroundJobKey
            });
          } else if (backgroundJob.isCancelled) {
            // 处理用户主动取消的情况
            // 重置状态 - 大部分情况下已经在stopRequest中处理，这里是为了防止页面重新打开时的处理
            this.setData({
              loading: false,
              isBackgroundProcessing: false
            });
            
            // 清除后台任务状态
            wx.removeStorage({
              key: this.backgroundJobKey
            });
          } else {
            // 没有响应也没有错误，回显通用消息
            this.addSystemMessage('任务已完成，但未返回结果');
            
            // 重置状态
            this.setData({
              loading: false,
              isBackgroundProcessing: false
            });
            
            // 发送通知
            this.sendNotification(backgroundJob.toolName || '您的请求', false);
            
            // 清除后台任务状态
            wx.removeStorage({
              key: this.backgroundJobKey
            });
          }
        } else if (backgroundJob && backgroundJob.processing) {
          // 如果任务仍在处理中，更新状态
          console.log('后台任务正在处理中');
          this.setData({
            isBackgroundProcessing: true
          });
          
          // 检查任务是否超时
          const now = Date.now();
          const taskStartTime = backgroundJob.timestamp || 0;
          const elapsedTime = now - taskStartTime;
          
          // 如果任务处理时间超过5分钟(300000毫秒)，认为超时
          if (elapsedTime > 300000) {
            console.log('后台任务处理超时');
            
            // 添加超时消息
            this.addSystemMessage('处理超时，请重试');
            
            // 重置状态
            this.setData({
              loading: false,
              isBackgroundProcessing: false
            });
            
            // 发送错误通知
            this.sendNotification(backgroundJob.toolName || '您的请求', true);
            
            // 清除后台任务状态
            wx.removeStorage({
              key: this.backgroundJobKey
            });
          }
        }
      } catch (error) {
        console.error('检查后台任务失败:', error);
      }
    },
    
    // 发送消息
    sendMessage: function() {
      // 如果正在加载状态，则尝试停止请求
      if (this.data.loading) {
        this.stopRequest();
        return;
      }
      
      if (!this.data.inputValue.trim()) return;
      
      // 在用户点击发送时，请求订阅消息权限（利用用户点击行为）
      this.requestSubscribePermission();
      
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
      
      // 添加系统提示，告知用户可以离开页面
      const processingMessage = {
        id: Date.now().toString() + '_processing',
        type: 'system',
        content: '您的需求已收到，正在处理中。您可以离开此页面使用小程序的其他功能，处理完成后会通知您。',
        time: this.formatTime(new Date())
      };
      
      this.setData({
        messages: [...this.data.messages, processingMessage],
        scrollToView: 'msg_' + processingMessage.id
      });
      
      // 保存消息到本地存储
      this.saveMessagesToStorage();
      
      // 调用API
      this.callAPI(userMessage.content);
    },

    // 重置聊天
    resetChat: function() {
      this.setData({
        messages: [],
        inputValue: '',
        loading: false,
        resultData: null,
        isBackgroundProcessing: false
      });
      
      // 清除后台任务状态
      wx.removeStorage({
        key: this.backgroundJobKey
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
      
      // 删除调试消息
      // console.log("准备调用API，输入:", userInput);
      
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
      
      // 设置后台任务状态
      const backgroundJob = {
          requestId: requestId,
          timestamp: Date.now(),
          userInput: userInput,
        toolType: this.properties.toolConfig.type,
        toolName: this.properties.toolConfig.title,
        completed: false,
        processing: true,
          lastMessage: this.data.messages.length > 0 ? this.data.messages[this.data.messages.length - 1] : null
      };
      
      wx.setStorage({
        key: this.backgroundJobKey,
        data: backgroundJob
      });
      
      // 设置后台处理状态
      this.setData({
        isBackgroundProcessing: true
      });
      
      // 将当前状态保存到本地存储
      this.saveMessagesToStorage();
      
      // 发送请求并保存请求任务引用
      const requestTask = wx.request({
        url: apiConfig.url,
        method: apiConfig.method || 'POST',
        header: {
          'Authorization': `Bearer ${apiConfig.authToken}`,
          'Content-Type': 'application/json'
        },
        data: requestData,
        timeout: 300000, // 增加到5分钟超时
        responseType: apiConfig.responseType || 'text', // 确保返回文本而不是JSON，因为SSE是文本格式
        success: (res) => {
          // 如果已被停止，则不处理响应
          if (this.data.isStopping) {
            // 删除调试日志
            // console.log('请求已手动停止，忽略响应');
            return;
          }
          
          // 删除调试日志
          // console.log("API响应完整数据:", JSON.stringify(res));
          
          // 检查这个响应是否是最新的请求
          if (this.currentRequestId !== requestId) {
            // 删除调试日志
            // console.log('收到旧请求的响应，忽略');
            return;
          }
          
          // 处理API响应
          let responseContent = '';
          let resultData = null;
          
          try {
            if (apiConfig.isSSE) {
              // 处理SSE响应
              const sseResult = this.handleSSEResponse(res.data, true);
              responseContent = sseResult.message;
              resultData = sseResult.resultData;
              
              // 检查是否是系统格式消息，如果是则不保存
              if (responseContent && responseContent.trim().startsWith('{') && responseContent.trim().endsWith('}')) {
                try {
                  const jsonData = JSON.parse(responseContent);
                  // 如果是系统格式消息(如generate_answer_finish)，不保存为响应内容
                  if (jsonData.msg_type === 'generate_answer_finish') {
                    console.warn('忽略系统格式化消息作为响应内容');
                    
                    // 使用handleSSEResponse提取的用户可读内容
                    if (sseResult.userDeltaContent && sseResult.userDeltaContent.length > 0) {
                      // 删除调试日志
                      // console.log(`使用提取的用户内容 (${sseResult.userDeltaContent.length}字符)`);
                      responseContent = sseResult.userDeltaContent;
                    } else {
                      responseContent = null;
                    }
                  }
                } catch (e) {
                  // 删除调试日志
                  // console.log('响应不是有效的JSON格式，保留原始内容');
                }
              }
              
              // 如果处理后没有有效内容，直接终止
              if (!responseContent) {
                console.warn('没有提取到有效消息内容，取消更新后台任务');
                return;
              }
            } else {
              // 处理普通JSON响应
              responseContent = this.extractResponseMessage(res.data);
              resultData = this.extractResultData(res.data);
            }
          } catch (error) {
            console.error('处理API响应失败:', error);
            responseContent = '处理响应时发生错误，但已收到服务器回复。';
          }
          
          // 更新后台任务状态为已完成
          const updatedJob = {
            ...backgroundJob,
            completed: true,
            processing: false,
            timestamp: Date.now(),
            response: responseContent || '处理完成，但未返回结果',
            resultData: resultData,
            originalResponse: apiConfig.isSSE ? res.data : null // 保存原始SSE响应数据
          };
          
          wx.setStorage({
            key: this.backgroundJobKey,
            data: updatedJob
          });
          
          // 如果页面当前可见，则更新UI
          if (this.pageVisible) {
            this.checkBackgroundJobs();
          } else {
            // 发送通知
            this.sendNotification(updatedJob.toolName || '您的请求', false);
          }
          
          // 清除请求状态
          wx.removeStorage({ 
            key: this.requestStatusKey,
            success: () => {
              // 删除调试日志
              // console.log('请求已完成，状态已清除')
            }
          });
        },
        fail: (error) => {
          // 如果是主动取消，不显示错误消息
          if (this.data.isStopping) {
            // 删除调试日志
            // console.log('请求已手动停止，不显示错误');
            return;
          }
          
          // 检查是否为abort操作（用户主动中止）
          if (error.errMsg && error.errMsg.indexOf('abort') !== -1) {
            console.log('用户主动中止请求');
            
            // 更新后台任务状态为已完成但不是错误
            const updatedJob = {
              ...backgroundJob,
              completed: true,
              processing: false,
              timestamp: Date.now(),
              response: '请求已停止',
              isCancelled: true // 标记为用户主动取消
            };
            
            wx.setStorage({
              key: this.backgroundJobKey,
              data: updatedJob
            });
            
            // 移除添加消息的代码，因为stopRequest函数已经添加了相同的消息
            // 只需重置状态即可
            if (this.pageVisible) {
              this.setData({ loading: false, isBackgroundProcessing: false });
            }
            
            // 清除请求状态
            wx.removeStorage({ 
              key: this.requestStatusKey,
              success: () => {
                // 删除调试日志
                // console.log('请求已完成，状态已清除')
              }
            });
            
            return;
          }
          
          console.error('API请求失败:', error);
          
          // 更新后台任务状态为失败
          const updatedJob = {
            ...backgroundJob,
            completed: true,
            processing: false,
            timestamp: Date.now(),
            response: '很抱歉，处理您的请求时遇到了问题，请稍后再试。',
            error: error.message || '未知错误'
          };
          
          wx.setStorage({
            key: this.backgroundJobKey,
            data: updatedJob
          });
          
          // 如果页面当前可见，则更新UI
          if (this.pageVisible) {
            this.addSystemMessage('很抱歉，处理您的请求时遇到了问题，请稍后再试。');
            this.setData({ loading: false, isBackgroundProcessing: false });
          } else {
            // 发送通知
            this.sendNotification(updatedJob.toolName || '您的请求', true);
          }
          
          // 清除请求状态
          wx.removeStorage({ 
            key: this.requestStatusKey,
            success: () => {
              // 删除调试日志
              // console.log('请求已完成，状态已清除')
            }
          });
        }
      });
      
      // 保存请求任务引用，用于取消
      this.setData({
        requestTask 
      });
    },

    // 发送通知
    sendNotification: function(toolName, isError = false) {
      // 使用微信通知 API 发送通知
      // 删除调试日志
      // console.log(`准备发送${isError ? '错误' : '完成'}通知: ${toolName}`);
      
      // 消息内容
      const title = isError ? '处理遇到问题' : '处理已完成';
      const message = isError ? 
        `很抱歉，${toolName}处理过程中遇到了问题，请点击查看详情。` : 
        `${toolName}已处理完成，请点击查看结果。`;
      
      // 首先检查是否已经获取了发送订阅消息的权限
      this.checkAndSendSubscribeMessage(toolName, isError);
    },
    
    // 检查是否有权限并发送订阅消息
    checkAndSendSubscribeMessage: function(toolName, isError = false) {
      // 检查用户是否已授权订阅消息
      const hasPermission = wx.getStorageSync('hasSubscribeMessagePermission');
      // 删除调试日志
      // console.log('用户订阅消息权限状态:', hasPermission);
      
      // 如果用户已授权，直接发送订阅消息
      if (hasPermission) {
        this.sendSubscribeMessage(toolName, isError);
        return;
      }
      
      // 如果用户未授权或授权状态未知，我们无法在后台任务完成时请求权限
      // 因为requestSubscribeMessage必须由用户点击触发
      // 删除调试日志
      // console.log('用户尚未授权订阅消息或授权状态未知，无法发送通知');
      
      // 记录此次尝试，下次用户与页面交互时可以再次请求
      wx.setStorageSync('shouldRequestPermissionNextTime', true);
    },
    
    // 实际发送订阅消息
    sendSubscribeMessage: function(toolName, isError = false) {
      const now = new Date();
      const formattedTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const status = isError ? '处理失败' : '处理完成';
      
      // 调用云函数发送订阅消息
      // 注意：微信小程序需要通过云函数或服务端发送订阅消息
      // 这里我们需要添加云函数调用，或者通过自己的服务器发送
      // 删除调试日志
      // console.log('准备发送订阅消息，数据:', {
      //   thing7: { value: toolName },
      //   time10: { value: formattedTime },
      //   phrase5: { value: status }
      // });
      
      // 如果有云函数
      if (wx.cloud && wx.cloud.callFunction) {
        wx.cloud.callFunction({
          name: 'sendSubscribeMessage',
          data: {
            templateId: 'bFGSlc6zR4QOHx5QVeP5OtCiwIlTIHcY8S0qXw_o8Zw',
            data: {
              thing7: { value: toolName },
              time10: { value: formattedTime },
              phrase5: { value: status }
            }
          },
          success: res => {
            // 删除调试日志
            // console.log('订阅消息发送成功:', res);
          },
          fail: err => {
            console.error('订阅消息发送失败:', err);
          }
        });
      } else {
        // 删除调试日志
        // console.log('云函数未初始化，无法发送订阅消息');
        // 这里可以添加备选的消息发送方式，如调用自己的API服务器
      }
    },

    // 处理API响应
    handleApiResponse: function(res, isBackgroundProcessing = false) {
      // 删除调试日志
      // console.log("处理API响应", res);
      
      // 如果响应不存在或为空，直接返回
      if (!res || !res.data) {
        this.addSystemMessage('服务器返回了空响应');
        return {
          message: '服务器返回了空响应',
          resultData: null
        };
      }
      
      // 处理SSE响应
      if ((res.header && res.header['content-type'] && res.header['content-type'].includes('text/event-stream')) 
          || (this.properties.toolConfig.apiConfig && this.properties.toolConfig.apiConfig.isSSE)) {
        // 删除调试日志
        // console.log("检测到SSE响应");
        return this.handleSSEResponse(res.data, isBackgroundProcessing);
      }
      
      // 处理常规JSON响应
      try {
        // 如果是字符串，尝试解析为JSON
        let data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        
        // 提取消息内容
        let messageContent = this.extractResponseMessage(data);
        
        // 提取结构化数据（如果有）
        let resultData = this.extractResultData(data);
        
        // 如果不是后台处理，则直接添加消息到界面
        if (!isBackgroundProcessing) {
          this.addSystemMessage(messageContent);
          
          // 如果有结构化数据，保存
      if (resultData) {
        this.setData({
          resultData: resultData
        });
        
            // 保存结果数据
        wx.setStorage({
          key: this.resultStorageKey,
          data: resultData
        });
          }
        }
        
        return {
          message: messageContent,
          resultData: resultData
        };
      } catch (error) {
        console.error('解析API响应失败:', error);
        
        // 如果解析失败，但响应是字符串，则显示原始字符串
        if (typeof res.data === 'string') {
          const message = '接收到的响应无法解析为结构化数据，显示原始内容：\n' + res.data.substring(0, 300) + (res.data.length > 300 ? '...(已截断)' : '');
          
          if (!isBackgroundProcessing) {
            this.addSystemMessage(message);
          }
          
          return {
            message: message,
            resultData: null
          };
        } else {
          const message = '接收到的响应无法解析为结构化数据，且不是文本格式。';
          
          if (!isBackgroundProcessing) {
            this.addSystemMessage(message);
          }
          
          return {
            message: message,
            resultData: null
          };
        }
      }
    },
    
    // 处理SSE格式的响应
    handleSSEResponse: function(sseData, isBackgroundProcessing = false) {
      // 移除调试日志: console.log("处理SSE响应");
      
      if (!sseData) {
        const message = '接收到空的SSE响应';
        if (!isBackgroundProcessing) {
          this.addSystemMessage(message);
        }
        return {
          message: message,
          resultData: null
        };
      }
      
      // 用于存储完整的响应消息
      let completeMessage = '';
      // 用于存储有效的用户可读消息内容
      let userReadableMessage = '';
      // 记录是否找到了完整消息
      let foundCompleteMessage = false;
      // 用于存储结构化数据
      let resultData = null;
      // 记录是否找到错误
      let foundError = false;
      
      try {
        // 将SSE数据分割为事件
        const events = sseData.split('\n\n').filter(event => event.trim());
        // 移除调试日志: console.log(`SSE响应包含${events.length}个事件`);
        
        // 提前提取所有delta事件的内容作为备用
        let allDeltaContent = '';
        for (const event of events) {
          if (event.includes('event: conversation.message.delta')) {
            const dataMatch = event.match(/data:\s*(.*)/);
            if (dataMatch && dataMatch[1]) {
              try {
                const eventData = JSON.parse(dataMatch[1]);
                if (eventData.content && typeof eventData.content === 'string') {
                  allDeltaContent += eventData.content;
                }
              } catch (e) {}
            }
          }
        }
        
        // 移除调试日志
        if (allDeltaContent) {
          // 移除调试日志: console.log(`预先收集到${allDeltaContent.length}字符的增量内容`);
          userReadableMessage = allDeltaContent;
        }
        
        for (const event of events) {
          // 解析事件数据
          const lines = event.split('\n');
          let eventName = '';
          let eventData = '';
          
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              eventData = line.substring(5).trim();
            }
          }
          
          // 移除调试日志
          // if (eventName) {
          //   console.log(`处理SSE事件: ${eventName}`);
          // }
          
          // 处理错误事件
          if (eventName === 'conversation.chat.failed') {
            foundError = true;
            // 保留错误相关日志: console.log('发现错误事件');
              continue;
            }
            
          // 移除调试日志
          // if (eventName === 'conversation.message.completed') {
          //   console.log('消息完成事件');
          // }
          
          // 只处理有效的事件数据
          if (eventData) {
            try {
              const data = JSON.parse(eventData);
              
              // 处理不同类型的事件
              if (eventName === 'conversation.message.delta' && data.content) {
                // 移除调试日志: console.log(`收到增量内容: ${data.content.length}字符`);
                completeMessage += data.content;
                // 同时更新用户可读内容
                userReadableMessage += data.content;
                // 移除调试日志: console.log(`累积用户可读内容: ${userReadableMessage.length}字符`);
              } else if (eventName === 'conversation.message.completed' && data.content) {
                // 移除调试日志: console.log(`收到完整消息: ${data.content.length}字符`);
                
                // 检查新接收的内容是否为系统格式消息
                if (data.content.trim().startsWith('{') && data.content.trim().endsWith('}')) {
                  try {
                    const jsonData = JSON.parse(data.content);
                    // 如果是系统格式消息且已有累积内容，不覆盖之前累积的内容
                    if (jsonData.msg_type === 'generate_answer_finish' && userReadableMessage.length > 0) {
                      // 移除调试日志: console.log(`检测到系统格式消息，保留已累积的${userReadableMessage.length}字符用户内容`);
                      // 不更新completeMessage和userReadableMessage，保留之前累积的内容
                    } else {
                      completeMessage = data.content;
                      userReadableMessage = data.content;
                      foundCompleteMessage = true;
                      // 移除调试日志: console.log(`设置完整消息，用户可读内容长度: ${userReadableMessage.length}字符`);
                    }
                  } catch (e) {
                    // 如果解析失败，则不是有效的JSON，仍然按普通内容处理
                    completeMessage = data.content;
                    userReadableMessage = data.content;
                    foundCompleteMessage = true;
                    // 移除调试日志: console.log(`设置完整消息，用户可读内容长度: ${userReadableMessage.length}字符`);
                  }
                } else {
                  // 普通文本内容，直接覆盖
                  completeMessage = data.content;
                  userReadableMessage = data.content;
                  foundCompleteMessage = true;
                  // 移除调试日志: console.log(`设置完整消息，用户可读内容长度: ${userReadableMessage.length}字符`);
                }
              } else if (eventName === 'conversation.data' && data.data) {
                // 结构化数据
                // 移除调试日志: console.log('收到结构化数据');
                resultData = data.data;
              } else if (data.role === 'assistant' && data.type === 'answer' && data.content) {
                // 处理标准回复
                // 移除调试日志: console.log('收到assistant标准回复');
                completeMessage = data.content;
                // 同时更新用户可读内容
                userReadableMessage = data.content;
                foundCompleteMessage = true;
                // 移除调试日志: console.log(`设置answer消息，用户可读内容长度: ${userReadableMessage.length}字符`);
              } else if (data.role === 'assistant' && data.type === 'verbose' && data.content) {
                // 处理verbose类型消息，可能包含JSON格式数据
                // 移除调试日志: console.log('收到verbose消息');
                try {
                  const verboseData = JSON.parse(data.content);
                  // 移除调试日志: console.log('解析verbose数据类型:', verboseData.msg_type || 'unknown');
                  
                  // 忽略generate_answer_finish类型的消息，这不是真正的内容
                  if (verboseData.msg_type === 'generate_answer_finish') {
                    // 移除调试日志: console.log('跳过generate_answer_finish类型消息');
                    continue;
                  }
                    
                    // 检查是否包含推荐结果数据
                    if (verboseData.data && typeof verboseData.data === 'string') {
                      try {
                      // 检查是否包含project或venue关键词
                        if (verboseData.data.includes('projects') || verboseData.data.includes('venues')) {
                          const parsedResultData = JSON.parse(verboseData.data);
                          
                        // 检查是否包含项目数据
                          if (parsedResultData.projects && Array.isArray(parsedResultData.projects) && parsedResultData.projects.length > 0) {
                            resultData = parsedResultData.projects;
                          // 移除调试日志: console.log('找到项目数据:', resultData.length);
                        } 
                        // 检查是否包含载体数据
                        else if (parsedResultData.venues && Array.isArray(parsedResultData.venues) && parsedResultData.venues.length > 0) {
                            resultData = parsedResultData.venues;
                          // 移除调试日志: console.log('找到载体数据:', resultData.length);
                          }
                        }
                      } catch (e) {
                      console.warn('解析结果数据失败:', e.message);
                      }
                    }
                  } catch (e) {
                  console.warn('解析verbose content失败:', e.message);
                }
              } else if (data.error) {
                const message = `服务器返回错误: ${data.error.message || '未知错误'}`;
                console.error('SSE错误:', message);
                if (!isBackgroundProcessing) {
                  this.addSystemMessage(message);
                }
                return {
                  message: message,
                  resultData: null
                };
              } else if (data.role === 'assistant' && data.content) {
                // 处理其他包含content的assistant消息
                // 移除调试日志: console.log(`处理其他assistant消息`);
                if (typeof data.content === 'string' && data.content.trim()) {
                  completeMessage += data.content;
                  // 同时更新用户可读内容
                  userReadableMessage += data.content;
                  // 移除调试日志: console.log(`累积其他assistant消息，用户可读内容长度: ${userReadableMessage.length}字符`);
                }
              }
            } catch (parseError) {
              console.warn('解析事件数据JSON失败:', parseError.message);
              // 移除详细输出
              // console.warn('原始事件数据:', eventData.substring(0, 100) + (eventData.length > 100 ? '...' : ''));
              
              // 获取错误信息
              if (foundCompleteMessage && eventData.trim()) {
                try {
                  const errorData = JSON.parse(eventData);
                  if (errorData.code && errorData.msg) {
                    const errorMessage = `API错误: ${errorData.msg} (${errorData.code})`;
                    console.error('API错误:', errorData);
                    if (!isBackgroundProcessing) {
                      this.addSystemMessage(errorMessage);
                    }
                    return {
                      message: errorMessage,
                      resultData: null
                    };
                }
              } catch (e) {
                  console.error('解析错误信息失败:', e);
                }
              }
            }
          }
        }
        
        // 使用最后收集的内容
        let finalMessage = foundCompleteMessage ? completeMessage : userReadableMessage;
        
        // 如果finalMessage是系统消息，直接使用预先收集的delta内容
        if (finalMessage && finalMessage.trim().startsWith('{') && finalMessage.trim().endsWith('}')) {
          try {
            const jsonData = JSON.parse(finalMessage);
            if (jsonData.msg_type === 'generate_answer_finish') {
              // 移除调试日志: console.log('最终消息是系统格式消息，使用已预先收集的增量内容');
              if (allDeltaContent && allDeltaContent.length > 0) {
                // 移除调试日志: console.log(`使用预先收集的${allDeltaContent.length}字符内容作为最终结果`);
                finalMessage = allDeltaContent;
              } else {
                return {
                  message: '未能获取有效的回复内容',
                  resultData: resultData
                };
              }
          }
        } catch (e) {
            // 移除调试日志: console.log('最终消息不是有效的JSON格式，保留原始内容');
          }
        }
        
        // 验证最终消息是否是系统格式消息
        if (finalMessage && finalMessage.trim().startsWith('{') && finalMessage.trim().endsWith('}')) {
          try {
            const jsonData = JSON.parse(finalMessage);
            if (jsonData.msg_type === 'generate_answer_finish') {
              console.warn('最终消息仍然是系统格式消息，检查是否有累积内容');
              
              // 如果已有预先收集的delta内容
              if (allDeltaContent && allDeltaContent.length > 0) {
                // 移除调试日志: console.log(`使用预先收集的delta内容 (${allDeltaContent.length}字符)`);
                return {
                  message: allDeltaContent,
                  resultData: resultData,
                  userDeltaContent: allDeltaContent // 传递预先收集的delta内容
                };
              }
              
              // 如果没有内容，返回默认消息
              return {
                message: '未能获取有效的回复内容',
                resultData: resultData
              };
            }
          } catch (e) {
            // 如果不是有效JSON，就保留现有内容
          }
        }
        
        // 移除调试日志
        // console.log(`最终消息内容(${finalMessage.length}字符):`, 
        //            finalMessage.substring(0, 100) + (finalMessage.length > 100 ? '...' : ''));
        
        // 如果有解析到消息
        if (finalMessage) {
      // 找到最后一条用户消息
      const lastUserMessage = this.findLastUserMessage();
          if (lastUserMessage && !isBackgroundProcessing) {
        // 记录对话到聊天历史
            this.recordChatConversation(lastUserMessage.content, finalMessage);
      }
      
          if (!isBackgroundProcessing) {
            // 添加系统消息
            this.addSystemMessage(finalMessage);
      
            // 如果有结构化数据，保存
            if (resultData) {
        this.setData({
          resultData: resultData
        });
        
              // 保存结果数据
        wx.setStorage({
          key: this.resultStorageKey,
                data: resultData
        });
              
              // 处理结果展示逻辑
              const { resultConfig } = this.properties.toolConfig;
        
        // 如果需要确认跳转到结果页
              if (resultConfig && resultConfig.needConfirm) {
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
              } else if (resultConfig && resultConfig.resultPage) {
          // 直接跳转到结果页面
          setTimeout(() => {
            this.navigateToResult();
          }, 1000);
        }
            }
          }
          
          return {
            message: finalMessage,
            resultData: resultData,
            userDeltaContent: allDeltaContent // 传递预先收集的delta内容
          };
        } else {
          const message = '无法从服务器响应中解析出有效的消息内容';
          if (!isBackgroundProcessing) {
            this.addSystemMessage(message);
          }
          return {
            message: message,
            resultData: null
          };
        }
      } catch (error) {
        console.error('解析SSE响应失败:', error);
        const message = '解析服务器响应时发生错误: ' + error.message;
        if (!isBackgroundProcessing) {
          this.addSystemMessage(message);
        }
        return {
          message: message,
          resultData: null
        };
      }
    },
    
    // 从响应数据中提取消息内容
    extractResponseMessage: function(data) {
      // 根据API响应格式提取消息内容
      if (data.message) {
        return data.message;
      } else if (data.content) {
        return data.content;
      } else if (data.response) {
        return data.response;
      } else if (data.assistant && data.assistant.message) {
        return data.assistant.message;
      } else if (data.result && data.result.message) {
        return data.result.message;
      } else if (data.text) {
        return data.text;
      } else if (typeof data === 'string') {
        return data;
      }
      
      // 如果无法提取消息，返回默认消息
      return '收到响应，但无法提取消息内容';
    },
    
    // 从响应数据中提取结构化数据
    extractResultData: function(data) {
      // 根据API响应格式提取结构化数据
      if (data.data) {
        return data.data;
      } else if (data.result && data.result.data) {
        return data.result.data;
      } else if (data.structured_data) {
        return data.structured_data;
      } else if (data.assistant && data.assistant.data) {
        return data.assistant.data;
      }
      
      // 如果没有结构化数据，返回null
      return null;
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
      // 从配置中获取工具名称和类型
      // 如果toolName或toolType不存在，使用title和type作为替代
      let { toolName, toolType, title, type } = this.properties.toolConfig;
      
      // 确保有正确的值：优先使用toolName/toolType，否则使用title/type
      const chatToolName = toolName || title || '聊天工具';
      const chatToolType = toolType || type || 'chat';
      
      // 移除错误提示，改为使用默认值
      if (!toolName || !toolType) {
        console.log('工具配置不完整，使用替代参数记录对话历史: ', chatToolName, chatToolType);
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
      const { formattedContent, recommendations, messageParts } = this.formatMessageContent(
        content,
        this.properties.toolConfig.type
      );
      
      // 检查是否有拆分的消息部分
      if (messageParts && messageParts.length > 0) {
        // 如果有拆分的消息部分，分别添加每个部分作为独立消息
        messageParts.forEach(part => {
          if (part.type === 'text') {
            // 文本类型消息
            const message = {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
              type: 'system',
              content: part.content,
              time: this.formatTime(new Date())
            };
            
            this.setData({
              messages: [...this.data.messages, message],
              scrollToView: 'msg_' + message.id
            });
          } else if (part.type === 'card') {
            // 卡片类型消息
            const message = {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
              type: 'system',
              content: part.fullContent, // 完整内容用于复制
              time: this.formatTime(new Date()),
              isProjectCard: true, // 标记为项目卡片
              cardData: {
                title: part.title,
                publishTime: part.publishTime,
                details: part.details,
                reason: part.reason
              }
            };
            
            this.setData({
              messages: [...this.data.messages, message],
              scrollToView: 'msg_' + message.id
            });
          }
        });
        
        // 保存消息到本地存储
        this.saveMessagesToStorage();
        return;
      }
      
      // 如果没有拆分的消息部分，按原来的逻辑处理
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
      
      // 保存消息到本地存储
      this.saveMessagesToStorage();
    },
    
    // 添加系统消息（支持指定时间）
    addSystemMessageWithTime: function(content, timestamp) {
      // 处理消息格式化
      const { formattedContent, recommendations, messageParts } = this.formatMessageContent(
        content,
        this.properties.toolConfig.type
      );
      
      const formattedTime = this.formatTime(timestamp || new Date());
      
      // 检查是否有拆分的消息部分
      if (messageParts && messageParts.length > 0) {
        // 如果有拆分的消息部分，分别添加每个部分作为独立消息
        messageParts.forEach(part => {
          if (part.type === 'text') {
            // 文本类型消息
            const message = {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
              type: 'system',
              content: part.content,
              time: formattedTime
            };
            
            this.setData({
              messages: [...this.data.messages, message],
              scrollToView: 'msg_' + message.id
            });
          } else if (part.type === 'card') {
            // 卡片类型消息
            const message = {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
              type: 'system',
              content: part.fullContent, // 完整内容用于复制
              time: formattedTime,
              isProjectCard: true, // 标记为项目卡片
              cardData: {
                title: part.title,
                publishTime: part.publishTime,
                details: part.details,
                reason: part.reason
              }
            };
            
            this.setData({
              messages: [...this.data.messages, message],
              scrollToView: 'msg_' + message.id
            });
          }
        });
        
        // 保存消息到本地存储
        this.saveMessagesToStorage();
        return;
      }
      
      // 如果没有拆分的消息部分，按原来的逻辑处理
      const message = {
        id: Date.now().toString(),
        type: 'system',
        content: formattedContent, // 使用处理后的内容
        recommendations: recommendations,
        time: formattedTime
      };
      
      this.setData({
        messages: [...this.data.messages, message],
        scrollToView: 'msg_' + message.id
      });
      
      // 保存消息到本地存储
      this.saveMessagesToStorage();
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

    // 检查未完成的请求
    checkPendingRequests: function() {
      try {
        // 检查是否有未完成的请求
        const requestStatus = wx.getStorageSync(this.requestStatusKey);
        
        if (requestStatus && requestStatus.requestId) {
          console.log('检测到未完成的请求:', requestStatus);
          
          // 计算距离上次请求的时间（秒）
          const elapsedSecs = Math.floor((Date.now() - requestStatus.timestamp) / 1000);
          
          // 如果请求时间超过3分钟（180秒），认为已超时
          if (elapsedSecs > 180) {
            console.log('未完成的请求已超时，清除状态');
            
              // 清除请求状态
            wx.removeStorage({
              key: this.requestStatusKey
            });
            
            // 添加超时消息
            setTimeout(() => {
              this.addSystemMessage('检测到上次请求已超时，请重试');
            }, 500);
          } else {
            console.log(`未完成的请求距离现在 ${elapsedSecs} 秒，继续等待响应`);
            
            // 设置加载状态
            this.setData({
              loading: true
            });
            
            // 添加等待消息
            setTimeout(() => {
              this.addSystemMessage(`正在继续处理您之前的请求，已等待 ${elapsedSecs} 秒...`);
            }, 500);
          }
        }
        
        // 检查是否有后台任务
        const backgroundJob = wx.getStorageSync(this.backgroundJobKey);
        
        if (backgroundJob && !backgroundJob.completed && backgroundJob.processing) {
          console.log('检测到正在处理的后台任务:', backgroundJob);
          
          // 计算距离任务开始的时间（秒）
          const elapsedSecs = Math.floor((Date.now() - backgroundJob.timestamp) / 1000);
          
          // 如果任务时间超过3分钟（180秒），认为已超时
          if (elapsedSecs > 180) {
            console.log('后台任务已超时，清除状态');
            
            // 更新任务状态为超时
            const updatedJob = {
              ...backgroundJob,
              completed: true,
              processing: false,
              timestamp: Date.now(),
              response: '很抱歉，处理您的请求时超时，请稍后再试。',
              error: '处理超时'
            };
            
            wx.setStorage({
              key: this.backgroundJobKey,
              data: updatedJob
            });
            
            // 添加超时消息
            setTimeout(() => {
              this.addSystemMessage('检测到上次请求已超时，请重试');
            }, 500);
          } else {
            console.log(`后台任务距离现在 ${elapsedSecs} 秒，继续等待处理完成`);
            
            // 设置后台处理状态
            this.setData({
              isBackgroundProcessing: true
            });
            
            // 添加等待消息
            setTimeout(() => {
              this.addSystemMessage(`正在后台处理您的请求，已等待 ${elapsedSecs} 秒...您可以离开此页面使用其他功能，处理完成后会通知您。`);
            }, 500);
          }
        }
      } catch (e) {
        console.error('检查未完成请求失败:', e);
      }
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
        recommendations: [],
        // 新增字段，用于存储需要单独显示的消息部分
        messageParts: []
      };
      
      // Log the original content received by the function
      console.log("[formatMessageContent] Original content:", content);

      // 直接使用原始文本，不再替换Markdown格式
      let formattedText = content;
      
      // 已经更新了formattedText，赋值给结果
      result.formattedContent = formattedText;
      
      // 仅针对找项目和找载体处理推荐卡片和消息拆分
      if (toolType === 'findProject' || toolType === 'findVenue') {
        try {
          // 新增逻辑：检测并拆分包含多个方案的消息
          // 检查是否包含"方案1"、"方案2"、"方案3"的模式
          const hasMultipleSchemes = content.includes('方案1') && (content.includes('方案2') || content.includes('方案3'));

          if (hasMultipleSchemes) {
            // 前言部分：从开始到第一个"方案1"前
            const schemeStartIndex = content.indexOf('方案1');
            if (schemeStartIndex > 0) {
              const preface = content.substring(0, schemeStartIndex).trim();
              if (preface) {
                // 移除可能存在的###符号
                const cleanedPreface = preface.replace(/###/g, '').trim();
                console.log("[formatMessageContent] Preface:", cleanedPreface);
                result.messageParts.push({
                  type: 'text',
                  content: cleanedPreface
                });
              }
            }

            // 提取各个方案，使用改进的正则表达式
            const schemeRegex = /方案(\d+)[：:]\s*([^\n]+)(?:\n|$)([\s\S]*?)(?=(?:方案\d+[：:])|(?:注[：:])|(?:---)|$)/g;
            let match;
            let lastIndex = 0;

            console.log("[formatMessageContent] Start extracting schemes...");

            while ((match = schemeRegex.exec(content)) !== null) {
              const schemeNumber = match[1];
              const schemeTitle = match[2].trim();
              let schemeContent = match[3] ? match[3].trim() : '';

              console.log(`[formatMessageContent] Scheme ${schemeNumber} Title (raw):`, schemeTitle);
              console.log(`[formatMessageContent] Scheme ${schemeNumber} Content (raw):\\n${schemeContent}`);

              lastIndex = match.index + match[0].length;

              // 提取方案详细信息
              let publishTime = '';
              let details = '';
              let reason = '';

              // 提取发布时间 - 调整正则以匹配 "**发布时间**" 并使冒号可选
              const timeMatch = schemeContent.match(/\*\*发布时间\*\*[：:]?\s*([^\n]+)/);
              console.log(`[formatMessageContent] Scheme ${schemeNumber} - Time Match Result:`, timeMatch);
              if (timeMatch && timeMatch[1]) { 
                publishTime = timeMatch[1].trim();
                console.log(`[formatMessageContent] Scheme ${schemeNumber} - Extracted Publish Time:`, publishTime);
              }

              // 提取项目/载体详情 - 调整正则以匹配 "**项目详情**" 或 "**详情**" 或 "**载体详情**"
              const detailsRegex = /\*\*(?:项目详情|详情|载体详情)\*\*(?:[：:]|\s*)?([\s\S]*?)(?=\*\*(?:推荐理由|匹配原因|发布时间)\*\*|$)/;
              const detailsMatch = schemeContent.match(detailsRegex);
              console.log(`[formatMessageContent] Scheme ${schemeNumber} - Details Match Result:`, detailsMatch);
              if (detailsMatch && detailsMatch[1]) {
                details = detailsMatch[1].trim();
                console.log(`[formatMessageContent] Scheme ${schemeNumber} - Extracted Details:`, details.substring(0, 100) + (details.length > 100 ? '...' : ''));
              }

              // 提取推荐理由 - 调整正则以匹配 "**推荐理由**" 或 "**匹配原因**"
              const reasonRegex = /\*\*(?:推荐理由|匹配原因)\*\*(?:[：:]|\s*)?([\s\S]*?)(?=\*\*(?:发布时间|项目详情|详情|载体详情)\*\*|$)/;
              const reasonMatch = schemeContent.match(reasonRegex);
              console.log(`[formatMessageContent] Scheme ${schemeNumber} - Reason Match Result:`, reasonMatch);
              if (reasonMatch && reasonMatch[1]) {
                reason = reasonMatch[1].trim();
                console.log(`[formatMessageContent] Scheme ${schemeNumber} - Extracted Reason:`, reason.substring(0, 100) + (reason.length > 100 ? '...' : ''));
              }

              // 创建方案卡片，保留原始的加粗标记
              const cardData = {
                // 去除标题末尾可能的**但保留其他加粗
                title: `方案${schemeNumber}: ${schemeTitle.replace(/\*\*$/, '').trim()}`,
                // 保留发布时间的标签，使用原始格式
                publishTime: publishTime ? publishTime.trim() : '',
                // 保留详情标签
                detailsLabel: "**项目详情**",
                details: details ? details.trim() : '',
                // 保留推荐理由标签
                reasonLabel: "**推荐理由**",
                reason: reason ? reason.trim() : ''
              };

              // Log the final cardData object
              console.log(`[formatMessageContent] Scheme ${schemeNumber} - Final cardData:`, JSON.stringify(cardData));

              result.messageParts.push({
                type: 'card',
                title: cardData.title,
                publishTime: cardData.publishTime,
                detailsLabel: cardData.detailsLabel,
                details: cardData.details,
                reasonLabel: cardData.reasonLabel,
                reason: cardData.reason,
                fullContent: `方案${schemeNumber}: ${schemeTitle}\\n${
                  cardData.publishTime ? `发布时间: ${cardData.publishTime}\\n` : ''
                }${
                  cardData.details ? `详情: ${cardData.details}\\n` : ''
                }${
                  cardData.reason ? `推荐理由: ${cardData.reason}` : ''
                }`
              });
            }

            // 提取完所有方案后，找后记部分
            if (lastIndex > 0) {
              console.log('[formatMessageContent] Start searching for postscript, lastIndex =', lastIndex);

              // 尝试查找各种可能的后记标记
              const noteMarkers = ['注：', '注:', '提示：', '提示:', '请注意：', '请注意:', '备注：', '备注:', '友情提示：', '友情提示:'];
              let postscript = '';
              let markerFound = false;

              // 按优先级顺序检查各种标记
              for (const marker of noteMarkers) {
                // 从最后处理的位置开始查找
                const noteIndex = content.indexOf(marker, lastIndex);
                if (noteIndex !== -1) {
                  postscript = content.substring(noteIndex).trim();
                  console.log(`[formatMessageContent] Postscript found (${marker}):`, postscript.substring(0, 100) + (postscript.length > 100 ? '...' : ''));
                  markerFound = true;
                  break;
                }
              }

              // 如果找到了后记内容
              if (markerFound && postscript) {
                // 移除可能存在的###符号
                const cleanedPostscript = postscript.replace(/###/g, '').trim();
                result.messageParts.push({
                  type: 'text',
                  content: cleanedPostscript
                });
              } else if (lastIndex < content.length) {
                // 如果没有找到明确的后记标记，但有未处理的内容
                const remainingContent = content.substring(lastIndex).trim();
                // 移除可能的分隔符和###符号
                const cleanedContent = remainingContent.replace(/^---+.*$/gm, '').replace(/###/g, '').trim();
                if (cleanedContent) {
                  console.log('[formatMessageContent] No explicit postscript marker found, using cleaned remaining content:', cleanedContent.substring(0, 100) + (cleanedContent.length > 100 ? '...' : ''));
                  result.messageParts.push({
                    type: 'text',
                    content: cleanedContent
                  });
                }
              }
            }

            // 如果成功拆分了消息，将原始内容清空，避免重复显示
            if (result.messageParts.length > 0) {
              result.formattedContent = '';
            }
          } else {
            // 保留原来的推荐卡片处理逻辑
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
          
          result.recommendations = recommendations;
            }
          }
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
      // 如果toolName或toolType不存在，使用title和type作为替代
      let { toolName, toolType, title, type } = this.properties.toolConfig;
      
      // 确保有正确的值：优先使用toolName/toolType，否则使用title/type
      const chatToolName = toolName || title || '聊天工具';
      const chatToolType = toolType || type || 'chat';
      
      // 检查wx对象和getCurrentInstance是否可用
      const page = getCurrentPages()[getCurrentPages().length - 1];
      
      // 如果在index页或有navigateBack，记录工具使用
      if (page && page.route && page.route.includes('index')) {
        if (page.recordToolUse && typeof page.recordToolUse === 'function') {
          page.recordToolUse(chatToolName, `/pages/${chatToolType}/chat`);
        }
      } else {
        // 如果不在index页，尝试调用全局方法或存储到本地
        try {
          const indexPage = getCurrentPages().find(p => p.route && p.route.includes('index/index'));
          if (indexPage && indexPage.recordToolUse) {
            indexPage.recordToolUse(chatToolName, `/pages/${chatToolType}/chat`);
          } else {
            // 本地存储记录，下次进入首页时可以读取
            const now = new Date();
            // 格式化日期和时间，精确到分钟
            const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            // 获取现有记录
            let recentTools = wx.getStorageSync('recentToolsUsage') || [];
            
            const newTool = {
              id: Date.now(),
              name: chatToolName,
              date: dateStr,
              path: `/pages/${chatToolType}/chat`,
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
            
            console.log(`使用工具: ${chatToolName}, 路径: /pages/${chatToolType}/chat, 时间: ${dateStr}, 时间戳: ${now.getTime()}`);
          }
        } catch (err) {
          console.error('记录工具使用失败:', err);
        }
      }
    },

    // 停止当前请求
    stopRequest: function() {
      if (!this.data.requestTask) {
        console.log('没有正在进行的请求可以停止');
        return;
      }
      
      console.log('尝试停止请求');
      
      // 设置停止标志
        this.setData({
          isStopping: true
        });
        
      // 尝试中断请求
        this.data.requestTask.abort();
        
      // 设置后台任务状态为已完成但标记为取消
      const backgroundJob = wx.getStorageSync(this.backgroundJobKey);
      if (backgroundJob) {
        const updatedJob = {
          ...backgroundJob,
          completed: true,
          processing: false,
          timestamp: Date.now(),
          response: '请求已停止',
          isCancelled: true // 标记为用户主动取消
        };
        
        wx.setStorage({
          key: this.backgroundJobKey,
          data: updatedJob
        });
      }
        
        // 重置状态
        this.setData({
          loading: false,
        isStopping: false,
        requestTask: null,
        isBackgroundProcessing: false
        });
      
      // 添加系统消息
      this.addSystemMessage('请求已停止');
        
        // 清除请求状态
        wx.removeStorage({ 
        key: this.requestStatusKey
      });
      
      // 保存更新后的消息
      this.saveMessagesToStorage();
    },

    // 请求订阅消息权限 - 需要在用户点击操作中调用
    requestSubscribePermission: function() {
      const templateId = 'bFGSlc6zR4QOHx5QVeP5OtCiwIlTIHcY8S0qXw_o8Zw';
      
      // 检查是否已经请求过权限，避免频繁打扰用户
      const lastRequestTime = wx.getStorageSync('subscribePermissionRequestTime') || 0;
      const now = Date.now();
      
      // 如果距离上次请求时间小于7天，则不再请求
      if (now - lastRequestTime < 7 * 24 * 60 * 60 * 1000) {
        console.log('7天内已经请求过订阅权限，跳过请求');
        return;
      }
      
      console.log('请求订阅消息权限...');
      
      // 记录本次请求时间
      wx.setStorageSync('subscribePermissionRequestTime', now);
      
      wx.requestSubscribeMessage({
        tmplIds: [templateId],
        success: (res) => {
          console.log('订阅消息权限请求结果:', res);
          
          // 检查授权结果
          if (res[templateId] === 'accept') {
            console.log('用户同意订阅消息');
            wx.setStorageSync('hasSubscribeMessagePermission', true);
          } else {
            console.log('用户拒绝订阅消息或请求过于频繁');
            wx.setStorageSync('hasSubscribeMessagePermission', false);
          }
        },
        fail: (err) => {
          console.error('订阅消息权限请求失败:', err);
          console.log('错误信息详情:', JSON.stringify(err));
          wx.setStorageSync('hasSubscribeMessagePermission', false);
        }
      });
    }
  }
}) 
