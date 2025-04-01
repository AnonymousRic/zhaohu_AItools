// index.js
const { TOOL_IDS, TOOL_NAMES, TOOL_PATHS } = require('../../constants/index');
const storage = require('../../utils/storage');
const db = require('../../utils/database.js');

Page({
  data: {
    activeTab: 'tools',
    recentUsage: [
      // 初始状态下的占位数据，将被实际历史记录替换
      {
        id: 'ev-parts',
        title: '电动汽车零部件产业项目分析',
        type: 'project',
        description: '通过找项目工具查询的项目分析报告',
        time: '2023-11-15 14:30',
        url: '/pages/industryAnalysis/chat?id=ev-parts'
      }
    ],
    loading: true,  // 添加loading状态
    recentUse: []
  },
  
  onLoad() {
    this.loadUserHistory();
    this.loadRecentUse();
  },
  
  onShow() {
    // 每次显示页面时刷新历史记录
    this.loadUserHistory();
  },
  
  // 加载用户历史记录
  async loadUserHistory() {
    try {
      this.setData({ loading: true });
      
      // 从数据库获取用户历史记录
      const history = await db.getUserToolHistory(5); // 获取最近5条记录
      
      if (history && history.length > 0) {
        this.setData({ 
          recentUsage: history,
          loading: false
        });
      } else {
        // 如果没有历史记录，显示空状态
        this.setData({ 
          recentUsage: [],
          loading: false
        });
      }
    } catch (err) {
      console.error('获取历史记录失败:', err);
      this.setData({ loading: false });
      
      // 如果获取失败，使用本地存储的数据
      const localHistory = wx.getStorageSync('recentUsage');
      if (localHistory) {
        this.setData({ recentUsage: localHistory });
      }
    }
  },
  
  // 记录工具使用历史
  async recordToolUsage(toolType, toolName, params = {}) {
    const historyData = {
      toolType: toolType,
      toolName: toolName,
      params: params,
      title: `${toolName}使用记录`,
      description: `通过${toolName}工具查询的记录`
    };
    
    try {
      // 记录到云数据库
      await db.recordToolUsage(historyData);
      
      // 刷新本地历史记录
      this.loadUserHistory();
    } catch (err) {
      console.error('记录工具使用失败:', err);
    }
  },
  
  // 导航到工具页面并记录历史
  navigateToTool(e) {
    const url = e.currentTarget.dataset.url;
    const toolType = e.currentTarget.dataset.type;
    const toolName = e.currentTarget.dataset.name;
    
    // 记录工具使用
    this.recordToolUsage(toolType, toolName);
    
    // 导航到页面
    this.navigateTo(e);
  },
  
  switchTab(e) {
    const tabName = e.currentTarget.dataset.tab;
    if (tabName === this.data.activeTab) return;

    this.setData({
      activeTab: tabName
    });

    // 如果切换到其他标签页，进行页面跳转
    if (tabName !== 'home') {
      wx.switchTab({
        url: `/pages/${tabName}/index`
      });
      
      // 延迟重置为home标签，以便下次进入首页显示正确内容
      setTimeout(() => {
        this.setData({
          activeTab: 'home'
        });
      }, 300);
    }
  },
  
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    
    // 检查是否是tabBar页面
    const tabBarPages = [
      '/pages/index/index', 
      '/pages/history/index', 
      '/pages/favorites/index', 
      '/pages/profile/index'
    ];
    
    const isTabBarPage = tabBarPages.some(page => url.startsWith(page));
    
    if (isTabBarPage) {
      wx.switchTab({
        url: url,
        fail: (err) => {
          console.error('Tab switch failed:', err);
          wx.showToast({
            title: '导航失败',
            icon: 'none'
          });
        }
      });
    } else {
      wx.navigateTo({
        url: url,
        fail: (err) => {
          console.error('Navigation failed:', err);
          wx.showToast({
            title: '导航失败',
            icon: 'none'
          });
        }
      });
    }
  },

  // 加载最近使用的工具
  loadRecentUse() {
    // 从本地存储获取最近使用记录
    const storedRecentTools = wx.getStorageSync('recentToolsUsage') || [];
    
    if (storedRecentTools.length > 0) {
      this.setData({
        recentUse: storedRecentTools
      });
    } else {
      // 如果没有记录，使用默认数据
      const defaultTools = [
        {
          id: 1,
          name: '找项目',
          date: '2023.10.15',
          path: '/pages/findProject/chat'
        },
        {
          id: 2,
          name: '找载体',
          date: '2023.10.14',
          path: '/pages/findVenue/chat'
        },
        {
          id: 3,
          name: '迁址动力评估',
          date: '2023.10.13',
          path: '/pages/relocEval/chat'
        }
      ];
      
      this.setData({
        recentUse: defaultTools
      });
    }
  },

  /**
   * 记录工具使用
   */
  recordToolUse(toolName, path) {
    // 获取当前日期和时间
    const now = new Date();
    // 格式化日期和时间，精确到分钟
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // 获取现有记录
    let recentTools = wx.getStorageSync('recentToolsUsage') || [];
    
    // 添加新记录，不检查是否已存在相同工具，每次都添加新记录
    const newTool = {
      id: Date.now(),
      name: toolName,
      date: dateStr,
      path: path,
      timestamp: now.getTime() // 添加时间戳字段，确保时间记录准确
    };
    
    // 直接添加新记录到列表开头
    recentTools.unshift(newTool);
    
    // 限制最多保存5条
    if (recentTools.length > 5) {
      recentTools = recentTools.slice(0, 5);
    }
    
    // 保存到本地存储
    wx.setStorageSync('recentToolsUsage', recentTools);
    
    // 刷新显示
    this.setData({
      recentUse: recentTools
    });
    
    console.log(`使用工具: ${toolName}, 路径: ${path}, 时间: ${dateStr}, 时间戳: ${now.getTime()}`);
  },

  /**
   * 导航到找项目工具
   */
  goToFindProject() {
    this.recordToolUse('找项目', '/pages/findProject/chat');
    wx.navigateTo({
      url: '/pages/findProject/chat'
    });
  },

  /**
   * 导航到找载体工具
   */
  goToFindVenue() {
    this.recordToolUse('找载体', '/pages/findVenue/chat');
    wx.navigateTo({
      url: '/pages/findVenue/chat'
    });
  },

  /**
   * 导航到产业链分析工具
   */
  goToIndustryAnalysis() {
    this.recordToolUse('产业链分析', '/pages/industryAnalysis/chat');
    wx.navigateTo({
      url: '/pages/industryAnalysis/chat'
    });
  },

  /**
   * 导航到迁址动力评估工具
   */
  goToRelocEval() {
    this.recordToolUse('迁址动力评估', '/pages/relocEval/chat');
    wx.navigateTo({
      url: '/pages/relocEval/chat'
    });
  },

  /**
   * 从最近使用列表导航到工具
   */
  goToRecentTool(e) {
    const { path, name } = e.currentTarget.dataset.tool;
    this.recordToolUse(name, path);
    wx.navigateTo({
      url: path
    });
  }
});
