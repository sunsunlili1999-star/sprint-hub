"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import {
  Typography,
  Button,
  Card,
  Tag,
  Avatar,
  Progress,
  Space,
  Tooltip,
  Timeline,
  Badge,
  Dropdown,
  Modal,
  message,
  Statistic,
  Collapse,
  Empty,
  Form,
  Input,
  Select,
  DatePicker,
} from "antd"
import {
  RocketOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  StopOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  LineChartOutlined,
  AlertOutlined,
  CheckOutlined,
  SyncOutlined,
  PlusOutlined,
  ProjectOutlined,
  FieldTimeOutlined,
  DownOutlined,
  RightOutlined,
  TeamOutlined,
  SettingOutlined,
  BugOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/zh-cn"
import { useBreadcrumb } from "@/components/layout/main-layout"

dayjs.extend(relativeTime)
dayjs.locale("zh-cn")

const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse
const { TextArea } = Input

// 状态配置
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  PLANNING: { label: "规划中", color: "#64748b", icon: <ClockCircleOutlined />, bgColor: "#f1f5f9" },
  READY: { label: "待发布", color: "#7c7cff", icon: <ThunderboltOutlined />, bgColor: "#f5f3ff" },
  IN_PROGRESS: { label: "发布中", color: "#f59e0b", icon: <RocketOutlined />, bgColor: "#fffbeb" },
  COMPLETED: { label: "已完成", color: "#10b981", icon: <CheckCircleOutlined />, bgColor: "#ecfdf5" },
  CANCELLED: { label: "已取消", color: "#94a3b8", icon: <ExclamationCircleOutlined />, bgColor: "#f8fafc" },
}

// 风险等级配置
const riskConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  LOW: { label: "低风险", color: "#10b981", bgColor: "#ecfdf5" },
  MEDIUM: { label: "中风险", color: "#f59e0b", bgColor: "#fffbeb" },
  HIGH: { label: "高风险", color: "#ef4444", bgColor: "#fef2f2" },
}

// 优先级配置
const priorityConfig: Record<string, { color: string; label: string }> = {
  P0: { color: "#ef4444", label: "P0" },
  P1: { color: "#f97316", label: "P1" },
  P2: { color: "#eab308", label: "P2" },
  P3: { color: "#3b82f6", label: "P3" },
}

// 日志操作配置
const actionConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CREATED: { label: "创建发布", color: "#10b981", icon: <PlusOutlined /> },
  UPDATED: { label: "更新信息", color: "#3b82f6", icon: <EditOutlined /> },
  STATUS_CHANGED: { label: "状态变更", color: "#f59e0b", icon: <SyncOutlined /> },
  ITEMS_ADDED: { label: "添加需求", color: "#22d3ee", icon: <FileTextOutlined /> },
  ITEMS_REMOVED: { label: "移除需求", color: "#f97316", icon: <DeleteOutlined /> },
  RISK_UPDATED: { label: "风险更新", color: "#ef4444", icon: <WarningOutlined /> },
  CONFIRMED: { label: "确认发布", color: "#7c7cff", icon: <CheckOutlined /> },
  COMPLETED: { label: "发布完成", color: "#10b981", icon: <CheckCircleOutlined /> },
  CANCELLED: { label: "取消发布", color: "#94a3b8", icon: <StopOutlined /> },
}

// 工作项状态
const itemStatusConfig: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: "未开始", color: "#94a3b8" },
  IN_PROGRESS: { label: "进行中", color: "#3b82f6" },
  COMPLETED: { label: "已完成", color: "#10b981" },
}

