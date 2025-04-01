# 引用路径更新说明

本文档记录了项目迁移后对文件引用路径的更新。

## 迁移前后引用路径对照表

| 文件 | 迁移前引用 | 迁移后引用 | 说明 |
|------|------------|------------|------|
| app.js | `require('./utils/database.js')` | `require('./utils/database.js')` | 文件迁移到src后引用路径保持不变 |
| app.json | `"navigation-bar": "/components/navigation-bar/navigation-bar"` | `"navigation-bar": "./components/common/navigation-bar/navigation-bar"` | 全局组件引用路径更新 |
| app.json | `"custom-tabbar": "./components/custom-tabbar/custom-tabbar"` | `"custom-tabbar": "./components/common/custom-tabbar/custom-tabbar"` | 全局组件引用路径更新 |
| pages/index/index.json | `"navigation-bar": "/components/navigation-bar/navigation-bar"` | `"navigation-bar": "../../components/common/navigation-bar/navigation-bar"` | 页面级组件引用路径更新 |
| pages/index/index.json | `"custom-tabbar": "/components/custom-tabbar/custom-tabbar"` | `"custom-tabbar": "../../components/common/custom-tabbar/custom-tabbar"` | 页面级组件引用路径更新 |
| pages/history/index.json | `"custom-tabbar": "/components/custom-tabbar/custom-tabbar"` | `"custom-tabbar": "../../components/common/custom-tabbar/custom-tabbar"` | 页面级组件引用路径更新 |
| pages/favorites/index.json | `"custom-tabbar": "/components/custom-tabbar/custom-tabbar"` | `"custom-tabbar": "../../components/common/custom-tabbar/custom-tabbar"` | 页面级组件引用路径更新 |
| pages/profile/index.json | `"custom-tabbar": "/components/custom-tabbar/custom-tabbar"` | `"custom-tabbar": "../../components/common/custom-tabbar/custom-tabbar"` | 页面级组件引用路径更新 |
| pages/findProject/chat.json | `"chat-page": "/components/chat-page/chat-page"` | `"chat-page": "../../components/business/chat-page/chat-page"` | 页面级组件引用路径更新 |
| pages/findVenue/chat.json | `"chat-page": "/components/chat-page/chat-page"` | `"chat-page": "../../components/business/chat-page/chat-page"` | 页面级组件引用路径更新 |
| pages/relocEval/chat.json | `"chat-page": "/components/chat-page/chat-page"` | `"chat-page": "../../components/business/chat-page/chat-page"` | 页面级组件引用路径更新 |
| pages/industryAnalysis/chat.json | `"chat-page": "/components/chat-page/chat-page"` | `"chat-page": "../../components/business/chat-page/chat-page"` | 页面级组件引用路径更新 |
| components/chat-page/chat-page.js | 无明确引用 | `require('../../../utils/storage')`, `require('../../../utils/request')`, `require('../../../utils/database')`, `require('../../../constants/index')` | 新增工具函数引用 |
| pages/findProject/chat.js | 无明确引用 | `require('../../utils/storage')`, `require('../../utils/database')` | 新增工具函数引用 |
| pages/findVenue/chat.js | 无明确引用 | `require('../../utils/storage')`, `require('../../utils/database')` | 新增工具函数引用 |
| pages/relocEval/chat.js | 无明确引用 | `require('../../utils/storage')`, `require('../../utils/database')` | 新增工具函数引用 |
| pages/industryAnalysis/chat.js | 无明确引用 | `require('../../utils/storage')`, `require('../../utils/database')` | 新增工具函数引用 |
| pages/index/index.js | `require('../../utils/database.js')` | `require('../../constants/index')`, `require('../../utils/storage')`, `require('../../utils/database')` | 添加新常量和工具引用 |
| components/custom-tabbar/custom-tabbar.js | 无明确引用 | `require('../../../constants/index')` | 新增常量引用 |
| constants/index.js | 无 | `require('./api')`, `require('./ui')` | 引用新创建的常量文件 |
| services/api.js | 无 | `require('../utils/request')`, `require('../constants/index')` | 引用请求工具和常量 |
| services/user.js | 无 | `require('../utils/request')`, `require('../utils/storage')`, `require('../constants/index')` | 引用请求、存储工具和常量 |
| services/chat.js | 无 | `require('../utils/request')`, `require('../utils/storage')` | 引用请求和存储工具 |
| 多个WXML文件 | `/assets/icons/...` | 需保持原路径 | 资源文件路径需要维持一致性 |

