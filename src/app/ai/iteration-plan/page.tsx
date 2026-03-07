"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Typography,
  Card,
  Button,
  Steps,
  Tag,
  Space,
  Row,
  Col,
  Progress,
  Alert,
  Divider,
  Timeline,
  Collapse,
  Spin,
  message,
  Badge,
  Tooltip,
} from "antd"
import {
  CalendarOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ThunderboltOutlined,
  StarFilled,
  StarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  TeamOutlined,
  BulbOutlined,
  CheckOutlined,
  SyncOutlined,
} from "@ant-design/icons"

const { Title, Text, Paragraph } = Typography

// 模拟 AI 生成的迭代方案
const mockPlans = [
  {
    id: "plan-1",
    name: "推荐方案",
    recommended: true,
    iterations: 2,
    totalWeeks: 4,
    riskScore: 15,
    resourceUtilization: 85,
    description: "平衡风险与效率的最优方案，资源利用率高且风险可控",
    highlights: ["高优先级需求优先交付", "充足的测试时间", "资源分配均匀"],
    sprints: [
      {
        name: "迭代 1",
        startDate: "2024-01-15",
        endDate: "2024-01-26",
        tasks: [
          { name: "用户登录模块", priority: "P0", estimate: "16h", assignee: "张三", status: "ready" },
          { name: "用户注册功能", priority: "P0", estimate: "12h", assignee: "张三", status: "ready" },
          { name: "登录API开发", priority: "P0", estimate: "16h", assignee: "王五", status: "ready" },
          { name: "数据库设计", priority: "P0", estimate: "8h", assignee: "王五", status: "ready" },
          { name: "登录页面UI设计", priority: "P1", estimate: "8h", assignee: "孙八", status: "ready" },
        ],
        totalHours: 60,
        capacity: 72,
      },
      {
        name: "迭代 2",
        startDate: "2024-01-29",
        endDate: "2024-02-09",
        tasks: [
          { name: "订单管理模块", priority: "P1", estimate: "20h", assignee: "李四", status: "ready" },
          { name: "订单API开发", priority: "P1", estimate: "16h", assignee: "赵六", status: "ready" },
          { name: "支付集成", priority: "P1", estimate: "12h", assignee: "王五", status: "ready" },
          { name: "功能测试", priority: "P1", estimate: "16h", assignee: "钱七", status: "ready" },
        ],
        totalHours: 64,
        capacity: 72,
      },
    ],
  },
  {
    id: "plan-2",
    name: "快速交付方案",
    recommended: false,
    iterations: 1,
    totalWeeks: 3,
    riskScore: 45,
    resourceUtilization: 95,
    description: "压缩时间快速交付，但风险较高，需要团队加班配合",
    highlights: ["最短交付周期", "资源利用最大化", "需要适当加班"],
    sprints: [
      {
        name: "迭代 1",
        startDate: "2024-01-15",
        endDate: "2024-02-02",
        tasks: [
          { name: "用户登录模块", priority: "P0", estimate: "16h", assignee: "张三", status: "ready" },
          { name: "用户注册功能", priority: "P0", estimate: "12h", assignee: "张三", status: "ready" },
          { name: "登录API开发", priority: "P0", estimate: "16h", assignee: "王五", status: "ready" },
          { name: "订单管理模块", priority: "P1", estimate: "20h", assignee: "李四", status: "ready" },
          { name: "订单API开发", priority: "P1", estimate: "16h", assignee: "赵六", status: "ready" },
          { name: "支付集成", priority: "P1", estimate: "12h", assignee: "王五", status: "ready" },
        ],
        totalHours: 92,
        capacity: 96,
      },
    ],
  },
  {
    id: "plan-3",
    name: "保守方案",
    recommended: false,
    iterations: 3,
    totalWeeks: 6,
    riskScore: 5,
    resourceUtilization: 65,
    description: "充分的缓冲时间，风险最低，适合对时间不敏感的项目",
    highlights: ["充足的缓冲时间", "风险最低", "适合新团队"],
    sprints: [
      {
        name: "迭代 1",
        startDate: "2024-01-15",
        endDate: "2024-01-26",
        tasks: [
          { name: "用户登录模块", priority: "P0", estimate: "16h", assignee: "张三", status: "ready" },
          { name: "登录API开发", priority: "P0", estimate: "16h", assignee: "王五", status: "ready" },
          { name: "数据库设计", priority: "P0", estimate: "8h", assignee: "王五", status: "ready" },
        ],
        totalHours: 40,
        capacity: 72,
      },
      {
        name: "迭代 2",
        startDate: "2024-01-29",
        endDate: "2024-02-09",
        tasks: [
          { name: "用户注册功能", priority: "P0", estimate: "12h", assignee: "张三", status: "ready" },
          { name: "订单管理模块", priority: "P1", estimate: "20h", assignee: "李四", status: "ready" },
          { name: "订单API开发", priority: "P1", estimate: "16h", assignee: "赵六", status: "ready" },
        ],
        totalHours: 48,
        capacity: 72,
      },
      {
        name: "迭代 3",
        startDate: "2024-02-12",
        endDate: "2024-02-23",
        tasks: [
          { name: "支付集成", priority: "P1", estimate: "12h", assignee: "王五", status: "ready" },
          { name: "功能测试", priority: "P1", estimate: "16h", assignee: "钱七", status: "ready" },
          { name: "UI优化", priority: "P2", estimate: "8h", assignee: "孙八", status: "ready" },
        ],
        totalHours: 36,
        capacity: 72,
      },
    ],
  },
]

