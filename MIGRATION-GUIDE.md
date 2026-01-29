# 从 Cloudflare Worker 迁移到 Nginx 反向代理

## 概述

本指南说明如何将微博 API 和图片代理从 Cloudflare Worker 迁移到 Nginx 反向代理。

## 为什么迁移？

### Cloudflare Worker 的限制

- ❌ 免费版每天 10 万请求限制
- ❌ 需要单独部署和管理
- ❌ 依赖第三方服务
- ❌ 配置分散（前端 + Worker）

### Nginx 反向代理的优势

- ✅ 无请求限制
- ✅ 统一部署（前端 + 代理在同一容器）
- ✅ 完全控制
- ✅ 配置集中管理
- ✅ 更低延迟（国内用户）

## 功能对比

| 功能 | Cloudflare Worker | Nginx 反向代理 | 状态 |
|------|------------------|---------------|------|
| 微博 API 代理 | ✅ | ✅ | 完全兼容 |
| 图片防盗链代理 | ✅ | ✅ | 完全兼容 |
| CORS 跨域支持 | ✅ | ✅ | 完全兼容 |
| 请求限流 | ❌ | ✅ | Nginx 更强 |
| 缓存控制 | ✅ | ✅ | 完全兼容 |
| 错误处理 | ✅ | ✅ | 完全兼容 |

## 迁移步骤

### 步骤 1: 更新 Nginx 配置

已创建 `nginx-full.conf`，包含完整的代理配置。

**关键配置：**

```nginx
# 微博 API 代理
location /api/ {
    proxy_pass https://m.weibo.cn/api/;
    proxy_set_header Host m.weibo.cn;
    proxy_set_header Referer "https://m.weibo.cn/";
    add_header Access-Control-Allow-Origin "*" always;
}

# 图片代理
location ~ ^/(image|img)$ {
    set $image_url $arg_url;
    proxy_pass $image_url;
    proxy_set_header Referer "https://weibo.com/";
    add_header Access-Control-Allow-Origin "*" always;
}
```

### 步骤 2: 更新 Dockerfile

已更新 Dockerfile 使用 `nginx-full.conf`：

```dockerfile
COPY nginx-full.conf /etc/nginx/conf.d/default.conf
```

### 步骤 3: 更新前端代码

#### 原来的代码（使用 Cloudflare Worker）

```javascript
// 使用 Cloudflare Worker
const WORKER_URL = 'https://your-worker.workers.dev'

// API 请求
fetch(`${WORKER_URL}/api/container/getIndex?...`)

// 图片代理
const imageUrl = `${WORKER_URL}/image?url=${encodeURIComponent(originalUrl)}`
```

#### 新的代码（使用 Nginx 代理）

```javascript
// 使用相对路径（Nginx 代理）
const API_BASE = ''  // 空字符串表示当前域名

// API 请求
fetch(`/api/container/getIndex?...`)

// 图片代理
const imageUrl = `/image?url=${encodeURIComponent(originalUrl)}`
```

#### 环境变量配置（推荐）

```javascript
// .env.development
VITE_API_BASE=https://your-worker.workers.dev

// .env.production
VITE_API_BASE=

// 代码中使用
const API_BASE = import.meta.env.VITE_API_BASE || ''
fetch(`${API_BASE}/api/container/getIndex?...`)
```

### 步骤 4: 查找并替换前端代码

需要查找项目中所有使用 Worker URL 的地方：

```bash
# 搜索 Worker URL
grep -r "workers.dev" src/
grep -r "worker" src/ | grep -i "url\|api"
```

**可能需要修改的文件：**
- `src/pages/weibo/*.vue` - 微博相关页面
- `src/composables/*.ts` - API 调用函数
- `src/utils/*.ts` - 工具函数
- `.env*` - 环境变量

### 步骤 5: 测试功能

#### 本地测试

```bash
# 1. 构建镜像
docker build -t my-vitesse-app .

# 2. 运行容器
docker run -d -p 8080:80 --name test-app my-vitesse-app

# 3. 测试 API 代理
curl "http://localhost:8080/api/container/getIndex?type=uid&value=6052726496&containerid=1005056052726496"

# 4. 测试图片代理
curl -I "http://localhost:8080/image?url=https://wx1.sinaimg.cn/large/xxx.jpg"

# 5. 测试服务信息
curl http://localhost:8080/proxy-info

# 6. 清理
docker stop test-app && docker rm test-app
```

