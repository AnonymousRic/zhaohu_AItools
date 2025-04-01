// 引入常量
const { TOOL_PATHS } = require('../../../constants/index');

Component({
  properties: {
    activeTab: {
      type: String,
      value: 'index'
    }
  },
  
  data: {
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        tab: "index",
        icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzc1NzU3NSI+PHBhdGggZD0iTTEwIDIwdi02aDR2Nmg1di04aDNMMTIgMyAyIDEyaDN2OHoiLz48L3N2Zz4=",
        activeIcon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzE5NzZEMiI+PHBhdGggZD0iTTEwIDIwdi02aDR2Nmg1di04aDNMMTIgMyAyIDEyaDN2OHoiLz48L3N2Zz4="
      },
      {
        pagePath: "/pages/history/index",
        text: "历史",
        tab: "history",
        icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzc1NzU3NSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDIgMC04LTMuNTgtOC04czMuNTgtOCA4LTggOCAzLjU4IDggOC0zLjU4IDgtOCA4eiIvPjxwYXRoIGQ9Ik0xMi41IDdIMTF2NmwzLjMgMy4zIDEuNC0xLjQtMi43LTIuN3oiLz48L3N2Zz4=",
        activeIcon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzE5NzZEMiI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDIgMC04LTMuNTgtOC04czMuNTgtOCA4LTggOCAzLjU4IDggOC0zLjU4IDgtOCA4eiIvPjxwYXRoIGQ9Ik0xMi41IDdIMTF2NmwzLjMgMy4zIDEuNC0xLjQtMi43LTIuN3oiLz48L3N2Zz4="
      },
      {
        pagePath: "/pages/favorites/index",
        text: "收藏",
        tab: "favorites",
        icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzc1NzU3NSI+PHBhdGggZD0iTTEyIDIgTDkuMSA4LjYgTDIgOS40IEw3LjUgMTQuMiBMNS44IDIxLjAgTDEyIDE3LjYgTDE4LjIgMjEuMCBMMTYuNSAxNC4yIEwyMiA5LjQgTDE0LjkgOC42IFoiLz48L3N2Zz4=",
        activeIcon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzE5NzZEMiI+PHBhdGggZD0iTTEyIDIgTDkuMSA4LjYgTDIgOS40IEw3LjUgMTQuMiBMNS44IDIxLjAgTDEyIDE3LjYgTDE4LjIgMjEuMCBMMTYuNSAxNC4yIEwyMiA5LjQgTDE0LjkgOC42IFoiLz48L3N2Zz4="
      },
      {
        pagePath: "/pages/profile/index",
        text: "我的",
        tab: "profile",
        icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzc1NzU3NSI+PHBhdGggZD0iTTEyIDRhNCA0IDAgMTAwIDhhNCA0IDAgMDAwLTh6bTAgMTBjLTQuNDIgMC04IDEuNzktOCA0djJoMTZ2LTJjMC0yLjIxLTMuNTgtNC04LTR6Ii8+PC9zdmc+",
        activeIcon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzE5NzZEMiI+PHBhdGggZD0iTTEyIDRhNCA0IDAgMTAwIDhhNCA0IDAgMDAwLTh6bTAgMTBjLTQuNDIgMC04IDEuNzktOCA0djJoMTZ2LTJjMC0yLjIxLTMuNTgtNC04LTR6Ii8+PC9zdmc+"
      }
    ],
    currentTab: '' // 存储当前实际所在的标签页
  },

  // 生命周期方法，组件进入页面节点树时执行
  lifetimes: {
    attached: function() {
      // 初始化时设置currentTab
      this.setData({
        currentTab: this.properties.activeTab
      });
    }
  },

  // 组件所在页面的生命周期
  pageLifetimes: {
    // 页面显示时，同步更新当前选中标签
    show: function() {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        const route = currentPage.route;
        
        // 根据当前页面路径确定应该选中哪个标签
        if (route.includes('/index/index')) {
          this.setData({ 
            currentTab: 'index',
            activeTab: 'index'
          });
        } else if (route.includes('/history/index')) {
          this.setData({ 
            currentTab: 'history',
            activeTab: 'history'
          });
        } else if (route.includes('/favorites/index')) {
          this.setData({ 
            currentTab: 'favorites',
            activeTab: 'favorites'
          });
        } else if (route.includes('/profile/index')) {
          this.setData({ 
            currentTab: 'profile',
            activeTab: 'profile'
          });
        }
        console.log('当前页面:', route, '选中标签:', this.data.currentTab);
      }
    }
  },

  methods: {
    switchTab(e) {
      const tab = e.currentTarget.dataset.tab;
      const url = e.currentTarget.dataset.url;
      
      // 如果点击的就是当前页面，不做任何操作
      if (tab === this.data.currentTab) {
        console.log('已经在当前页面:', tab);
        return;
      }
      
      console.log('切换到:', tab, url);
      
      // 更新当前标签和activeTab
      this.setData({ 
        currentTab: tab,
        activeTab: tab 
      });
      
      wx.switchTab({
        url: url,
        success: () => {
          console.log('成功切换到:', tab);
        },
        fail: (err) => {
          console.error('Tab switch failed:', err);
          wx.showToast({
            title: '导航失败',
            icon: 'none'
          });
        }
      });
    }
  }
}); 