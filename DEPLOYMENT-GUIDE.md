# GitHub Docker 部署流程详解

## 概述

是的，**底层确实使用了 Nginx**。这个项目使用 **多阶段 Docker 构建**，最终运行的是一个 Nginx 服务器来提供静态文件服务。

## 完整部署流程图

```
开发者推送代码到 GitHub
         ↓
GitHub Actions 自动触发
         ↓
在 GitHub 服务器上构建 Docker 镜像
         ↓
推送镜像到 GitHub Container Registry
         ↓
用户从 GHCR 拉取镜像到服务器
         ↓
运行容器（Nginx 提供服务）
         ↓
用户通过浏览器访问应用
```

---

## 第一阶段：代码推送触发构建

### 1. 开发者推送代码

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### 2. GitHub Actions 自动触发

当代码推送到 `main` 分支时，GitHub 会自动检测到 `.github/workflows/docker.yml` 文件，并触发工作流。

**触发配置：**
```yaml
on:
  push:
    branches:
      - main
```

---

## 第二阶段：GitHub Actions 构建过程

### 工作流执行环境

- **运行环境**: Ubuntu 虚拟机（GitHub 提供的免费 Runner）
- **权限**: 自动获得 `GITHUB_TOKEN`，可以推送镜像到 GHCR

### 详细步骤解析

#### Step 1: 检出代码
```yaml
- name: Checkout repository
  uses: actions/checkout@v4
```

**作用**: 将你的仓库代码克隆到 GitHub Actions 的虚拟机上。

#### Step 2: 设置 Docker Buildx
```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
```

**作用**:
- 启用 Docker Buildx（Docker 的高级构建工具）
- 支持多平台构建（amd64/arm64）
- 支持构建缓存加速

#### Step 3: 登录到 GHCR
```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}  # 你的 GitHub 用户名
    password: ${{ secrets.GITHUB_TOKEN }}  # 自动提供的令牌
```

**作用**: 使用 GitHub 自动提供的令牌登录到容器注册表，无需手动配置密钥。

#### Step 4: 提取镜像元数据
```yaml
- name: Extract metadata for Docker
  id: meta
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/${{ github.repository }}
    tags: |
      type=ref,event=branch          # 例如: main
      type=sha,prefix={{branch}}-    # 例如: main-abc1234
      type=raw,value=latest,enable={{is_default_branch}}  # latest
```

**作用**: 自动生成镜像标签，例如：
- `ghcr.io/username/repo:main`
- `ghcr.io/username/repo:main-abc1234`
- `ghcr.io/username/repo:latest`

#### Step 5: 构建并推送镜像
```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: linux/amd64,linux/arm64  # 多平台构建
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    cache-from: type=gha  # 从 GitHub Actions 缓存读取
    cache-to: type=gha,mode=max  # 写入缓存
```

**作用**:
- 同时构建 amd64 和 arm64 两个架构的镜像
- 使用 GitHub Actions 缓存加速构建
- 推送到 GHCR

---

## 第三阶段：Docker 镜像构建详解

### Dockerfile 多阶段构建

你的 Dockerfile 使用了**两阶段构建**，这是最佳实践：

#### 阶段 1: 构建阶段（build-stage）

```dockerfile
FROM node:20-alpine AS build-stage

WORKDIR /app
RUN corepack enable

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
```

**详细过程：**

1. **基础镜像**: `node:20-alpine`
   - Alpine Linux（轻量级 Linux 发行版，只有 5MB）
   - Node.js 20
   - 用途：编译 Vue 应用

2. **启用 pnpm**: `corepack enable`
   - Corepack 是 Node.js 自带的包管理器管理工具
   - 自动安装正确版本的 pnpm

3. **安装依赖**: `pnpm install --frozen-lockfile`
   - 使用 BuildKit 缓存加速（`--mount=type=cache`）
   - `--frozen-lockfile` 确保使用锁定的依赖版本

4. **构建应用**: `pnpm build`
   - 执行 `vite-ssg build`
   - 生成静态文件到 `/app/dist` 目录
   - 包含 HTML、CSS、JavaScript、图片等

**构建产物：**
```
/app/dist/
├── index.html
├── assets/
│   ├── index-abc123.js
│   ├── index-def456.css
│   └── logo-xyz789.png
└── favicon.ico
```

#### 阶段 2: 生产阶段（production-stage）

