# 招乎AI助手微信小程序

## 项目概述

招乎AI助手是一个基于微信小程序平台的智能工具集，旨在为用户提供多种产业和企业相关的智能分析服务。本项目整合了多个AI驱动的工具，包括项目匹配、载体推荐、迁址评估和产业链分析，通过对话式交互方式，为用户提供便捷、高效的信息查询和决策支持服务。

## 功能特点

### 智能工具集

- **找项目助手**: 基于用户需求智能匹配适合的招商项目，提供项目详情和联系方式。使用Coze对话流API提供智能对话能力。
- **找载体助手**: 帮助用户查找合适的产业园区、厂房、办公空间等载体资源。使用Coze对话流API提供智能对话能力。
- **迁址动力评估**: 分析企业迁址的可行性和动力，提供量化评估报告。
- **产业链分析**: 提供产业上下游关系分析，帮助了解产业生态和发展趋势。

### 用户体验优化

- **统一对话界面**: 所有工具采用一致的对话式交互界面，降低用户学习成本。
- **个性化工具头像**: 每个工具配备独特的头像设计，提升识别度和品牌形象。
- **会话持久化**: 支持对话历史和结果的本地存储，用户可随时关闭后继续之前的对话。
- **长程请求支持**: 优化长时间运行的AI请求处理，支持高达5分钟的处理时间，并改进了响应数据处理机制，确保即使对于复杂格式的消息也能提取出有效内容。
- **后台处理机制**: 支持用户发送请求后离开对话页面使用其他功能，系统将在后台继续处理请求，完成后通知用户并展示结果。
- **文本复制功能**: 支持长按消息文本复制到剪贴板，方便用户保存重要信息。
- **键盘优化**: 智能处理键盘弹出/收起，改善移动端输入体验。
- **最近使用记录**: 自动记录用户使用过的工具，在首页展示最近使用的工具，方便快速访问。
- **智能时间显示**: 今天的消息只显示时间，历史消息(今天之前)同时显示日期和时间。
- **请求停止功能**: 在等待API响应期间，输入框置为禁用状态，发送按钮变为停止按钮，点击可立即中止当前请求。

## 环境要求

- 微信开发者工具 1.06.2306120 或更高版本
- 基础库最低版本 2.30.0
- Node.js 16.x 或更高版本

## 快速开始

1. 克隆项目
   ```bash
   git clone [项目仓库地址]
   cd zhaohuAI_tools
   ```

2. 使用微信开发者工具打开项目
   - 导入项目目录
   - 填入自己的 AppID（或选择无 AppID 模式）

3. 配置环境
   - 配置 Coze API 密钥（必须配置）
     - 找项目助手 workflow_id: 7486096531545276452
     - 找载体助手 workflow_id: 7486308411508998183
     - API Key: pat_qDM3tPe7y6slRlIOnrUOhh22uiSZ4tUuAa3sM3oXyf8fbb0jleIvgjywhCHouXWG
   - 在微信开发者工具中添加合法域名：api.coze.cn
   - 云开发环境配置（如使用云开发功能）

4. 本地开发
   - 编译运行项目
   - 在模拟器或真机预览效果

## 技术实现

### 核心组件

- **通用聊天组件 (chat-page)**:
  - 统一的对话界面实现
  - 支持自定义头像、欢迎语和输入提示
  - 消息历史管理及存储
  - 键盘行为优化
  - 工具使用记录功能
  - 适配Coze的SSE(Server-Sent Events)响应格式
  - 消息文本格式化处理，支持Markdown风格的加粗、斜体等样式
  - 请求停止机制，允许用户通过停止按钮中断正在处理的API请求
  - 后台处理机制，支持用户离开页面后继续处理请求

- **结果展示组件**:
  - 针对各工具定制的结果展示页面
  - 数据持久化支持
  - 优化的视觉呈现
  
### 增强的SSE响应处理

聊天组件实现了高级的SSE(Server-Sent Events)响应处理机制，具有以下特点：

