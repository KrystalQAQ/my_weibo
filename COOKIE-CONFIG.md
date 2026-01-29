# Cookie 配置说明

## 核心配置

### 固定 Cookie（写死在 Nginx 配置中）

```nginx
location /api/ {
    proxy_pass https://m.weibo.cn/api/;

    # 关键：设置固定的 Cookie
    proxy_set_header Cookie "SUB=_2AkMeJjMff8NxqwFRmvEVyW_kboR0zAHEieKoesLEJRM3HRl-yT9yqlRctRB6NaYd8RDrUEht8KeU5v4q9h7AA8M5HUko";

    # 其他必要的请求头
    proxy_set_header Host m.weibo.cn;
    proxy_set_header Referer "https://m.weibo.cn/";
    proxy_set_header User-Agent "Mozilla/5.0...";
}
```

## 工作原理

```
客户端请求 /api/container/getIndex
         ↓
    Nginx 接收
         ↓
添加固定 Cookie: SUB=_2AkMeJjMff8NxqwFRmvEVyW_kboR0z...
         ↓
代理到 https://m.weibo.cn/api/container/getIndex
         ↓
微博 API 验证 Cookie
         ↓
返回数据
         ↓
客户端接收
```

## 优势

- ✅ **简单直接**：Cookie 写死在配置中
- ✅ **无需客户端传递**：客户端不需要管理 Cookie
- ✅ **统一管理**：所有请求使用同一个 Cookie
- ✅ **易于更新**：修改配置文件即可更换 Cookie

## 修改 Cookie

### 步骤 1: 编辑配置文件

```bash
# 编辑 nginx-full.conf
code nginx-full.conf

# 找到这一行
proxy_set_header Cookie "SUB=_2AkMeJjMff8NxqwFRmvEVyW_kboR0z...";

# 替换为新的 Cookie
proxy_set_header Cookie "SUB=新的Cookie值";
```

### 步骤 2: 重载配置

```bash
# 验证配置
docker exec my-vitesse-app nginx -t

# 重载配置（无需重启容器）
docker exec my-vitesse-app nginx -s reload
```

### 步骤 3: 测试

```bash
# 测试 API 请求
curl http://localhost/api/container/getIndex?type=uid&value=6052726496

# 查看日志
tail -f logs/nginx/access.log
```

## 获取新的 Cookie

### 方法 1: 浏览器开发者工具

1. 打开浏览器访问 `https://m.weibo.cn`
2. 按 F12 打开开发者工具
3. 切换到 Network 标签
4. 刷新页面
5. 查看任意请求的 Request Headers
6. 复制 Cookie 值

### 方法 2: 使用 curl

```bash
# 访问微博并保存 Cookie
curl -c cookies.txt https://m.weibo.cn

# 查看 Cookie
cat cookies.txt
```

## 注意事项

### Cookie 过期

微博 Cookie 可能会过期，如果 API 返回 401 或 403 错误：

1. 获取新的 Cookie
2. 更新 `nginx-full.conf` 中的 Cookie
3. 重载 Nginx 配置

### Cookie 格式

```
SUB=_2AkMeJjMff8NxqwFRmvEVyW_kboR0zAHEieKoesLEJRM3HRl-yT9yqlRctRB6NaYd8RDrUEht8KeU5v4q9h7AA8M5HUko
```

- `SUB=` 是 Cookie 名称
- 后面是 Cookie 值
- 如果有多个 Cookie，用分号分隔：`SUB=xxx; SUBP=yyy`

### 多个 Cookie

如果需要多个 Cookie：

```nginx
proxy_set_header Cookie "SUB=xxx; SUBP=yyy; _T_WM=zzz";
```

## 测试配置

### 测试 API 请求

```bash
# 测试博主信息
curl "http://localhost/api/container/getIndex?type=uid&value=6052726496&containerid=1005056052726496"

# 测试微博列表
curl "http://localhost/api/container/getIndex?type=uid&value=6052726496&containerid=1076036052726496"
```

### 查看请求头

```bash
# 查看 Nginx 日志
tail -f logs/nginx/access.log

# 查看错误日志
tail -f logs/nginx/error.log
```

### 验证 Cookie

```bash
# 进入容器
docker exec -it my-vitesse-app sh

# 查看配置
cat /etc/nginx/conf.d/default.conf | grep -A 2 "proxy_set_header Cookie"

# 测试配置
nginx -t
```

## 故障排查

### 问题 1: API 返回 401/403

**原因**: Cookie 过期或无效

**解决**:
1. 获取新的 Cookie
2. 更新配置文件
3. 重载 Nginx

### 问题 2: API 返回空数据

**原因**: Cookie 可能不正确

**解决**:
1. 检查 Cookie 格式
2. 确认 Cookie 是否完整
3. 尝试在浏览器中手动测试

### 问题 3: 配置修改不生效

**解决**:
```bash
# 1. 验证配置
docker exec my-vitesse-app nginx -t

# 2. 重载配置
docker exec my-vitesse-app nginx -s reload

# 3. 检查配置文件
docker exec my-vitesse-app cat /etc/nginx/conf.d/default.conf | grep Cookie
```

## 完整配置示例

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    resolver 8.8.8.8 1.1.1.1 valid=300s;

    # 微博 API 代理（固定 Cookie）
    location /api/ {
        proxy_pass https://m.weibo.cn/api/;

        # 固定 Cookie
        proxy_set_header Cookie "SUB=_2AkMeJjMff8NxqwFRmvEVyW_kboR0zAHEieKoesLEJRM3HRl-yT9yqlRctRB6NaYd8RDrUEht8KeU5v4q9h7AA8M5HUko";

        # 其他请求头
        proxy_set_header Host m.weibo.cn;
        proxy_set_header Referer "https://m.weibo.cn/";
        proxy_set_header User-Agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

        # CORS
        add_header Access-Control-Allow-Origin "*" always;

        # 代理配置
        proxy_ssl_server_name on;
        proxy_redirect off;
    }

    # 图片代理
    location ~ ^/(image|img)$ {
        set $image_url $arg_url;
        proxy_pass $image_url;
        proxy_set_header Referer "https://weibo.com/";
        add_header Access-Control-Allow-Origin "*" always;
    }

    # Vue Router
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 快速参考

```bash
# 修改 Cookie
vim nginx-full.conf
# 找到: proxy_set_header Cookie "SUB=...";
# 修改为新的 Cookie

# 重载配置
docker exec my-vitesse-app nginx -s reload

# 测试
curl http://localhost/api/container/getIndex?type=uid&value=6052726496
```

## 总结

### 配置要点

- ✅ Cookie 写死在 Nginx 配置中
- ✅ 使用 `proxy_set_header Cookie "SUB=..."`
- ✅ 不需要从客户端传递 Cookie
- ✅ 不需要处理 Set-Cookie

### 维护流程

1. Cookie 过期时获取新的 Cookie
2. 更新 `nginx-full.conf`
3. 执行 `docker exec my-vitesse-app nginx -s reload`
4. 测试 API 请求

### 优势

- 简单直接，易于管理
- 无需客户端处理 Cookie
- 统一的认证凭证
- 易于更新和维护