#### 浏览器测试

1. 访问 `http://localhost:8080`
2. 打开浏览器开发者工具（F12）
3. 查看 Network 标签
4. 测试微博相关功能
5. 确认请求路径为 `/api/*` 和 `/image?url=*`

### 步骤 6: 部署到生产环境

```bash
# 1. 提交代码
git add .
git commit -m "Migrate from Cloudflare Worker to Nginx proxy"
git push origin main

# 2. GitHub Actions 自动构建镜像

# 3. 在服务器上拉取新镜像
docker pull ghcr.io/<username>/<repo>:latest

# 4. 停止旧容器
docker stop my-vitesse-app
docker rm my-vitesse-app

# 5. 启动新容器
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest

# 6. 验证功能
curl http://your-domain.com/proxy-info
```

### 步骤 7: 停用 Cloudflare Worker（可选）

如果确认 Nginx 代理工作正常，可以停用 Cloudflare Worker：

```bash
# 删除 Worker
wrangler delete

# 或者保留作为备份（不推荐，会产生混淆）
```

## API 端点对比

### Cloudflare Worker

```
https://your-worker.workers.dev/api/container/getIndex?...
https://your-worker.workers.dev/image?url=https://...
```

### Nginx 反向代理

```
https://your-domain.com/api/container/getIndex?...
https://your-domain.com/image?url=https://...
```

**注意**: 路径完全相同，只是域名不同。

## 前端代码修改示例

### 示例 1: API 调用

#### 修改前

```typescript
// src/composables/useWeibo.ts
const WORKER_URL = 'https://your-worker.workers.dev'

export function useWeibo() {
  async function getUserInfo(uid: string) {
    const response = await fetch(
      `${WORKER_URL}/api/container/getIndex?type=uid&value=${uid}&containerid=100505${uid}`
    )
    return response.json()
  }

  return { getUserInfo }
}
```

#### 修改后

```typescript
// src/composables/useWeibo.ts
const API_BASE = import.meta.env.VITE_API_BASE || ''

export function useWeibo() {
  async function getUserInfo(uid: string) {
    const response = await fetch(
      `${API_BASE}/api/container/getIndex?type=uid&value=${uid}&containerid=100505${uid}`
    )
    return response.json()
  }

  return { getUserInfo }
}
```

### 示例 2: 图片代理

#### 修改前

```vue
<script setup lang="ts">
const WORKER_URL = 'https://your-worker.workers.dev'

function getProxiedImageUrl(originalUrl: string) {
  return `${WORKER_URL}/image?url=${encodeURIComponent(originalUrl)}`
}
</script>

<template>
  <img :src="getProxiedImageUrl(imageUrl)" alt="Weibo Image">
</template>
```

#### 修改后

```vue
<script setup lang="ts">
const API_BASE = import.meta.env.VITE_API_BASE || ''

function getProxiedImageUrl(originalUrl: string) {
  return `${API_BASE}/image?url=${encodeURIComponent(originalUrl)}`
}
</script>

<template>
  <img :src="getProxiedImageUrl(imageUrl)" alt="Weibo Image">
</template>
```

### 示例 3: 环境变量配置

```bash
# .env.development（开发环境，可选使用 Worker）
VITE_API_BASE=https://your-worker.workers.dev

# .env.production（生产环境，使用 Nginx）
VITE_API_BASE=
```

## 故障排查

### 问题 1: API 请求返回 404

**原因**: Nginx 配置未正确加载

**解决**:
```bash
# 检查 Nginx 配置
docker exec my-vitesse-app nginx -t

# 查看配置文件
docker exec my-vitesse-app cat /etc/nginx/conf.d/default.conf

# 重启容器
docker restart my-vitesse-app
```

### 问题 2: CORS 错误

**原因**: CORS 头未正确设置

**解决**: 检查 Nginx 配置中的 `add_header Access-Control-Allow-Origin "*" always;`

### 问题 3: 图片代理返回 400