- **消息增量更新**: 支持处理增量内容更新，实时构建完整的回复内容
- **格式消息过滤**: 能够识别并过滤系统格式消息（如`generate_answer_finish`类型），确保只向用户展示有效内容
- **内容提取优化**: 多层内容提取逻辑，从不同类型的事件中获取用户可读内容
- **错误处理增强**: 完善的错误处理机制，即使在响应解析失败的情况下也能提供有意义的反馈
- **背景任务支持**: 将原始响应数据保存到本地，支持应用切换到后台后依然能恢复和处理完整响应

### 后台处理机制

用户可以在发送请求后离开聊天页面，系统会继续在后台处理请求：

- **状态持久化**: 将请求状态和原始响应数据保存到本地存储
- **会话恢复**: 用户返回页面时自动检查和恢复处理状态
- **超时处理**: 自动检测长时间运行但未完成的请求，提供适当的超时处理
- **通知机制**: 请求完成后通知用户查看结果

## 技术特点

- **组件化设计**: 高度组件化的架构，提高代码复用性和可维护性
- **数据持久化**: 使用微信存储API实现对话及结果数据的持久化
- **API集成**: 
  - 找项目和找载体工具集成Coze API实现AI对话能力
  - 迁址评估和产业链分析集成自有API端点
- **响应式布局**: 适配不同屏幕尺寸和安全区域
- **状态管理**: 有效管理请求状态和UI状态，提升用户体验
- **本地存储**: 使用本地存储记录工具使用历史，提供快速访问
- **长连接支持**: 支持最长300秒的请求处理时间，适应复杂AI处理需求
- **增强的后台处理**: 改进的数据处理机制，能够从复杂响应中提取有效用户内容，即使在系统格式消息的情况下也能正确展示结果
- **智能时间处理**: 根据消息发送时间智能显示不同格式的时间标记

## 工具配置说明

所有聊天工具需要在其配置中包含以下关键属性，以确保功能正常：

```javascript
toolConfig: {
  // 基础属性
  type: 'toolType',              // 工具类型标识符，如findProject
  title: "工具名称",             // 显示在界面上的工具名称
  placeholder: "输入提示...",    // 输入框占位文本
  welcomeMessage: "欢迎消息",    // 初始欢迎消息
  avatarPath: "/path/to/avatar.svg", // 工具头像路径
  
  // 消息历史记录所需属性
  toolName: "工具名称",          // 用于记录工具使用和对话历史
  toolType: "toolType",          // 用于记录工具类型和页面路径
  
  // API配置
  apiConfig: {
    // 根据工具类型不同有所差异
    // Coze API 配置示例
    url: "https://api.coze.cn/v1/workflows/chat",
    method: "POST",
    workflowId: "工作流ID",
    authToken: "API密钥",
    isSSE: true,
    responseType: 'text'
  },
  
  // 结果配置
  resultConfig: {
    dataKey: "dataKey",          // 结果数据键名
    resultPage: "/pages/tool/result", // 结果页面路径
    hasResult: false,            // 是否已有结果
    needConfirm: true            // 是否需要用户确认后查看结果
  }
}
```

必须确保`toolName`和`toolType`属性存在，否则会导致对话历史无法正确记录。

### 消息文本格式化处理

聊天组件支持基础的Markdown风格文本格式化，包括：

- **加粗文本**: 使用`**文本**`格式
- **斜体文本**: 使用`*文本*`格式
- **加粗斜体**: 使用`***文本***`格式

实现方式采用特殊的分割处理技术，避免了微信小程序中正则表达式的限制。格式化逻辑位于`chat-page.wxml`文件的WXS模块中。

## 使用方法

1. 从主页选择需要使用的AI工具
2. 在对话框中描述您的需求
3. AI助手将通过对话形式提供相关信息和建议
4. 对于有结构化数据的响应，可查看详细结果页面
5. 长按文本可复制内容，点击页面任意区域可收起键盘
6. 通过首页的最近使用记录可快速访问常用工具

## 目录结构

项目采用优化后的文件结构组织：