// 风险等级配色
const getRiskColor = (score: number) => {
  if (score <= 20) return "#10b981"
  if (score <= 40) return "#f59e0b"
  return "#ef4444"
}

const getRiskLabel = (score: number) => {
  if (score <= 20) return "低风险"
  if (score <= 40) return "中风险"
  return "高风险"
}

// 优先级配色
const priorityConfig: Record<string, { color: string; label: string }> = {
  P0: { color: "#ef4444", label: "P0-紧急" },
  P1: { color: "#f59e0b", label: "P1-高" },
  P2: { color: "#7c7cff", label: "P2-中" },
  P3: { color: "#94a3b8", label: "P3-低" },
}

export default function IterationPlanPage() {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(true) // 默认已生成
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  // 模拟重新生成
  const handleRegenerate = () => {
    setGenerating(true)
    setGenerated(false)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      message.success("AI 已重新生成迭代计划！")
    }, 2000)
  }

  // 选择方案
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    message.success("已选择方案，可以录入系统")
  }

  // 导入系统
  const handleImportToSystem = () => {
    if (!selectedPlan) {
      message.warning("请先选择一个方案")
      return
    }
    setImporting(true)
    setTimeout(() => {
      setImporting(false)
      message.success("迭代计划已成功录入项目管理系统！")
      router.push("/iterations")
    }, 1500)
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* 返回按钮 */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/ai/team-resources")}
        style={{ marginBottom: 16, padding: "4px 0" }}
      >
        返回资源配置
      </Button>

      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
          <CalendarOutlined style={{ marginRight: 12, color: "#7c7cff" }} />
          AI 迭代计划
        </Title>
        <Text type="secondary">
          AI 根据需求和资源情况，为您生成多个迭代方案，选择最适合的方案录入系统
        </Text>
      </div>

      {/* 步骤条 */}
      <Steps
        current={3}
        style={{ marginBottom: 32 }}
        items={[
          { title: "上传文档", icon: <FileTextOutlined /> },
          { title: "确认需求", icon: <CheckCircleOutlined /> },
          { title: "配置资源", icon: <UserOutlined /> },
          { title: "生成计划", icon: <CalendarOutlined /> },
        ]}
      />

      {/* 生成中状态 */}
      {generating && (
        <Card style={{ textAlign: "center", padding: "60px 0", marginBottom: 24, borderRadius: 12 }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 24, marginBottom: 8 }}>
            AI 正在生成迭代计划...
          </Title>
          <Text type="secondary">正在分析需求依赖、资源容量，生成最优方案</Text>
        </Card>
      )}

      {/* 已生成的方案 */}
      {generated && !generating && (
        <>
          {/* 操作栏 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <Space>
              <Tag icon={<ThunderboltOutlined />} color="#7c7cff">
                AI 已生成 {mockPlans.length} 个方案
              </Tag>
              <Text type="secondary">基于 6 个需求、6 名成员、2 周迭代周期</Text>
            </Space>
            <Space>
              <Button icon={<SyncOutlined />} onClick={handleRegenerate}>
                重新生成
              </Button>
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={handleImportToSystem}
                loading={importing}
                disabled={!selectedPlan}
                style={{
                  background: selectedPlan ? "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)" : undefined,
                  border: "none",
                }}
              >
                录入项目系统
              </Button>
            </Space>
          </div>

          {/* 方案对比卡片 */}
          <Row gutter={24}>
            {mockPlans.map((plan) => (
              <Col span={8} key={plan.id}>
                <Card
                  hoverable
                  style={{
                    marginBottom: 24,
                    borderRadius: 12,
                    border: selectedPlan === plan.id ? "2px solid #7c7cff" : plan.recommended ? "2px solid #22d3ee" : "1px solid #e2e8f0",
                    background: selectedPlan === plan.id ? "linear-gradient(135deg, #7c7cff08 0%, #22d3ee08 100%)" : undefined,
                  }}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {/* 方案标题 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <Space>
                        <Title level={5} style={{ margin: 0 }}>
                          {plan.name}
                        </Title>
                        {plan.recommended && (
                          <Tag icon={<StarFilled />} color="#22d3ee">
                            推荐
                          </Tag>
                        )}
                      </Space>
                      <Paragraph type="secondary" style={{ margin: "8px 0 0", fontSize: 13 }}>
                        {plan.description}
                      </Paragraph>
                    </div>
                    {selectedPlan === plan.id && (
                      <CheckCircleOutlined style={{ color: "#7c7cff", fontSize: 24 }} />
                    )}
                  </div>

                  <Divider style={{ margin: "16px 0" }} />

                  {/* 关键指标 */}
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <div style={{ textAlign: "center" }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>迭代数</Text>
                        <div style={{ fontSize: 24, fontWeight: 600, color: "#7c7cff" }}>
                          {plan.iterations}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: "center" }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>总周期</Text>
                        <div style={{ fontSize: 24, fontWeight: 600, color: "#22d3ee" }}>
                          {plan.totalWeeks}周
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: "center" }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>风险</Text>
                        <div style={{ fontSize: 24, fontWeight: 600, color: getRiskColor(plan.riskScore) }}>
                          {plan.riskScore}%
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* 资源利用率 */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>资源利用率</Text>
                      <Text style={{ fontSize: 12 }}>{plan.resourceUtilization}%</Text>
                    </div>
                    <Progress
                      percent={plan.resourceUtilization}
                      strokeColor={plan.resourceUtilization > 90 ? "#f59e0b" : "#7c7cff"}
                      trailColor="#f1f5f9"
                      showInfo={false}
                      size="small"
                    />
                  </div>

                  {/* 风险指标 */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>风险评分</Text>
                      <Tag color={getRiskColor(plan.riskScore)} style={{ margin: 0, fontSize: 11 }}>
                        {getRiskLabel(plan.riskScore)}
                      </Tag>
                    </div>
                    <Progress
                      percent={plan.riskScore}
                      strokeColor={getRiskColor(plan.riskScore)}
                      trailColor="#f1f5f9"
                      showInfo={false}
                      size="small"
                    />
                  </div>

                  {/* 方案亮点 */}
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>方案亮点</Text>
                    <div style={{ marginTop: 8 }}>
                      {plan.highlights.map((h, i) => (
                        <Tag key={i} style={{ marginBottom: 4, background: "#f8fafc", border: "none" }}>
                          <CheckOutlined style={{ color: "#22d3ee", marginRight: 4 }} />
                          {h}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* 选中方案的详细信息 */}
          {selectedPlan && (
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  <span>迭代详情 - {mockPlans.find(p => p.id === selectedPlan)?.name}</span>
                </Space>
              }
              style={{ borderRadius: 12, marginBottom: 24 }}
            >
              <Collapse
                defaultActiveKey={["0"]}
                items={mockPlans
                  .find(p => p.id === selectedPlan)
                  ?.sprints.map((sprint, index) => ({
                    key: String(index),
                    label: (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                        <Space>
                          <Text strong>{sprint.name}</Text>
                          <Text type="secondary">({sprint.startDate} ~ {sprint.endDate})</Text>
                        </Space>
                        <Space>
                          <Tag>{sprint.tasks.length} 个任务</Tag>
                          <Progress
                            percent={Math.round((sprint.totalHours / sprint.capacity) * 100)}
                            size="small"
                            style={{ width: 100 }}
                            strokeColor="#7c7cff"
                          />
                          <Text type="secondary">{sprint.totalHours}h / {sprint.capacity}h</Text>
                        </Space>
                      </div>
                    ),
                    children: (
                      <Timeline
                        items={sprint.tasks.map(task => ({
                          color: priorityConfig[task.priority]?.color || "#7c7cff",
                          children: (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Space>
                                <Tag
                                  style={{
                                    margin: 0,
                                    background: `${priorityConfig[task.priority]?.color}15`,
                                    color: priorityConfig[task.priority]?.color,
                                    border: "none",
                                  }}
                                >
                                  {task.priority}
                                </Tag>
                                <Text>{task.name}</Text>
                              </Space>
                              <Space>
                                <Tag icon={<UserOutlined />}>{task.assignee}</Tag>
                                <Tag icon={<ClockCircleOutlined />}>{task.estimate}</Tag>
                              </Space>
                            </div>
                          ),
                        }))}
                      />
                    ),
                  }))}
              />
            </Card>
          )}

          {/* AI 建议 */}
          <Alert
            icon={<BulbOutlined />}
            message="AI 建议"
            description={
              <div>
                <Paragraph style={{ margin: 0 }}>
                  基于当前需求分析和资源配置，<strong>推荐方案</strong>是最优选择：
                </Paragraph>
                <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                  <li>高优先级需求（P0）在第一个迭代优先交付，确保核心功能上线</li>
                  <li>每个迭代预留 15% 缓冲时间处理突发问题</li>
                  <li>任务分配考虑了成员技能匹配度，减少交接成本</li>
                </ul>
              </div>
            }
            type="info"
            style={{ borderRadius: 12, marginBottom: 24 }}
          />
        </>
      )}

      {/* 底部操作 */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={() => router.push("/ai/team-resources")}>
          <ArrowLeftOutlined /> 上一步
        </Button>
        <Space>
          <Button onClick={() => router.push("/ai/risk-analysis")}>
            查看风险分析 <ArrowRightOutlined />
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleImportToSystem}
            loading={importing}
            disabled={!selectedPlan}
            style={{
              background: selectedPlan ? "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)" : undefined,
              border: "none",
            }}
          >
            <RocketOutlined /> 确认并录入系统
          </Button>
        </Space>
      </div>
    </div>
  )
}