```dockerfile
FROM nginx:stable-alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**详细过程：**

1. **基础镜像**: `nginx:stable-alpine`
   - Nginx 稳定版
   - Alpine Linux（轻量级）
   - 最终镜像大小约 40MB（相比 Node.js 镜像的 180MB）

2. **复制构建产物**: `COPY --from=build-stage /app/dist /usr/share/nginx/html`
   - 从第一阶段复制编译好的静态文件
   - 放到 Nginx 的默认网站目录
   - **关键点**: 最终镜像不包含 Node.js、源代码、node_modules

3. **暴露端口**: `EXPOSE 80`
   - 声明容器监听 80 端口
   - 这是 Nginx 的默认 HTTP 端口

4. **启动命令**: `CMD ["nginx", "-g", "daemon off;"]`
   - 启动 Nginx
   - `daemon off` 让 Nginx 在前台运行（Docker 容器要求）

### 为什么使用多阶段构建？

**优势对比：**

| 方面 | 单阶段构建 | 多阶段构建 |
|------|-----------|-----------|
| 镜像大小 | ~180MB (包含 Node.js) | ~40MB (只有 Nginx) |
| 安全性 | 包含构建工具和源代码 | 只包含运行时文件 |
| 启动速度 | 慢 | 快 |
| 攻击面 | 大（更多软件包） | 小（最小化） |

---

## 第四阶段：Nginx 服务详解

### Nginx 的角色

Nginx 在这里充当 **静态文件服务器**，负责：

1. **提供 HTTP 服务**: 监听 80 端口
2. **服务静态文件**: 响应浏览器请求，返回 HTML/CSS/JS
3. **处理路由**: 支持 Vue Router 的 History 模式
4. **性能优化**:
   - Gzip 压缩
   - 缓存控制
   - 并发连接处理

### Nginx 默认配置

Nginx 官方镜像自带的默认配置（`/etc/nginx/nginx.conf`）：

```nginx
user  nginx;
worker_processes  auto;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  localhost;

        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }
}
```

### Vue Router History 模式问题

**问题**: 默认配置不支持 Vue Router 的 History 模式。

**现象**:
- 访问 `http://localhost/` ✅ 正常
- 访问 `http://localhost/about` ❌ 404 错误
- 刷新页面 ❌ 404 错误

**原因**: Nginx 会尝试查找 `/usr/share/nginx/html/about` 文件，但实际上只有 `index.html`。

**解决方案**: 需要自定义 Nginx 配置。

---

## 优化建议：自定义 Nginx 配置

### 创建自定义配置文件

创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # 支持 Vue Router History 模式
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
```

### 更新 Dockerfile

```dockerfile
FROM node:20-alpine AS build-stage

WORKDIR /app
RUN corepack enable

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:stable-alpine AS production-stage

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 完整部署链路示意图

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 开发阶段（本地）                                          │
├─────────────────────────────────────────────────────────────┤
│ 开发者编写 Vue 代码                                          │
│ ├── src/components/HelloWorld.vue                           │
│ ├── src/pages/index.vue                                     │
│ └── src/App.vue                                             │
│                                                             │
│ git push origin main                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. GitHub Actions（云端构建）                                │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 构建阶段 1: Node.js 容器                                 │ │
│ │ ├── pnpm install（安装依赖）                            │ │
│ │ ├── pnpm build（Vite 编译）                             │ │
│ │ └── 生成 dist/ 目录                                     │ │
│ │     ├── index.html                                      │ │
│ │     ├── assets/index-abc.js                             │ │
│ │     └── assets/index-def.css                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 构建阶段 2: Nginx 容器                                   │ │
│ │ ├── 复制 dist/ → /usr/share/nginx/html                  │ │
│ │ ├── 配置 Nginx                                          │ │
│ │ └── 打包成 Docker 镜像                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│ 推送镜像到 ghcr.io                                          │
│ ├── ghcr.io/user/repo:latest                               │
│ ├── ghcr.io/user/repo:main                                 │
│ └── ghcr.io/user/repo:main-abc1234                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 生产服务器（你的服务器）                                  │
├─────────────────────────────────────────────────────────────┤
│ docker pull ghcr.io/user/repo:latest                        │
│                          ↓                                  │
│ docker run -p 80:80 ghcr.io/user/repo:latest                │
│                          ↓                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Docker 容器                                              │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Nginx 进程                                           │ │ │
│ │ │ ├── 监听 80 端口                                     │ │ │
│ │ │ ├── 服务 /usr/share/nginx/html/                     │ │ │
│ │ │ │   ├── index.html                                  │ │ │
│ │ │ │   └── assets/                                     │ │ │
│ │ │ └── 处理 HTTP 请求                                   │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 用户访问                                                  │
├─────────────────────────────────────────────────────────────┤
│ 浏览器 → http://your-server.com                             │
│          ↓                                                  │
│ Nginx 返回 index.html                                       │
│          ↓                                                  │
│ 浏览器加载 Vue 应用                                          │
│          ↓                                                  │
│ Vue Router 接管路由                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 运行时架构

### 容器内部结构