// 模拟发布数据（固定数据）
const mockRelease = {
  id: "1",
  name: "电商平台 v2.0 正式版",
  description: "全新改版的电商平台，包含新首页、商品详情页重构、购物车优化等核心功能升级，提升用户购物体验和转化率。",
  status: "IN_PROGRESS",
  riskLevel: "MEDIUM",
  aiRiskScore: 45,
  plannedDate: "2024-01-20",
  actualDate: null,
  project: { id: "1", name: "电商平台", code: "EC" },
  owner: { id: "1", name: "张三", avatar: null },
  creator: { id: "2", name: "李四", avatar: null },
  createdAt: "2024-01-05T10:00:00Z",
  riskDescription: "部分接口性能待优化，建议在高峰期前完成压测",
  items: [
    {
      id: "item-1",
      title: "新版首页改版",
      description: "重新设计首页布局，优化商品推荐位展示，增加个性化推荐模块",
      priority: "P0",
      devStatus: "COMPLETED",
      testStatus: "IN_PROGRESS",
      verifyStatus: "NOT_STARTED",
      devOwner: { id: "1", name: "张三", avatar: null },
      testOwner: { id: "5", name: "钱七", avatar: null },
      product: { id: "1", name: "电商平台" },
      module: { id: "1", name: "首页模块" },
      plannedStartDate: "2024-01-08",
      plannedEndDate: "2024-01-15",
      estimatedHours: 40,
      actualHours: 38,
      sprint: { id: "1", name: "Sprint 1" },
    },
    {
      id: "item-2",
      title: "商品详情页优化",
      description: "优化商品详情页加载速度，增加SKU选择器交互体验",
      priority: "P0",
      devStatus: "COMPLETED",
      testStatus: "COMPLETED",
      verifyStatus: "IN_PROGRESS",
      devOwner: { id: "2", name: "李四", avatar: null },
      testOwner: { id: "5", name: "钱七", avatar: null },
      product: { id: "1", name: "电商平台" },
      module: { id: "2", name: "商品模块" },
      plannedStartDate: "2024-01-08",
      plannedEndDate: "2024-01-12",
      estimatedHours: 24,
      actualHours: 26,
      sprint: { id: "1", name: "Sprint 1" },
    },
    {
      id: "item-3",
      title: "购物车功能重构",
      description: "重构购物车状态管理，支持多店铺合并结算",
      priority: "P1",
      devStatus: "IN_PROGRESS",
      testStatus: "NOT_STARTED",
      verifyStatus: "NOT_STARTED",
      devOwner: { id: "3", name: "王五", avatar: null },
      testOwner: null,
      product: { id: "1", name: "电商平台" },
      module: { id: "3", name: "购物车模块" },
      plannedStartDate: "2024-01-10",
      plannedEndDate: "2024-01-18",
      estimatedHours: 32,
      actualHours: 20,
      sprint: { id: "1", name: "Sprint 1" },
    },
    {
      id: "item-4",
      title: "订单支付流程优化",
      description: "优化支付流程，增加支付方式选择，优化异常处理",
      priority: "P1",
      devStatus: "COMPLETED",
      testStatus: "IN_PROGRESS",
      verifyStatus: "NOT_STARTED",
      devOwner: { id: "1", name: "张三", avatar: null },
      testOwner: { id: "5", name: "钱七", avatar: null },
      product: { id: "1", name: "电商平台" },
      module: { id: "4", name: "订单模块" },
      plannedStartDate: "2024-01-12",
      plannedEndDate: "2024-01-18",
      estimatedHours: 28,
      actualHours: 24,
      sprint: { id: "1", name: "Sprint 1" },
    },
    {
      id: "item-5",
      title: "登录闪退问题修复",
      description: "修复iOS设备上偶发的登录闪退问题",
      priority: "P0",
      devStatus: "COMPLETED",
      testStatus: "COMPLETED",
      verifyStatus: "COMPLETED",
      devOwner: { id: "2", name: "李四", avatar: null },
      testOwner: { id: "5", name: "钱七", avatar: null },
      product: { id: "1", name: "电商平台" },
      module: { id: "5", name: "用户模块" },
      plannedStartDate: "2024-01-06",
      plannedEndDate: "2024-01-08",
      estimatedHours: 8,
      actualHours: 6,
      sprint: { id: "1", name: "Sprint 1" },
    },
  ],
  logs: [
    { id: "log-1", action: "CREATED", description: "创建发布计划", createdAt: "2024-01-05T10:00:00Z", createdBy: { id: "2", name: "李四", avatar: null } },
    { id: "log-2", action: "ITEMS_ADDED", description: "添加 5 个需求到发布计划", createdAt: "2024-01-05T10:30:00Z", createdBy: { id: "2", name: "李四", avatar: null } },
    { id: "log-3", action: "STATUS_CHANGED", description: "状态从「规划中」变更为「待发布」", createdAt: "2024-01-10T09:00:00Z", createdBy: { id: "1", name: "张三", avatar: null } },
    { id: "log-4", action: "CONFIRMED", description: "确认发布计划，开始发布流程", createdAt: "2024-01-15T14:00:00Z", createdBy: { id: "1", name: "张三", avatar: null } },
    { id: "log-5", action: "STATUS_CHANGED", description: "状态从「待发布」变更为「发布中」", createdAt: "2024-01-15T14:00:00Z", createdBy: { id: "1", name: "张三", avatar: null } },
    { id: "log-6", action: "RISK_UPDATED", description: "AI 检测到潜在风险：部分接口性能待优化", createdAt: "2024-01-16T10:00:00Z", createdBy: { id: "0", name: "小派", avatar: null } },
  ],
  stats: {
    totalItems: 5,
    completedItems: 1,
    inProgressItems: 3,
    notStartedItems: 1,
    progress: 67,
    totalEstimatedHours: 132,
    totalActualHours: 114,
    byPriority: { P0: 3, P1: 2, P2: 0, P3: 0 },
  },
}

