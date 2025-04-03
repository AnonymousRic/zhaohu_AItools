// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取OpenID
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    console.log('准备发送订阅消息，事件数据: ', event)
    
    // 检查必要参数
    if (!event.templateId || !event.data) {
      console.error('缺少必要参数: templateId或data')
      return {
        success: false,
        error: '缺少必要参数'
      }
    }
    
    // 发送订阅消息
    const result = await cloud.openapi.subscribeMessage.send({
      touser: openid,
      templateId: event.templateId,
      page: event.page || 'pages/index/index', // 跳转页面，默认首页
      data: event.data,
      miniprogramState: 'formal' // 正式版本
    })
    
    console.log('订阅消息发送结果:', result)
    
    return {
      success: true,
      result: result
    }
  } catch (err) {
    console.error('发送订阅消息失败:', err)
    return {
      success: false,
      error: err
    }
  }
} 