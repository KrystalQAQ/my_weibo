# 部署指南

本文档说明如何部署此 Vue 3 应用的 Docker 镜像。

## 镜像信息

- **注册表**: GitHub Container Registry (ghcr.io)
- **镜像名称**: `ghcr.io/<你的用户名>/<仓库名>`
- **支持平台**: linux/amd64, linux/arm64

## 快速部署

### 1. 拉取镜像

```bash
# 拉取最新镜像
docker pull ghcr.io/<你的用户名>/<仓库名>:latest

# 或拉取特定提交的镜像
docker pull ghcr.io/<你的用户名>/<仓库名>:main-<commit-sha>
```

### 2. 运行容器

**基础运行（端口 80）：**
```bash
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  ghcr.io/<你的用户名>/<仓库名>:latest
```

**自定义端口（例如 8080）：**
```bash
docker run -d \
  --name my-vitesse-app \
  -p 8080:80 \
  ghcr.io/<你的用户名>/<仓库名>:latest
```

**带重启策略：**
```bash
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  --restart unless-stopped \
  ghcr.io/<你的用户名>/<仓库名>:latest
```

### 3. 验证部署

```bash
# 查看容器状态
docker ps

# 查看容器日志
docker logs my-vitesse-app

# 访问应用
curl http://localhost
```

## Docker Compose 部署

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  web:
    image: ghcr.io/<你的用户名>/<仓库名>:latest
    container_name: my-vitesse-app
    ports:
      - "80:80"
    restart: unless-stopped
    # 可选：添加健康检查
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**启动服务：**
```bash
docker-compose up -d
```

**停止服务：**
```bash
docker-compose down
```

## 生产环境部署

### 使用 Nginx 反向代理

如果你已经有 Nginx 服务器，可以配置反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 使用 Traefik

```yaml
version: '3.8'

services:
  web:
    image: ghcr.io/<你的用户名>/<仓库名>:latest
    container_name: my-vitesse-app
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.vitesse.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.vitesse.entrypoints=websecure"
      - "traefik.http.routers.vitesse.tls.certresolver=letsencrypt"
      - "traefik.http.services.vitesse.loadbalancer.server.port=80"
    networks:
      - traefik

networks:
  traefik:
    external: true
```

## Kubernetes 部署

### 基础部署配置

创建 `k8s-deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-vitesse-app
  labels:
    app: my-vitesse-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-vitesse-app
  template:
    metadata:
      labels:
        app: my-vitesse-app
    spec:
      containers:
      - name: web
        image: ghcr.io/<你的用户名>/<仓库名>:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: my-vitesse-app-service
spec:
  selector:
    app: my-vitesse-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer
```

**部署到 Kubernetes：**
```bash
kubectl apply -f k8s-deployment.yaml

# 查看部署状态
kubectl get deployments
kubectl get pods
kubectl get services

# 查看日志
kubectl logs -l app=my-vitesse-app
```

## 云平台部署

### AWS ECS

```bash
# 1. 创建 ECS 任务定义
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 2. 创建或更新服务
aws ecs create-service \
  --cluster my-cluster \
  --service-name my-vitesse-app \
  --task-definition my-vitesse-app:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

### Google Cloud Run

```bash
gcloud run deploy my-vitesse-app \
  --image ghcr.io/<你的用户名>/<仓库名>:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80
```

### Azure Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name my-vitesse-app \
  --image ghcr.io/<你的用户名>/<仓库名>:latest \
  --dns-name-label my-vitesse-app \
  --ports 80
```

## 常用命令

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

# 查看容器日志（实时）
docker logs -f my-vitesse-app

# 进入容器
docker exec -it my-vitesse-app sh
```

### 镜像管理

```bash
# 查看本地镜像
docker images

# 删除镜像
docker rmi ghcr.io/<你的用户名>/<仓库名>:latest

# 清理未使用的镜像
docker image prune -a

# 查看镜像详情
docker inspect ghcr.io/<你的用户名>/<仓库名>:latest
```

### 更新部署

```bash
# 1. 拉取最新镜像
docker pull ghcr.io/<你的用户名>/<仓库名>:latest

# 2. 停止并删除旧容器
docker stop my-vitesse-app
docker rm my-vitesse-app

# 3. 启动新容器
docker run -d \
  --name my-vitesse-app \
  -p 80:80 \
  --restart unless-stopped \
  ghcr.io/<你的用户名>/<仓库名>:latest
```

或使用一行命令：
```bash
docker pull ghcr.io/<你的用户名>/<仓库名>:latest && \
docker stop my-vitesse-app && \
docker rm my-vitesse-app && \
docker run -d --name my-vitesse-app -p 80:80 --restart unless-stopped ghcr.io/<你的用户名>/<仓库名>:latest
```

## 故障排查

### 容器无法启动

```bash
# 查看容器日志
docker logs my-vitesse-app

# 查看容器详细信息
docker inspect my-vitesse-app

# 检查端口占用
netstat -tuln | grep 80
# 或
lsof -i :80
```

### 应用无法访问

```bash
# 检查容器是否运行
docker ps -a

# 检查容器网络
docker network inspect bridge

# 测试容器内部
docker exec my-vitesse-app wget -O- http://localhost
```

### 性能问题

```bash
# 查看容器资源使用
docker stats my-vitesse-app

# 查看容器进程
docker top my-vitesse-app
```

## 安全建议

1. **使用特定版本标签**：生产环境避免使用 `latest` 标签
   ```bash
   docker pull ghcr.io/<你的用户名>/<仓库名>:main-abc123
   ```

2. **定期更新镜像**：及时拉取最新的安全补丁

3. **限制容器资源**：
   ```bash
   docker run -d \
     --name my-vitesse-app \
     -p 80:80 \
     --memory="256m" \
     --cpus="0.5" \
     ghcr.io/<你的用户名>/<仓库名>:latest
   ```

4. **使用只读文件系统**（如果应用支持）：
   ```bash
   docker run -d \
     --name my-vitesse-app \
     -p 80:80 \
     --read-only \
     --tmpfs /tmp \
     ghcr.io/<你的用户名>/<仓库名>:latest
   ```

## 监控和日志

### 使用 Prometheus 监控

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    image: ghcr.io/<你的用户名>/<仓库名>:latest
    container_name: my-vitesse-app
    ports:
      - "80:80"
    restart: unless-stopped

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
```

### 集中式日志收集

```yaml
# 使用 Fluentd
version: '3.8'

services:
  web:
    image: ghcr.io/<你的用户名>/<仓库名>:latest
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        tag: vitesse.app
```

## 备份和恢复

虽然这是一个静态网站应用，但如果有自定义配置：

```bash
# 备份容器配置
docker inspect my-vitesse-app > my-vitesse-app-config.json

# 导出镜像
docker save ghcr.io/<你的用户名>/<仓库名>:latest -o vitesse-app.tar

# 导入镜像
docker load -i vitesse-app.tar
```

## 支持

如有问题，请查看：
- GitHub Actions 构建日志
- 容器运行日志：`docker logs my-vitesse-app`
- Nginx 错误日志（容器内）：`docker exec my-vitesse-app cat /var/log/nginx/error.log`
