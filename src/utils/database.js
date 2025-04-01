// 数据库操作工具
let db;

// 初始化云环境
function initCloud() {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      reject(new Error('不支持云开发'));
      return;
    }
    
    try {
      // 初始化云开发环境
      wx.cloud.init({
        env: 'cloudbase-8g29274l2fa63132', // 替换为您的云环境ID
        traceUser: true,
      });
      
      // 初始化数据库
      db = wx.cloud.database();
      
      console.log('云环境初始化成功');
      resolve(true);
    } catch (err) {
      console.error('云环境初始化失败:', err);
      reject(err);
    }
  });
}

// 获取用户ID
function getUserId() {
  const userInfo = wx.getStorageSync('userInfo');
  return userInfo ? userInfo.openid : '';
}

// 记录工具使用历史
async function recordToolUsage(data) {
  if (!db) {
    try {
      await initCloud();
    } catch (err) {
      console.error('云环境初始化失败:', err);
      return null;
    }
  }
  
  const userId = getUserId();
  if (!userId) {
    console.log('用户未登录，使用临时ID');
    // 使用设备信息或随机ID作为临时用户ID
    const tempUserId = 'temp_' + new Date().getTime();
    
    try {
      const userHistoryCollection = db.collection('user_history');
      const result = await userHistoryCollection.add({
        data: {
          userId: tempUserId,
          toolType: data.toolType || 'tool',
          toolName: data.toolName || '未知工具',
          params: data.params || {},
          result: data.result || {},
          title: data.title || '工具使用记录',
          description: data.description || '工具使用记录',
          createTime: db.serverDate(),
        }
      });
      
      return result;
    } catch (err) {
      console.error('记录工具使用历史失败: ', err);
      return null;
    }
  }
  
  try {
    const userHistoryCollection = db.collection('user_history');
    const result = await userHistoryCollection.add({
      data: {
        userId: userId,
        toolType: data.toolType || 'tool',
        toolName: data.toolName || '未知工具',
        params: data.params || {},
        result: data.result || {},
        title: data.title || '工具使用记录',
        description: data.description || '工具使用记录',
        createTime: db.serverDate(),
      }
    });
    
    return result;
  } catch (err) {
    console.error('记录工具使用历史失败: ', err);
    return null;
  }
}

// 记录对话历史
async function recordChatHistory(data) {
  // 确保数据有效
  if (!data || !data.toolType || !data.userMessage || !data.aiResponse) {
    console.error('记录对话历史需要完整的数据');
    return Promise.reject(new Error('数据不完整'));
  }

  try {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo') || {};
    const openid = userInfo.openid || 'anonymous';

    // 准备保存的数据
    const historyData = {
      ...data,
      id: data.id || `chat_${Date.now()}`,
      openid: openid,
      time: data.time || Date.now(),
      title: data.title || '聊天记录',
      lastUserMessage: data.userMessage.substring(0, 50) + (data.userMessage.length > 50 ? '...' : ''),
      createTime: new Date()
    };

    // 先保存到本地缓存
    let localHistory = wx.getStorageSync('chatHistory') || [];
    
    // 限制本地存储的聊天记录数量，最多保存50条
    if (localHistory.length >= 50) {
      localHistory = localHistory.slice(0, 49);
    }
    
    localHistory.unshift(historyData);
    wx.setStorageSync('chatHistory', localHistory);

    // 尝试保存到云数据库
    try {
      if (wx.cloud) {
        await initCloud();
        const db = wx.cloud.database();
        const result = await db.collection('chat_history').add({
          data: historyData
        });
        console.log('聊天历史已记录到云数据库', result);
        return result;
      }
    } catch (cloudErr) {
      console.error('保存到云数据库失败，但已保存到本地', cloudErr);
    }
    
    // 返回成功，即使云存储失败
    return Promise.resolve({
      id: historyData.id,
      success: true
    });
  } catch (err) {
    console.error('记录聊天历史失败:', err);
    return Promise.reject(err);
  }
}

