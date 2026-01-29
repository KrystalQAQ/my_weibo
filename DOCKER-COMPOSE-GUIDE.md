# Docker Compose 部署指南

## 概述

使用 Docker Compose 部署应用，Nginx 配置文件映射到宿主机，方便修改和调试。

## 目录结构

```
my-vitesse-app/
├── docker-compose.yml          # Docker Compose 配置
├── nginx-full.conf             # Nginx 配置（映射到容器）
├── logs/                       # 日志目录（映射到容器）
│   └── nginx/
│       ├── access.log
│       └── error.log
├── Dockerfile
└── dist/                       # 构建产物
```

## 快速开始

### 1. 创建日志目录

```bash
# Windows
mkdir logs\nginx

# Linux/Mac
mkdir -p logs/nginx
```

### 2. 修改 docker-compose.yml

将 `<your-username>/<your-repo>` 替换为你的镜像名称：

```yaml
image: ghcr.io/username/my-vitesse-app:latest
```

或使用本地构建：

```yaml
# 注释掉 image 行，取消注释 build 行
build: .
```

### 3. 启动服务

```bash
# 启动服务（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

### 4. 访问应用

浏览器打开 `http://localhost`

## Nginx 配置管理

### 修改配置

1. **编辑配置文件：**
   ```bash
   # 使用你喜欢的编辑器
   code nginx-full.conf
   # 或
   notepad nginx-full.conf
   ```

2. **验证配置：**
   ```bash
   # 测试配置语法
   docker-compose exec web nginx -t
   ```

3. **重载配置（无需重启）：**
   ```bash
   # 热重载 Nginx 配置
   docker-compose exec web nginx -s reload
   ```

4. **查看效果：**
   ```bash
   # 查看 Nginx 日志
   docker-compose logs -f web

   # 或直接查看日志文件
   tail -f logs/nginx/access.log
   tail -f logs/nginx/error.log
   ```

### 配置示例

#### 修改端口

```yaml
# docker-compose.yml
ports:
  - "8080:80"  # 宿主机端口:容器端口
```

#### 添加 HTTPS

```yaml
# docker-compose.yml
services:
  web:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-full.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx-ssl.conf:/etc/nginx/conf.d/ssl.conf:ro  # SSL 配置
      - ./ssl:/etc/nginx/ssl:ro  # SSL 证书
```

#### 添加环境变量

```yaml
# docker-compose.yml
services:
  web:
    environment:
      - TZ=Asia/Shanghai  # 时区
      - NGINX_WORKER_PROCESSES=auto
```

## 常用命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 停止并删除容器、网络、卷
docker-compose down -v
```

### 日志查看

```bash
# 查看所有日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100

# 查看特定服务日志
docker-compose logs web
```

### 容器管理

```bash
# 进入容器
docker-compose exec web sh

# 查看容器状态
docker-compose ps

# 查看容器资源使用
docker stats my-vitesse-app
```

### Nginx 管理

```bash
# 测试配置
docker-compose exec web nginx -t

# 重载配置
docker-compose exec web nginx -s reload

# 查看 Nginx 版本
docker-compose exec web nginx -v

# 查看 Nginx 配置
docker-compose exec web cat /etc/nginx/conf.d/default.conf
```

## 开发环境配置

### 本地构建模式

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: my-vitesse-app-dev
    ports:
      - "8080:80"
    volumes:
      - ./nginx-full.conf:/etc/nginx/conf.d/default.conf:ro
      - ./logs/nginx:/var/log/nginx
      # 开发环境：映射构建产物（实时更新）
      - ./dist:/usr/share/nginx/html:ro
    restart: "no"  # 开发环境不自动重启
```

**使用：**
```bash
# 构建并启动
docker-compose -f docker-compose.dev.yml up --build

# 修改代码后重新构建
pnpm build
docker-compose -f docker-compose.dev.yml restart
```

## 生产环境配置

### 使用镜像模式

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  web:
    image: ghcr.io/username/my-vitesse-app:latest
    container_name: my-vitesse-app
    ports:
      - "80:80"
    volumes:
      - ./nginx-full.conf:/etc/nginx/conf.d/default.conf:ro
      - ./logs/nginx:/var/log/nginx
    restart: unless-stopped

    # 健康检查
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
```

**使用：**
```bash
# 拉取最新镜像
docker-compose -f docker-compose.prod.yml pull

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 更新服务
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 多服务配置

### 添加反向代理

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 前端应用
  web:
    image: ghcr.io/username/my-vitesse-app:latest
    container_name: vitesse-web
    volumes:
      - ./nginx-full.conf:/etc/nginx/conf.d/default.conf:ro
      - ./logs/nginx:/var/log/nginx
    restart: unless-stopped
    networks:
      - app-network

  # Nginx 反向代理（可选）
  nginx-proxy:
    image: nginx:stable-alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## 日志管理

