# Cloudflare Worker vs Nginx 反向代理对比

## 方案对比

| 特性 | Cloudflare Worker | Nginx 反向代理 |
|------|------------------|---------------|
| **部署位置** | Cloudflare 边缘节点（全球） | 你的服务器 |
| **延迟** | 低（就近访问） | 取决于服务器位置 |
| **请求限制** | 免费版 10 万/天 | 无限制 ✅ |
| **成本** | 免费/付费 | 服务器成本 |
| **控制权** | 受限于 Cloudflare | 完全控制 ✅ |
| **配置复杂度** | 需要单独部署 | 统一部署 ✅ |
| **适合场景** | 全球用户访问 | 国内用户/自建服务 |

## 推荐方案

### 方案 1: Nginx 反向代理（推荐）

**适合场景：**
- ✅ 已有 Docker 部署
- ✅ 主要用户在国内
- ✅ 想要统一管理
- ✅ 不想依赖第三方服务

**优势：**
- 前端 + 代理在同一个容器
- 无请求限制
- 配置简单
- 完全控制

### 方案 2: Cloudflare Worker

**适合场景：**
- ✅ 全球用户访问
- ✅ 需要 CDN 加速
- ✅ 不想自己维护服务器
- ✅ 请求量在免费额度内

**优势：**
- 全球边缘节点
- 自动扩展
- 高可用性

### 方案 3: 混合方案

**适合场景：**
- ✅ 既有全球用户，又有国内用户
- ✅ 需要高可用性

**架构：**
```
国内用户 → Nginx 反向代理 → 微博 API
国外用户 → Cloudflare Worker → 微博 API
```

## 实现对比

### Cloudflare Worker 实现

```javascript
// worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleApiProxy(request, url) {
  const weiboApiUrl = `https://m.weibo.cn${url.pathname}${url.search}`
  const response = await fetch(weiboApiUrl, {
    headers: {
      'User-Agent': '...',
      'Referer': 'https://m.weibo.cn/'
    }
  })
  return new Response(response.body, {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  })
}
```

**部署：**
```bash
wrangler deploy
```

### Nginx 反向代理实现

```nginx
# nginx.conf
location /api/ {
    proxy_pass https://m.weibo.cn/api/;
    proxy_set_header User-Agent "Mozilla/5.0...";
    proxy_set_header Referer "https://m.weibo.cn/";
    add_header Access-Control-Allow-Origin "*";
}

location /image {
    proxy_pass $arg_url;
    proxy_set_header Referer "https://weibo.com/";
    add_header Access-Control-Allow-Origin "*";
}
```

**部署：**
```bash
docker build -t app .
docker run -p 80:80 app
```

## 性能对比

### 延迟测试（假设）

| 场景 | Cloudflare Worker | Nginx（国内服务器） |
|------|------------------|-------------------|
| 国内用户访问 | 50-100ms | 20-50ms ✅ |
| 国外用户访问 | 20-50ms ✅ | 200-500ms |
| 微博 API 响应 | +50ms（边缘节点） | +20ms（直连） ✅ |

### 吞吐量

| 方案 | 并发请求 | 限制 |
|------|---------|------|
| Cloudflare Worker | 自动扩展 | 10 万/天（免费） |
| Nginx | 取决于服务器 | 无限制 ✅ |

## 成本对比

### Cloudflare Worker

- **免费版**: 10 万请求/天
- **付费版**: $5/月（1000 万请求）

### Nginx 反向代理

- **成本**: 服务器成本（已有）
- **流量**: 取决于服务器带宽
- **请求**: 无限制

## 迁移建议

### 从 Cloudflare Worker 迁移到 Nginx

**步骤：**

1. **更新 Nginx 配置**（添加反向代理规则）
2. **更新前端代码**（修改 API 地址）
3. **测试功能**（确保代理正常工作）
4. **停用 Cloudflare Worker**（可选保留作为备份）

### 保留两者（推荐）

**策略：**

```javascript
// 前端代码
const API_BASE = import.meta.env.PROD
  ? '/api'  // 生产环境使用 Nginx 代理
  : 'https://your-worker.workers.dev/api'  // 开发环境使用 Worker

// 或根据用户地理位置选择
const API_BASE = isChina ? '/api' : 'https://worker.dev/api'
```

## 安全考虑

### Cloudflare Worker

- ✅ 自动 DDoS 防护
- ✅ 隐藏源服务器 IP
- ⚠️ 代码公开（可被分析）

### Nginx 反向代理

- ⚠️ 需要自己配置防护
- ⚠️ 暴露服务器 IP
- ✅ 可以添加访问限制

**Nginx 安全加固：**

```nginx
# 限流
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20;
    proxy_pass https://m.weibo.cn/api/;
}

# IP 白名单（可选）
location /api/ {
    allow 1.2.3.4;
    deny all;
}
```

## 总结

### 选择 Nginx 反向代理，如果：

- ✅ 已有 Docker 部署
- ✅ 主要用户在国内
- ✅ 想要完全控制
- ✅ 不想依赖第三方

### 选择 Cloudflare Worker，如果：

- ✅ 全球用户访问
- ✅ 需要 CDN 加速
- ✅ 请求量不大
- ✅ 不想维护服务器

### 推荐方案：

**对于你的项目（已有 Docker 部署）：**

1. **主方案**: Nginx 反向代理（统一部署，无限制）
2. **备用方案**: Cloudflare Worker（作为备份或开发环境）

这样既能享受 Nginx 的灵活性，又能在需要时切换到 Cloudflare Worker。
