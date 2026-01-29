# Nginx 配置映射 - 快速指南

## TL;DR（太长不看版）

```bash
# 1. 创建日志目录
mkdir logs\nginx  # Windows
mkdir -p logs/nginx  # Linux/Mac

# 2. 启动服务
docker-compose up -d

# 3. 修改 Nginx 配置
code nginx-full.conf

# 4. 重载配置（无需重启）
docker-compose exec web nginx -s reload

# 5. 查看日志
tail -f logs/nginx/access.log
```

## 目录结构

```
my-vitesse-app/
├── docker-compose.yml          # Docker Compose 配置
├── nginx-full.conf             # Nginx 配置（映射到容器）✅
├── logs/                       # 日志目录（映射到容器）✅
│   └── nginx/
│       ├── access.log          # 访问日志
│       └── error.log           # 错误日志
├── manage.sh                   # 管理脚本（Linux/Mac）
├── manage.bat                  # 管理脚本（Windows）
└── Dockerfile
```

## 配置说明

### docker-compose.yml

```yaml
services:
  web:
    image: ghcr.io/<username>/<repo>:latest
    ports:
      - "80:80"
    volumes:
      # Nginx 配置映射（只读）
      - ./nginx-full.conf:/etc/nginx/conf.d/default.conf:ro
      # 日志映射（读写）
      - ./logs/nginx:/var/log/nginx
```

**关键点：**
- ✅ `nginx-full.conf` 映射到容器，可在宿主机修改
- ✅ 日志映射到 `logs/nginx`，可直接查看
- ✅ `:ro` 表示只读挂载，更安全

## 使用方法

### 方法 1: 使用管理脚本（推荐）

#### Windows

```cmd
# 启动服务
manage.bat start

# 修改配置后重载
manage.bat reload

# 查看日志
manage.bat logs

# 查看状态
manage.bat status

# 停止服务
manage.bat stop
```

#### Linux/Mac

```bash
# 添加执行权限
chmod +x manage.sh

# 启动服务
./manage.sh start

# 修改配置后重载
./manage.sh reload

# 查看日志
./manage.sh logs

# 查看状态
./manage.sh status

# 停止服务
./manage.sh stop
```

### 方法 2: 使用 Docker Compose 命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps
```

## 修改 Nginx 配置

### 步骤 1: 编辑配置文件

```bash
# 使用你喜欢的编辑器
code nginx-full.conf
# 或
notepad nginx-full.conf
# 或
vim nginx-full.conf
```

### 步骤 2: 验证配置

```bash
# 测试配置语法
docker-compose exec web nginx -t
```

**输出示例：**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 步骤 3: 重载配置

```bash
# 热重载（无需重启容器）
docker-compose exec web nginx -s reload
```

**或使用管理脚本：**
```bash
# Windows
manage.bat reload

# Linux/Mac
./manage.sh reload
```

### 步骤 4: 验证效果

```bash
# 查看日志
tail -f logs/nginx/access.log

# 或使用 Docker 日志
docker-compose logs -f web

# 测试接口
curl http://localhost/proxy-info
```

## 常见配置修改

### 1. 修改 API 代理地址

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

### 2. 修改端口

```yaml
# docker-compose.yml
ports:
  - "8080:80"  # 改为 8080 端口
```

```bash
# 重启服务
docker-compose restart
```

### 3. 添加访问限制

```nginx
# nginx-full.conf
location /admin {
    allow 192.168.1.0/24;  # 只允许内网访问
    deny all;
    try_files $uri $uri/ /index.html;
}
```

```bash
# 重载配置
docker-compose exec web nginx -s reload
```

### 4. 启用 Gzip 压缩

```nginx
# nginx-full.conf
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;
```

```bash
# 重载配置
docker-compose exec web nginx -s reload
```

## 查看日志

### 方法 1: 直接查看日志文件

```bash
# 访问日志
tail -f logs/nginx/access.log

# 错误日志
tail -f logs/nginx/error.log

# 查看最近 100 行
tail -n 100 logs/nginx/access.log
```

### 方法 2: 使用 Docker 日志

```bash
# 查看所有日志
docker-compose logs web

# 实时查看
docker-compose logs -f web

# 查看最近 100 行
docker-compose logs --tail=100 web
```

### 方法 3: 使用管理脚本

```bash
# Windows
manage.bat logs

# Linux/Mac
./manage.sh logs
```

## 日志分析

### 统计请求

```bash
# 统计 API 请求次数
grep "/api/" logs/nginx/access.log | wc -l

