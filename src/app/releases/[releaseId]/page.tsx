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
  Skeleton,
  Tooltip,
  Tabs,
  Table,
  Timeline,
  Badge,
  Dropdown,
  Modal,
  message,
  Statistic,
  Collapse,
  Tree,
  Empty,
} from "antd"
import type { TreeDataNode } from "antd"
import {
  ArrowLeftOutlined,
  RocketOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  EllipsisOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  StopOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  BulbOutlined,
  LineChartOutlined,
  SafetyOutlined,
  AlertOutlined,
  CheckOutlined,
  SyncOutlined,
  PlusOutlined,
  ProjectOutlined,
  FieldTimeOutlined,
  UserOutlined,
  CodeOutlined,
  DownOutlined,
  RightOutlined,
  TeamOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/zh-cn"
import { releaseApi, type ReleaseDetail, type ReleaseItem, type ReleaseLog } from "@/lib/api"

dayjs.extend(relativeTime)
dayjs.locale("zh-cn")

const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse

// 状态配置
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  PLANNING: { label: "规划中", color: "#64748b", icon: <ClockCircleOutlined />, bgColor: "#f1f5f9" },
  READY: { label: "待发布", color: "#3b82f6", icon: <ThunderboltOutlined />, bgColor: "#dbeafe" },
  IN_PROGRESS: { label: "发布中", color: "#f59e0b", icon: <RocketOutlined />, bgColor: "#fef3c7" },
  COMPLETED: { label: "已完成", color: "#10b981", icon: <CheckCircleOutlined />, bgColor: "#d1fae5" },
  CANCELLED: { label: "已取消", color: "#94a3b8", icon: <ExclamationCircleOutlined />, bgColor: "#f1f5f9" },
}

// 风险等级配置
const riskConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  LOW: { label: "低风险", color: "#10b981", bgColor: "#d1fae5" },
  MEDIUM: { label: "中风险", color: "#f59e0b", bgColor: "#fef3c7" },
  HIGH: { label: "高风险", color: "#ef4444", bgColor: "#fee2e2" },
}

// 优先级配置
const priorityConfig: Record<string, { color: string; label: string }> = {
  P0: { color: "#ef4444", label: "P0" },
  P1: { color: "#f97316", label: "P1" },
  P2: { color: "#eab308", label: "P2" },
  P3: { color: "#3b82f6", label: "P3" },
  P4: { color: "#94a3b8", label: "P4" },
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
  ROLLBACK: { label: "回滚", color: "#ef4444", icon: <HistoryOutlined /> },
}

// 工作项状态
const itemStatusConfig: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: "未开始", color: "#94a3b8" },
  IN_PROGRESS: { label: "进行中", color: "#3b82f6" },
  COMPLETED: { label: "已完成", color: "#10b981" },
}

interface PageProps {
  params: Promise<{ releaseId: string }>
}