// 获取聊天历史记录
async function getChatHistory(limit = 20) {
  try {
    // 首先尝试从本地获取
    const localHistory = wx.getStorageSync('chatHistory') || [];
    
    // 如果本地有足够的数据，直接返回
    if (localHistory.length >= limit) {
      return localHistory.slice(0, limit);
    }
    
    // 尝试从云数据库获取
    try {
      if (wx.cloud) {
        await initCloud();
        const userInfo = wx.getStorageSync('userInfo') || {};
        const openid = userInfo.openid || 'anonymous';

        const db = wx.cloud.database();
        const result = await db.collection('chat_history')
          .where({
            openid: openid
          })
          .orderBy('time', 'desc')
          .limit(limit)
          .get();

        if (result && result.data && result.data.length > 0) {
          // 更新本地缓存
          wx.setStorageSync('chatHistory', result.data);
          return result.data;
        }
      }
    } catch (cloudErr) {
      console.error('从云数据库获取失败，使用本地数据', cloudErr);
    }

    // 如果云获取失败或无数据，返回本地数据
    return localHistory;
  } catch (err) {
    console.error('获取聊天历史失败:', err);
    
    // 出错时从本地获取
    const localHistory = wx.getStorageSync('chatHistory') || [];
    return localHistory;
  }
}

// 生成聊天记录的URL
function generateChatUrl(item) {
  if (!item || !item.toolType) return '';
  
  // 根据记录数据中的toolType生成对应的聊天页面URL
  let baseUrl = `/pages/${item.toolType}/chat`;
  
  // 添加历史记录ID作为参数
  if (item.id) {
    baseUrl += `?historyId=${item.id}`;
  }
  
  return baseUrl;
}

// 获取用户工具使用历史
async function getUserToolHistory(limit = 10) {
  if (!db) {
    try {
      await initCloud();
    } catch (err) {
      console.error('云环境初始化失败:', err);
      return [];
    }
  }
  
  // 如果用户未登录，返回本地存储的历史记录
  const userId = getUserId();
  if (!userId) {
    console.log('用户未登录，返回默认示例数据');
    // 返回示例数据
    return [
      {
        id: 'sample-1',
        title: '电动汽车零部件产业项目分析',
        description: '通过找项目工具查询的项目分析报告',
        toolType: 'findProject',
        toolName: '找项目',
        time: formatTime(new Date()),
        timestamp: new Date(),
        url: '/pages/industryChain/index?id=sample-1'
      }
    ];
  }
  
  try {
    const userHistoryCollection = db.collection('user_history');
    const result = await userHistoryCollection.where({
      userId: userId
    })
    .orderBy('createTime', 'desc')
    .limit(limit)
    .get();
    
    if (result.data && result.data.length > 0) {
      return result.data.map(item => {
        return {
          id: item._id,
          title: item.title || '未命名记录',
          description: item.description || '',
          toolType: item.toolType || 'tool',
          toolName: item.toolName || '未知工具',
          time: formatTime(item.createTime),
          timestamp: item.createTime,
          url: generateUrl(item)
        };
      });
    } else {
      // 没有数据时返回示例
      return [
        {
          id: 'sample-1',
          title: '电动汽车零部件产业项目分析',
          description: '通过找项目工具查询的项目分析报告',
          toolType: 'findProject',
          toolName: '找项目',
          time: formatTime(new Date()),
          timestamp: new Date(),
          url: '/pages/industryChain/index?id=sample-1'
        }
      ];
    }
  } catch (err) {
    console.error('获取用户工具使用历史失败: ', err);
    // 发生错误时返回示例数据
    return [
      {
        id: 'sample-1',
        title: '电动汽车零部件产业项目分析',
        description: '通过找项目工具查询的项目分析报告',
        toolType: 'findProject',
        toolName: '找项目',
        time: formatTime(new Date()),
        timestamp: new Date(),
        url: '/pages/industryChain/index?id=sample-1'
      }
    ];
  }
}

// 生成URL
function generateUrl(historyItem) {
  let baseUrl = '';
  
  switch(historyItem.toolType) {
    case 'findProject':
      baseUrl = '/pages/findProject/index';
      break;
    case 'findVenue':
      baseUrl = '/pages/findVenue/index';
      break;
    case 'industryChain':
      baseUrl = '/pages/industryChain/index';
      break;
    case 'relocationEval':
      baseUrl = '/pages/relocationEval/index';
      break;
    default:
      baseUrl = '/pages/index/index';
  }
  
  return `${baseUrl}?id=${historyItem._id || 'unknown'}`;
}

// 格式化时间 YYYY-MM-DD HH:MM
function formatTime(date) {
  if (!date) {
    date = new Date();
  }
  
  if (typeof date !== 'object') {
    date = new Date(date);
  }
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

module.exports = {
  initCloud,
  recordToolUsage,
  recordChatHistory,
  getUserToolHistory,
  getChatHistory,
  generateChatUrl,
  generateUrl,
  formatTime
}; 