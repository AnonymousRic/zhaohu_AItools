// favorites/index.js
Page({
  data: {
    favoritesList: []
  },

  onLoad: function() {
    this.loadFavorites();
  },
  
  onShow: function() {
    // Refresh data when returning to this page
    this.loadFavorites();
  },
  
  loadFavorites: function() {
    // Get favorites from storage
    const favorites = wx.getStorageSync('favorites') || [];
    
    // Format the data for display
    const formattedList = favorites.map(item => {
      // Convert type to readable text
      let typeText = '项目';
      if (item.type === 'venue') typeText = '载体';
      else if (item.type === 'industry') typeText = '产业';
      
      return {
        id: item.id,
        title: item.title,
        type: typeText,
        url: item.url
      };
    });
    
    this.setData({
      favoritesList: formattedList
    });
  },
  
  navigateTo: function(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url
    });
  }
}); 