### 查看日志

```bash
# 查看 Nginx 访问日志
tail -f logs/nginx/access.log

# 查看 Nginx 错误日志
tail -f logs/nginx/error.log

# 查看 Docker 容器日志
docker-compose logs -f web
```

### 日志轮转

创建 `logrotate.conf`：

```
logs/nginx/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        docker-compose exec web nginx -s reload > /dev/null 2>&1
    endscript
}
```

### 清理日志

```bash
# 清空日志文件
> logs/nginx/access.log
> logs/nginx/error.log

# 或删除日志文件
rm logs/nginx/*.log

# 重启容器生成新日志
docker-compose restart web
```

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs web

# 检查配置文件
docker-compose config

# 验证 Nginx 配置
docker-compose exec web nginx -t
```

### 配置修改不生效

```bash
# 1. 验证配置语法
docker-compose exec web nginx -t

# 2. 重载配置
docker-compose exec web nginx -s reload

# 3. 如果还不行，重启容器
docker-compose restart web
```

### 端口被占用

```bash
# Windows
netstat -ano | findstr :80

# Linux/Mac
lsof -i :80

# 修改端口
# 编辑 docker-compose.yml，将 "80:80" 改为 "8080:80"
```

### 权限问题

```bash
# Windows: 以管理员身份运行
# Linux/Mac: 使用 sudo
sudo docker-compose up -d
```

## 备份和恢复

### 备份配置

```bash
# 备份 Nginx 配置
cp nginx-full.conf nginx-full.conf.backup

# 备份整个项目
tar -czf my-vitesse-app-backup.tar.gz \
  docker-compose.yml \
  nginx-full.conf \
  logs/
```

### 恢复配置

```bash
# 恢复 Nginx 配置
cp nginx-full.conf.backup nginx-full.conf

# 重载配置
docker-compose exec web nginx -s reload
```

## 性能优化

### 启用缓存

```yaml
# docker-compose.yml
services:
  web:
    volumes:
      - ./nginx-full.conf:/etc/nginx/conf.d/default.conf:ro
      - ./logs/nginx:/var/log/nginx
      - nginx-cache:/var/cache/nginx  # Nginx 缓存

volumes:
  nginx-cache:
```

### 资源限制

```yaml
# docker-compose.yml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 监控

### 健康检查

```bash
# 查看健康状态
docker-compose ps

# 手动健康检查
curl http://localhost/proxy-info
```

### 资源监控

```bash
# 查看资源使用
docker stats my-vitesse-app

# 持续监控
watch -n 1 docker stats my-vitesse-app
```

## 安全建议

### 1. 只读挂载

```yaml
volumes:
  - ./nginx-full.conf:/etc/nginx/conf.d/default.conf:ro  # :ro 表示只读
```

### 2. 限制资源

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 256M
```

### 3. 使用非 root 用户

```yaml
# Dockerfile
USER nginx
```

### 4. 定期更新镜像

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d
```

## 常见配置场景

### 场景 1: 修改 API 代理地址

```nginx
# nginx-full.conf
location /api/ {
    proxy_pass https://new-api-server.com/api/;
    # ...
}
```

```bash
# 重载配置
docker-compose exec web nginx -s reload
```

### 场景 2: 添加自定义路由

```nginx
# nginx-full.conf
location /custom-path {
    proxy_pass http://backend-service:3000;
    proxy_set_header Host $host;
}
```

```bash
# 重载配置
docker-compose exec web nginx -s reload
```

### 场景 3: 启用访问限制

```nginx
# nginx-full.conf
location /admin {
    allow 192.168.1.0/24;
    deny all;
    try_files $uri $uri/ /index.html;
}
```

```bash
# 重载配置
docker-compose exec web nginx -s reload
```

## 总结

### 优势

- ✅ Nginx 配置映射到宿主机，方便修改
- ✅ 日志映射到宿主机，方便查看
- ✅ 支持热重载，无需重启容器
- ✅ 使用 Docker Compose 统一管理
- ✅ 支持开发和生产环境配置

### 工作流程

1. 修改 `nginx-full.conf`
2. 验证配置：`docker-compose exec web nginx -t`
3. 重载配置：`docker-compose exec web nginx -s reload`
4. 查看日志：`tail -f logs/nginx/access.log`

### 下一步

1. 创建日志目录：`mkdir -p logs/nginx`
2. 修改 docker-compose.yml 中的镜像名称
3. 启动服务：`docker-compose up -d`
4. 测试功能：`curl http://localhost/proxy-info`
