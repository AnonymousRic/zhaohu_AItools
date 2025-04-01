// profile/index.js
Page({
  data: {
    userInfo: null,
    isLoggedIn: false
  },

  onLoad: function() {
    // Check if user is logged in
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        isLoggedIn: true
      });
    }
  },
  
  login: function() {
    // For demo purposes, just show a toast
    wx.showToast({
      title: '登录功能开发中',
      icon: 'none'
    });
  },
  
  navigateTo: function(e) {
    const url = e.currentTarget.dataset.url;
    
    // For demo purposes, just show a toast
    wx.showToast({
      title: '该功能开发中',
      icon: 'none'
    });
    
    // Uncomment when the pages are created
    /*
    wx.navigateTo({
      url: url
    });
    */
  }
}); 