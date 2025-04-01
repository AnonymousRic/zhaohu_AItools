# 新文件结构说明

本文档介绍了项目新的文件结构设计和目录组织方式。

## 整体结构

项目采用分层架构，主要包含以下几个部分：

```
zhaohuAI_tools/
├── src/                     # 源码目录
│   ├── components/          # 组件目录
│   │   ├── common/          # 通用组件
│   │   └── business/        # 业务组件
│   ├── pages/               # 页面目录
│   ├── services/            # API 服务层
│   ├── utils/               # 工具函数
│   ├── constants/           # 常量定义
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
└── cloudfunctions/          # 云函数目录
```

## 目录详解

### src/ 源码目录

所有源代码文件都应放在 `src` 目录下，包括组件、页面、工具函数等。

#### src/components/ 组件目录

按照组件的用途分为两类：

- **common/**: 通用组件，可在多个页面或功能中复用
  - **custom-tabbar/**: 自定义底部导航栏
  - **navigation-bar/**: 顶部导航栏

- **business/**: 业务组件，与特定业务逻辑相关
  - **chat-page/**: 聊天对话组件

#### src/pages/ 页面目录

所有页面都放在这个目录下，每个页面一个子目录：

- **index/**: 首页
- **findProject/**: 找项目页面
- **findVenue/**: 找载体页面
- **relocEval/**: 迁址评估页面
- **industryAnalysis/**: 产业链分析页面
- **profile/**: 用户个人中心
- **favorites/**: 收藏夹页面
- **history/**: 历史记录页面

#### src/services/ 服务层

处理与后端 API 的交互，按功能模块划分：

- **chat.js**: 聊天相关服务
- **user.js**: 用户相关服务
- **api.js**: API 接口配置

#### src/utils/ 工具函数

提供各种通用的工具函数：

- **request.js**: 网络请求工具
- **storage.js**: 本地存储工具
- **validator.js**: 数据验证工具
- **database.js**: 数据库操作相关

#### src/constants/ 常量定义

存放项目中使用的常量：

- **index.js**: 常量导出聚合文件
- **api.js**: API 相关常量
- **ui.js**: UI 相关常量

#### src/assets/ 静态资源目录

包含图标、样式等静态资源：

- **icons/**: 图标资源
  - **tools/**: 工具头像
- **styles/**: 全局样式文件

### config/ 配置文件目录

存放项目配置文件，如环境配置、构建配置等。

### docs/ 文档目录

项目相关文档，包括：

- **file_structure_migration_guide.md**: 文件结构迁移指南
- **new_file_structure.md**: 新文件结构说明
- **reference_path_updates.md**: 引用路径更新说明

### tests/ 测试文件目录

存放单元测试、集成测试等测试文件。

### cloudfunctions/ 云函数目录

存放小程序云函数相关代码和配置。

## 命名规范

1. **文件命名**:
   - 组件文件使用大驼峰命名法: `NavigationBar.js`
   - 非组件文件使用小驼峰命名法: `request.js`
   - 常量文件使用小写字母: `constants.js`

2. **目录命名**:
   - 使用小驼峰命名法: `findProject/`

3. **组件命名**:
   - 使用大驼峰命名法: `NavigationBar`

4. **函数命名**:
   - 使用小驼峰命名法: `getData()`

5. **常量命名**:
   - 使用大写字母和下划线: `MAX_COUNT`

## 引用路径规范

为了保持代码的一致性，推荐使用以下导入路径格式：

```javascript
// 推荐
const request = require('../../utils/request');
const { TOOL_IDS } = require('../../constants/index');

// 不推荐
const request = require('./../../../../utils/request');
```

## 静态资源引用规范

在项目中引用静态资源（如图片、图标等）时，应使用以下路径格式：

```javascript
// JS中引用
const iconPath = '/src/assets/icons/back.svg';

// WXML中引用
<image src="/src/assets/icons/tools/project.png"></image>

// WXSS中引用
background-image: url('/src/assets/icons/default.png');
```

## 代码组织原则

1. **关注点分离**: 将业务逻辑、UI 展示、数据处理分开
2. **单一职责**: 每个文件只负责一个功能
3. **高内聚低耦合**: 相关功能放在一起，减少不同模块间的依赖
4. **可测试性**: 代码设计应易于编写单元测试
5. **一致性**: 遵循统一的代码风格和命名规范 