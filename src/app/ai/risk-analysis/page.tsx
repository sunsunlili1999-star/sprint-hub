"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Typography,
  Card,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Progress,
  Alert,
  Divider,
  Timeline,
  Collapse,
  Tabs,
  List,
  Badge,
  Tooltip,
  Modal,
  Input,
  message,
} from "antd"
import {
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BugOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  CopyOutlined,
  MailOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  SyncOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
} from "@ant-design/icons"

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

// 阶段配置
const stageConfig = {
  development: { label: "开发中", color: "#7c7cff", icon: <ThunderboltOutlined /> },
  testing: { label: "测试中", color: "#22d3ee", icon: <BugOutlined /> },
  acceptance: { label: "验收中", color: "#f59e0b", icon: <CheckCircleOutlined /> },
  release: { label: "待发布", color: "#10b981", icon: <RocketOutlined /> },
}

// 风险等级配置
const riskLevelConfig = {
  high: { label: "高风险", color: "#ef4444", bgColor: "#fef2f2" },
  medium: { label: "中风险", color: "#f59e0b", bgColor: "#fffbeb" },
  low: { label: "低风险", color: "#10b981", bgColor: "#ecfdf5" },
}

// 模拟风险数据
const mockRiskData = {
  summary: {
    total: 12,
    high: 3,
    medium: 5,
    low: 4,
    overallScore: 65,
  },
  stages: {
    development: {
      items: [
        {
          id: "dev-1",
          name: "用户认证模块",
          project: "电商平台 v2.0",
          assignee: "张三",
          riskLevel: "high",
          riskReason: "技术复杂度高，预估工时可能不足",
          suggestion: "建议增加 2 天缓冲时间，考虑引入第三方认证库",
          progress: 45,
          dueDate: "2024-01-20",
          daysLeft: 3,
        },
        {
          id: "dev-2",
          name: "订单管理 API",
          project: "电商平台 v2.0",
          assignee: "王五",
          riskLevel: "medium",
          riskReason: "接口数量多，联调时间可能紧张",
          suggestion: "提前准备 Mock 数据，并行开发前后端",
          progress: 60,
          dueDate: "2024-01-22",
          daysLeft: 5,
        },
      ],
    },
    testing: {
      items: [
        {
          id: "test-1",
          name: "支付流程测试",
          project: "电商平台 v2.0",
          assignee: "钱七",
          riskLevel: "high",
          riskReason: "涉及第三方支付，测试环境不稳定",
          suggestion: "准备支付沙箱环境，增加自动化测试覆盖",
          progress: 30,
          dueDate: "2024-01-25",
          daysLeft: 8,
        },
        {
          id: "test-2",
          name: "性能压力测试",
          project: "数据中台",
          assignee: "钱七",
          riskLevel: "medium",
          riskReason: "测试数据准备耗时，可能延期",
          suggestion: "使用数据生成脚本批量创建测试数据",
          progress: 20,
          dueDate: "2024-01-28",
          daysLeft: 11,
        },
      ],
    },
    acceptance: {
      items: [
        {
          id: "acc-1",
          name: "报表导出功能",
          project: "数据中台",
          assignee: "李四",
          riskLevel: "low",
          riskReason: "业务方确认时间不确定",
          suggestion: "提前与业务方预约验收时间",
          progress: 80,
          dueDate: "2024-01-18",
          daysLeft: 1,
        },
        {
          id: "acc-2",
          name: "用户权限模块",
          project: "电商平台 v2.0",
          assignee: "张三",
          riskLevel: "high",
          riskReason: "权限粒度要求变更，需要返工",
          suggestion: "紧急对齐需求，优先处理核心权限场景",
          progress: 65,
          dueDate: "2024-01-19",
          daysLeft: 2,
        },
      ],
    },
    release: {
      items: [
        {
          id: "rel-1",
          name: "数据迁移脚本",
          project: "数据中台",
          assignee: "赵六",
          riskLevel: "medium",
          riskReason: "数据量大，迁移时间较长",
          suggestion: "建议选择凌晨低峰期执行，准备回滚方案",
          progress: 95,
          dueDate: "2024-01-17",
          daysLeft: 0,
        },
        {
          id: "rel-2",
          name: "CDN 配置更新",
          project: "电商平台 v2.0",
          assignee: "王五",
          riskLevel: "low",
          riskReason: "配置简单，风险较低",
          suggestion: "准备配置回滚方案以备不时之需",
          progress: 100,
          dueDate: "2024-01-17",
          daysLeft: 0,
        },
      ],
    },
  },
}

