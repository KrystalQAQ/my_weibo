# Vite 开发代理配置说明

## 概述

已配置 Vite 开发服务器代理，将 API 请求转发到后端服务器 `http://192.168.1.125:9880`。

## 配置详情

### vite.config.ts

```typescript
server: {
  proxy: {
    // 代理微博 API 请求
    '/api': {
      target: 'http://192.168.1.125:9880',
      changeOrigin: true,
      rewrite: path => path.replace(/^\/api/, '/api'),
    },
    // 代理图片请求
    '/image': {
      target: 'http://192.168.1.125:9880',
      changeOrigin: true,
    },
  },
},
```

## 工作原理

### 开发环境（npm run dev）

```
浏览器请求 /api/container/getIndex
         ↓
Vite 开发服务器（localhost:3333）
         ↓
代理到 http://192.168.1.125:9880/api/container/getIndex
         ↓
返回数据
```

### 生产环境（Docker）

```
浏览器请求 /api/container/getIndex
         ↓
Nginx 容器（端口 80）
         ↓
代理到 https://m.weibo.cn/api/container/getIndex
         ↓
返回数据
```

## 环境变量配置

### .env.development（开发环境）

```bash
# 留空使用 Vite 代理
VITE_WORKER_URL=
```

### .env.production（生产环境）

```bash
# 留空使用 Nginx 代理
VITE_WORKER_URL=
```

## 代码变更

### 删除的功能

已删除所有 mockData（模拟数据）相关代码：
- ❌ `useMockBloggerData()` 函数
- ❌ `useMockWeiboData()` 函数
- ❌ 模拟数据后备方案

### 保留的功能

- ✅ 错误处理和提示
- ✅ 加载状态显示
- ✅ 缓存机制
- ✅ 无限滚动加载

## 使用方法

### 启动开发服务器

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 `http://localhost:3333`，所有 API 请求会自动代理到 `http://192.168.1.125:9880`。

### 构建生产版本

```bash
# 构建
pnpm build

# 预览构建结果
pnpm preview
```

## 请求流程

### API 请求

```typescript
// src/utils/proxy.ts
const WORKER_URL = import.meta.env.VITE_WORKER_URL || ''

// 开发环境：VITE_WORKER_URL 为空
fetch('/api/container/getIndex?...')
// → Vite 代理到 http://192.168.1.125:9880/api/container/getIndex

// 生产环境：VITE_WORKER_URL 为空
fetch('/api/container/getIndex?...')
// → Nginx 代理到 https://m.weibo.cn/api/container/getIndex
```

### 图片代理

```typescript
// 开发环境
proxyImageUrl('https://wx1.sinaimg.cn/large/xxx.jpg')
// → /image?url=https://wx1.sinaimg.cn/large/xxx.jpg
// → Vite 代理到 http://192.168.1.125:9880/image?url=...

// 生产环境
proxyImageUrl('https://wx1.sinaimg.cn/large/xxx.jpg')
// → /image?url=https://wx1.sinaimg.cn/large/xxx.jpg
// → Nginx 代理到微博图片服务器
```

## 错误处理

### API 请求失败

```typescript
try {
  const data = await fetchBloggerInfo(bloggerId)
  if (data.ok === 1) {
    // 成功处理
  } else {
    // 显示错误信息
    error.value = 'API 返回失败，请稍后重试'
  }
} catch (err) {
  // 显示错误信息
  error.value = '获取博主信息失败，请检查网络连接'
}
```

### 用户体验

- ✅ 显示加载状态
- ✅ 显示错误提示
- ✅ 提供重试按钮
- ❌ 不再使用模拟数据

## 后端服务要求

后端服务（`http://192.168.1.125:9880`）需要提供以下接口：

### 1. 博主信息接口

```
GET /api/container/getIndex?type=uid&value={bloggerId}&containerid=100505{bloggerId}
```

**响应格式：**
```json
{
  "ok": 1,
  "data": {
    "userInfo": {
      "id": 6052726496,
      "screen_name": "博主名称",
      "profile_image_url": "头像URL",
      "avatar_hd": "高清头像URL",
      "description": "个人简介",
      "follow_count": 538,
      "followers_count": "693",
      "statuses_count": 2051,
      "verified": false,
      "verified_type": -1,
      "gender": "f",
      "mbrank": 7
    }
  }
}
```

### 2. 微博列表接口