# 统计图片代理请求
grep "/image" logs/nginx/access.log | wc -l

# 统计状态码
awk '{print $9}' logs/nginx/access.log | sort | uniq -c | sort -rn
```

### 查看错误

```bash
# 查看所有错误
cat logs/nginx/error.log

# 查看最近的错误
tail -n 50 logs/nginx/error.log

# 搜索特定错误
grep "error" logs/nginx/error.log
```

## 故障排查

### 问题 1: 配置修改不生效

**解决：**
```bash
# 1. 验证配置
docker-compose exec web nginx -t

# 2. 重载配置
docker-compose exec web nginx -s reload

# 3. 如果还不行，重启容器
docker-compose restart web
```

### 问题 2: 容器无法启动

**解决：**
```bash
# 查看详细日志
docker-compose logs web

# 检查配置文件
docker-compose config

# 验证 Nginx 配置
docker run --rm -v ${PWD}/nginx-full.conf:/etc/nginx/conf.d/default.conf nginx:stable-alpine nginx -t
```

### 问题 3: 日志文件过大

**解决：**
```bash
# 清空日志
> logs/nginx/access.log
> logs/nginx/error.log

# 或删除日志
rm logs/nginx/*.log

# 重启容器生成新日志
docker-compose restart web
```

### 问题 4: 权限问题

**Windows:**
```cmd
# 以管理员身份运行
# 右键 -> 以管理员身份运行
```

**Linux/Mac:**
```bash
# 使用 sudo
sudo docker-compose up -d

# 或修改文件权限
sudo chown -R $USER:$USER logs/
```

## 配置示例

### 完整的 nginx-full.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # DNS 解析器
    resolver 8.8.8.8 1.1.1.1 valid=300s;

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

    # Vue Router History 模式
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 完整的 docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    image: ghcr.io/<username>/<repo>:latest
    container_name: my-vitesse-app
    ports:
      - "80:80"
    volumes:
      - ./nginx-full.conf:/etc/nginx/conf.d/default.conf:ro
      - ./logs/nginx:/var/log/nginx
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 优势总结

### ✅ 方便修改

- 直接在宿主机编辑 `nginx-full.conf`
- 无需进入容器
- 支持任何编辑器

### ✅ 热重载

- 修改配置后无需重启容器
- 使用 `nginx -s reload` 即可
- 不影响正在处理的请求

### ✅ 日志可见

- 日志文件在 `logs/nginx/` 目录
- 可直接使用 `tail -f` 查看
- 支持日志分析工具

### ✅ 版本控制

- 配置文件可提交到 Git
- 方便团队协作
- 支持配置回滚

## 工作流程

```
1. 修改配置
   ↓
   编辑 nginx-full.conf

2. 验证配置
   ↓
   docker-compose exec web nginx -t

3. 重载配置
   ↓
   docker-compose exec web nginx -s reload

4. 查看效果
   ↓
   tail -f logs/nginx/access.log
```

## 快速命令参考

```bash
# 启动
docker-compose up -d

# 停止
docker-compose stop

# 重启
docker-compose restart

# 重载 Nginx
docker-compose exec web nginx -s reload

# 验证配置
docker-compose exec web nginx -t

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps

# 进入容器
docker-compose exec web sh

# 更新镜像
docker-compose pull && docker-compose up -d
```

## 下一步

1. **创建日志目录：**
   ```bash
   mkdir -p logs/nginx
   ```

2. **修改镜像名称：**
   编辑 `docker-compose.yml`，替换 `<username>/<repo>`

3. **启动服务：**
   ```bash
   docker-compose up -d
   ```

4. **测试功能：**
   ```bash
   curl http://localhost/proxy-info
   ```

5. **修改配置：**
   编辑 `nginx-full.conf`，然后重载

## 相关文档

- `DOCKER-COMPOSE-GUIDE.md` - Docker Compose 详细指南
- `DEPLOYMENT-GUIDE.md` - Docker 部署详解
- `QUICK-START.md` - Nginx 代理快速指南
- `manage.sh` / `manage.bat` - 管理脚本

## 需要帮助？

如果遇到问题：
1. 查看日志：`docker-compose logs web`
2. 验证配置：`docker-compose exec web nginx -t`
3. 检查状态：`docker-compose ps`
4. 参考文档：`DOCKER-COMPOSE-GUIDE.md`