// 日报模板
const dailyReportTemplate = `# 项目日报 - {date}

## 今日概况
- 高风险项：{high} 个
- 中风险项：{medium} 个
- 低风险项：{low} 个
- 整体风险评分：{score}/100

## 风险详情

### 高风险项（需立即关注）
{highRiskItems}

### 中风险项（需持续跟进）
{mediumRiskItems}

## AI 建议
{suggestions}

## 明日计划
- 持续跟进高风险项进展
- 确保测试环境稳定性
- 提前与业务方沟通验收时间

---
由 Projex 小派自动生成
`

export default function RiskAnalysisPage() {
  const router = useRouter()
  const [activeStage, setActiveStage] = useState("development")
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportContent, setReportContent] = useState("")

  // 生成日报
  const generateDailyReport = () => {
    const { summary, stages } = mockRiskData
    const date = new Date().toLocaleDateString("zh-CN")
    
    // 收集高风险项
    const highRiskItems = Object.values(stages)
      .flatMap(s => s.items)
      .filter(i => i.riskLevel === "high")
      .map(i => `- **${i.name}**（${i.project}）：${i.riskReason}\n  - 建议：${i.suggestion}`)
      .join("\n")
    
    // 收集中风险项
    const mediumRiskItems = Object.values(stages)
      .flatMap(s => s.items)
      .filter(i => i.riskLevel === "medium")
      .map(i => `- **${i.name}**（${i.project}）：${i.riskReason}`)
      .join("\n")
    
    const content = dailyReportTemplate
      .replace("{date}", date)
      .replace("{high}", String(summary.high))
      .replace("{medium}", String(summary.medium))
      .replace("{low}", String(summary.low))
      .replace("{score}", String(summary.overallScore))
      .replace("{highRiskItems}", highRiskItems || "暂无")
      .replace("{mediumRiskItems}", mediumRiskItems || "暂无")
      .replace("{suggestions}", "- 用户认证模块建议引入成熟的第三方认证库\n- 支付测试建议使用沙箱环境\n- 用户权限模块需要紧急对齐需求")
    
    setReportContent(content)
    setReportModalOpen(true)
  }

  // 复制报告
  const copyReport = () => {
    navigator.clipboard.writeText(reportContent)
    message.success("日报已复制到剪贴板")
  }

  // 渲染风险项
  const renderRiskItem = (item: typeof mockRiskData.stages.development.items[0]) => {
    const riskConfig = riskLevelConfig[item.riskLevel as keyof typeof riskLevelConfig]
    return (
      <Card
        key={item.id}
        size="small"
        style={{
          marginBottom: 12,
          borderRadius: 8,
          border: `1px solid ${riskConfig.color}30`,
          background: riskConfig.bgColor,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <Space style={{ marginBottom: 8 }}>
              <Tag color={riskConfig.color} style={{ margin: 0 }}>
                {riskConfig.label}
              </Tag>
              <Text strong>{item.name}</Text>
            </Space>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.project} · <UserOutlined /> {item.assignee}
              </Text>
            </div>
            <div style={{ marginBottom: 8 }}>
              <ExclamationCircleOutlined style={{ color: riskConfig.color, marginRight: 8 }} />
              <Text style={{ fontSize: 13 }}>{item.riskReason}</Text>
            </div>
            <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <BulbOutlined style={{ color: "#7c7cff", marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: "#7c7cff" }}>{item.suggestion}</Text>
            </div>
          </div>
          <div style={{ textAlign: "right", marginLeft: 16, minWidth: 100 }}>
            <div style={{ marginBottom: 8 }}>
              <Progress
                type="circle"
                percent={item.progress}
                size={50}
                strokeColor={riskConfig.color}
              />
            </div>
            <Tag
              icon={<ClockCircleOutlined />}
              color={item.daysLeft <= 2 ? "error" : item.daysLeft <= 5 ? "warning" : "default"}
            >
              {item.daysLeft === 0 ? "今日到期" : `剩余 ${item.daysLeft} 天`}
            </Tag>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* 返回按钮 */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/ai/iteration-plan")}
        style={{ marginBottom: 16, padding: "4px 0" }}
      >
        返回迭代计划
      </Button>

      {/* 页面标题 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
            <SafetyCertificateOutlined style={{ marginRight: 12, color: "#f59e0b" }} />
            AI 风险分析
          </Title>
          <Text type="secondary">
            AI 实时监控项目各阶段风险，提供预警和建议
          </Text>
        </div>
        <Space>
          <Button icon={<SyncOutlined />}>刷新分析</Button>
          <Button type="primary" icon={<FileTextOutlined />} onClick={generateDailyReport}>
            生成日报
          </Button>
        </Space>
      </div>

      {/* 风险概览 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 600, color: "#7c7cff", marginBottom: 8 }}>
              {mockRiskData.summary.total}
            </div>
            <Text type="secondary">监控项总数</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: "center", borderTop: "3px solid #ef4444" }}>
            <div style={{ fontSize: 36, fontWeight: 600, color: "#ef4444", marginBottom: 8 }}>
              {mockRiskData.summary.high}
            </div>
            <Text type="secondary">高风险</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: "center", borderTop: "3px solid #f59e0b" }}>
            <div style={{ fontSize: 36, fontWeight: 600, color: "#f59e0b", marginBottom: 8 }}>
              {mockRiskData.summary.medium}
            </div>
            <Text type="secondary">中风险</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: "center", borderTop: "3px solid #10b981" }}>
            <div style={{ fontSize: 36, fontWeight: 600, color: "#10b981", marginBottom: 8 }}>
              {mockRiskData.summary.low}
            </div>
            <Text type="secondary">低风险</Text>
          </Card>
        </Col>
      </Row>

      {/* 整体风险评分 */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row align="middle" gutter={24}>
          <Col span={8}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Progress
                type="dashboard"
                percent={mockRiskData.summary.overallScore}
                strokeColor={{
                  "0%": "#22d3ee",
                  "100%": mockRiskData.summary.overallScore > 70 ? "#ef4444" : mockRiskData.summary.overallScore > 40 ? "#f59e0b" : "#10b981",
                }}
                size={120}
                format={(percent) => (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 600 }}>{percent}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>风险指数</div>
                  </div>
                )}
              />
              <div style={{ marginLeft: 24 }}>
                <Title level={5} style={{ margin: 0, marginBottom: 8 }}>整体风险评估</Title>
                <Tag color="warning" icon={<WarningOutlined />}>中等风险</Tag>
                <Paragraph type="secondary" style={{ margin: "8px 0 0", fontSize: 13 }}>
                  当前有 3 个高风险项需要立即关注
                </Paragraph>
              </div>
            </div>
          </Col>
          <Col span={16}>
            <Alert
              type="warning"
              icon={<FireOutlined />}
              message="重点关注"
              description={
                <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                  <li><strong>用户认证模块</strong> - 技术复杂度高，建议增加缓冲时间</li>
                  <li><strong>支付流程测试</strong> - 第三方依赖风险，建议准备沙箱环境</li>
                  <li><strong>用户权限模块</strong> - 需求变更导致返工，建议紧急对齐</li>
                </ul>
              }
              style={{ borderRadius: 8 }}
            />
          </Col>
        </Row>
      </Card>

      {/* 分阶段风险详情 */}
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>分阶段风险详情</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Tabs
          activeKey={activeStage}
          onChange={setActiveStage}
          items={Object.entries(stageConfig).map(([key, config]) => {
            const stageData = mockRiskData.stages[key as keyof typeof mockRiskData.stages]
            const highCount = stageData.items.filter(i => i.riskLevel === "high").length
            return {
              key,
              label: (
                <Space>
                  {config.icon}
                  <span>{config.label}</span>
                  <Badge count={stageData.items.length} style={{ backgroundColor: config.color }} />
                  {highCount > 0 && (
                    <Badge count={highCount} style={{ backgroundColor: "#ef4444" }} />
                  )}
                </Space>
              ),
              children: (
                <div style={{ padding: "16px 0" }}>
                  {stageData.items.length > 0 ? (
                    stageData.items.map(renderRiskItem)
                  ) : (
                    <div style={{ textAlign: "center", padding: 40 }}>
                      <CheckCircleOutlined style={{ fontSize: 48, color: "#10b981", marginBottom: 16 }} />
                      <div>
                        <Text type="secondary">该阶段暂无风险项</Text>
                      </div>
                    </div>
                  )}
                </div>
              ),
            }
          })}
        />
      </Card>

      {/* 日报弹窗 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>项目日报</span>
          </Space>
        }
        open={reportModalOpen}
        onCancel={() => setReportModalOpen(false)}
        width={700}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={copyReport}>
            复制内容
          </Button>,
          <Button key="email" icon={<MailOutlined />} type="primary">
            发送邮件
          </Button>,
        ]}
      >
        <TextArea
          value={reportContent}
          rows={20}
          style={{ fontFamily: "monospace", fontSize: 13 }}
          onChange={(e) => setReportContent(e.target.value)}
        />
      </Modal>

      {/* 底部操作 */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={() => router.push("/ai/iteration-plan")}>
          <ArrowLeftOutlined /> 返回迭代计划
        </Button>
        <Button type="primary" onClick={() => router.push("/ai/daily-alerts")}>
          查看每日提醒 <WarningOutlined />
        </Button>
      </div>
    </div>
  )
}