```
Docker 容器
├── Nginx 主进程 (PID 1)
│   ├── Worker 进程 1
│   ├── Worker 进程 2
│   └── Worker 进程 N
│
├── 文件系统
│   ├── /usr/share/nginx/html/  ← 你的 Vue 应用
│   │   ├── index.html
│   │   ├── assets/
│   │   │   ├── index-abc123.js
│   │   │   └── index-def456.css
│   │   └── favicon.ico
│   │
│   ├── /etc/nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/
│   │       └── default.conf
│   │
│   └── /var/log/nginx/
│       ├── access.log
│       └── error.log
│
└── 网络
    └── 端口 80 (映射到宿主机)
```

### 请求处理流程

```
用户浏览器
    ↓ HTTP 请求: GET /about
宿主机端口 80
    ↓
Docker 端口映射
    ↓
容器端口 80
    ↓
Nginx 接收请求
    ↓
检查 /usr/share/nginx/html/about
    ↓ (文件不存在)
try_files 规则
    ↓
返回 /usr/share/nginx/html/index.html
    ↓
浏览器接收 HTML
    ↓
加载 Vue 应用
    ↓
Vue Router 解析 /about 路由
    ↓
渲染 About 页面组件
```

---

## 为什么选择 Nginx？

### 1. 性能优异

- **事件驱动架构**: 单个进程可处理数千并发连接
- **低内存占用**: 约 10MB 内存
- **高吞吐量**: 每秒可处理数万请求

### 2. 专为静态文件优化

- **零拷贝**: 使用 `sendfile` 系统调用
- **内核级文件缓存**: 利用操作系统缓存
- **高效的静态文件服务**: 比 Node.js 快 10 倍以上

### 3. 生产级特性

- **负载均衡**: 支持多种负载均衡算法
- **反向代理**: 可代理后端 API
- **SSL/TLS**: 内置 HTTPS 支持
- **压缩**: Gzip/Brotli 压缩
- **缓存控制**: 灵活的缓存策略

### 4. 轻量级

- **镜像大小**: 40MB（vs Node.js 180MB）
- **启动速度**: 毫秒级
- **资源消耗**: 极低

### 对比其他方案

| 方案 | 镜像大小 | 性能 | 复杂度 | 适用场景 |
|------|---------|------|--------|---------|
| **Nginx** | 40MB | ⭐⭐⭐⭐⭐ | 低 | 静态网站（推荐） |
| Node.js + Express | 180MB | ⭐⭐⭐ | 中 | 需要 SSR 或 API |
| Apache | 150MB | ⭐⭐⭐⭐ | 中 | 传统 Web 服务 |
| Caddy | 50MB | ⭐⭐⭐⭐ | 低 | 自动 HTTPS |

---

## 常见问题

### Q1: 为什么不直接用 Node.js 服务静态文件？

**A**: 可以，但不推荐：

```dockerfile
# 不推荐的方式
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "80"]
```

**缺点**:
- 镜像大 4 倍（180MB vs 40MB）
- 性能差（Node.js 不擅长静态文件服务）
- 安全风险（包含构建工具和源代码）
- 资源浪费（运行时不需要 Node.js）

### Q2: 如何查看 Nginx 日志？

```bash
# 访问日志
docker logs my-vitesse-app

# 或进入容器查看
docker exec my-vitesse-app cat /var/log/nginx/access.log
docker exec my-vitesse-app cat /var/log/nginx/error.log
```

### Q3: 如何自定义 Nginx 配置？

参考上面的"优化建议"部分，创建 `nginx.conf` 并在 Dockerfile 中复制。

### Q4: 支持 HTTPS 吗？

容器内的 Nginx 默认只支持 HTTP。生产环境建议：

**方案 1**: 使用反向代理（推荐）
```
用户 → Nginx/Caddy (HTTPS) → Docker 容器 (HTTP)
```

**方案 2**: 在容器内配置 SSL
```dockerfile
COPY ssl/cert.pem /etc/nginx/ssl/
COPY ssl/key.pem /etc/nginx/ssl/
COPY nginx-ssl.conf /etc/nginx/conf.d/default.conf
EXPOSE 443
```

### Q5: 如何调试构建问题？

```bash
# 本地构建测试
docker build -t test-image .

# 查看构建过程
docker build --progress=plain -t test-image .

# 进入构建阶段调试
docker build --target build-stage -t debug-image .
docker run -it debug-image sh
```

---

## 总结

1. **GitHub Actions** 在云端自动构建 Docker 镜像
2. **多阶段构建** 先用 Node.js 编译，再用 Nginx 服务
3. **Nginx** 是最终运行的 Web 服务器，提供静态文件服务
4. **镜像推送** 到 GitHub Container Registry
5. **生产部署** 拉取镜像并运行容器

这是一个标准的现代化前端应用部署方案，兼顾了性能、安全性和易用性。