**原因**: 缺少 `url` 参数

**解决**: 确保请求格式为 `/image?url=https://...`

### 问题 4: 图片代理返回 404

**原因**: DNS 解析失败或图片 URL 无效

**解决**:
```bash
# 检查 DNS 解析器配置
docker exec my-vitesse-app cat /etc/resolv.conf

# 测试 DNS 解析
docker exec my-vitesse-app nslookup wx1.sinaimg.cn
```

### 问题 5: 请求超时

**原因**: 代理超时设置过短

**解决**: 调整 Nginx 配置中的超时设置：
```nginx
proxy_connect_timeout 30s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

## 性能优化

### 1. 启用缓存

```nginx
# 在 http 块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

# 在 location /api/ 中添加
proxy_cache api_cache;
proxy_cache_valid 200 5m;
proxy_cache_key "$request_uri";
```

### 2. 启用限流

```nginx
# 在 http 块中添加
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# 在 location /api/ 中添加
limit_req zone=api_limit burst=20 nodelay;
```

### 3. 启用连接池

```nginx
# 在 location /api/ 中添加
proxy_http_version 1.1;
proxy_set_header Connection "";
keepalive_timeout 65;
```

## 监控和日志

### 查看访问日志

```bash
# 实时查看日志
docker logs -f my-vitesse-app

# 查看 Nginx 访问日志
docker exec my-vitesse-app tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
docker exec my-vitesse-app tail -f /var/log/nginx/error.log
```

### 统计 API 请求

```bash
# 统计 API 请求次数
docker exec my-vitesse-app grep "/api/" /var/log/nginx/access.log | wc -l

# 统计图片代理请求次数
docker exec my-vitesse-app grep "/image" /var/log/nginx/access.log | wc -l

# 查看最常访问的 API
docker exec my-vitesse-app grep "/api/" /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -10
```

## 回滚方案

如果迁移后出现问题，可以快速回滚到 Cloudflare Worker：

### 方案 1: 环境变量切换

```bash
# 修改环境变量
VITE_API_BASE=https://your-worker.workers.dev

# 重新构建和部署
npm run build
docker build -t my-vitesse-app .
docker run -d -p 80:80 my-vitesse-app
```

### 方案 2: 使用旧镜像

```bash
# 回滚到之前的镜像
docker pull ghcr.io/<username>/<repo>:main-<old-commit-sha>
docker stop my-vitesse-app
docker rm my-vitesse-app
docker run -d --name my-vitesse-app -p 80:80 ghcr.io/<username>/<repo>:main-<old-commit-sha>
```

## 混合方案（可选）

如果想同时保留两种方案：

```typescript
// src/config.ts
const USE_WORKER = import.meta.env.VITE_USE_WORKER === 'true'
const WORKER_URL = 'https://your-worker.workers.dev'

export const API_BASE = USE_WORKER ? WORKER_URL : ''

// 使用
import { API_BASE } from '@/config'
fetch(`${API_BASE}/api/...`)
```

## 总结

### 迁移清单

- [x] 创建 `nginx-full.conf` 配置文件
- [x] 更新 `Dockerfile`
- [ ] 查找并替换前端代码中的 Worker URL
- [ ] 配置环境变量
- [ ] 本地测试功能
- [ ] 部署到生产环境
- [ ] 验证功能正常
- [ ] 停用 Cloudflare Worker（可选）

### 预期效果

- ✅ 无请求限制
- ✅ 统一部署管理
- ✅ 更低延迟（国内用户）
- ✅ 完全控制
- ✅ 功能完全兼容

### 注意事项

1. **测试充分**: 迁移前务必在本地充分测试
2. **备份数据**: 虽然是无状态服务，但建议保留旧配置
3. **监控日志**: 迁移后密切关注日志，及时发现问题
4. **灰度发布**: 如果有条件，可以先部署到测试环境
5. **保留 Worker**: 建议保留 Cloudflare Worker 作为备份，至少保留一周

## 需要帮助？

如果遇到问题，请检查：
1. Nginx 配置是否正确加载
2. DNS 解析器是否正常工作
3. 前端代码是否正确修改
4. 环境变量是否正确配置
5. Docker 容器是否正常运行