```
zhaohuAI_tools/
├── src/                     # 源码目录
│   ├── components/          # 组件目录
│   │   ├── common/          # 通用组件
│   │   └── business/        # 业务组件
│   │       └── chat-page/   # 通用聊天页面组件
│   ├── pages/               # 页面目录
│   │   ├── index/           # 首页
│   │   ├── findProject/     # 找项目相关页面
│   │   ├── findVenue/       # 找载体相关页面
│   │   ├── relocEval/       # 迁址评估相关页面
│   │   ├── industryAnalysis/# 产业链分析相关页面
│   │   ├── profile/         # 用户个人中心
│   │   ├── favorites/       # 收藏夹页面
│   │   └── history/         # 历史记录页面
│   ├── services/            # API 服务层
│   │   ├── api.js           # API配置
│   │   ├── chat.js          # 聊天相关服务
│   │   └── user.js          # 用户相关服务
│   ├── utils/               # 工具函数
│   │   ├── request.js       # 网络请求工具
│   │   ├── storage.js       # 本地存储工具
│   │   └── database.js      # 数据库交互工具
│   ├── constants/           # 常量定义
│   │   ├── index.js         # 常量聚合文件
│   │   ├── api.js           # API相关常量
│   │   └── ui.js            # UI相关常量
│   ├── types/               # TypeScript 类型定义（如使用TS）
│   ├── assets/              # 静态资源目录
│   │   ├── icons/           # 图标资源
│   │   │   └── tools/       # 工具头像
│   │   └── styles/          # 全局样式文件
│   ├── app.js               # 小程序入口文件
│   ├── app.json             # 小程序全局配置
│   ├── app.wxss             # 小程序全局样式
│   └── sitemap.json         # 小程序搜索配置
├── config/                  # 配置文件目录
├── docs/                    # 文档目录
├── tests/                   # 测试文件目录
├── cloudfunctions/          # 云函数目录
├── project.config.json      # 项目配置文件
└── project.private.config.json # 项目私有配置文件
```

## 项目维护

### 代码提交规范

遵循 Angular 提交规范，格式如下：
```
<type>(<scope>): <subject>

<body>

<footer>
```

常用的 type 类型:
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码风格调整
- refactor: 代码重构
- perf: 性能优化
- test: 测试相关
- chore: 构建过程或辅助工具变动

### 分支管理策略

- master: 主分支，稳定版本
- develop: 开发分支，最新开发版本
- feature/xxx: 功能分支，用于开发新功能
- hotfix/xxx: 热修复分支，用于修复线上bug

### 发布流程

1. 功能开发完成后，合并到 develop 分支
2. 测试通过后，合并到 master 分支
3. 在 master 分支上打 tag，生成新的版本号
4. 将代码部署到生产环境

## 文件组织原则

1. **关注点分离**: 将业务逻辑、UI展示、数据处理分开
2. **单一职责**: 每个文件只负责一个功能
3. **高内聚低耦合**: 相关功能放在一起，减少不同模块间的依赖
4. **可测试性**: 代码设计应易于编写单元测试
5. **一致性**: 遵循统一的代码风格和命名规范

## 引用路径规范

为了保持代码的一致性，使用以下引用路径格式：

```javascript
// 推荐
const request = require('../../utils/request');
const { TOOL_IDS } = require('../../constants/index');

// 不推荐
const request = require('./../../../../utils/request');
```

## Coze API集成说明

本项目中的"找项目助手"和"找载体助手"工具集成了Coze对话流API，具体实现如下：

1. **API配置**: 
   - 端点: https://api.coze.cn/v1/workflows/chat
   - 请求方法: POST
   - 认证: Bearer认证，使用API Key进行身份验证
   - 响应格式: SSE (Server-Sent Events)

2. **请求格式**:
   ```json
   {
     "workflow_id": "[工具对应的workflow_id]",
     "additional_messages": [
       {
         "role": "user",
         "content_type": "text",
         "content": "[用户输入内容]"
       }
     ],
     "parameters": {}
   }
   ```

3. **响应处理**:
   - 使用SSE格式处理事件流响应
   - 监听`conversation.message.delta`和`conversation.message.completed`等事件
   - 提取`assistant`回复和可能的结构化数据

4. **超时设置**:
   - 请求超时时间设置为180秒(3分钟)，以适应长时间运行的AI处理

5. **代码位置**:
   - 核心调用逻辑位于`src/components/business/chat-page/chat-page.js`的`callAPI`和`handleSSEResponse`方法
   - 工具特定配置位于各工具页面的`chat.js`文件中

## 常见问题及解决方案

### 开发中常见问题及解决方案

