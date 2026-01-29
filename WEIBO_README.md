# 微博博主管理项目

这是一个基于 Vue 3 + Vitesse 的自定义微博博主管理应用，可以添加你喜欢的博主ID，快速查看和切换博主主页。

## 功能特性

- ✨ 添加/删除博主ID
- 👤 查看博主详细信息（头像、昵称、简介、粉丝数等）
- 🔄 快速切换多个博主
- 💾 本地存储博主列表
- 🌓 支持深色模式
- 📱 响应式设计，支持移动端

## 项目结构

```
src/
├── pages/
│   ├── weibo/
│   │   ├── index.vue          # 博主列表管理页面
│   │   └── [id].vue           # 博主主页展示页面
│   └── index.vue              # 首页（含微博入口）
├── stores/
│   └── weibo.ts               # 微博数据管理 Store
└── ...
```

## 使用说明

### 1. 启动项目

```bash
pnpm install
pnpm dev
```

### 2. 添加博主

1. 访问首页，点击"进入微博管理"
2. 在输入框中输入博主ID（例如：6052726496）
3. 点击"添加"按钮
4. 自动跳转到博主主页

### 3. 查看博主主页

- 在博主列表页面点击"查看"按钮
- 博主主页显示：
  - 封面图
  - 头像和昵称
  - 个人简介
  - 关注数、粉丝数、微博数
  - 认证状态、会员等级等

### 4. 快速切换博主

在博主主页顶部有头像切换器，点击不同的头像即可快速切换到其他博主。

### 5. 删除博主

在博主列表页面点击红色的删除按钮，确认后即可删除。

## 如何获取博主ID

1. 打开微博网页版或移动版
2. 访问目标博主的主页
3. 从URL中获取ID：
   - 网页版：`https://weibo.com/u/6052726496` → ID是 `6052726496`
   - 移动版：`https://m.weibo.cn/u/6052726496` → ID是 `6052726496`

## 接入真实API

当前版本使用模拟数据，要接入真实的微博API：

1. 打开 `src/pages/weibo/[id].vue`
2. 找到 `fetchBloggerData` 函数
3. 取消注释真实API调用代码：

```typescript
// 替换模拟数据部分
const response = await fetch(`https://m.weibo.cn/api/container/getIndex?type=uid&value=${bloggerId.value}`)
const data = await response.json()
bloggerData.value = data
```

## 数据存储

- 博主ID列表存储在 `localStorage` 的 `weibo-blogger-ids` 键中
- 当前选中的博主ID存储在 `weibo-current-blogger` 键中
- 博主详细数据缓存在内存中（刷新页面后需重新加载）

## 技术栈

- Vue 3 - 渐进式 JavaScript 框架
- Vite - 下一代前端构建工具
- Pinia - Vue 状态管理
- UnoCSS - 即时按需原子化CSS引擎
- TypeScript - JavaScript 的超集
- Vue Router - Vue.js 官方路由

## 注意事项

1. 微博API可能需要认证或有访问限制
2. 跨域问题可能需要配置代理
3. 建议在生产环境中添加错误处理和重试机制
4. 可以根据需要添加微博内容展示功能

## 后续优化建议

- [ ] 接入真实微博API
- [ ] 添加微博内容列表展示
- [ ] 支持搜索博主
- [ ] 添加博主分组功能
- [ ] 支持导出/导入博主列表
- [ ] 添加数据刷新功能
- [ ] 优化加载性能和缓存策略
