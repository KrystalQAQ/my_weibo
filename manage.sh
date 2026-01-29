#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# 检查 Docker 和 Docker Compose
check_requirements() {
    print_info "检查环境..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装"
        exit 1
    fi

    print_success "环境检查通过"
}

# 创建必要的目录
create_directories() {
    print_info "创建日志目录..."
    mkdir -p logs/nginx
    print_success "日志目录创建完成"
}

# 启动服务
start_service() {
    print_info "启动服务..."
    docker-compose up -d

    if [ $? -eq 0 ]; then
        print_success "服务启动成功"
        print_info "访问地址: http://localhost"
    else
        print_error "服务启动失败"
        exit 1
    fi
}

# 停止服务
stop_service() {
    print_info "停止服务..."
    docker-compose stop
    print_success "服务已停止"
}

# 重启服务
restart_service() {
    print_info "重启服务..."
    docker-compose restart
    print_success "服务已重启"
}

# 查看日志
view_logs() {
    print_info "查看日志（Ctrl+C 退出）..."
    docker-compose logs -f
}

# 重载 Nginx 配置
reload_nginx() {
    print_info "验证 Nginx 配置..."
    docker-compose exec web nginx -t

    if [ $? -eq 0 ]; then
        print_success "配置验证通过"
        print_info "重载 Nginx 配置..."
        docker-compose exec web nginx -s reload
        print_success "配置重载成功"
    else
        print_error "配置验证失败，请检查 nginx-full.conf"
        exit 1
    fi
}

# 查看服务状态
status_service() {
    print_info "服务状态:"
    docker-compose ps
    echo ""
    print_info "资源使用:"
    docker stats --no-stream my-vitesse-app 2>/dev/null || print_error "容器未运行"
}

# 更新服务
update_service() {
    print_info "拉取最新镜像..."
    docker-compose pull

    print_info "重启服务..."
    docker-compose up -d

    print_success "服务更新完成"
}

# 清理
cleanup() {
    print_info "停止并删除容器..."
    docker-compose down

    print_info "清理日志..."
    rm -rf logs/nginx/*.log

    print_success "清理完成"
}

# 显示帮助
show_help() {
    echo "用法: ./manage.sh [命令]"
    echo ""
    echo "命令:"
    echo "  start      启动服务"
    echo "  stop       停止服务"
    echo "  restart    重启服务"
    echo "  logs       查看日志"
    echo "  reload     重载 Nginx 配置"
    echo "  status     查看服务状态"
    echo "  update     更新服务"
    echo "  cleanup    清理服务和日志"
    echo "  help       显示帮助"
    echo ""
    echo "示例:"
    echo "  ./manage.sh start    # 启动服务"
    echo "  ./manage.sh reload   # 修改配置后重载"
    echo "  ./manage.sh logs     # 查看实时日志"
}

# 主函数
main() {
    case "$1" in
        start)
            check_requirements
            create_directories
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        logs)
            view_logs
            ;;
        reload)
            reload_nginx
            ;;
        status)
            status_service
            ;;
        update)
            update_service
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h|"")
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
