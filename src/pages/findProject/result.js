// pages/findProject/result.js
Page({
  data: {
    projects: [],
    loading: true
  },

  onLoad: function(options) {
    // 尝试从事件通道获取数据
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel) {
      eventChannel.on('acceptDataFromOpenerPage', (data) => {
        console.log('从对话页面接收到数据:', data);
        if (data && data.projects && data.projects.length > 0) {
          // 处理项目数据
          this.processProjectData(data.projects);
        } else {
          // 如果事件通道没有数据，显示提示并尝试从存储中恢复
          this.showNoDataTip();
        }
      });
    } else {
      // 尝试从本地存储恢复数据
      this.loadFromStorage();
    }
  },
  
  // 处理项目数据
  processProjectData: function(projects) {
    // 设置数据并保存到本地存储
    this.setData({
      projects: projects,
      loading: false
    });
    
    // 保存到本地存储以便后续恢复
    wx.setStorage({
      key: 'findProject_results',
      data: projects
    });
    
    // 处理项目分类等其他逻辑
    // ...其他代码
  },
  
  // 从本地存储加载数据
  loadFromStorage: function() {
    wx.getStorage({
      key: 'findProject_results',
      success: (res) => {
        if (res.data && res.data.length > 0) {
          this.processProjectData(res.data);
        } else {
          this.showNoDataTip();
        }
      },
      fail: () => {
        this.showNoDataTip();
      }
    });
  },
  
  // 显示无数据提示
  showNoDataTip: function() {
    this.setData({
      loading: false,
      noDataTip: '未找到项目数据，请返回对话页面重新查询'
    });
    
    wx.showToast({
      title: '未找到项目数据',
      icon: 'none',
      duration: 2000
    });
  },
  
  // 查看项目详情
  viewProjectDetail: function(e) {
    const projectId = e.currentTarget.dataset.id;
    const project = this.data.projects.find(p => p.id === projectId);
    
    if (project) {
      wx.navigateTo({
        url: `/pages/projectDetail/index?id=${projectId}`,
        success: (res) => {
          // 传递数据给详情页面
          res.eventChannel.emit('acceptProjectData', { project: project });
        }
      });
    }
  },
  
  // 收藏项目
  favoriteProject: function(e) {
    const projectId = e.currentTarget.dataset.id;
    const projectIndex = this.data.projects.findIndex(p => p.id === projectId);
    
    if (projectIndex !== -1) {
      // 切换收藏状态
      const projects = this.data.projects;
      projects[projectIndex].favorited = !projects[projectIndex].favorited;
      
      this.setData({
        projects: projects
      });
      
      // 如果已收藏，则添加到收藏夹
      if (projects[projectIndex].favorited) {
        wx.showToast({
          title: '已收藏',
          icon: 'success',
          duration: 1500
        });
        
        // TODO: 调用API保存收藏数据
      } else {
        wx.showToast({
          title: '已取消收藏',
          icon: 'none',
          duration: 1500
        });
        
        // TODO: 调用API删除收藏数据
      }
    }
  },
  
  // 分享项目
  shareProject: function(e) {
    const projectId = e.currentTarget.dataset.id;
    const project = this.data.projects.find(p => p.id === projectId);
    
    if (project) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    }
  },
  
  // 返回聊天页面
  goBack: function() {
    wx.navigateBack();
  },
  
  // 返回主页
  goHome: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
}); 