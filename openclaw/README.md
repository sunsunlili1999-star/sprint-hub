# Projex OpenClaw 集成

本目录包含 Projex 与 OpenClaw 的集成配置，实现：

- 📊 **每日状态推送** - 每天 9:00 自动推送迭代和发布状态到钉钉
- ⚠️ **实时风险告警** - 检测到高风险时立即推送告警
- 📝 **智能周报生成** - 每周五 17:00 自动生成并发送周报

## 目录结构

```
openclaw/
├── skills/                    # OpenClaw Skills
│   ├── projex-status/         # 项目状态技能
│   │   ├── skill.json         # 技能定义
│   │   └── index.ts           # 技能实现
│   └── dingtalk-notify/       # 钉钉通知技能
│       ├── skill.json         # 技能定义
│       └── index.ts           # 技能实现
├── workflows/                 # Lobster 工作流
│   ├── daily-status.yaml      # 每日状态推送
│   ├── risk-alert.yaml        # 实时风险告警
│   └── weekly-report.yaml     # 智能周报生成
└── README.md                  # 本文件
```

## 安装步骤

### 1. 安装 OpenClaw

```bash
# macOS
brew install openclaw

# Windows (使用 winget)
winget install openclaw

# 或者使用 npm
npm install -g @openclaw/cli
```

### 2. 初始化 OpenClaw

```bash
# 初始化配置
openclaw init

# 登录（如果需要）
openclaw login
```

### 3. 安装 Skills

```bash
# 进入项目目录
cd sprint-hub

# 安装 projex-status skill
openclaw skill install ./openclaw/skills/projex-status

# 安装 dingtalk-notify skill
openclaw skill install ./openclaw/skills/dingtalk-notify
```

### 4. 配置 Skills

```bash
# 配置 projex-status skill
openclaw skill config projex-status \
  --set projex_api_url="http://localhost:3000" \
  --set projex_api_key="your-api-key"

# 配置 dingtalk-notify skill
openclaw skill config dingtalk-notify \
  --set webhook_url="https://oapi.dingtalk.com/robot/send?access_token=xxx" \
  --set secret="SECxxx"
```

### 5. 部署工作流

```bash
# 部署每日状态推送工作流
openclaw workflow deploy ./openclaw/workflows/daily-status.yaml

# 部署风险告警工作流
openclaw workflow deploy ./openclaw/workflows/risk-alert.yaml

# 部署周报工作流
openclaw workflow deploy ./openclaw/workflows/weekly-report.yaml
```

## 验证安装

### 测试 Skills

```bash
# 测试获取迭代状态
openclaw skill run projex-status get_sprint_status

# 测试发送钉钉消息
openclaw skill run dingtalk-notify send_message \
  --param content="测试消息"
```

### 手动触发工作流

```bash
# 手动触发每日状态推送
openclaw workflow run daily-status-push

# 手动触发风险检查
openclaw workflow run risk-alert

# 手动生成周报
openclaw workflow run weekly-report
```

### 查看工作流状态

```bash
# 查看所有工作流
openclaw workflow list

# 查看工作流执行历史
openclaw workflow history daily-status-push

# 查看工作流日志
openclaw workflow logs daily-status-push --tail 100
```

## 配置说明

### Projex API 端点

Projex 提供以下 API 供 OpenClaw 调用：

| API | 方法 | 说明 |
|-----|------|------|
| `/api/openclaw/sprints/status` | GET | 获取迭代状态 |
| `/api/openclaw/releases/status` | GET | 获取发布状态 |
| `/api/openclaw/risks/analysis` | GET | 获取风险分析 |
| `/api/openclaw/reports/daily` | POST | 生成日报 |
| `/api/openclaw/reports/weekly` | POST | 生成周报 |

### 钉钉机器人配置

1. 在钉钉群中添加自定义机器人
2. 复制 Webhook 地址
3. 如果启用加签，复制密钥
4. 使用 `openclaw skill config` 配置

### 推送时间配置

修改工作流文件中的 `cron` 表达式：

```yaml
# 每日推送时间（默认 9:00）
cron: "0 9 * * *"

# 风险检查频率（默认每小时）
cron: "0 * * * *"

# 周报发送时间（默认周五 17:00）
cron: "0 17 * * 5"
```

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        OpenClaw                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Lobster 工作流引擎                   │    │
│  │                                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │    │
│  │  │ daily-status│  │ risk-alert  │  │weekly-report│   │    │
│  │  │ (每日 9:00) │  │ (每小时)    │  │(周五 17:00) │   │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │    │
│  └─────────┼────────────────┼────────────────┼──────────┘    │
│            │                │                │               │
│  ┌─────────┴────────────────┴────────────────┴──────────┐    │
│  │                      Skills                           │    │
│  │  ┌─────────────────┐    ┌─────────────────┐          │    │
│  │  │ projex-status   │    │ dingtalk-notify │          │    │
│  │  │ - get_sprint    │    │ - send_message  │          │    │
│  │  │ - get_release   │    │ - send_alert    │          │    │
│  │  │ - get_risk      │    │ - send_daily    │          │    │
│  │  │ - gen_report    │    │                 │          │    │
│  │  └────────┬────────┘    └────────┬────────┘          │    │
│  └───────────┼──────────────────────┼───────────────────┘    │
└──────────────┼──────────────────────┼────────────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│       Projex API         │  │      钉钉 Webhook        │
│  http://localhost:3000   │  │  oapi.dingtalk.com       │
│                          │  │                          │
│  /api/openclaw/sprints   │  │  发送 Markdown 消息      │
│  /api/openclaw/releases  │  │  @成员                   │
│  /api/openclaw/risks     │  │  @所有人（高风险时）      │
│  /api/openclaw/reports   │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

## 常见问题

### Q: 工作流没有按时执行？

检查：
1. OpenClaw 服务是否在运行：`openclaw status`
2. 工作流是否已部署：`openclaw workflow list`
3. 时区配置是否正确

### Q: 钉钉消息发送失败？

检查：
1. Webhook 地址是否正确
2. 如果启用加签，密钥是否配置正确
3. 钉钉机器人是否有 IP 白名单限制

### Q: Projex API 调用失败？

检查：
1. Projex 服务是否在运行
2. API 地址是否正确
3. 如果有 API Key，是否配置正确

## 联系支持

- GitHub Issues: https://github.com/your-org/projex/issues
- OpenClaw 文档: https://openclaw.ai/docs
