# 使用 Nginx 替代 Cloudflare Worker - 快速指南

## TL;DR（太长不看版）

**是的，你可以不用 worker.js！** 直接用 Nginx 反向代理替代 Cloudflare Worker。

## 一句话总结

你的项目已经有很好的代理抽象层（`src/utils/proxy.ts`），只需要：
1. 设置环境变量 `VITE_WORKER_URL=`（留空）
2. 使用 `nginx-full.conf` 配置
3. 部署 Docker 容器

## 当前架构

```
┌─────────────────────────────────────────────────────────┐
│ 前端代码 (src/utils/proxy.ts)                           │
│ ├── VITE_WORKER_URL 环境变量                            │
│ ├── 如果有值：使用 Cloudflare Worker                    │
│ └── 如果为空：使用相对路径（Nginx 代理）                │
└─────────────────────────────────────────────────────────┘
```

## 两种方案对比

| 特性 | Cloudflare Worker | Nginx 反向代理 |
|------|------------------|---------------|
| 部署 | 需要单独部署 | 统一部署 ✅ |
| 限制 | 10 万/天 | 无限制 ✅ |
| 延迟 | 50-100ms | 20-50ms ✅ |
| 成本 | 免费/付费 | 服务器成本 |
| 控制 | 受限 | 完全控制 ✅ |

## 快速迁移（3 步）

### 步骤 1: 配置环境变量

```bash
# .env.production
VITE_WORKER_URL=
```

**就这么简单！** 留空表示使用 Nginx 代理。

### 步骤 2: 使用正确的 Dockerfile

已更新 Dockerfile 使用 `nginx-full.conf`：

```dockerfile
COPY nginx-full.conf /etc/nginx/conf.d/default.conf
```

### 步骤 3: 部署

```bash
# 提交代码
git add .
git commit -m "Use Nginx proxy instead of Cloudflare Worker"
git push origin main

# GitHub Actions 自动构建
# 拉取并运行
docker pull ghcr.io/<username>/<repo>:latest
docker run -d -p 80:80 ghcr.io/<username>/<repo>:latest
```

## 工作原理

### 前端代码（无需修改）

```typescript
// src/utils/proxy.ts
const WORKER_URL = import.meta.env.VITE_WORKER_URL || ''

// 如果 WORKER_URL 为空，使用相对路径
if (WORKER_URL) {
  fetch(`${WORKER_URL}/api/...`)  // → https://worker.dev/api/...
} else {
  fetch(`/api/...`)  // → /api/... (Nginx 代理)
}
```

### Nginx 配置（已创建）

```nginx
# nginx-full.conf

# 微博 API 代理
location /api/ {
    proxy_pass https://m.weibo.cn/api/;
    add_header Access-Control-Allow-Origin "*";
}

# 图片代理
location /image {
    proxy_pass $arg_url;
    proxy_set_header Referer "https://weibo.com/";
}
```

### 请求流程

```
浏览器请求 /api/container/getIndex
         ↓
    Nginx 接收
         ↓
代理到 https://m.weibo.cn/api/container/getIndex
         ↓
    返回数据 + CORS 头
         ↓
    浏览器接收
```

## 测试

```bash
# 本地测试
docker build -t test .
docker run -d -p 8080:80 test

# 测试 API
curl "http://localhost:8080/api/container/getIndex?type=uid&value=6052726496&containerid=1005056052726496"

# 测试图片
curl -I "http://localhost:8080/image?url=https://wx1.sinaimg.cn/large/xxx.jpg"

# 测试服务信息
curl http://localhost:8080/proxy-info
```

## 文件清单

已创建的文件：

- ✅ `nginx-full.conf` - 完整的 Nginx 配置（包含代理）
- ✅ `.env.production` - 生产环境配置
- ✅ `.env.development` - 开发环境配置
- ✅ `.env.example` - 环境变量示例
- ✅ `MIGRATION-GUIDE.md` - 详细迁移指南
- ✅ `PROXY-COMPARISON.md` - 方案对比
- ✅ `Dockerfile` - 已更新使用 nginx-full.conf

## 常见问题

### Q: 需要修改前端代码吗？

**A**: 不需要！你的代码已经有很好的抽象层，只需要设置环境变量。

### Q: 可以同时保留两种方案吗？

**A**: 可以！通过环境变量切换：
- 开发环境：`VITE_WORKER_URL=https://worker.dev`
- 生产环境：`VITE_WORKER_URL=`

### Q: 如何回滚？

**A**: 修改环境变量为 Worker URL，重新构建部署即可。

### Q: 性能会更好吗？

**A**: 对于国内用户，Nginx 代理延迟更低（20-50ms vs 50-100ms）。

### Q: 有请求限制吗？

**A**: 没有！Nginx 代理无请求限制。

## 推荐配置

### 生产环境（推荐）

```bash
# .env.production
VITE_WORKER_URL=
```

使用 Nginx 代理，享受：
- ✅ 无限制
- ✅ 统一部署
- ✅ 更低延迟

### 开发环境（可选）

```bash
# .env.development
VITE_WORKER_URL=https://your-worker.workers.dev
```

如果你想在开发时使用 Worker（可选）。

### 混合方案（灵活）

```bash
# .env.development - 开发用 Worker
VITE_WORKER_URL=https://your-worker.workers.dev

# .env.production - 生产用 Nginx
VITE_WORKER_URL=
```

## 下一步

1. **确认环境变量**: 检查 `.env.production` 中 `VITE_WORKER_URL=`
2. **提交代码**: `git add . && git commit -m "Use Nginx proxy" && git push`
3. **等待构建**: GitHub Actions 自动构建镜像
4. **部署测试**: 拉取镜像并运行
5. **验证功能**: 测试微博 API 和图片代理
6. **停用 Worker**: （可选）删除 Cloudflare Worker

## 总结

你的项目设计得很好，已经有了代理抽象层。迁移到 Nginx 非常简单：

1. ✅ 环境变量设置为空
2. ✅ 使用 nginx-full.conf
3. ✅ 部署 Docker 容器

**就这么简单！** 无需修改任何前端代码。

## 详细文档

- `MIGRATION-GUIDE.md` - 完整迁移指南
- `PROXY-COMPARISON.md` - 方案详细对比
- `DEPLOYMENT-GUIDE.md` - Docker 部署流程详解
- `DEPLOY.md` - 部署命令参考

## 需要帮助？

如果遇到问题：
1. 检查环境变量是否正确
2. 查看 Nginx 日志：`docker logs <container>`
3. 测试代理端点：`curl http://localhost/proxy-info`
4. 参考 `MIGRATION-GUIDE.md` 故障排查部分
