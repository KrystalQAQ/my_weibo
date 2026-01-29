# 快速部署参考

## 核心要点

### 1. Cookie 是关键 ✅

Nginx 配置中已添加 Cookie 处理：

```nginx
# 传递客户端 Cookie 到微博 API
proxy_set_header Cookie $http_cookie;

# 传递微博 API 的 Set-Cookie 到客户端
proxy_pass_header Set-Cookie;

# 处理 Cookie 域名和路径
proxy_cookie_domain m.weibo.cn $host;
proxy_cookie_path /api/ /api/;

# 允许跨域携带凭证
add_header Access-Control-Allow-Credentials "true" always;
```

### 2. 使用 docker run 命令 ✅

不使用 docker-compose，直接用命令行。

## 一键部署

### Linux/Mac

```bash
# 1. 创建日志目录
mkdir -p logs/nginx

# 2. 启动容器（映射配置和日志）
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest

# 3. 验证运行
docker ps
curl http://localhost/proxy-info
```

### Windows PowerShell

```powershell
# 1. 创建日志目录
mkdir logs\nginx

# 2. 启动容器
docker run -d `
  --name my-vitesse-app `
  -p 80:80 `
  -v ${PWD}/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro `
  -v ${PWD}/logs/nginx:/var/log/nginx `
  --restart unless-stopped `
  ghcr.io/<username>/<repo>:latest

# 3. 验证运行
docker ps
curl http://localhost/proxy-info
```

### Windows CMD

```cmd
:: 1. 创建日志目录
mkdir logs\nginx

:: 2. 启动容器
docker run -d ^
  --name my-vitesse-app ^
  -p 80:80 ^
  -v %cd%/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro ^
  -v %cd%/logs/nginx:/var/log/nginx ^
  --restart unless-stopped ^
  ghcr.io/<username>/<repo>:latest

:: 3. 验证运行
docker ps
curl http://localhost/proxy-info
```

## 常用命令

```bash
# 修改配置后重载（无需重启）
docker exec my-vitesse-app nginx -s reload

# 查看日志
tail -f logs/nginx/access.log

# 停止容器
docker stop my-vitesse-app

# 启动容器
docker start my-vitesse-app

# 重启容器
docker restart my-vitesse-app

# 删除容器
docker rm -f my-vitesse-app

# 查看容器日志
docker logs -f my-vitesse-app
```

## 修改配置流程

```bash
# 1. 编辑配置
code nginx-full.conf

# 2. 验证配置
docker exec my-vitesse-app nginx -t

# 3. 重载配置
docker exec my-vitesse-app nginx -s reload

# 4. 查看效果
tail -f logs/nginx/access.log
```

## 更新部署

```bash
# 拉取最新镜像并重新部署
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

## Cookie 配置详解

### 为什么 Cookie 是关键？

微博 API 需要 Cookie 来：
1. 验证用户身份
2. 维持会话状态
3. 防止爬虫和滥用

### Nginx 如何处理 Cookie？

```nginx
location /api/ {
    # 1. 接收客户端的 Cookie
    proxy_set_header Cookie $http_cookie;

    # 2. 传递给微博 API
    proxy_pass https://m.weibo.cn/api/;

    # 3. 接收微博 API 的 Set-Cookie
    proxy_pass_header Set-Cookie;

    # 4. 修改 Cookie 域名（m.weibo.cn → 你的域名）
    proxy_cookie_domain m.weibo.cn $host;

    # 5. 返回给客户端
    add_header Access-Control-Allow-Credentials "true" always;
}
```

### 测试 Cookie

```bash
# 带 Cookie 请求
curl -v \
  -H "Cookie: SUB=xxx; SUBP=xxx" \
  http://localhost/api/container/getIndex?type=uid&value=6052726496

