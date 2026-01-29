@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 颜色定义（Windows 10+）
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "NC=[0m"

:: 打印带颜色的消息
:print_success
echo %GREEN%✓ %~1%NC%
goto :eof

:print_error
echo %RED%✗ %~1%NC%
goto :eof

:print_info
echo %YELLOW%ℹ %~1%NC%
goto :eof

:: 检查 Docker 和 Docker Compose
:check_requirements
call :print_info "检查环境..."

where docker >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "Docker 未安装"
    exit /b 1
)

where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "Docker Compose 未安装"
    exit /b 1
)

call :print_success "环境检查通过"
goto :eof

:: 创建必要的目录
:create_directories
call :print_info "创建日志目录..."
if not exist "logs\nginx" mkdir logs\nginx
call :print_success "日志目录创建完成"
goto :eof

:: 启动服务
:start_service
call :print_info "启动服务..."
docker-compose up -d

if %errorlevel% equ 0 (
    call :print_success "服务启动成功"
    call :print_info "访问地址: http://localhost"
) else (
    call :print_error "服务启动失败"
    exit /b 1
)
goto :eof

:: 停止服务
:stop_service
call :print_info "停止服务..."
docker-compose stop
call :print_success "服务已停止"
goto :eof

:: 重启服务
:restart_service
call :print_info "重启服务..."
docker-compose restart
call :print_success "服务已重启"
goto :eof

:: 查看日志
:view_logs
call :print_info "查看日志（Ctrl+C 退出）..."
docker-compose logs -f
goto :eof

:: 重载 Nginx 配置
:reload_nginx
call :print_info "验证 Nginx 配置..."
docker-compose exec web nginx -t

if %errorlevel% equ 0 (
    call :print_success "配置验证通过"
    call :print_info "重载 Nginx 配置..."
    docker-compose exec web nginx -s reload
    call :print_success "配置重载成功"
) else (
    call :print_error "配置验证失败，请检查 nginx-full.conf"
    exit /b 1
)
goto :eof

:: 查看服务状态
:status_service
call :print_info "服务状态:"
docker-compose ps
echo.
call :print_info "资源使用:"
docker stats --no-stream my-vitesse-app 2>nul
if %errorlevel% neq 0 (
    call :print_error "容器未运行"
)
goto :eof

:: 更新服务
:update_service
call :print_info "拉取最新镜像..."
docker-compose pull

call :print_info "重启服务..."
docker-compose up -d

call :print_success "服务更新完成"
goto :eof

:: 清理
:cleanup
call :print_info "停止并删除容器..."
docker-compose down

call :print_info "清理日志..."
if exist "logs\nginx\*.log" del /q logs\nginx\*.log

call :print_success "清理完成"
goto :eof

:: 显示帮助
:show_help
echo 用法: manage.bat [命令]
echo.
echo 命令:
echo   start      启动服务
echo   stop       停止服务
echo   restart    重启服务
echo   logs       查看日志
echo   reload     重载 Nginx 配置
echo   status     查看服务状态
echo   update     更新服务
echo   cleanup    清理服务和日志
echo   help       显示帮助
echo.
echo 示例:
echo   manage.bat start    # 启动服务
echo   manage.bat reload   # 修改配置后重载
echo   manage.bat logs     # 查看实时日志
goto :eof

:: 主函数
:main
if "%~1"=="" goto show_help
if "%~1"=="start" goto cmd_start
if "%~1"=="stop" goto cmd_stop
if "%~1"=="restart" goto cmd_restart
if "%~1"=="logs" goto cmd_logs
if "%~1"=="reload" goto cmd_reload
if "%~1"=="status" goto cmd_status
if "%~1"=="update" goto cmd_update
if "%~1"=="cleanup" goto cmd_cleanup
if "%~1"=="help" goto show_help
if "%~1"=="-h" goto show_help
if "%~1"=="--help" goto show_help

call :print_error "未知命令: %~1"
goto show_help

:cmd_start
call :check_requirements
call :create_directories
call :start_service
goto :eof

:cmd_stop
call :stop_service
goto :eof

:cmd_restart
call :restart_service
goto :eof

:cmd_logs
call :view_logs
goto :eof

:cmd_reload
call :reload_nginx
goto :eof

:cmd_status
call :status_service
goto :eof

:cmd_update
call :update_service
goto :eof

:cmd_cleanup
call :cleanup
goto :eof

call :main %*
