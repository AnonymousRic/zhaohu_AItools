// app.js
const db = require('./utils/database.js');

App({
  onLaunch() {
    // 初始化云环境
    this.initCloud();
    
    // 获取用户信息
    this.getUserInfo();
    
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
  
  globalData: {
    userInfo: null,
    openid: null
  }
});
