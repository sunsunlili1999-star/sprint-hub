#!/bin/bash

# Projex OpenClaw 集成一键部署脚本

set -e

echo "================================================"
echo "  Projex OpenClaw 集成部署"
echo "================================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 OpenClaw 是否安装
check_openclaw() {
    if ! command -v openclaw &> /dev/null; then
        echo -e "${RED}❌ OpenClaw 未安装${NC}"
        echo ""
        echo "请先安装 OpenClaw:"
        echo "  macOS:   brew install openclaw"
        echo "  Windows: winget install openclaw"
        echo "  npm:     npm install -g @openclaw/cli"
        exit 1
    fi
    echo -e "${GREEN}✅ OpenClaw 已安装${NC}"
}

# 获取配置
get_config() {
    echo ""
    echo "请输入配置信息："
    echo ""
    
    # Projex API URL
    read -p "Projex API 地址 [http://localhost:3000]: " PROJEX_API_URL
    PROJEX_API_URL=${PROJEX_API_URL:-http://localhost:3000}
    
    # Projex API Key (可选)
    read -p "Projex API Key (可选，直接回车跳过): " PROJEX_API_KEY
    
    # 钉钉 Webhook
    read -p "钉钉 Webhook 地址: " DINGTALK_WEBHOOK
    if [ -z "$DINGTALK_WEBHOOK" ]; then
        echo -e "${RED}❌ 钉钉 Webhook 地址不能为空${NC}"
        exit 1
    fi
    
    # 钉钉密钥 (可选)
    read -p "钉钉加签密钥 (可选，直接回车跳过): " DINGTALK_SECRET
    
    echo ""
    echo -e "${GREEN}配置信息:${NC}"
    echo "  Projex API: $PROJEX_API_URL"
    echo "  钉钉 Webhook: ${DINGTALK_WEBHOOK:0:50}..."
    echo ""
}

# 安装 Skills
install_skills() {
    echo "正在安装 Skills..."
    
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    # 安装 projex-status skill
    echo "  安装 projex-status..."
    openclaw skill install "$SCRIPT_DIR/skills/projex-status" || {
        echo -e "${YELLOW}⚠️ projex-status 可能已安装，尝试更新...${NC}"
        openclaw skill update projex-status "$SCRIPT_DIR/skills/projex-status" || true
    }
    
    # 安装 dingtalk-notify skill
    echo "  安装 dingtalk-notify..."
    openclaw skill install "$SCRIPT_DIR/skills/dingtalk-notify" || {
        echo -e "${YELLOW}⚠️ dingtalk-notify 可能已安装，尝试更新...${NC}"
        openclaw skill update dingtalk-notify "$SCRIPT_DIR/skills/dingtalk-notify" || true
    }
    
    echo -e "${GREEN}✅ Skills 安装完成${NC}"
}

# 配置 Skills
configure_skills() {
    echo "正在配置 Skills..."
    
    # 配置 projex-status
    echo "  配置 projex-status..."
    openclaw skill config projex-status \
        --set projex_api_url="$PROJEX_API_URL"
    
    if [ -n "$PROJEX_API_KEY" ]; then
        openclaw skill config projex-status \
            --set projex_api_key="$PROJEX_API_KEY"
    fi
    
    # 配置 dingtalk-notify
    echo "  配置 dingtalk-notify..."
    openclaw skill config dingtalk-notify \
        --set webhook_url="$DINGTALK_WEBHOOK"
    
    if [ -n "$DINGTALK_SECRET" ]; then
        openclaw skill config dingtalk-notify \
            --set secret="$DINGTALK_SECRET"
    fi
    
    echo -e "${GREEN}✅ Skills 配置完成${NC}"
}

# 部署工作流
deploy_workflows() {
    echo "正在部署工作流..."
    
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    # 部署每日状态推送
    echo "  部署 daily-status-push..."
    openclaw workflow deploy "$SCRIPT_DIR/workflows/daily-status.yaml" || {
        echo -e "${YELLOW}⚠️ 工作流可能已存在，尝试更新...${NC}"
        openclaw workflow update daily-status-push "$SCRIPT_DIR/workflows/daily-status.yaml" || true
    }
    
    # 部署风险告警
    echo "  部署 risk-alert..."
    openclaw workflow deploy "$SCRIPT_DIR/workflows/risk-alert.yaml" || {
        echo -e "${YELLOW}⚠️ 工作流可能已存在，尝试更新...${NC}"
        openclaw workflow update risk-alert "$SCRIPT_DIR/workflows/risk-alert.yaml" || true
    }
    
    # 部署周报
    echo "  部署 weekly-report..."
    openclaw workflow deploy "$SCRIPT_DIR/workflows/weekly-report.yaml" || {
        echo -e "${YELLOW}⚠️ 工作流可能已存在，尝试更新...${NC}"
        openclaw workflow update weekly-report "$SCRIPT_DIR/workflows/weekly-report.yaml" || true
    }
    
    echo -e "${GREEN}✅ 工作流部署完成${NC}"
}

# 测试连接
test_connection() {
    echo "正在测试连接..."
    
    # 测试 Projex API
    echo "  测试 Projex API..."
    if curl -s "$PROJEX_API_URL/api/openclaw/sprints/status" | grep -q "success"; then
        echo -e "${GREEN}  ✅ Projex API 连接正常${NC}"
    else
        echo -e "${YELLOW}  ⚠️ Projex API 连接异常，请确保 Projex 服务已启动${NC}"
    fi
    
    # 测试钉钉
    echo "  发送测试消息到钉钉..."
    openclaw skill run dingtalk-notify send_message \
        --param title="测试消息" \
        --param content="## ✅ Projex OpenClaw 集成测试\n\n连接测试成功！\n\n---\n*来自 Projex AI 助手小派*" \
        && echo -e "${GREEN}  ✅ 钉钉消息发送成功${NC}" \
        || echo -e "${YELLOW}  ⚠️ 钉钉消息发送失败，请检查 Webhook 配置${NC}"
}

# 显示结果
show_result() {
    echo ""
    echo "================================================"
    echo -e "${GREEN}  🎉 部署完成！${NC}"
    echo "================================================"
    echo ""
    echo "已部署的工作流："
    echo "  📊 daily-status-push  - 每日 9:00 状态推送"
    echo "  ⚠️  risk-alert         - 每小时风险检查"
    echo "  📝 weekly-report      - 每周五 17:00 周报"
    echo ""
    echo "常用命令："
    echo "  查看工作流:    openclaw workflow list"
    echo "  手动触发:      openclaw workflow run <name>"
    echo "  查看日志:      openclaw workflow logs <name>"
    echo ""
}

# 主流程
main() {
    check_openclaw
    get_config
    install_skills
    configure_skills
    deploy_workflows
    test_connection
    show_result
}

main