// 模拟所有发布列表（用于下拉切换）
const mockAllReleases = [
  { id: "1", name: "电商平台 v2.0 正式版", project: "电商平台" },
  { id: "2", name: "数据中台 v1.5 功能迭代", project: "数据中台" },
  { id: "3", name: "移动端 APP v3.2 热修复", project: "移动APP" },
  { id: "4", name: "后台管理系统 v2.1", project: "电商平台" },
  { id: "5", name: "推荐系统 v2.0", project: "推荐系统" },
]

interface PageProps {
  params: Promise<{ releaseId: string }>
}

export default function ReleaseDetailPage({ params }: PageProps) {
  const { releaseId } = use(params)
  const router = useRouter()
  const { setBreadcrumbs, setHeaderTabs, clearHeaderTabs } = useBreadcrumb()
  
  const [release] = useState(mockRelease)
  const [allReleases] = useState(mockAllReleases)
  const [activeTab, setActiveTab] = useState("plan")
  
  // 控制面板弹窗
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  // 编辑弹窗
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm] = Form.useForm()

  // 设置面包屑和 Header Tabs
  useEffect(() => {
    // 设置面包屑
    setBreadcrumbs([
      { title: "发布管理", href: "/releases" },
      {
        title: release.name,
        dropdown: {
          options: allReleases.map(r => ({ key: r.id, label: r.name })),
          currentKey: "1", // 固定使用 id=1
          onSelect: (newReleaseId: string) => {
            // 统一跳转到 id=1 的发布（因为只有这个有数据）
            router.push(`/releases/1`)
          },
        },
      },
    ])

    // 设置 Header Tabs
    setHeaderTabs(
      [
        { key: "plan", label: "发版计划" },
        { key: "overview", label: "概览" },
        { key: "logs", label: "操作日志" },
      ],
      activeTab,
      (key) => setActiveTab(key)
    )

    return () => {
      clearHeaderTabs()
    }
  }, [release, allReleases, activeTab, setBreadcrumbs, setHeaderTabs, clearHeaderTabs, router])

  const status = statusConfig[release.status] || statusConfig.PLANNING
  const risk = riskConfig[release.riskLevel] || riskConfig.LOW
  const plannedDate = dayjs(release.plannedDate)
  const isOverdue = release.status !== "COMPLETED" && release.status !== "CANCELLED" && plannedDate.isBefore(dayjs(), "day")
  const daysUntil = plannedDate.diff(dayjs(), "day")

  // 打开编辑弹窗
  const handleOpenEdit = () => {
    editForm.setFieldsValue({
      name: release.name,
      description: release.description,
      status: release.status,
      riskLevel: release.riskLevel,
      plannedDate: dayjs(release.plannedDate),
    })
    setInfoPanelOpen(false)
    setEditModalOpen(true)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      await editForm.validateFields()
      message.success("保存成功")
      setEditModalOpen(false)
    } catch (error) {
      // 验证失败
    }
  }

  // 确认发布
  const handleConfirm = () => {
    Modal.confirm({
      title: "确认发布",
      content: "确认后将进入发布流程，是否继续？",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        message.success("发布已确认")
      },
    })
  }

  // 删除发布
  const handleDelete = () => {
    Modal.confirm({
      title: "删除发布",
      content: "确定要删除此发布吗？此操作不可恢复。",
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: () => {
        message.success("删除成功")
        router.push("/releases")
      },
    })
  }

  // 渲染发版计划 Tab
  const renderPlanTab = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 发版计划头部信息 */}
        <Card style={{ borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
                <FileTextOutlined style={{ marginRight: 8, color: "#7c7cff" }} />
                发版计划清单
              </Title>
              <Text type="secondary">
                本次发布共包含 <Text strong style={{ color: "#7c7cff" }}>{release.items.length}</Text> 个需求，
                计划于 <Text strong>{plannedDate.format("YYYY年MM月DD日")}</Text> 发布
              </Text>
            </div>
            <Space>
              <Button icon={<PlusOutlined />}>添加需求</Button>
              {release.status === "PLANNING" && (
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleConfirm}
                  style={{ background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)", border: "none" }}>
                  确认发布
                </Button>
              )}
              {release.status === "IN_PROGRESS" && (
                <Button type="primary" icon={<CheckCircleOutlined />}
                  style={{ background: "#10b981", border: "none" }}>
                  完成发布
                </Button>
              )}
            </Space>
          </div>
        </Card>

        {/* 需求列表 */}
        <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
          <Collapse
            defaultActiveKey={release.items.slice(0, 3).map(i => i.id)}
            expandIcon={({ isActive }) => isActive ? <DownOutlined /> : <RightOutlined />}
            style={{ border: "none", background: "transparent" }}
          >
            {release.items.map((item, index) => {
              const devStatus = itemStatusConfig[item.devStatus] || itemStatusConfig.NOT_STARTED
              const testStatus = itemStatusConfig[item.testStatus] || itemStatusConfig.NOT_STARTED
              const verifyStatus = itemStatusConfig[item.verifyStatus] || itemStatusConfig.NOT_STARTED
              const priority = priorityConfig[item.priority] || priorityConfig.P2

              let phaseProgress = 0
              if (item.devStatus === "COMPLETED") phaseProgress += 33
              if (item.testStatus === "COMPLETED") phaseProgress += 33
              if (item.verifyStatus === "COMPLETED") phaseProgress += 34

              return (
                <Panel
                  key={item.id}
                  header={
                    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                      <div style={{ 
                        width: 28, height: 28, borderRadius: 6, 
                        background: `${priority.color}15`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: priority.color, fontWeight: 600, fontSize: 12, flexShrink: 0,
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Text strong>{item.title}</Text>
                          <Tag style={{ margin: 0, background: `${priority.color}15`, color: priority.color, border: "none", fontSize: 10 }}>
                            {priority.label}
                          </Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.product?.name}{item.module && ` / ${item.module.name}`}
                        </Text>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                        <Progress percent={phaseProgress} size="small" style={{ width: 80, margin: 0 }}
                          strokeColor={{ "0%": "#7c7cff", "100%": "#22d3ee" }} />
                        {item.devOwner && (
                          <Tooltip title={`负责人: ${item.devOwner.name}`}>
                            <Avatar size={24} style={{ background: "#c4b5fd" }}>{item.devOwner.name?.[0]}</Avatar>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  }
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <div style={{ padding: "0 12px 12px 40px" }}>
                    {item.description && (
                      <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 6 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>{item.description}</Text>
                      </div>
                    )}

                    {/* 阶段进度 */}
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12 }}>
                        <ThunderboltOutlined style={{ marginRight: 6 }} />阶段进度
                      </Text>
                      <div style={{ display: "flex", gap: 12 }}>
                        {[
                          { label: "开发", status: devStatus, owner: item.devOwner },
                          { label: "测试", status: testStatus, owner: item.testOwner },
                          { label: "验收", status: verifyStatus, owner: null },
                        ].map((phase) => (
                          <div key={phase.label} style={{ 
                            flex: 1, padding: 12, borderRadius: 8, 
                            background: `${phase.status.color}08`,
                            border: `1px solid ${phase.status.color}20`,
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <Text style={{ fontSize: 12, color: "#64748b" }}>{phase.label}</Text>
                              <Tag style={{ margin: 0, background: `${phase.status.color}15`, color: phase.status.color, border: "none", fontSize: 10 }}>
                                {phase.status.label}
                              </Tag>
                            </div>
                            {phase.owner ? (
                              <Space size={6}>
                                <Avatar size={20} style={{ background: "#c4b5fd" }}>{phase.owner.name?.[0]}</Avatar>
                                <Text style={{ fontSize: 12 }}>{phase.owner.name}</Text>
                              </Space>
                            ) : (
                              <Text type="secondary" style={{ fontSize: 12 }}>{phase.label === "验收" ? "产品验收" : "未分配"}</Text>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 时间信息 */}
                    <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#64748b" }}>
                      {item.plannedStartDate && (
                        <Space size={4}>
                          <CalendarOutlined />
                          <span>计划: {dayjs(item.plannedStartDate).format("MM/DD")} - {item.plannedEndDate ? dayjs(item.plannedEndDate).format("MM/DD") : "?"}</span>
                        </Space>
                      )}
                      {item.estimatedHours && (
                        <Space size={4}><FieldTimeOutlined /><span>预估: {item.estimatedHours}h</span></Space>
                      )}
                      {item.actualHours && (
                        <Space size={4}><ClockCircleOutlined /><span>实际: {item.actualHours}h</span></Space>
                      )}
                      {item.sprint && (
                        <Space size={4}><RocketOutlined /><span>{item.sprint.name}</span></Space>
                      )}
                    </div>
                  </div>
                </Panel>
              )
            })}
          </Collapse>
        </Card>

        {/* 负责人汇总 */}
        <Card style={{ borderRadius: 12 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
            <TeamOutlined style={{ marginRight: 8, color: "#7c7cff" }} />负责人汇总
          </Title>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {(() => {
              const ownerMap = new Map<string, { name: string; count: number }>()
              release.items.forEach(item => {
                if (item.devOwner) {
                  const existing = ownerMap.get(item.devOwner.id)
                  if (existing) existing.count++
                  else ownerMap.set(item.devOwner.id, { name: item.devOwner.name, count: 1 })
                }
              })
              return Array.from(ownerMap.entries()).map(([id, owner]) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#f8fafc", borderRadius: 8 }}>
                  <Avatar size={28} style={{ background: "#c4b5fd" }}>{owner.name?.[0]}</Avatar>
                  <Text>{owner.name}</Text>
                  <Tag style={{ margin: 0, background: "#7c7cff15", color: "#7c7cff", border: "none" }}>{owner.count} 项</Tag>
                </div>
              ))
            })()}
          </div>
        </Card>
      </div>
    )
  }

  // 渲染概览 Tab
  const renderOverviewTab = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 进度统计 */}
        <Card style={{ borderRadius: 12 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
            <LineChartOutlined style={{ marginRight: 8, color: "#7c7cff" }} />发布进度
          </Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
            <Statistic title="总需求" value={release.stats.totalItems} valueStyle={{ fontSize: 24 }} />
            <Statistic title="已完成" value={release.stats.completedItems} valueStyle={{ color: "#10b981", fontSize: 24 }} />
            <Statistic title="进行中" value={release.stats.inProgressItems} valueStyle={{ color: "#3b82f6", fontSize: 24 }} />
            <Statistic title="未开始" value={release.stats.notStartedItems} valueStyle={{ color: "#94a3b8", fontSize: 24 }} />
          </div>
          <Progress percent={release.stats.progress} strokeColor={{ "0%": "#7c7cff", "100%": "#22d3ee" }} trailColor="#e2e8f0" strokeWidth={10} />
        </Card>

        {/* 工时统计 */}
        <Card style={{ borderRadius: 12 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
            <FieldTimeOutlined style={{ marginRight: 8, color: "#7c7cff" }} />工时统计
          </Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            <Statistic title="预估工时" value={release.stats.totalEstimatedHours} suffix="小时" />
            <Statistic title="实际工时" value={release.stats.totalActualHours} suffix="小时" />
          </div>
        </Card>

        {/* 优先级分布 */}
        <Card style={{ borderRadius: 12 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
            <AlertOutlined style={{ marginRight: 8, color: "#7c7cff" }} />优先级分布
          </Title>
          <div style={{ display: "flex", gap: 12 }}>
            {Object.entries(release.stats.byPriority).map(([key, value]) => (
              <div key={key} style={{ flex: 1, padding: 12, borderRadius: 8, background: `${priorityConfig[key]?.color}10`, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: priorityConfig[key]?.color }}>{value}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{key}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* AI 风险分析 */}
        <Card style={{ borderRadius: 12 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
            <RobotOutlined style={{ marginRight: 8, color: "#7c7cff" }} />
            AI 风险分析
            {release.aiRiskScore && (
              <Tag style={{ marginLeft: 8, background: release.aiRiskScore > 50 ? "#fef2f2" : "#fffbeb", color: release.aiRiskScore > 50 ? "#ef4444" : "#f59e0b", border: "none" }}>
                风险评分: {release.aiRiskScore}
              </Tag>
            )}
          </Title>
          {release.riskDescription ? (
            <div style={{ padding: 16, background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
              <Space align="start">
                <WarningOutlined style={{ color: "#f59e0b", marginTop: 4 }} />
                <Text style={{ color: "#92400e" }}>{release.riskDescription}</Text>
              </Space>
            </div>
          ) : (
            <div style={{ padding: 24, background: "#f8fafc", borderRadius: 8, textAlign: "center" }}>
              <CheckCircleOutlined style={{ fontSize: 32, color: "#10b981", marginBottom: 8 }} />
              <div><Text type="secondary">暂未检测到风险</Text></div>
            </div>
          )}
        </Card>

        {/* 快捷操作 */}
        <Card style={{ borderRadius: 12 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>快捷操作</Title>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button block icon={<FileTextOutlined />}>生成发布报告</Button>
            <Button block icon={<BugOutlined />}>查看缺陷列表</Button>
            <Button block icon={<HistoryOutlined />}>查看变更记录</Button>
          </Space>
        </Card>
      </div>
    </div>
  )

  // 渲染操作日志 Tab
  const renderLogsTab = () => (
    <Card style={{ borderRadius: 12 }}>
      <Timeline
        items={release.logs.map((log) => {
          const action = actionConfig[log.action] || { label: log.action, color: "#64748b", icon: <HistoryOutlined /> }
          return {
            dot: (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${action.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: action.color }}>
                {action.icon}
              </div>
            ),
            children: (
              <div style={{ paddingBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Tag style={{ margin: 0, background: `${action.color}15`, color: action.color, border: "none" }}>{action.label}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(log.createdAt).format("YYYY-MM-DD HH:mm")}</Text>
                </div>
                {log.description && <Text style={{ fontSize: 13 }}>{log.description}</Text>}
                <div style={{ marginTop: 4 }}>
                  <Space size={4}>
                    <Avatar size={18} style={{ background: log.createdBy.name === "小派" ? "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)" : "#c4b5fd" }}>
                      {log.createdBy.name === "小派" ? <RobotOutlined style={{ fontSize: 10 }} /> : log.createdBy.name?.[0]}
                    </Avatar>
                    <Text type="secondary" style={{ fontSize: 12 }}>{log.createdBy.name}</Text>
                  </Space>
                </div>
              </div>
            ),
          }
        })}
      />
    </Card>
  )

  return (
    <div style={{ padding: 24, height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* 控制面板按钮 - 放在面包屑旁边，通过 CSS 定位 */}
      <div style={{ position: "fixed", top: 12, right: 460, zIndex: 100 }}>
        <Tooltip title="发布信息">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setInfoPanelOpen(true)}
            style={{ color: "#64748b" }}
          />
        </Tooltip>
      </div>

      {/* 主内容区域 */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeTab === "plan" && renderPlanTab()}
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "logs" && renderLogsTab()}
      </div>

      {/* 信息面板弹窗 - 下方弹出 */}
      <Modal
        title={null}
        open={infoPanelOpen}
        onCancel={() => setInfoPanelOpen(false)}
        footer={null}
        width={480}
        style={{ top: 60 }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <RocketOutlined style={{ fontSize: 20 }} />
            </div>
            <div style={{ flex: 1 }}>
              <Title level={5} style={{ margin: 0 }}>{release.name}</Title>
              <Space size={8} style={{ marginTop: 4 }}>
                <Tag style={{ margin: 0, background: status.bgColor, color: status.color, border: "none" }}>{status.icon} {status.label}</Tag>
                <Tag style={{ margin: 0, background: risk.bgColor, color: risk.color, border: "none" }}>{risk.label}</Tag>
              </Space>
            </div>
            <Button icon={<EditOutlined />} onClick={handleOpenEdit}>编辑</Button>
          </div>
        </div>
        
        <div style={{ padding: "16px 24px" }}>
          {release.description && (
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>描述</Text>
              <Text style={{ fontSize: 13 }}>{release.description}</Text>
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>所属项目</Text>
              <Space size={4}><ProjectOutlined /><Text>{release.project.name}</Text></Space>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>计划日期</Text>
              <Space size={4}>
                <CalendarOutlined style={{ color: isOverdue ? "#ef4444" : undefined }} />
                <Text style={{ color: isOverdue ? "#ef4444" : undefined }}>{plannedDate.format("YYYY-MM-DD")}</Text>
                {isOverdue && <Tag color="error" style={{ margin: 0 }}>已逾期</Tag>}
              </Space>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>负责人</Text>
              <Space size={4}>
                <Avatar size={20} style={{ background: "#c4b5fd" }}>{release.owner.name?.[0]}</Avatar>
                <Text>{release.owner.name}</Text>
              </Space>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>创建人</Text>
              <Space size={4}>
                <Avatar size={20} style={{ background: "#a5b4fc" }}>{release.creator.name?.[0]}</Avatar>
                <Text>{release.creator.name}</Text>
              </Space>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>创建时间</Text>
              <Text>{dayjs(release.createdAt).format("YYYY-MM-DD HH:mm")}</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>需求数量</Text>
              <Text>{release.items.length} 个</Text>
            </div>
          </div>

          {release.riskDescription && (
            <div style={{ marginTop: 16, padding: 12, background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
              <Space align="start">
                <WarningOutlined style={{ color: "#f59e0b", marginTop: 2 }} />
                <div>
                  <Text strong style={{ fontSize: 12, color: "#92400e", display: "block" }}>风险提示</Text>
                  <Text style={{ fontSize: 13, color: "#92400e" }}>{release.riskDescription}</Text>
                </div>
              </Space>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 24px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 8 }}>
          {release.status !== "CANCELLED" && release.status !== "COMPLETED" && (
            <Button danger icon={<StopOutlined />} onClick={() => { setInfoPanelOpen(false); message.success("已取消发布") }}>取消发布</Button>
          )}
          <Button danger icon={<DeleteOutlined />} onClick={() => { setInfoPanelOpen(false); handleDelete() }}>删除</Button>
        </div>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑发布信息"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSaveEdit}
        okText="保存"
        cancelText="取消"
        width={520}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="发布名称" rules={[{ required: true, message: "请输入发布名称" }]}>
            <Input placeholder="请输入发布名称" />
          </Form.Item>
          <Form.Item name="description" label="发布描述">
            <TextArea rows={3} placeholder="请输入发布描述" />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item name="status" label="状态">
              <Select options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))} />
            </Form.Item>
            <Form.Item name="riskLevel" label="风险等级">
              <Select options={Object.entries(riskConfig).map(([k, v]) => ({ value: k, label: v.label }))} />
            </Form.Item>
          </div>
          <Form.Item name="plannedDate" label="计划发布日期">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
