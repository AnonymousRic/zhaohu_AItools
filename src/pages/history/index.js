// history/index.js
const db = require('../../utils/database.js');

Page({
  data: {
    historyList: [],
    isLoading: true,
    filterType: 'all' // 'all', 'chat', 'tool'
  },

  onLoad: function() {
    this.loadHistoryData();
  },

  onShow: function() {
    this.loadHistoryData();
  },

  // 切换过滤器类型
  switchFilter: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      filterType: type
    });
    this.loadHistoryData();
  },

  // 加载历史数据
  loadHistoryData: function() {
    this.setData({ isLoading: true });
    
    try {
      // 获取工具使用历史
      const recentTools = wx.getStorageSync('recentToolsUsage') || [];
      
      // 直接从本地存储获取聊天历史
      const chatHistory = wx.getStorageSync('chatHistory') || [];
      
      console.log('原始聊天历史条数:', chatHistory.length);
      console.log('原始工具历史条数:', recentTools.length);
      
      // 格式化聊天历史数据
      const formattedChatHistory = chatHistory.map(chat => {
        // 解析时间戳
        const timestamp = chat.timestamp || chat.time || Date.now();
        
        return {
          id: chat.id,
          title: chat.title || `${chat.toolType || '聊天'}记录`,
          type: 'chat',
          toolType: chat.toolType || 'chat',
          content: chat.userMessage,
          time: chat.createTime || chat.time,
          avatarUrl: `/assets/icons/tools/${chat.toolType || 'chat'}.svg`
        };
      });

      // 格式化工具使用历史数据
      const formattedToolsHistory = recentTools.map(tool => {
        // 解析日期字符串为时间戳 (格式如: 2023.10.15 14:30)
        let timestamp;
        if (tool.timestamp) {
          timestamp = tool.timestamp;
        } else if (tool.date) {
          if (typeof tool.date === 'string') {
            // 尝试解析日期字符串
            const dateParts = tool.date.split(' ');
            if (dateParts.length >= 1) {
              const dateComponents = dateParts[0].split('.');
              if (dateComponents.length === 3) {
                const year = parseInt(dateComponents[0]);
                const month = parseInt(dateComponents[1]) - 1; // 月份从0开始
                const day = parseInt(dateComponents[2]);
                
                let hours = 0, minutes = 0;
                if (dateParts.length > 1 && dateParts[1].includes(':')) {
                  const timeParts = dateParts[1].split(':');
                  hours = parseInt(timeParts[0]);
                  minutes = parseInt(timeParts[1]);
                }
                
                timestamp = new Date(year, month, day, hours, minutes).getTime();
              }
            }
          }
          
          // 如果解析失败，使用当前时间作为备选
          if (!timestamp || isNaN(timestamp)) {
            console.warn('日期解析失败，使用当前时间:', tool.date);
            timestamp = Date.now();
          }
        } else {
          timestamp = Date.now();
        }
        
        console.log(`工具 ${tool.name} 时间戳: ${timestamp}, 原始日期: ${tool.date}`);
        
        const item = {
          id: tool.id,
          title: tool.name || '工具使用记录',
          type: 'tool',
          content: tool.description || '无描述',
          time: tool.createTime || new Date().toISOString(),
          avatarUrl: `/assets/icons/tools/${tool.path ? tool.path.split('/')[2] : 'tool'}.svg`
        };
        return item;
      });

      console.log('格式化后聊天历史条数:', formattedChatHistory.length);
      console.log('格式化后工具历史条数:', formattedToolsHistory.length);

      // 合并并按时间排序
      let allHistory = [...formattedChatHistory, ...formattedToolsHistory];
      
      // 根据过滤类型筛选
      if (this.data.filterType === 'chat') {
        allHistory = formattedChatHistory;
      } else if (this.data.filterType === 'tool') {
        allHistory = formattedToolsHistory;
      }
      
      // 按时间降序排序
      allHistory.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });

      this.setData({
        historyList: allHistory,
        isLoading: false
      });
      
      // 如果有原始数据但格式化后为空，记录错误
      if (chatHistory.length > 0 && formattedChatHistory.length === 0) {
        console.error('聊天历史格式化错误:', chatHistory);
      }
      if (recentTools.length > 0 && formattedToolsHistory.length === 0) {
        console.error('工具历史格式化错误:', recentTools);
      }

    } catch (error) {
      console.error('加载历史记录失败:', error);
      // 显示空状态
      this.setData({
        historyList: [],
        isLoading: false
      });
    }
  },

  // 格式化时间为易读格式
  formatTime: function(timestamp) {
    if (!timestamp) return '';
    
    // 尝试将字符串转换为数字
    if (typeof timestamp === 'string' && !isNaN(timestamp)) {
      timestamp = parseInt(timestamp);
    }
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.log('无效的时间戳:', timestamp);
      return new Date().toLocaleString();
    }
    
    const diff = now - date;
    
    // 小于1小时，显示为"X分钟前"
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      if (minutes < 1) return '刚刚';
      return `${minutes}分钟前`;
    }
    
    // 小于24小时，显示为"X小时前"
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}小时前`;
    }
    
    // 小于30天，显示为"X天前"
    if (diff < 30 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}天前`;
    }
    
    // 大于30天，显示具体日期
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 导航到历史记录详情页
  navigateTo: function(e) {
    const url = e.currentTarget.dataset.url;
    const historyId = e.currentTarget.dataset.id;
    
    if (!url || url === '#') {
      wx.showToast({
        title: '无法打开此记录',
        icon: 'none'
      });
      return;
    }
    
    // 检查URL是否已包含historyId参数
    let targetUrl = url;
    if (historyId && !url.includes('historyId=')) {
      // 如果URL已经包含参数，添加&，否则添加?
      targetUrl = url + (url.includes('?') ? '&' : '?') + 'historyId=' + historyId;
    }
    
    console.log('导航到聊天历史:', targetUrl);
    
    wx.navigateTo({
      url: targetUrl,
      fail: (err) => {
        console.error('导航失败:', err);
        wx.showToast({
          title: '页面不存在',
          icon: 'none'
        });
      }
    });
  },

  // 清空历史记录
  clearHistory: function() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？此操作不可撤销',
      success: (res) => {
        if (res.confirm) {
          // 清空工具使用历史
          wx.removeStorageSync('recentToolsUsage');
          // 清空聊天历史
          wx.removeStorageSync('chatHistory');
          
          this.setData({
            historyList: []
          });
          
          wx.showToast({
            title: '历史记录已清空',
            icon: 'success'
          });
        }
      }
    });
  }
}); 