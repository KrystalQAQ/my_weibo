# 配置总结

## 已完成的工作

### 1. 添加 Vite 开发代理

**文件：** `vite.config.ts`

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://192.168.1.125:9880',
      changeOrigin: true,
    },
    '/image': {
      target: 'http://192.168.1.125:9880',
      changeOrigin: true,
    },
  },
},
```

### 2. 删除 mockData

**文件：** `src/pages/weibo/[id].vue`

删除的函数：
- ❌ `useMockBloggerData()` - 模拟博主数据
- ❌ `useMockWeiboData()` - 模拟微博数据

保留的功能：
- ✅ 错误处理和提示
- ✅ 加载状态
- ✅ 重试功能

### 3. 环境变量配置

**文件：** `.env.development` 和 `.env.production`

```bash
# 留空使用代理（Vite 或 Nginx）
VITE_WORKER_URL=
```

## 工作流程

### 开发环境

```
浏览器 → Vite Dev Server (localhost:3333)
         ↓
    代理到 http://192.168.1.125:9880
         ↓
    后端服务返回数据
```

### 生产环境

```
浏览器 → Nginx 容器 (端口 80)
         ↓
    代理到 https://m.weibo.cn
         ↓
    微博 API 返回数据
```

## 使用方法

### 启动开发

```bash
# 1. 确保后端服务运行
curl http://192.168.1.125:9880/api/...

# 2. 启动开发服务器
pnpm dev

# 3. 访问应用
open http://localhost:3333
```

### 构建部署

```bash
# 1. 构建
pnpm build

# 2. 构建 Docker 镜像
docker build -t my-vitesse-app .

# 3. 运行容器
docker run -d -p 80:80 my-vitesse-app
```

## 测试清单

- [ ] 后端服务是否运行（`http://192.168.1.125:9880`）
- [ ] 开发服务器是否正常启动（`pnpm dev`）
- [ ] API 请求是否成功（查看 Network 标签）
- [ ] 图片是否正常加载
- [ ] 错误处理是否正常显示

## 文档

- `VITE-PROXY-GUIDE.md` - Vite 代理详细说明
- `QUICK-START.md` - Nginx 代理快速指南
- `MIGRATION-GUIDE.md` - 从 Cloudflare Worker 迁移
- `DEPLOYMENT-GUIDE.md` - Docker 部署详解

## 注意事项

1. **开发环境**需要后端服务运行在 `http://192.168.1.125:9880`
2. **生产环境**使用 Nginx 代理到微博 API
3. **不再使用**模拟数据，所有数据来自真实 API
4. **错误处理**会显示友好的错误提示和重试按钮
