// 云开发环境配置
const cloudConfig = {
  env: 'cloudbase-8g29274l2fa63132', // 替换为实际的云环境ID
  
  // 数据库集合配置
  collections: {
    backgroundTasks: 'background_tasks', // 后台任务集合
    messageTemplates: 'message_templates', // 订阅消息模板集合
    userHistory: 'user_history' // 用户历史记录集合
  },
  
  // 订阅消息模板配置
  subscribeMessage: {
    templates: {
      taskCreated: {
        type: 'task_created',
        templateId: 'bFGSlc6zR4QOHx5QVeP5OtCiwIlTIHcY8S0qXw_o8Zw', // 服务进度提醒模板ID
        title: '服务进度提醒',
        content: '您的AI分析任务已创建，正在处理中'
      },
      taskCompleted: {
        type: 'task_completed',
        templateId: 'bFGSlc6zR4QOHx5QVeP5OtCiwIlTIHcY8S0qXw_o8Zw', // 使用同一个模板ID
        title: '服务进度提醒',
        content: '您的AI分析任务已完成，请查看结果'
      },
      taskFailed: {
        type: 'task_failed',
        templateId: 'bFGSlc6zR4QOHx5QVeP5OtCiwIlTIHcY8S0qXw_o8Zw', // 使用同一个模板ID
        title: '服务进度提醒',
        content: '您的任务处理失败，请重试'
      }
    }
  }
};

module.exports = cloudConfig; 