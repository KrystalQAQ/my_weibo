# Cloudflare Worker 部署指南

这个 Worker 提供微博 API 反代和图片防盗链代理服务。

## 功能特性

### 1. 微博 API 反代
- 路径：`/api/*`
- 功能：代理微博 API 请求，解决跨域问题
- 示例：
  ```
  https://your-worker.workers.dev/api/container/getIndex?type=uid&value=6052726496&containerid=1005056052726496
  ```

### 2. 图片防盗链代理
- 路径：`/image?url=<图片URL>` 或 `/img?url=<图片URL>`
- 功能：绕过微博图片的 Referer 防盗链检查
- 示例：
  ```
  https://your-worker.workers.dev/image?url=https://wx1.sinaimg.cn/large/xxx.jpg
  ```

### 3. CORS 支持
- 自动添加 CORS 头，支持跨域请求
- 支持 OPTIONS 预检请求

### 4. 安全特性
- 图片代理仅允许微博相关域名（sinaimg.cn, sina.cn, weibo.com, weibocdn.com）
- 完善的错误处理和响应

## 部署步骤

### 方法一：通过 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 点击 **Create Application** → **Create Worker**
4. 给 Worker 命名（例如：`weibo-proxy`）
5. 点击 **Deploy**
6. 部署后，点击 **Edit Code**
7. 将 `worker.js` 的内容复制粘贴到编辑器中
8. 点击 **Save and Deploy**

### 方法二：使用 Wrangler CLI

1. 安装 Wrangler：
   ```bash
   npm install -g wrangler
   ```

2. 登录 Cloudflare：
   ```bash
   wrangler login
   ```

3. 创建 `wrangler.toml` 配置文件：
   ```toml
   name = "weibo-proxy"
   main = "worker.js"
   compatibility_date = "2024-01-01"
   ```

4. 部署：
   ```bash
   wrangler deploy
   ```

## 在前端项目中使用

### 1. 创建环境变量

在项目根目录创建 `.env` 文件：

```env
# Cloudflare Worker 地址
VITE_WORKER_URL=https://your-worker.workers.dev
```

### 2. 修改 API 请求

在 `src/pages/weibo/[id].vue` 中使用代理：

```typescript
// 获取博主信息
async function fetchBloggerData() {
  loading.value = true
  error.value = ''

  try {
    const workerUrl = import.meta.env.VITE_WORKER_URL
    const bloggerId = bloggerId.value
    const containerId = `100505${bloggerId}`

    // 通过 Worker 代理请求
    const response = await fetch(
      `${workerUrl}/api/container/getIndex?type=uid&value=${bloggerId}&containerid=${containerId}`
    )

    const data = await response.json()

    if (data.ok === 1) {
      bloggerData.value = data
      weiboStore.saveBloggerData(bloggerId, data.data.userInfo)
      weiboStore.switchBlogger(bloggerId)
    } else {
      error.value = '加载失败，请稍后重试'
    }
  } catch (err) {
    error.value = '加载失败，请稍后重试'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 获取微博列表
async function fetchWeiboList() {
  loadingWeibos.value = true

  try {
    const workerUrl = import.meta.env.VITE_WORKER_URL
    const bloggerId = bloggerId.value
    const containerId = `107603${bloggerId}`

    const response = await fetch(
      `${workerUrl}/api/container/getIndex?type=uid&value=${bloggerId}&containerid=${containerId}`
    )

    const data: WeiboHomeData = await response.json()

    if (data.ok === 1 && data.data.cards) {
      weiboCards.value = data.data.cards.filter(card => card.mblog)
      weiboStore.saveBloggerWeibos(bloggerId, weiboCards.value)
    }
  } catch (err) {
    console.error('加载微博列表失败:', err)
  } finally {
    loadingWeibos.value = false
  }
}
```

### 3. 代理图片 URL

创建一个工具函数来处理图片 URL：

```typescript
// src/utils/image.ts
export function proxyImageUrl(url: string): string {
  if (!url) return ''

  const workerUrl = import.meta.env.VITE_WORKER_URL
  if (!workerUrl) return url

  // 如果是微博图片，使用代理
  if (url.includes('sinaimg.cn') || url.includes('sina.cn')) {
    return `${workerUrl}/image?url=${encodeURIComponent(url)}`
  }

  return url
}
```

在模板中使用：

```vue
<img :src="proxyImageUrl(bloggerData.data.userInfo.avatar_hd)" />
```

## API 说明

### 获取用户信息

```
GET /api/container/getIndex?type=uid&value={博主ID}&containerid=100505{博主ID}
```

响应示例：
```json
{
  "ok": 1,
  "data": {
    "userInfo": {
      "id": 6052726496,
      "screen_name": "博主昵称",
      "profile_image_url": "头像URL",
      "avatar_hd": "高清头像URL",
      "description": "个人简介",
      "followers_count": "粉丝数",
      "follow_count": 关注数,
      "statuses_count": 微博数
    }
  }
}
```

### 获取微博列表

```
GET /api/container/getIndex?type=uid&value={博主ID}&containerid=107603{博主ID}
```

响应示例：
```json
{
  "ok": 1,
  "data": {
    "cards": [
      {
        "mblog": {
          "id": "微博ID",
          "text": "微博内容",
          "created_at": "发布时间",
          "pics": [图片列表],
          "reposts_count": 转发数,
          "comments_count": 评论数,
          "attitudes_count": 点赞数
        }
      }
    ]
  }
}
```

## 注意事项

1. **免费额度**：Cloudflare Workers 免费版每天有 100,000 次请求限制
2. **缓存策略**：图片代理设置了长期缓存（1年），减少重复请求
3. **域名限制**：图片代理仅支持微博相关域名，防止滥用
4. **错误处理**：所有错误都会返回 JSON 格式的错误信息

## 测试

部署后访问 Worker 根路径，会看到 API 使用说明：

```bash
curl https://your-worker.workers.dev/
```

测试图片代理：

```bash
curl "https://your-worker.workers.dev/image?url=https://wx1.sinaimg.cn/large/xxx.jpg"
```

测试 API 代理：

```bash
curl "https://your-worker.workers.dev/api/container/getIndex?type=uid&value=6052726496&containerid=1005056052726496"
```

## 自定义域名（可选）

1. 在 Cloudflare Dashboard 中进入你的 Worker
2. 点击 **Triggers** → **Custom Domains**
3. 添加自定义域名（需要域名托管在 Cloudflare）
4. 更新 `.env` 中的 `VITE_WORKER_URL`

## 故障排查

### 跨域问题
- 确认 Worker 已正确添加 CORS 头
- 检查浏览器控制台的错误信息

### 图片加载失败
- 确认图片 URL 是否正确
- 检查图片域名是否在允许列表中
- 查看 Worker 日志（Dashboard → Workers → 你的 Worker → Logs）

### API 请求失败
- 确认微博 API 参数是否正确
- 检查 containerid 格式（用户信息：100505+ID，微博列表：107603+ID）
- 查看 Worker 返回的错误信息
