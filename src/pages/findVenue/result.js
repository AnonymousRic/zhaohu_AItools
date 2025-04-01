Page({
  data: {
    venues: [],
    loading: true
  },

  onLoad: function(options) {
    // 尝试从事件通道获取数据
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel) {
      eventChannel.on('acceptDataFromOpenerPage', (data) => {
        console.log('从对话页面接收到数据:', data);
        if (data && data.venues && data.venues.length > 0) {
          // 处理载体数据
          this.processVenueData(data.venues);
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
  
  // 处理载体数据
  processVenueData: function(venues) {
    // 设置数据并保存到本地存储
    this.setData({
      venues: venues,
      loading: false
    });
    
    // 保存到本地存储以便后续恢复
    wx.setStorage({
      key: 'findVenue_results',
      data: venues
    });
    
    // 处理载体分类等其他逻辑
    // ...其他代码
  },

  // 从本地存储加载数据
  loadFromStorage: function() {
    wx.getStorage({
      key: 'findVenue_results',
      success: (res) => {
        if (res.data && res.data.length > 0) {
          this.processVenueData(res.data);
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
      noDataTip: '未找到载体数据，请返回对话页面重新查询'
    });
    
    wx.showToast({
      title: '未找到载体数据',
      icon: 'none',
      duration: 2000
    });
  },
  
  // 查看载体详情
  viewVenueDetail: function(e) {
    const venueId = e.currentTarget.dataset.id;
    const venue = this.data.venues.find(v => v.id === venueId);
    
    if (venue) {
      wx.navigateTo({
        url: `/pages/venueDetail/index?id=${venueId}`,
        success: (res) => {
          // 传递数据给详情页面
          res.eventChannel.emit('acceptVenueData', { venue: venue });
        }
      });
    }
  },
  
  // 收藏载体
  favoriteVenue: function(e) {
    const venueId = e.currentTarget.dataset.id;
    const venueIndex = this.data.venues.findIndex(v => v.id === venueId);
    
    if (venueIndex !== -1) {
      // 切换收藏状态
      const venues = this.data.venues;
      venues[venueIndex].favorited = !venues[venueIndex].favorited;
      
      this.setData({
        venues: venues
      });
      
      // 如果已收藏，则添加到收藏夹
      if (venues[venueIndex].favorited) {
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
  
  // 分享载体
  shareVenue: function(e) {
    const venueId = e.currentTarget.dataset.id;
    const venue = this.data.venues.find(v => v.id === venueId);
    
    if (venue) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    }
  },
  
  // 联系咨询
  contactInquiry: function(e) {
    const venueId = e.currentTarget.dataset.id;
    const venue = this.data.venues.find(v => v.id === venueId);
    
    if (venue) {
      wx.showModal({
        title: '联系咨询',
        content: '您即将联系园区招商负责人获取更多信息，是否继续？',
        confirmText: '立即咨询',
        success: (res) => {
          if (res.confirm) {
            // TODO: 跳转到联系页或拨打电话
            wx.makePhoneCall({
              phoneNumber: venue.contactPhone || '400-123-4567',
              fail: () => {
                wx.showToast({
                  title: '拨打电话失败',
                  icon: 'none'
                });
              }
            });
          }
        }
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