- **Q: 小程序启动时报错 "xxx is not defined"**
  A: 检查 app.js 中是否正确引入了相关模块，或者检查模块是否正确导出

- **Q: 页面跳转后数据丢失**
  A: 使用本地存储（wx.setStorage）或页面参数传递数据

- **Q: API 请求超时**
  A: 检查以下几点：
  - 确保请求超时设置为至少180秒（request.js中的TIMEOUT常量）
  - 确保app.json中的networkTimeout设置合理
  - 确保微信开发者工具中添加了api.coze.cn为合法域名
  - 在请求失败时查看错误信息，根据具体错误码调整

- **Q: 资源路径错误**
  A: 确保所有资源路径使用正确的前缀，静态资源应使用 `/src/assets/` 开头的路径

- **Q: 历史消息时间显示不正确**
  A: 确保在加载历史消息时使用原始的timestamp创建日期对象，而不是当前时间

- **Q: Coze API调用失败**
  A: 检查以下几点：
  - 确认API Key和workflow_id正确无误
  - 确认请求格式符合Coze API要求
  - 查看请求头是否正确设置Authorization
  - 确认响应格式设置为text以处理SSE流

### 错误码说明

- 1001: 网络请求失败
- 1002: 用户未授权
- 1003: 数据解析错误
- 1004: 操作超时
- 720702204: Coze API错误 - 会话名不存在

## 更新日志

### v1.0.0 (2023-03-20)
- 初始版本发布
- 实现智能对话助手基本功能
- 支持找项目、找载体、迁址评估和产业链分析四大功能模块

### v1.1.0 (2023-03-21)
- 最近使用记录功能：实现用户与智能工具交互时自动记录使用情况
- 添加用户使用记录自动保存功能
- 优化聊天界面响应速度

### v1.2.0 (2023-03-28)
- 项目结构优化：将所有代码和资源文件整合到src目录
- 重构文件引用路径，提高代码组织性和可维护性
- 文档更新：添加详细的文件结构说明和引用路径规范

### v1.3.0 (2023-04-01)
- 集成Coze对话流API，增强找项目和找载体工具的智能交互能力
- 优化网络请求超时设置，支持长达3分钟的AI处理请求
- 改进消息时间显示，今天的消息只显示时间，历史消息同时显示日期
- 增强历史记录功能，确保历史消息加载时保留原始时间信息
- 添加详细的Coze API集成文档

### v1.3.1 (2023-04-10)
- 修复工具配置信息不完整导致无法记录对话历史的问题
- 为所有工具组件添加toolName和toolType必要属性
- 优化消息内容格式化处理，支持Markdown风格文本
- 增强文本处理的稳定性和兼容性

### v1.4.0 (2023-04-15)
- 添加请求停止功能，允许用户在等待API响应期间取消请求
- 优化输入体验，在等待响应时自动禁用输入框
- 改进用户界面，请求过程中将发送按钮替换为红色停止按钮
- 增强请求状态管理，确保取消请求后UI状态正确恢复

### v1.4.1 (2023-04-20)
- 将API请求超时时间从3分钟增加到5分钟，支持处理更长时间的复杂请求
- 优化SSE响应处理逻辑，改进了消息增量更新机制
- 增强系统格式消息处理，确保即使收到非标准的系统消息也能提取有效用户内容
- 改进后台任务机制，支持保存原始响应数据以便更好地恢复和处理
- 修复在后台处理大型响应时可能出现的超时问题
- 增强请求完成后的结果展示逻辑，确保显示完整的、格式正确的内容

### v1.5.0 (2023-05-01)
- 优化SSE响应处理机制，提高了消息处理的稳定性和可靠性
- 修复页面导航时聊天历史记录保存不完整的问题
- 加强背景任务日志记录，便于调试和问题追踪
- 实现云函数用于发送订阅消息，改善用户通知体验
- 提升聊天组件的状态管理，确保用户界面状态与实际处理状态同步
- 修复部分场景下消息显示错误的问题
- 优化后台处理任务的资源利用，降低内存占用
- 增加请求重试机制，提高网络不稳定环境下的可靠性

## 联系方式

- 项目维护者: [招乎团队]
- 邮箱: [zhaohu_community@163.com]