```
GET /api/container/getIndex?type=uid&value={bloggerId}&containerid=107603{bloggerId}&page={page}
```

**响应格式：**
```json
{
  "ok": 1,
  "data": {
    "cardlistInfo": {
      "containerid": "1076036052726496",
      "total": 2051,
      "page": 1
    },
    "cards": [
      {
        "card_type": 9,
        "mblog": {
          "id": "5259817843425929",
          "created_at": "Tue Jan 27 21:49:19 +0800 2026",
          "text": "微博内容",
          "user": { /* 用户信息 */ },
          "reposts_count": 0,
          "comments_count": 0,
          "attitudes_count": 2,
          "pics": [ /* 图片列表 */ ]
        }
      }
    ]
  }
}
```

### 3. 图片代理接口

```
GET /image?url={imageUrl}
```

**功能：**
- 接收图片 URL 参数
- 添加 Referer 头绕过防盗链
- 返回图片数据
- 添加 CORS 头

## 调试技巧

### 查看代理请求

打开浏览器开发者工具（F12）→ Network 标签：

```
开发环境：
- 请求 URL: http://localhost:3333/api/container/getIndex
- 实际请求: http://192.168.1.125:9880/api/container/getIndex

生产环境：
- 请求 URL: http://your-domain.com/api/container/getIndex
- 实际请求: https://m.weibo.cn/api/container/getIndex
```

### 查看 Vite 代理日志

Vite 开发服务器会在终端显示代理日志：

```bash
vite v5.x.x dev server running at:

> Local:    http://localhost:3333/
> Network:  http://192.168.1.x:3333/

[vite] http proxy: /api/container/getIndex -> http://192.168.1.125:9880/api/container/getIndex
```

### 测试后端服务

```bash
# 测试博主信息接口
curl "http://192.168.1.125:9880/api/container/getIndex?type=uid&value=6052726496&containerid=1005056052726496"

# 测试微博列表接口
curl "http://192.168.1.125:9880/api/container/getIndex?type=uid&value=6052726496&containerid=1076036052726496&page=1"

# 测试图片代理接口
curl -I "http://192.168.1.125:9880/image?url=https://wx1.sinaimg.cn/large/xxx.jpg"
```

## 常见问题

### Q1: 开发环境请求失败

**检查：**
1. 后端服务是否运行：`curl http://192.168.1.125:9880/api/...`
2. 网络是否可达：`ping 192.168.1.125`
3. 防火墙是否阻止：检查端口 9880

### Q2: CORS 错误

**原因：** Vite 代理已设置 `changeOrigin: true`，不应该有 CORS 问题。

**检查：**
- 确认后端服务返回了正确的 CORS 头
- 查看浏览器控制台的具体错误信息

### Q3: 图片无法加载

**检查：**
1. 图片 URL 是否正确
2. 后端图片代理是否正常工作
3. 查看 Network 标签的图片请求状态

### Q4: 生产环境与开发环境行为不一致

**原因：**
- 开发环境：Vite 代理到 `http://192.168.1.125:9880`
- 生产环境：Nginx 代理到 `https://m.weibo.cn`

**解决：**
- 确保后端服务返回的数据格式与微博 API 一致
- 测试两种环境的 API 响应

## 部署清单

### 开发环境

- [x] 配置 Vite 代理
- [x] 设置环境变量 `VITE_WORKER_URL=`
- [x] 删除 mockData 代码
- [x] 测试 API 请求
- [x] 测试图片加载

### 生产环境

- [x] 配置 Nginx 代理（nginx-full.conf）
- [x] 设置环境变量 `VITE_WORKER_URL=`
- [x] 构建 Docker 镜像
- [x] 部署容器
- [x] 测试功能

## 总结

### 变更内容

1. ✅ 添加 Vite 开发代理配置
2. ✅ 删除所有 mockData 代码
3. ✅ 改进错误处理
4. ✅ 统一开发和生产环境的 API 调用方式

### 优势

- ✅ 开发环境使用本地后端服务
- ✅ 生产环境使用 Nginx 代理
- ✅ 无需模拟数据
- ✅ 真实的 API 测试
- ✅ 统一的代码逻辑

### 下一步

1. 启动后端服务（`http://192.168.1.125:9880`）
2. 启动开发服务器（`pnpm dev`）
3. 测试功能是否正常
4. 如有问题，查看浏览器控制台和终端日志
