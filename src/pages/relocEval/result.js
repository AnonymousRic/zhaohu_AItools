Page({
  data: {
    loading: true,
    evalResults: null,
    // 定义评分等级对应的颜色
    scoreColors: {
      high: '#4CAF50', // 绿色 - 高分
      medium: '#FF9800', // 橙色 - 中分
      low: '#F44336' // 红色 - 低分
    },
    // 定义因素类型
    factorTypes: {
      positive: '正向因素',
      negative: '负向因素',
      neutral: '中性因素'
    }
  },

  onLoad() {
    // 获取评估结果数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptEvalResults', (data) => {
      if (data && data.results) {
        // 处理评估结果数据
        const processedResults = this.processResults(data.results);
        
        this.setData({
          evalResults: processedResults,
          loading: false
        });
      } else {
        this.setData({
          loading: false
        });
        wx.showToast({
          title: '无法获取评估结果',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 处理评估结果数据
   * @param {object} results 原始评估结果
   * @return {object} 处理后的评估结果
   */
  processResults(results) {
    // 复制结果，避免修改原始数据
    const processedResults = JSON.parse(JSON.stringify(results));
    
    // 如果有需要，这里可以添加额外的数据处理逻辑
    // 例如：计算总分、处理因素分类、格式化数据等
    
    return processedResults;
  },

  /**
   * 获取评分等级对应的颜色
   * @param {number} score 评分
   * @return {string} 颜色代码
   */
  getScoreColor(score) {
    if (score >= 7) {
      return this.data.scoreColors.high;
    } else if (score >= 4) {
      return this.data.scoreColors.medium;
    } else {
      return this.data.scoreColors.low;
    }
  },

  /**
   * 获取因素类型对应的文本
   * @param {string} type 因素类型
   * @return {string} 类型文本
   */
  getFactorTypeText(type) {
    return this.data.factorTypes[type] || '其他因素';
  },

  /**
   * 导出评估报告
   */
  exportReport() {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 分享评估结果
   */
  shareResults() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 返回聊天页
   */
  backToChat() {
    // 传递事件给聊天页，表示返回
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.emit('backToChat', { action: 'back' });
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 重新评估
   */
  restartEvaluation() {
    // 传递事件给聊天页，表示重新开始
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.emit('backToChat', { action: 'restart' });
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 返回首页
   */
  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
}); 