export default function ReleaseDetailPage({ params }: PageProps) {
  const { releaseId } = use(params)
  const router = useRouter()
  const [release, setRelease] = useState<ReleaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("plan")

  // 加载发布详情
  const loadRelease = useCallback(async () => {
    try {
      setLoading(true)
      const data = await releaseApi.getDetail(releaseId)
      setRelease(data)
    } catch (error) {
      console.error("加载发布详情失败", error)
      message.error("加载发布详情失败")
    } finally {
      setLoading(false)
    }
  }, [releaseId])

  useEffect(() => {
    loadRelease()
  }, [loadRelease])

  // 确认发布
  const handleConfirm = async () => {
    Modal.confirm({
      title: "确认发布",
      content: "确认后将进入发布流程，是否继续？",
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await releaseApi.confirm(releaseId)
          message.success("发布已确认")
          loadRelease()
        } catch (error) {
          console.error("确认发布失败", error)
          message.error("确认发布失败")
        }
      },
    })
  }

  // 更新状态
  const handleStatusChange = async (newStatus: string) => {
    try {
      await releaseApi.update(releaseId, { status: newStatus })
      message.success("状态更新成功")
      loadRelease()
    } catch (error) {
      console.error("更新状态失败", error)
      message.error("更新状态失败")
    }
  }

  // 删除发布
  const handleDelete = () => {
    Modal.confirm({
      title: "删除发布",
      content: "确定要删除此发布吗？此操作不可恢复。",
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        try {
          await releaseApi.delete(releaseId)
          message.success("删除成功")
          router.push("/releases")
        } catch (error) {
          console.error("删除失败", error)
          message.error("删除失败")
        }
      },
    })
  }

  if (loading) {
    return (
      <div style={{ padding: "24px 32px" }}>
        <Skeleton active paragraph={{ rows: 20 }} />
      </div>
    )
  }

  if (!release) {
    return (
      <div style={{ padding: "24px 32px", textAlign: "center" }}>
        <Text type="secondary">发布不存在</Text>
      </div>
    )
  }

  const status = statusConfig[release.status] || statusConfig.PLANNING
  const risk = riskConfig[release.riskLevel] || riskConfig.LOW
  const plannedDate = dayjs(release.plannedDate)
  const isOverdue = release.status !== "COMPLETED" && release.status !== "CANCELLED" && plannedDate.isBefore(dayjs(), "day")
  const daysUntil = plannedDate.diff(dayjs(), "day")

  // 渲染发版计划 Tab（详尽的需求->任务->工作项层级）
  const renderPlanTab = () => {
    if (release.items.length === 0) {
      return (
        <Card style={{ borderRadius: 8 }}>
          <Empty description="暂无发布需求" />
        </Card>
      )
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 发版计划头部信息 */}
        <Card style={{ borderRadius: 8 }}>
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
              <Tag style={{ background: status.bgColor, color: status.color, border: "none" }}>
                {status.icon} {status.label}
              </Tag>
              <Tag style={{ background: risk.bgColor, color: risk.color, border: "none" }}>
                {risk.label}
              </Tag>
            </Space>
          </div>
        </Card>

        {/* 需求列表 - 展开式 */}
        <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
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

              // 计算整体进度
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
                        width: 28, 
                        height: 28, 
                        borderRadius: 6, 
                        background: `${priority.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: priority.color,
                        fontWeight: 600,
                        fontSize: 12,
                        flexShrink: 0,
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
                        {item.product && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.product.name}{item.module && ` / ${item.module.name}`}
                          </Text>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                        <Progress 
                          percent={phaseProgress} 
                          size="small" 
                          style={{ width: 80, margin: 0 }}
                          strokeColor={{ "0%": "#7c7cff", "100%": "#22d3ee" }}
                        />
                        {item.devOwner && (
                          <Tooltip title={`负责人: ${item.devOwner.name}`}>
                            <Avatar size={24} src={item.devOwner.avatar} style={{ background: "#c4b5fd" }}>
                              {item.devOwner.name?.[0]}
                            </Avatar>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  }
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <div style={{ padding: "0 12px 12px 40px" }}>
                    {/* 需求描述 */}
                    {item.description && (
                      <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 6 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>{item.description}</Text>
                      </div>
                    )}

                    {/* 阶段进度 */}
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12 }}>
                        <ThunderboltOutlined style={{ marginRight: 6 }} />
                        阶段进度
                      </Text>
                      <div style={{ display: "flex", gap: 12 }}>
                        {/* 开发阶段 */}
                        <div style={{ 
                          flex: 1, 
                          padding: 12, 
                          borderRadius: 8, 
                          background: `${devStatus.color}08`,
                          border: `1px solid ${devStatus.color}20`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Text style={{ fontSize: 12, color: "#64748b" }}>开发</Text>
                            <Tag style={{ margin: 0, background: `${devStatus.color}15`, color: devStatus.color, border: "none", fontSize: 10 }}>
                              {devStatus.label}
                            </Tag>
                          </div>
                          {item.devOwner ? (
                            <Space size={6}>
                              <Avatar size={20} src={item.devOwner.avatar} style={{ background: "#c4b5fd" }}>
                                {item.devOwner.name?.[0]}
                              </Avatar>
                              <Text style={{ fontSize: 12 }}>{item.devOwner.name}</Text>
                            </Space>
                          ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>未分配</Text>
                          )}
                        </div>

                        {/* 测试阶段 */}
                        <div style={{ 
                          flex: 1, 
                          padding: 12, 
                          borderRadius: 8, 
                          background: `${testStatus.color}08`,
                          border: `1px solid ${testStatus.color}20`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Text style={{ fontSize: 12, color: "#64748b" }}>测试</Text>
                            <Tag style={{ margin: 0, background: `${testStatus.color}15`, color: testStatus.color, border: "none", fontSize: 10 }}>
                              {testStatus.label}
                            </Tag>
                          </div>
                          {item.testOwner ? (
                            <Space size={6}>
                              <Avatar size={20} src={item.testOwner.avatar} style={{ background: "#c4b5fd" }}>
                                {item.testOwner.name?.[0]}
                              </Avatar>
                              <Text style={{ fontSize: 12 }}>{item.testOwner.name}</Text>
                            </Space>
                          ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>未分配</Text>
                          )}
                        </div>

                        {/* 验收阶段 */}
                        <div style={{ 
                          flex: 1, 
                          padding: 12, 
                          borderRadius: 8, 
                          background: `${verifyStatus.color}08`,
                          border: `1px solid ${verifyStatus.color}20`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Text style={{ fontSize: 12, color: "#64748b" }}>验收</Text>
                            <Tag style={{ margin: 0, background: `${verifyStatus.color}15`, color: verifyStatus.color, border: "none", fontSize: 10 }}>
                              {verifyStatus.label}
                            </Tag>
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>产品验收</Text>
                        </div>
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
                        <Space size={4}>
                          <FieldTimeOutlined />
                          <span>预估: {item.estimatedHours}h</span>
                        </Space>
                      )}
                      {item.actualHours && (
                        <Space size={4}>
                          <ClockCircleOutlined />
                          <span>实际: {item.actualHours}h</span>
                        </Space>
                      )}
                      {item.sprint && (
                        <Space size={4}>
                          <RocketOutlined />
                          <span>{item.sprint.name}</span>
                        </Space>
                      )}
                    </div>
                  </div>
                </Panel>
              )
            })}
          </Collapse>
        </Card>

        {/* 汇总统计 */}
        <Card style={{ borderRadius: 8 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
            <TeamOutlined style={{ marginRight: 8, color: "#7c7cff" }} />
            负责人汇总
          </Title>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {/* 统计每个负责人的需求数 */}
            {(() => {
              const ownerMap = new Map<string, { name: string; avatar: string | null; count: number }>()
              release.items.forEach(item => {
                if (item.devOwner) {
                  const existing = ownerMap.get(item.devOwner.id)
                  if (existing) {
                    existing.count++
                  } else {
                    ownerMap.set(item.devOwner.id, { name: item.devOwner.name, avatar: item.devOwner.avatar, count: 1 })
                  }
                }
              })
              return Array.from(ownerMap.entries()).map(([id, owner]) => (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    background: "#f8fafc",
                    borderRadius: 8,
                  }}
                >
                  <Avatar size={28} src={owner.avatar} style={{ background: "#c4b5fd" }}>
                    {owner.name?.[0]}
                  </Avatar>
                  <Text>{owner.name}</Text>
                  <Tag style={{ margin: 0, background: "#7c7cff15", color: "#7c7cff", border: "none" }}>
                    {owner.count} 项
                  </Tag>
                </div>
              ))
            })()}
            {release.items.filter(i => !i.devOwner).length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  background: "#fef3c7",
                  borderRadius: 8,
                }}
              >
                <Avatar size={28} style={{ background: "#f59e0b" }}>?</Avatar>
                <Text>未分配</Text>
                <Tag color="warning" style={{ margin: 0 }}>
                  {release.items.filter(i => !i.devOwner).length} 项
                </Tag>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // 渲染概览 Tab
  const renderOverviewTab = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
      {/* 左侧主要内容 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 进度统计 */}
        <Card style={{ borderRadius: 8 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
            <LineChartOutlined style={{ marginRight: 8, color: "#7c7cff" }} />
            发布进度
          </Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
            <Statistic title="总需求" value={release.stats.totalItems} valueStyle={{ fontSize: 24 }} />
            <Statistic title="已完成" value={release.stats.completedItems} valueStyle={{ color: "#10b981", fontSize: 24 }} />
            <Statistic title="进行中" value={release.stats.inProgressItems} valueStyle={{ color: "#3b82f6", fontSize: 24 }} />
            <Statistic title="未开始" value={release.stats.notStartedItems} valueStyle={{ color: "#94a3b8", fontSize: 24 }} />
          </div>
          <Progress
            percent={release.stats.progress}
            strokeColor={{ "0%": "#7c7cff", "100%": "#22d3ee" }}
            trailColor="#e2e8f0"
            strokeWidth={10}
          />
        </Card>

        {/* 工时统计 */}
        <Card style={{ borderRadius: 8 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
            <FieldTimeOutlined style={{ marginRight: 8, color: "#7c7cff" }} />
            工时统计
          </Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            <Statistic title="预估工时" value={release.stats.totalEstimatedHours} suffix="小时" />
            <Statistic title="实际工时" value={release.stats.totalActualHours} suffix="小时" />
          </div>
        </Card>

        {/* 优先级分布 */}
        <Card style={{ borderRadius: 8 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
            <AlertOutlined style={{ marginRight: 8, color: "#7c7cff" }} />
            优先级分布
          </Title>
          <div style={{ display: "flex", gap: 12 }}>
            {Object.entries(release.stats.byPriority).map(([key, value]) => (
              <div
                key={key}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  background: `${priorityConfig[key]?.color}10`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 600, color: priorityConfig[key]?.color }}>{value}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{key}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 右侧 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* AI 风险分析卡片 */}
        <Card style={{ borderRadius: 8 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
            <RobotOutlined style={{ marginRight: 8, color: "#7c7cff" }} />
            AI 风险分析
            <Tag style={{ marginLeft: 8, background: "#7c7cff15", color: "#7c7cff", border: "none", fontSize: 10 }}>
              即将上线
            </Tag>
          </Title>
          <div style={{ padding: 24, background: "#f8fafc", borderRadius: 8, textAlign: "center" }}>
            <RobotOutlined style={{ fontSize: 36, color: "#7c7cff", marginBottom: 12 }} />
            <div>
              <Text type="secondary">智能风险预测功能</Text>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
              基于历史数据分析发布风险
            </div>
          </div>
        </Card>

        {/* 发布信息 */}
        <Card style={{ borderRadius: 8 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
            <FileTextOutlined style={{ marginRight: 8, color: "#7c7cff" }} />
            发布信息
          </Title>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>所属项目</Text>
              <Space size={4}>
                <ProjectOutlined />
                <Text>{release.project.name}</Text>
              </Space>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>计划日期</Text>
              <Space size={4}>
                <CalendarOutlined />
                <Text>{plannedDate.format("YYYY-MM-DD")}</Text>
                {isOverdue && <Tag color="error">已逾期</Tag>}
                {!isOverdue && daysUntil <= 7 && daysUntil >= 0 && <Tag color="warning">{daysUntil}天后</Tag>}
              </Space>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>负责人</Text>
              <Space size={4}>
                <Avatar size={20} src={release.owner.avatar} style={{ background: "#c4b5fd" }}>
                  {release.owner.name?.[0]}
                </Avatar>
                <Text>{release.owner.name}</Text>
              </Space>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>创建时间</Text>
              <Text>{dayjs(release.createdAt).format("YYYY-MM-DD HH:mm")}</Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  // 渲染发布日志 Tab
  const renderLogsTab = () => (
    <Card style={{ borderRadius: 8 }}>
      {release.logs.length === 0 ? (
        <Empty description="暂无操作记录" />
      ) : (
        <Timeline
          items={release.logs.map((log) => {
            const action = actionConfig[log.action] || { label: log.action, color: "#64748b", icon: <HistoryOutlined /> }
            return {
              dot: (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: `${action.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: action.color,
                  }}
                >
                  {action.icon}
                </div>
              ),
              children: (
                <div style={{ paddingBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Tag style={{ margin: 0, background: `${action.color}15`, color: action.color, border: "none" }}>
                      {action.label}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(log.createdAt).format("YYYY-MM-DD HH:mm")}
                    </Text>
                  </div>
                  {log.description && <Text style={{ fontSize: 13 }}>{log.description}</Text>}
                  <div style={{ marginTop: 4 }}>
                    <Space size={4}>
                      <Avatar size={18} src={log.createdBy.avatar} style={{ background: "#c4b5fd" }}>
                        {log.createdBy.name?.[0]}
                      </Avatar>
                      <Text type="secondary" style={{ fontSize: 12 }}>{log.createdBy.name}</Text>
                    </Space>
                  </div>
                </div>
              ),
            }
          })}
        />
      )}
    </Card>
  )

  return (
    <div style={{ padding: "24px 32px" }}>
      {/* 返回按钮 */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/releases")}
        style={{ marginBottom: 16, padding: "4px 0" }}
      >
        返回发布列表
      </Button>

      {/* 头部 */}
      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <RocketOutlined style={{ fontSize: 22 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, marginBottom: 8 }}>{release.name}</Title>
              <Space size={8}>
                <Tag style={{ margin: 0, background: status.bgColor, color: status.color, border: "none" }}>
                  {status.icon} {status.label}
                </Tag>
                <Tag style={{ margin: 0, background: risk.bgColor, color: risk.color, border: "none" }}>
                  {risk.label}
                </Tag>
                <Text type="secondary">
                  <ProjectOutlined style={{ marginRight: 4 }} />
                  {release.project.name}
                </Text>
                <Text type="secondary">
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {plannedDate.format("YYYY-MM-DD")}
                </Text>
              </Space>
              {release.description && (
                <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, maxWidth: 600 }}>
                  {release.description}
                </Paragraph>
              )}
            </div>
          </div>

          <Space>
            {release.status === "PLANNING" && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleConfirm}
                style={{ background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)", border: "none" }}>
                确认发布
              </Button>
            )}
            {release.status === "IN_PROGRESS" && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleStatusChange("COMPLETED")}
                style={{ background: "#10b981", border: "none" }}>
                完成发布
              </Button>
            )}
            <Dropdown
              menu={{
                items: [
                  { key: "edit", icon: <EditOutlined />, label: "编辑" },
                  { type: "divider" },
                  ...(release.status !== "CANCELLED" ? [{ key: "cancel", icon: <StopOutlined />, label: "取消发布" }] : []),
                  { key: "delete", icon: <DeleteOutlined />, label: "删除", danger: true },
                ],
                onClick: ({ key }) => {
                  if (key === "cancel") handleStatusChange("CANCELLED")
                  if (key === "delete") handleDelete()
                },
              }}
              trigger={["click"]}
            >
              <Button icon={<EllipsisOutlined />} />
            </Dropdown>
          </Space>
        </div>
      </Card>

      {/* 内容区域 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "plan",
            label: (
              <Space>
                <FileTextOutlined />
                发版计划
                <Badge count={release.stats.totalItems} style={{ backgroundColor: "#7c7cff" }} />
              </Space>
            ),
            children: renderPlanTab(),
          },
          {
            key: "overview",
            label: (
              <Space>
                <LineChartOutlined />
                概览
              </Space>
            ),
            children: renderOverviewTab(),
          },
          {
            key: "logs",
            label: (
              <Space>
                <HistoryOutlined />
                操作日志
                <Badge count={release.logs.length} style={{ backgroundColor: "#64748b" }} />
              </Space>
            ),
            children: renderLogsTab(),
          },
        ]}
      />
    </div>
  )
}
