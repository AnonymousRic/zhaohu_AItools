// pages/industryAnalysis/result.js
Page({
  data: {
    analysisData: null,
    loading: true
  },

  onLoad: function(options) {
    const eventChannel = this.getOpenerEventChannel();
    
    // 监听acceptDataFromOpenerPage事件，获取上一页面通过eventChannel传送到当前页面的数据
    eventChannel.on('acceptDataFromOpenerPage', (data) => {
      console.log('Received analysis data:', data);
      if (data && data.analysis) {
        this.setData({
          analysisData: data.analysis,
          loading: false
        });
      } else {
        this.setData({
          loading: false
        });
      }
    });
  },

  // 返回聊天页面
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 返回首页
  goHome: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 收藏分析结果
  favoriteAnalysis: function() {
    if (!this.data.analysisData) return;
    
    wx.showToast({
      title: '已收藏',
      icon: 'success',
      duration: 2000
    });
    
    // TODO: 实际收藏逻辑
  },

  // 分享分析结果
  shareAnalysis: function() {
    if (!this.data.analysisData) return;
    
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none',
      duration: 2000
    });
    
    // TODO: 实际分享逻辑
  },

  // 查看详情
  viewDetails: function(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.analysisData.items[index];
    
    wx.showToast({
      title: '详情功能开发中',
      icon: 'none',
      duration: 2000
    });
    
    // TODO: 跳转到详情页
    console.log('View details for item:', item);
  }
}); 