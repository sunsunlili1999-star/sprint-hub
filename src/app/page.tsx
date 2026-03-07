"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Typography,
  Card,
  Button,
  Space,
  Tag,
  Avatar,
  Progress,
  Badge,
  Tooltip,
  Tabs,
  List,
  Collapse,
  Checkbox,
} from "antd"
import {
  RobotOutlined,
  RocketOutlined,
  FileTextOutlined,
  TeamOutlined,
  WarningOutlined,
  BulbOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  BugOutlined,
  UserOutlined,
  SyncOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  FieldTimeOutlined,
  ProjectOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  EditOutlined,
  MessageOutlined,
  PlusOutlined,
  EyeOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons"
import { useBreadcrumb } from "@/components/layout/main-layout"

const { Title, Text, Paragraph } = Typography

// ==================== 模拟数据 ====================

// AI 项目跟踪 - 发布计划风险
const releaseRisks = [
  {
    id: "release-1",
    name: "电商平台 v2.0",
    plannedDate: "2024-01-20",
    status: "IN_PROGRESS",
    riskLevel: "high",
    riskScore: 72,
    dimensions: {
      bugBurndown: { status: "warning", value: 65, desc: "缺陷修复燃尽速度偏慢", detail: "剩余12个缺陷，日均修复2个，预计延期3天" },
      testProgress: { status: "danger", value: 45, desc: "测试进度滞后", detail: "计划完成80%，实际45%，缺口35%" },
      acceptProgress: { status: "warning", value: 30, desc: "验收进度待提升", detail: "5个需求待验收，已验收3个" },
    },
  },
  {
    id: "release-2",
    name: "数据中台 v1.5",
    plannedDate: "2024-01-25",
    status: "READY",
    riskLevel: "low",
    riskScore: 18,
    dimensions: {
      bugBurndown: { status: "success", value: 95, desc: "缺陷修复进度良好", detail: "仅剩1个低优先级缺陷" },
      testProgress: { status: "success", value: 100, desc: "测试已完成", detail: "所有测试用例通过" },
      acceptProgress: { status: "success", value: 100, desc: "验收已完成", detail: "产品已确认验收" },
    },
  },
]

// AI 项目跟踪 - 迭代过程风险
const sprintRisks = [
  {
    id: "sprint-1",
    name: "Sprint 3 - 电商平台",
    project: "电商平台",
    endDate: "2024-01-19",
    progress: 62,
    riskLevel: "medium",
    issues: [
      { type: "delay", title: "购物车重构任务进度滞后", desc: "预计完成时间超出2天", assignee: "王五", severity: "high" },
      { type: "blocker", title: "支付接口依赖阻断", desc: "等待第三方支付SDK更新", assignee: "张三", severity: "medium" },
    ],
  },
  {
    id: "sprint-2",
    name: "Sprint 2 - 数据中台",
    project: "数据中台",
    endDate: "2024-01-22",
    progress: 85,
    riskLevel: "low",
    issues: [],
  },
]

// 人员资源占用
const resourceConflicts = [
  {
    id: "conflict-1",
    member: { id: "1", name: "张三", avatar: null, role: "高级开发" },
    workload: 145, // 百分比，超过100表示超负荷
    conflicts: [
      { project: "电商平台 v2.0", task: "修复支付回调异常", hours: 16, priority: "P0", type: "bug" },
      { project: "Sprint 3", task: "订单模块开发", hours: 24, priority: "P1", type: "task" },
      { project: "数据中台 v1.5", task: "数据导出功能支持", hours: 8, priority: "P2", type: "task" },
    ],
    suggestion: "建议将「数据导出功能支持」任务转交给李四",
  },
  {
    id: "conflict-2",
    member: { id: "5", name: "钱七", avatar: null, role: "测试工程师" },
    workload: 130,
    conflicts: [
      { project: "电商平台 v2.0", task: "支付流程回归测试", hours: 20, priority: "P0", type: "test" },
      { project: "电商平台 v2.0", task: "首页改版功能测试", hours: 16, priority: "P1", type: "test" },
      { project: "数据中台", task: "报表功能测试", hours: 12, priority: "P2", type: "test" },
    ],
    suggestion: "建议协调测试资源，或将P2任务延后至下周",
  },
]



// 逾期工作项
const overdueItems = [
  {
    id: "overdue-1",
    title: "用户权限模块重构",
    type: "requirement",
    project: "电商平台",
    assignee: { name: "李四", avatar: null },
    dueDate: "2024-01-15",
    overdueDays: 2,
    priority: "P1",
  },
  {
    id: "overdue-2",
    title: "修复登录闪退问题",
    type: "bug",
    project: "移动APP",
    assignee: { name: "赵六", avatar: null },
    dueDate: "2024-01-14",
    overdueDays: 3,
    priority: "P0",
  },
  {
    id: "overdue-3",
    title: "商品搜索性能优化",
    type: "task",
    project: "电商平台",
    assignee: { name: "王五", avatar: null },
    dueDate: "2024-01-16",
    overdueDays: 1,
    priority: "P2",
  },
]

// 今日待办 - 工作项中起止范围在今日之内的内容
const todayWorkItems = [
  { 
    id: "work-1", 
    title: "用户登录模块优化", 
    type: "task", 
    project: "电商平台",
    startDate: "2024-01-15",
    endDate: "2024-01-17",
    priority: "P1",
    assignee: "张三",
    status: "IN_PROGRESS",
    done: true,
  },
  { 
    id: "work-2", 
    title: "修复支付回调异常", 
    type: "bug", 
    project: "电商平台",
    startDate: "2024-01-17",
    endDate: "2024-01-17",
    priority: "P0",
    assignee: "张三",
    status: "IN_PROGRESS",
    done: false,
  },
  { 
    id: "work-3", 
    title: "商品详情页重构", 
    type: "requirement", 
    project: "电商平台",
    startDate: "2024-01-16",
    endDate: "2024-01-18",
    priority: "P1",
    assignee: "李四",
    status: "IN_PROGRESS",
    done: false,
  },
  { 
    id: "work-4", 
    title: "购物车功能测试", 
    type: "test", 
    project: "电商平台",
    startDate: "2024-01-17",
    endDate: "2024-01-17",
    priority: "P2",
    assignee: "钱七",
    status: "TODO",
    done: false,
  },
  { 
    id: "work-5", 
    title: "数据导出接口开发", 
    type: "task", 
    project: "数据中台",
    startDate: "2024-01-15",
    endDate: "2024-01-17",
    priority: "P2",
    assignee: "王五",
    status: "IN_PROGRESS",
    done: false,
  },
]

// 团队动态
const teamActivities = [
  { id: "act-1", user: "张三", action: "完成了任务", target: "订单状态同步优化", project: "电商平台", time: "10分钟前", type: "complete" },
  { id: "act-2", user: "李四", action: "提交了代码", target: "feat: 商品详情页重构", project: "电商平台", time: "25分钟前", type: "commit" },
  { id: "act-3", user: "钱七", action: "发现了缺陷", target: "支付金额计算精度问题", project: "电商平台", time: "1小时前", type: "bug" },
  { id: "act-4", user: "王五", action: "更新了任务状态", target: "购物车功能重构 → 进行中", project: "电商平台", time: "1小时前", type: "update" },
  { id: "act-5", user: "赵六", action: "完成了测试", target: "用户登录流程回归测试", project: "移动APP", time: "2小时前", type: "test" },
  { id: "act-6", user: "小派", action: "检测到风险", target: "电商平台 v2.0 测试进度滞后", project: "电商平台", time: "3小时前", type: "ai" },
]

// ==================== 辅助函数 ====================

const getStatusColor = (status: string) => {
  switch (status) {
    case "success": return "#10b981"
    case "warning": return "#f59e0b"
    case "danger": return "#ef4444"
    default: return "#64748b"
  }
}

const getStatusBg = (status: string) => {
  switch (status) {
    case "success": return "#ecfdf5"
    case "warning": return "#fffbeb"
    case "danger": return "#fef2f2"
    default: return "#f8fafc"
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "requirement": return <FileTextOutlined />
    case "bug": return <BugOutlined />
    case "task": return <CheckCircleOutlined />
    case "test": return <SafetyCertificateOutlined />
    default: return <FileTextOutlined />
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "requirement": return "#7c7cff"
    case "bug": return "#ef4444"
    case "task": return "#22d3ee"
    case "test": return "#10b981"
    default: return "#64748b"
  }
}

const getTypeName = (type: string) => {
  switch (type) {
    case "requirement": return "需求"
    case "bug": return "缺陷"
    case "task": return "任务"
    case "test": return "测试"
    default: return "其他"
  }
}

// ==================== 组件 ====================

export default function DashboardPage() {
  const router = useRouter()
  const { setBreadcrumbs } = useBreadcrumb()
  const [activeRiskTab, setActiveRiskTab] = useState("release")

  useEffect(() => {
    setBreadcrumbs([{ title: "AI 工作台" }])
  }, [setBreadcrumbs])

  // 计算统计数据
  const stats = {
    highRiskReleases: releaseRisks.filter(r => r.riskLevel === "high").length,
    sprintIssues: sprintRisks.reduce((acc, s) => acc + s.issues.length, 0),
    resourceConflicts: resourceConflicts.length,
    overdueItems: overdueItems.length,
    todayWorkItems: todayWorkItems.filter(t => !t.done).length,
  }
  
  // 今日待办状态管理
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    todayWorkItems.forEach(item => {
      initial[item.id] = item.done
    })
    return initial
  })
  
  const handleCheckChange = (id: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [id]: checked }))
  }
  
  const completedCount = Object.values(checkedItems).filter(Boolean).length

  // 渲染发布风险维度
  const renderReleaseDimension = (key: string, dim: { status: string; value: number; desc: string; detail: string }) => (
    <div
      key={key}
      style={{
        padding: "12px 16px",
        background: getStatusBg(dim.status),
        borderRadius: 8,
        border: `1px solid ${getStatusColor(dim.status)}20`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ fontSize: 13, color: "#64748b" }}>{dim.desc}</Text>
        <Tag
          style={{
            margin: 0,
            background: `${getStatusColor(dim.status)}15`,
            color: getStatusColor(dim.status),
            border: "none",
          }}
        >
          {dim.value}%
        </Tag>
      </div>
      <Progress
        percent={dim.value}
        size="small"
        strokeColor={getStatusColor(dim.status)}
        trailColor="#e2e8f0"
        showInfo={false}
      />
      <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>{dim.detail}</Text>
    </div>
  )

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1600, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        {/* 左侧主内容区 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* AI 项目跟踪 */}
          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: "#7c7cff" }} />
                <span>AI 项目跟踪</span>
                <Tag color="#7c7cff" style={{ margin: 0 }}>实时监控</Tag>
              </Space>
            }
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            <Tabs
              activeKey={activeRiskTab}
              onChange={setActiveRiskTab}
              style={{ padding: "0 24px" }}
              items={[
                {
                  key: "release",
                  label: (
                    <Space>
                      <RocketOutlined />
                      发布计划风险
                      {stats.highRiskReleases > 0 && <Badge count={stats.highRiskReleases} style={{ backgroundColor: "#ef4444" }} />}
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: "16px 0 24px" }}>
                      <Collapse
                        defaultActiveKey={["release-1"]}
                        expandIcon={({ isActive }) => isActive ? <DownOutlined /> : <RightOutlined />}
                        style={{ background: "transparent", border: "none" }}
                        items={releaseRisks.map((release) => ({
                          key: release.id,
                          style: {
                            marginBottom: 12,
                            background: release.riskLevel === "high" ? "#fef2f2" : release.riskLevel === "medium" ? "#fffbeb" : "#f8fafc",
                            borderRadius: 8,
                            border: `1px solid ${release.riskLevel === "high" ? "#fecaca" : release.riskLevel === "medium" ? "#fde68a" : "#e2e8f0"}`,
                          },
                          label: (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                              <Space>
                                <Text strong>{release.name}</Text>
                                <Tag
                                  color={release.riskLevel === "high" ? "error" : release.riskLevel === "medium" ? "warning" : "success"}
                                  style={{ margin: 0 }}
                                >
                                  {release.riskLevel === "high" ? "高风险" : release.riskLevel === "medium" ? "中风险" : "低风险"}
                                </Tag>
                                <Tag icon={<RobotOutlined />} style={{ margin: 0, background: "#f5f3ff", color: "#7c7cff", border: "none" }}>
                                  风险评分 {release.riskScore}
                                </Tag>
                              </Space>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <CalendarOutlined style={{ marginRight: 4 }} />
                                计划发布 {release.plannedDate}
                              </Text>
                            </div>
                          ),
                          children: (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              {renderReleaseDimension("bug", release.dimensions.bugBurndown)}
                              {renderReleaseDimension("test", release.dimensions.testProgress)}
                              {renderReleaseDimension("accept", release.dimensions.acceptProgress)}
                              <Button type="link" style={{ padding: 0, height: "auto", alignSelf: "flex-start" }}>
                                查看详细风险报告 <ArrowRightOutlined />
                              </Button>
                            </div>
                          ),
                        }))}
                      />
                    </div>
                  ),
                },
                {
                  key: "sprint",
                  label: (
                    <Space>
                      <ThunderboltOutlined />
                      迭代过程风险
                      {stats.sprintIssues > 0 && <Badge count={stats.sprintIssues} style={{ backgroundColor: "#f59e0b" }} />}
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: "16px 0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                      {sprintRisks.map((sprint) => (
                        <div
                          key={sprint.id}
                          style={{
                            padding: 16,
                            borderRadius: 8,
                            background: sprint.issues.length > 0 ? "#fffbeb" : "#f8fafc",
                            border: `1px solid ${sprint.issues.length > 0 ? "#fde68a" : "#e2e8f0"}`,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <Space>
                              <Text strong>{sprint.name}</Text>
                              <Tag style={{ margin: 0, background: "#f1f5f9", border: "none" }}>{sprint.project}</Tag>
                            </Space>
                            <Space>
                              <Text type="secondary" style={{ fontSize: 12 }}>截止 {sprint.endDate}</Text>
                              <Progress percent={sprint.progress} size="small" style={{ width: 80, margin: 0 }} />
                            </Space>
                          </div>
                          {sprint.issues.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {sprint.issues.map((issue, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 12,
                                    padding: "10px 12px",
                                    background: "#fff",
                                    borderRadius: 6,
                                    border: "1px solid #fde68a",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: 4,
                                      background: issue.type === "delay" ? "#fef3c7" : "#fee2e2",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {issue.type === "delay" ? (
                                      <ClockCircleOutlined style={{ fontSize: 12, color: "#f59e0b" }} />
                                    ) : (
                                      <ExclamationCircleOutlined style={{ fontSize: 12, color: "#ef4444" }} />
                                    )}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <Text strong style={{ fontSize: 13 }}>{issue.title}</Text>
                                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>{issue.desc}</Text>
                                  </div>
                                  <Tag style={{ margin: 0 }}>{issue.assignee}</Tag>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ textAlign: "center", padding: "12px 0", color: "#10b981" }}>
                              <CheckCircleOutlined style={{ marginRight: 8 }} />
                              迭代进展顺利，暂无风险
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "resource",
                  label: (
                    <Space>
                      <TeamOutlined />
                      人员资源占用
                      {stats.resourceConflicts > 0 && <Badge count={stats.resourceConflicts} style={{ backgroundColor: "#a855f7" }} />}
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: "16px 0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                      {resourceConflicts.map((conflict) => (
                        <div
                          key={conflict.id}
                          style={{
                            padding: 16,
                            borderRadius: 8,
                            background: conflict.workload > 100 ? "#fdf4ff" : "#f8fafc",
                            border: `1px solid ${conflict.workload > 100 ? "#e9d5ff" : "#e2e8f0"}`,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <Space>
                              <Avatar style={{ background: "#c4b5fd" }}>{conflict.member.name[0]}</Avatar>
                              <div>
                                <Text strong>{conflict.member.name}</Text>
                                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{conflict.member.role}</Text>
                              </div>
                            </Space>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>工作负荷</Text>
                                <Progress
                                  percent={Math.min(conflict.workload, 100)}
                                  size="small"
                                  style={{ width: 80, margin: 0 }}
                                  strokeColor={conflict.workload > 120 ? "#ef4444" : conflict.workload > 100 ? "#f59e0b" : "#10b981"}
                                />
                                <Tag color={conflict.workload > 120 ? "error" : conflict.workload > 100 ? "warning" : "success"}>
                                  {conflict.workload}%
                                </Tag>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                            {conflict.conflicts.map((task, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "8px 12px",
                                  background: "#fff",
                                  borderRadius: 6,
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                <Space>
                                  <Tag color={getTypeColor(task.type)} style={{ margin: 0 }}>
                                    {task.type === "bug" ? "缺陷" : task.type === "test" ? "测试" : "任务"}
                                  </Tag>
                                  <Text style={{ fontSize: 13 }}>{task.task}</Text>
                                </Space>
                                <Space>
                                  <Tag style={{ margin: 0, background: "#f1f5f9", border: "none", fontSize: 11 }}>{task.project}</Tag>
                                  <Tag style={{ margin: 0 }}>{task.priority}</Tag>
                                  <Text type="secondary" style={{ fontSize: 12 }}>{task.hours}h</Text>
                                </Space>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#fef3c7", borderRadius: 6 }}>
                            <BulbOutlined style={{ color: "#f59e0b" }} />
                            <Text style={{ color: "#92400e", fontSize: 13 }}>{conflict.suggestion}</Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                },

              ]}
            />
          </Card>

          {/* 逾期工作项提醒 */}
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: "#f59e0b" }} />
                <span>逾期工作项</span>
                <Badge count={overdueItems.length} style={{ backgroundColor: "#f59e0b" }} />
              </Space>
            }
            extra={<Button type="link">查看全部 <ArrowRightOutlined /></Button>}
            style={{ borderRadius: 12 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {overdueItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                  }}
                >
                  <Space>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: `${getTypeColor(item.type)}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: getTypeColor(item.type),
                      }}
                    >
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <Text strong style={{ display: "block" }}>{item.title}</Text>
                      <Space size={8} style={{ marginTop: 2 }}>
                        <Tag style={{ margin: 0, background: "#f1f5f9", border: "none", fontSize: 11 }}>{item.project}</Tag>
                        <Tag color="error" style={{ margin: 0, fontSize: 11 }}>逾期 {item.overdueDays} 天</Tag>
                      </Space>
                    </div>
                  </Space>
                  <Space>
                    <Avatar size={24} style={{ background: "#c4b5fd" }}>{item.assignee.name[0]}</Avatar>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.assignee.name}</Text>
                    <Tag style={{ margin: 0 }}>{item.priority}</Tag>
                    <Button size="small" icon={<EyeOutlined />}>查看</Button>
                  </Space>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 右侧边栏 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 今日待办 - 工作项 */}
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: "#10b981" }} />
                <span>今日待办</span>
                <Tag style={{ margin: 0 }}>{completedCount}/{todayWorkItems.length}</Tag>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            <List
              size="small"
              dataSource={todayWorkItems}
              renderItem={(item) => {
                const isChecked = checkedItems[item.id]
                return (
                  <List.Item style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%" }}>
                      <Checkbox 
                        checked={isChecked}
                        onChange={(e) => handleCheckChange(item.id, e.target.checked)}
                        style={{ marginTop: 2 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <Tag 
                            style={{ 
                              margin: 0, 
                              padding: "0 6px", 
                              fontSize: 11, 
                              background: `${getTypeColor(item.type)}15`,
                              color: getTypeColor(item.type),
                              border: "none",
                            }}
                          >
                            {getTypeName(item.type)}
                          </Tag>
                          <Tag style={{ margin: 0, fontSize: 11 }}>{item.priority}</Tag>
                        </div>
                        <Text
                          style={{
                            display: "block",
                            fontSize: 13,
                            textDecoration: isChecked ? "line-through" : "none",
                            color: isChecked ? "#94a3b8" : "#334155",
                          }}
                          ellipsis
                        >
                          {item.title}
                        </Text>
                        <Space size={4} style={{ marginTop: 4 }}>
                          <Tag style={{ margin: 0, background: "#f1f5f9", border: "none", fontSize: 10, padding: "0 4px" }}>
                            {item.project}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {item.startDate === item.endDate ? item.endDate : `${item.startDate} ~ ${item.endDate}`}
                          </Text>
                        </Space>
                      </div>
                    </div>
                  </List.Item>
                )
              }}
            />
          </Card>

          {/* 团队动态 */}
          <Card
            title={
              <Space>
                <TeamOutlined style={{ color: "#7c7cff" }} />
                <span>团队动态</span>
              </Space>
            }
            extra={<Button type="link" size="small">更多</Button>}
            style={{ borderRadius: 12 }}
          >
            <List
              size="small"
              dataSource={teamActivities}
              renderItem={(item) => (
                <List.Item style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", gap: 10, width: "100%" }}>
                    <Avatar
                      size={28}
                      style={{
                        background: item.type === "ai" ? "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)" : "#c4b5fd",
                        flexShrink: 0,
                      }}
                    >
                      {item.type === "ai" ? <RobotOutlined style={{ fontSize: 12 }} /> : item.user[0]}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13 }}>
                        <Text strong>{item.user}</Text>
                        <Text type="secondary"> {item.action} </Text>
                        <Text style={{ color: "#7c7cff" }}>{item.target}</Text>
                      </div>
                      <Space size={4} style={{ marginTop: 2 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>{item.project}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>·</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{item.time}</Text>
                      </Space>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          {/* 快捷入口 */}
          <Card title="快捷入口" style={{ borderRadius: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              <Button
                style={{ height: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                onClick={() => router.push("/ai/upload-requirements")}
              >
                <FileTextOutlined style={{ fontSize: 18, marginBottom: 4 }} />
                <span style={{ fontSize: 12 }}>上传需求</span>
              </Button>
              <Button
                style={{ height: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                onClick={() => router.push("/ai/risk-analysis")}
              >
                <WarningOutlined style={{ fontSize: 18, marginBottom: 4 }} />
                <span style={{ fontSize: 12 }}>风险分析</span>
              </Button>
              <Button
                style={{ height: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                onClick={() => router.push("/releases")}
              >
                <RocketOutlined style={{ fontSize: 18, marginBottom: 4 }} />
                <span style={{ fontSize: 12 }}>发布管理</span>
              </Button>
              <Button
                style={{ height: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                onClick={() => router.push("/ai/daily-alerts")}
              >
                <BulbOutlined style={{ fontSize: 18, marginBottom: 4 }} />
                <span style={{ fontSize: 12 }}>每日提醒</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