# 查看响应头（包括 Set-Cookie）
curl -I http://localhost/api/container/getIndex?...
```

## 目录结构

```
my-vitesse-app/
├── nginx-full.conf             # Nginx 配置（已添加 Cookie 处理）✅
├── logs/                       # 日志目录（映射到容器）
│   └── nginx/
│       ├── access.log
│       └── error.log
├── Dockerfile
└── dist/
```

## 配置映射说明

```bash
-v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro
```

- `$(pwd)/nginx-full.conf` - 宿主机配置文件
- `/etc/nginx/conf.d/default.conf` - 容器内配置文件
- `:ro` - 只读挂载（安全）

```bash
-v $(pwd)/logs/nginx:/var/log/nginx
```

- `$(pwd)/logs/nginx` - 宿主机日志目录
- `/var/log/nginx` - 容器内日志目录
- 可读写（需要写入日志）

## 优势总结

### ✅ Cookie 正确处理

- 传递客户端 Cookie 到微博 API
- 传递微博 API 的 Set-Cookie 到客户端
- 自动处理 Cookie 域名和路径
- 支持跨域携带凭证

### ✅ 配置映射到宿主机

- 直接在宿主机编辑 `nginx-full.conf`
- 无需进入容器
- 支持任何编辑器

### ✅ 热重载配置

- 修改配置后无需重启容器
- 使用 `nginx -s reload` 即可
- 不影响正在处理的请求

### ✅ 日志可见

- 日志文件在 `logs/nginx/` 目录
- 可直接使用 `tail -f` 查看
- 支持日志分析工具

## 故障排查

### 问题 1: Cookie 未传递

**检查：**
```bash
# 查看 Nginx 配置
docker exec my-vitesse-app cat /etc/nginx/conf.d/default.conf | grep -A 5 "proxy_set_header Cookie"

# 查看请求头
docker exec my-vitesse-app tail -f /var/log/nginx/access.log
```

**解决：**
确保配置中有：
```nginx
proxy_set_header Cookie $http_cookie;
proxy_pass_header Set-Cookie;
```

### 问题 2: 跨域 Cookie 问题

**检查：**
```bash
# 查看响应头
curl -I http://localhost/api/...
```

**解决：**
确保配置中有：
```nginx
add_header Access-Control-Allow-Credentials "true" always;
add_header Access-Control-Allow-Headers "Content-Type, Authorization, Cookie" always;
```

### 问题 3: 配置未生效

**解决：**
```bash
# 1. 验证配置
docker exec my-vitesse-app nginx -t

# 2. 重载配置
docker exec my-vitesse-app nginx -s reload

# 3. 检查配置文件
docker exec my-vitesse-app cat /etc/nginx/conf.d/default.conf
```

## 完整示例

### 1. 准备环境

```bash
# 进入项目目录
cd /path/to/my-vitesse-app

# 创建日志目录
mkdir -p logs/nginx

# 确认配置文件存在
ls nginx-full.conf
```

### 2. 启动容器

```bash
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  -v $(pwd)/nginx-full.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/logs/nginx:/var/log/nginx \
  --restart unless-stopped \
  ghcr.io/<username>/<repo>:latest
```

### 3. 验证部署

```bash
# 查看容器状态
docker ps

# 测试服务
curl http://localhost/proxy-info

# 测试 API（带 Cookie）
curl -H "Cookie: test=value" http://localhost/api/container/getIndex?type=uid&value=6052726496

# 查看日志
tail -f logs/nginx/access.log
```

### 4. 修改配置

```bash
# 编辑配置
vim nginx-full.conf

# 验证配置
docker exec my-vitesse-app nginx -t

# 重载配置
docker exec my-vitesse-app nginx -s reload
```

## 相关文档

- `DOCKER-RUN-GUIDE.md` - Docker Run 完整指南
- `nginx-full.conf` - Nginx 配置文件（已添加 Cookie 处理）
- `DEPLOYMENT-GUIDE.md` - 部署流程详解

## 需要帮助？

如果遇到问题：
1. 查看日志：`docker logs my-vitesse-app`
2. 验证配置：`docker exec my-vitesse-app nginx -t`
3. 检查 Cookie：`curl -v -H "Cookie: ..." http://localhost/api/...`
4. 参考文档：`DOCKER-RUN-GUIDE.md`