## 项目配置更新

项目配置文件也进行了更新，以指向新的src目录结构：

1. `project.config.json`: 
   - 更新 `"miniprogramRoot"` 为 `"src/"`

2. `project.private.config.json`: 
   - 添加 `"miniprogramRoot": "src/"`
   - 更新其他配置项

3. `app.json`:
   - 更新全局组件引用路径:
     - `"navigation-bar"` 从 `/components/navigation-bar/navigation-bar` 改为 `./components/common/navigation-bar/navigation-bar`
     - `"custom-tabbar"` 从 `./components/custom-tabbar/custom-tabbar` 改为 `./components/common/custom-tabbar/custom-tabbar`

4. 页面级JSON配置:
   - 更新页面级组件引用路径:
     - 在`index.json`中更新`navigation-bar`和`custom-tabbar`组件引用路径
     - 在各个聊天页面的JSON中更新`chat-page`组件引用路径
     - 在`history/index.json`、`favorites/index.json`和`profile/index.json`中更新`custom-tabbar`组件引用路径

## 引用路径更新方法

引用路径更新遵循以下原则：

1. **相对路径**: 所有引用都使用相对路径，而非绝对路径
2. **路径计算**: 根据文件在新目录结构中的位置，计算正确的相对路径
3. **统一格式**: 使用 `require()` 而非 ES6 的 `import` 语法，保持与现有代码风格一致

例如，从 `src/components/business/chat-page/chat-page.js` 引用 `src/utils/storage.js`，需要上移三级目录：
```javascript
const storage = require('../../../utils/storage');
```

在页面JSON中引用组件，则使用相对路径：
```json
{
  "usingComponents": {
    "chat-page": "../../components/business/chat-page/chat-page"
  }
}
```

## 需注意的潜在问题

在实际项目运行中，还可能存在一些尚未捕捉到的引用路径问题，特别是：

1. **动态引用路径**: 使用变量构建的路径，如history模块中的:
   ```javascript
   avatarUrl: `/assets/icons/tools/${chat.toolType || 'chat'}.svg`
   ```

2. **WXML/WXSS文件中的引用路径**:
   发现多个WXML文件中使用了绝对路径引用图片资源，例如:
   ```html
   <image class="back-icon" src="/assets/icons/back.svg"></image>
   <image class="avatar-image" src="{{item.type === 'user' ? '/assets/icons/user_avatar.svg' : toolConfig.avatarPath}}"></image>
   ```
   
3. **图片资源引用路径**:
   - 图片等静态资源现在仍在项目根目录的assets文件夹中
   - 需要将assets文件夹迁移到src目录下，或者保持在根目录并确保引用路径正确

4. **全局组件引用路径**:
   - 需要注意全局组件在app.json中的引用路径
   - 组件目录结构变更后，引用路径也需要相应调整

5. **页面级组件引用**:
   - 每个页面的JSON配置文件中可能包含组件引用
   - 需要根据新的目录结构更新这些引用路径

## 需要进行的迁移操作

1. **迁移静态资源**:
   - 将根目录下的`assets`文件夹复制到`src`目录下
   - 或者保持在根目录，但需确保项目配置正确设置静态资源的查找路径

2. **修复组件中的引用路径错误**:
   - 已修复`src/components/business/chat-page/chat-page.js`中第592行的错误引用路径
   - 从`const db = require('../../utils/database.js')`修改为`const db = require('../../../utils/database.js')`

3. **修复全局组件引用路径**:
   - 已修复`src/app.json`中的全局组件引用路径
   - 更新`navigation-bar`和`custom-tabbar`组件的路径，使其指向正确的目录

4. **修复页面级组件引用路径**:
   - 已修复`src/pages/index/index.json`中的组件引用路径
   - 已修复各聊天页面的`chat.json`中`chat-page`组件的引用路径
   - 已修复`history`、`favorites`和`profile`页面中的`custom-tabbar`组件引用路径

如果遇到与资源路径或引用路径相关的问题，请按照上述原则进行修正。 