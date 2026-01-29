# Docker Run 命令部署指南

## 核心命令

### 基础运行命令

```bash
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  -v ${PWD}/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v ${PWD}/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest
```

### Windows PowerShell

```powershell
docker run -d `
  --name my-vitesse-app `
  -p 80:80 `
  -v ${PWD}/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro `
  -v ${PWD}/logs/nginx:/var/log/nginx `
  --restart unless-stopped `
  ghcr.io/<username>/<repo>:latest
```

### Windows CMD

```cmd
docker run -d ^
  --name my-vitesse-app ^
  -p 80:80 ^
  -v %cd%/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro ^
  -v %cd%/logs/nginx:/var/log/nginx ^
  --restart unless-stopped ^
  ghcr.io/<username>/<repo>:latest
```

## 参数说明

| 参数 | 说明 |
|------|------|
| `-d` | 后台运行 |
| `--name my-vitesse-app` | 容器名称 |
| `-p 80:80` | 端口映射（宿主机:容器） |
| `-v nginx-full.conf:...` | 映射 Nginx 配置（只读） |
| `-v logs/nginx:...` | 映射日志目录 |
| `--restart unless-stopped` | 自动重启策略 |

## 完整工作流程

### 1. 准备工作

```bash
# 创建日志目录
mkdir -p logs/nginx

# 确认配置文件存在
ls nginx-full.conf
```

### 2. 启动容器

```bash
# Linux/Mac
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest

# Windows PowerShell
docker run -d `
  --name my-vitesse-app `
  -p 80:80 `
  -v ${PWD}/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro `
  -v ${PWD}/logs/nginx:/var/log/nginx `
  --restart unless-stopped `
  ghcr.io/<username>/<repo>:latest
```

### 3. 验证运行

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs my-vitesse-app

# 测试访问
curl http://localhost/proxy-info
```

### 4. 修改 Nginx 配置

```bash
# 编辑配置文件
code nginx-full.conf

# 验证配置
docker exec my-vitesse-app nginx -t

# 重载配置（无需重启容器）
docker exec my-vitesse-app nginx -s reload
```

### 5. 查看日志

```bash
# 方法 1: 查看日志文件
tail -f logs/nginx/access.log
tail -f logs/nginx/error.log

# 方法 2: 查看容器日志
docker logs -f my-vitesse-app

# 方法 3: 进入容器查看
docker exec my-vitesse-app tail -f /var/log/nginx/access.log
```

## 常用管理命令

### 容器管理

```bash
# 启动容器
docker start my-vitesse-app

# 停止容器
docker stop my-vitesse-app

# 重启容器
docker restart my-vitesse-app

# 删除容器
docker rm my-vitesse-app

# 强制删除运行中的容器
docker rm -f my-vitesse-app
```

### Nginx 管理

```bash
# 测试配置
docker exec my-vitesse-app nginx -t

# 重载配置（热重载，无需重启）
docker exec my-vitesse-app nginx -s reload

# 查看 Nginx 版本
docker exec my-vitesse-app nginx -v

# 查看 Nginx 配置
docker exec my-vitesse-app cat /etc/nginx/conf.d/default.conf
```

### 日志管理

```bash
# 查看容器日志
docker logs my-vitesse-app

# 实时查看日志
docker logs -f my-vitesse-app

# 查看最近 100 行
docker logs --tail=100 my-vitesse-app

# 查看 Nginx 访问日志
docker exec my-vitesse-app tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
docker exec my-vitesse-app tail -f /var/log/nginx/error.log
```

### 容器调试

```bash
# 进入容器
docker exec -it my-vitesse-app sh

# 查看容器详情
docker inspect my-vitesse-app

# 查看容器资源使用
docker stats my-vitesse-app

# 查看容器进程
docker top my-vitesse-app
```

## 高级配置

### 自定义端口

```bash
# 使用 8080 端口
docker run -d \
  --name my-vitesse-app \
  -p 8080:80 \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest
```

### 资源限制

```bash
# 限制 CPU 和内存
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  --cpus="0.5" \
  --memory="256m" \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest
```

### 环境变量

```bash
# 设置时区
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  -e TZ=Asia/Shanghai \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest
```

### 网络配置

```bash
# 使用自定义网络
docker network create vitesse-network

docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  --network vitesse-network \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest
```

## 更新部署

### 方法 1: 删除重建

```bash
# 1. 停止并删除旧容器
docker stop my-vitesse-app
docker rm my-vitesse-app

# 2. 拉取最新镜像
docker pull ghcr.io/<username>/<repo>:latest

# 3. 启动新容器
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest
```

### 方法 2: 一行命令

```bash
docker pull ghcr.io/<username>/<repo>:latest && \
docker stop my-vitesse-app && \
docker rm my-vitesse-app && \
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest
```

## 本地构建

### 构建镜像

```bash
# 构建镜像
docker build -t my-vitesse-app:local .

# 运行本地镜像
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  my-vitesse-app:local
```

### 开发模式（映射 dist 目录）

```bash
# 先构建前端
pnpm build

# 运行容器并映射 dist 目录
docker run -d \
  --name my-vitesse-app-dev \
  -p 8080:80 \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/dist:/usr/share/nginx/html:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  nginx:stable-alpine
```

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker logs my-vitesse-app

# 检查端口占用
# Linux/Mac
lsof -i :80

# Windows
netstat -ano | findstr :80

# 验证配置文件
docker run --rm \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:stable-alpine nginx -t
```

