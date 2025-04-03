// app.js
const db = require('./utils/database.js');

App({
  onLaunch: function () {
    // 初始化云环境
    this.initCloud();
    
    // 获取用户信息
    this.getUserInfo();
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-7g6h7jg1afd4f43f',
        traceUser: true,
      });
    }

    this.globalData = {};
    
    // 不再自动请求订阅消息权限
    // this.requestSubscribeMessagePermission();
    
    // 设置导航栏高度
    this.getNavBarInfo();
    
    // 初始化 AI 工具配置
    this.initToolConfig();
    
    // 检查是否有后台任务
    this.checkBackgroundJobs();
    
    // 输出调试信息
    console.log('应用启动完成');
  },
  
  async initCloud() {
    console.log('开始初始化云环境...');
    try {
      await db.initCloud();
      console.log('云环境初始化成功');
    } catch (err) {
      console.error('云环境初始化失败:', err);
      
      // 显示错误提示
      wx.showToast({
        title: '系统初始化失败，部分功能可能无法使用',
        icon: 'none',
        duration: 3000
      });
    }
  },
  
  getUserInfo() {
    console.log('获取用户信息...');
    
    // 检查是否可以调用getUserInfo
    if (wx.getUserProfile) {
      // 获取用户设备信息作为临时标识
      const systemInfo = wx.getSystemInfoSync();
      const tempUserInfo = {
        openid: 'temp_' + new Date().getTime(),
        deviceInfo: {
          brand: systemInfo.brand,
          model: systemInfo.model,
          system: systemInfo.system,
          platform: systemInfo.platform
        }
      };
      
      // 存储临时用户信息
      this.globalData.userInfo = tempUserInfo;
      wx.setStorageSync('userInfo', tempUserInfo);
      
      console.log('已创建临时用户标识');
    } else {
      console.log('当前环境不支持getUserProfile');
    }
  },
  
  // 请求订阅消息权限
  requestSubscribeMessagePermission() {
    // 消息模板ID
    const templateId = 'bFGSlc6zR4QOHx5QVeP5OtCiwIlTIHcY8S0qXw_o8Zw';
    
    console.log('请求订阅消息权限...');
    
    // 先检查是否已经请求过权限
    wx.getSetting({
      withSubscriptions: true,
      success: (res) => {
        // 检查权限状态
        const subscriptionsSetting = res.subscriptionsSetting;
        const mainSwitch = subscriptionsSetting.mainSwitch; // 用户是否打开了订阅消息总开关
        
        // 如果总开关没打开，可以引导用户开启
        if (!mainSwitch) {
          console.log('用户未打开订阅消息总开关，跳过权限请求');
          return;
        }
        
        // 检查模板权限
        if (subscriptionsSetting.itemSettings && 
            subscriptionsSetting.itemSettings[templateId] === 'accept') {
          console.log('用户已授权订阅消息权限');
          this.globalData.hasSubscribeMessagePermission = true;
        } else {
          // 没有授权或授权已过期，重新请求
          this.doRequestSubscribeMessagePermission(templateId);
        }
      },
      fail: (err) => {
        console.error('获取订阅权限设置失败:', err);
        // 请求权限
        this.doRequestSubscribeMessagePermission(templateId);
      }
    });
  },
  
  // 执行订阅消息权限请求
  doRequestSubscribeMessagePermission(templateId) {
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        console.log('订阅消息权限请求结果:', res);
        
        // 检查授权结果
        if (res[templateId] === 'accept') {
          console.log('用户同意订阅消息');
          this.globalData.hasSubscribeMessagePermission = true;
        } else {
          console.log('用户拒绝订阅消息或请求过于频繁');
          this.globalData.hasSubscribeMessagePermission = false;
        }
      },
      fail: (err) => {
        console.error('订阅消息权限请求失败:', err);
        this.globalData.hasSubscribeMessagePermission = false;
      }
    });
  },
  
  // 获取导航栏信息
  getNavBarInfo: function() {
    console.log('获取导航栏信息...');
    try {
      const systemInfo = wx.getSystemInfoSync();
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      
      // 计算导航栏高度
      const statusBarHeight = systemInfo.statusBarHeight;
      const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height;
      
      this.globalData.navBarInfo = {
        statusBarHeight: statusBarHeight,
        navBarHeight: navBarHeight,
        menuButtonInfo: menuButtonInfo,
        windowHeight: systemInfo.windowHeight
      };
      
      console.log('导航栏信息获取成功:', this.globalData.navBarInfo);
    } catch (err) {
      console.error('获取导航栏信息失败:', err);
    }
  },
  
  // 初始化AI工具配置
  initToolConfig: function() {
    console.log('初始化AI工具配置...');
    try {
      // 这里可以从本地存储或远程获取工具配置
      // 例如从本地存储读取
      const toolConfig = wx.getStorageSync('aiToolConfig');
      
      if (toolConfig) {
        this.globalData.toolConfig = toolConfig;
        console.log('从本地存储加载工具配置成功');
      } else {
        // 设置默认配置
        this.globalData.toolConfig = {
          tools: [
            {
              id: 'chat',
              title: 'AI助手',
              type: 'chat',
              description: '智能问答助手',
              icon: '/images/icon-chat.png',
              apiConfig: {
                url: 'https://api.example.com/chat',
                method: 'POST',
                isSSE: true,
                workflowId: 'default'
              },
              welcomeMessage: '您好，我是您的AI助手，有什么可以帮您？'
            }
          ]
        };
        
        // 保存到本地存储
        wx.setStorage({
          key: 'aiToolConfig',
          data: this.globalData.toolConfig
        });
        
        console.log('使用默认工具配置');
      }
    } catch (err) {
      console.error('初始化工具配置失败:', err);
    }
  },
  
  // 检查后台任务
  checkBackgroundJobs: function() {
    console.log('检查后台任务...');
    try {
      // 获取所有存储的key
      wx.getStorageInfo({
        success: (res) => {
          const keys = res.keys;
          const jobKeys = keys.filter(key => key.startsWith('bg_job_'));
          
          console.log('找到后台任务数量:', jobKeys.length);
          
          if (jobKeys.length > 0) {
            // 记录任务信息
            this.globalData.pendingJobs = jobKeys.length;
            
            // 可以在这里进行一些处理，例如在首页显示任务通知
          }
        },
        fail: (err) => {
          console.error('获取存储信息失败:', err);
        }
      });
    } catch (err) {
      console.error('检查后台任务失败:', err);
    }
  },
  
  globalData: {
    userInfo: null,
    openid: null,
    hasSubscribeMessagePermission: false,
    navBarInfo: null,
    toolConfig: null,
    pendingJobs: 0
  }
});