### 配置修改不生效

```bash
# 1. 验证配置
docker exec my-vitesse-app nginx -t

# 2. 重载配置
docker exec my-vitesse-app nginx -s reload

# 3. 如果还不行，重启容器
docker restart my-vitesse-app

# 4. 检查配置文件是否正确映射
docker exec my-vitesse-app cat /etc/nginx/conf.d/default.conf
```

### 权限问题

```bash
# Linux/Mac: 使用 sudo
sudo docker run ...

# 或添加用户到 docker 组
sudo usermod -aG docker $USER

# Windows: 以管理员身份运行 PowerShell/CMD
```

### 日志文件权限

```bash
# 修改日志目录权限
chmod -R 777 logs/nginx

# 或使用 root 用户运行容器
docker run -d \
  --name my-vitesse-app \
  --user root \
  ...
```

## Cookie 配置说明

### Nginx 配置关键点

```nginx
# 传递客户端 Cookie 到上游服务器
proxy_set_header Cookie $http_cookie;

# 传递上游服务器的 Set-Cookie 到客户端
proxy_pass_header Set-Cookie;

# 处理 Cookie 域名
proxy_cookie_domain m.weibo.cn $host;

# 处理 Cookie 路径
proxy_cookie_path /api/ /api/;

# 允许跨域携带凭证
add_header Access-Control-Allow-Credentials "true" always;
```

### 测试 Cookie

```bash
# 测试 API 请求（带 Cookie）
curl -v \
  -H "Cookie: your-cookie-here" \
  http://localhost/api/container/getIndex?type=uid&value=6052726496

# 查看响应头（包括 Set-Cookie）
curl -I http://localhost/api/...
```

## 快速命令参考

```bash
# 启动
docker run -d --name my-vitesse-app -p 80:80 \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest

# 停止
docker stop my-vitesse-app

# 重启
docker restart my-vitesse-app

# 重载 Nginx
docker exec my-vitesse-app nginx -s reload

# 查看日志
docker logs -f my-vitesse-app

# 删除
docker rm -f my-vitesse-app

# 更新
docker pull ghcr.io/<username>/<repo>:latest && \
docker stop my-vitesse-app && docker rm my-vitesse-app && \
docker run -d --name my-vitesse-app -p 80:80 \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest
```

## 管理脚本（可选）

### Linux/Mac 脚本

创建 `run.sh`:

```bash
#!/bin/bash

IMAGE="ghcr.io/<username>/<repo>:latest"
CONTAINER="my-vitesse-app"

case "$1" in
  start)
    docker run -d \
      --name $CONTAINER \
      -p 80:80 \
      -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
      -v $(pwd)/logs/nginx:/var/log/nginx \
      --restart unless-stopped \
      $IMAGE
    ;;
  stop)
    docker stop $CONTAINER
    ;;
  restart)
    docker restart $CONTAINER
    ;;
  reload)
    docker exec $CONTAINER nginx -t && \
    docker exec $CONTAINER nginx -s reload
    ;;
  logs)
    docker logs -f $CONTAINER
    ;;
  rm)
    docker rm -f $CONTAINER
    ;;
  update)
    docker pull $IMAGE && \
    docker stop $CONTAINER && \
    docker rm $CONTAINER && \
    $0 start
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|reload|logs|rm|update}"
    exit 1
    ;;
esac
```

使用：

```bash
chmod +x run.sh
./run.sh start
./run.sh reload
./run.sh logs
```

### Windows 脚本

创建 `run.bat`:

```batch
@echo off
set IMAGE=ghcr.io/<username>/<repo>:latest
set CONTAINER=my-vitesse-app

if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="reload" goto reload
if "%1"=="logs" goto logs
if "%1"=="rm" goto rm
if "%1"=="update" goto update
goto help

:start
docker run -d ^
  --name %CONTAINER% ^
  -p 80:80 ^
  -v %cd%/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro ^
  -v %cd%/logs/nginx:/var/log/nginx ^
  --restart unless-stopped ^
  %IMAGE%
goto end

:stop
docker stop %CONTAINER%
goto end

:restart
docker restart %CONTAINER%
goto end

:reload
docker exec %CONTAINER% nginx -t
docker exec %CONTAINER% nginx -s reload
goto end

:logs
docker logs -f %CONTAINER%
goto end

:rm
docker rm -f %CONTAINER%
goto end

:update
docker pull %IMAGE%
docker stop %CONTAINER%
docker rm %CONTAINER%
call %0 start
goto end

:help
echo Usage: run.bat {start^|stop^|restart^|reload^|logs^|rm^|update}
goto end

:end
```

使用：

```cmd
run.bat start
run.bat reload
run.bat logs
```

## 总结

### 核心命令

```bash
# 启动（映射配置和日志）
docker run -d --name my-vitesse-app -p 80:80 \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest

# 重载 Nginx 配置
docker exec my-vitesse-app nginx -s reload

# 查看日志
tail -f logs/nginx/access.log
```

### 优势

- ✅ 简单直接，无需 Docker Compose
- ✅ Nginx 配置映射到宿主机
- ✅ 日志映射到宿主机
- ✅ 支持热重载配置
- ✅ Cookie 正确传递

### 下一步

1. 创建日志目录：`mkdir -p logs/nginx`
2. 修改镜像名称
3. 运行 docker run 命令
4. 测试功能
