"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Typography,
  Tag,
  Button,
  Space,
  Skeleton,
  Select,
  Card,
  Row,
  Col,
  Progress,
  Avatar,
  Divider,
  message,
  Dropdown,
  Modal,
  Form,
  Input,
  DatePicker,
  Table,
  Segmented,
} from "antd"
import type { TableProps } from "antd"
import {
  RocketOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  TeamOutlined,
  AimOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  FieldTimeOutlined,
  BarsOutlined,
  FundProjectionScreenOutlined,
  BugOutlined,
  HourglassOutlined,
  FireOutlined,
  UserOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import { 
  sprintApi, 
  type Sprint, 
  type SprintDetail, 
  type SprintMemberStats,
  type BurndownDataPoint,
} from "@/lib/api"
import { SprintWorkItemsTab } from "./components/SprintWorkItemsTab"

const { Text, Title, Paragraph } = Typography
const { RangePicker } = DatePicker

// 迭代状态配置
const sprintStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  PLANNING: { label: "规划中", color: "default", icon: <ClockCircleOutlined />, bg: "#f1f5f9" },
  IN_PROGRESS: { label: "进行中", color: "processing", icon: <SyncOutlined spin />, bg: "#eff6ff" },
  ACTIVE: { label: "进行中", color: "processing", icon: <SyncOutlined spin />, bg: "#eff6ff" },
  COMPLETED: { label: "已完成", color: "success", icon: <CheckCircleOutlined />, bg: "#f0fdf4" },
}

// Tab 配置
const tabs = [
  { key: "overview", label: "概览", icon: <FundProjectionScreenOutlined /> },
  { key: "workitems", label: "工作项", icon: <BarsOutlined /> },
  { key: "timeline", label: "时间轴", icon: <FieldTimeOutlined /> },
]

// 简易燃尽图组件
function BurndownChart({ data, unit }: { data: BurndownDataPoint[]; unit: string }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Text type="secondary">暂无数据</Text>
    </div>
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.ideal, d.actual || 0)), 1)
  const chartHeight = 160
  const padding = { top: 10, right: 10, bottom: 30, left: 35 }

  return (
    <div style={{ position: "relative", height: chartHeight + padding.top + padding.bottom }}>
      <div style={{ position: "absolute", left: 0, top: padding.top, bottom: padding.bottom, width: padding.left - 5, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Text type="secondary" style={{ fontSize: 10 }}>{maxValue}{unit}</Text>
        <Text type="secondary" style={{ fontSize: 10 }}>{Math.round(maxValue / 2)}</Text>
        <Text type="secondary" style={{ fontSize: 10 }}>0</Text>
      </div>
      
      <svg 
        style={{ 
          position: "absolute", 
          left: padding.left, 
          top: padding.top, 
          width: `calc(100% - ${padding.left + padding.right}px)`, 
          height: chartHeight 
        }}
        viewBox={`0 0 100 ${chartHeight}`}
        preserveAspectRatio="none"
      >
        <line x1="0" y1="0" x2="100" y2="0" stroke="#e2e8f0" strokeWidth="0.5" />
        <line x1="0" y1={chartHeight / 2} x2="100" y2={chartHeight / 2} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="0" y1={chartHeight} x2="100" y2={chartHeight} stroke="#e2e8f0" strokeWidth="0.5" />
        
        <line 
          x1="0" 
          y1={chartHeight - (data[0]?.ideal / maxValue) * chartHeight}
          x2="100" 
          y2={chartHeight}
          stroke="#94a3b8" 
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
        
        {data.filter(d => d.actual !== null).length > 1 && (
          <polyline
            points={data
              .filter(d => d.actual !== null)
              .map((d, i, arr) => {
                const x = (i / Math.max(arr.length - 1, 1)) * 100
                const y = chartHeight - ((d.actual || 0) / maxValue) * chartHeight
                return `${x},${y}`
              })
              .join(" ")}
            fill="none"
            stroke="#7c7cff"
            strokeWidth="2"
          />
        )}
      </svg>
      
      <div style={{ position: "absolute", left: padding.left, right: padding.right, bottom: 5, display: "flex", justifyContent: "space-between" }}>
        <Text type="secondary" style={{ fontSize: 10 }}>{data[0]?.date?.slice(5)}</Text>
        <Text type="secondary" style={{ fontSize: 10 }}>{data[data.length - 1]?.date?.slice(5)}</Text>
      </div>
    </div>
  )
}

// 进度环组件
function ProgressRing({ percent, size = 80, strokeWidth = 8, color = "#7c7cff" }: { percent: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percent / 100) * circumference

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div style={{ 
        position: "absolute", 
        top: "50%", 
        left: "50%", 
        transform: "translate(-50%, -50%)",
        textAlign: "center",
      }}>
        <Text strong style={{ fontSize: size / 4, color }}>{percent}%</Text>
      </div>
    </div>
  )
}

// 概览骨架屏组件
function OverviewSkeleton() {
  return (
    <div>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={10}>
          <Card style={{ height: 320 }}>
            <div style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0", marginBottom: 16 }}>
              <Space>
                <Skeleton.Avatar active shape="square" size={40} />
                <div>
                  <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 8 }} />
                  <br />
                  <Skeleton.Button active size="small" style={{ width: 60 }} />
                </div>
              </Space>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Skeleton.Input active size="small" style={{ width: "100%", marginBottom: 8 }} />
                <Skeleton.Input active size="small" style={{ width: "80%" }} />
              </Col>
              <Col span={12}>
                <Skeleton.Input active size="small" style={{ width: "100%", marginBottom: 8 }} />
                <Skeleton.Input active size="small" style={{ width: "80%" }} />
              </Col>
            </Row>
            <Divider style={{ margin: "16px 0" }} />
            <Skeleton.Input active size="small" style={{ width: "100%", marginBottom: 8 }} />
            <Skeleton paragraph={{ rows: 2, width: ["100%", "60%"] }} active />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card style={{ height: 320 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <Skeleton.Input active size="small" style={{ width: 80 }} />
              <Skeleton.Button active size="small" style={{ width: 120 }} />
            </div>
            <Skeleton.Node active style={{ width: "100%", height: 200 }}>
              <div style={{ width: "100%", height: 200 }} />
            </Skeleton.Node>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Col key={i} xs={12} sm={8} lg={4}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Skeleton.Input active style={{ width: 60, marginBottom: 8 }} />
              <br />
              <Skeleton.Input active size="small" style={{ width: 80 }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card>
        <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 16 }} />
        <Skeleton paragraph={{ rows: 4 }} active />
      </Card>
    </div>
  )
}

export default function SprintDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const sprintId = params.sprintId as string
  
  const [sprint, setSprint] = useState<SprintDetail | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  const [burndownType, setBurndownType] = useState<"hours" | "items">("items")
  
  const [isSettingOpen, setIsSettingOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const loadSprintDetail = useCallback(async () => {
    try {
      const data = await sprintApi.getDetail(projectId, sprintId)
      setSprint(data)
    } catch (error) {
      console.error("加载迭代详情失败", error)
      message.error("加载迭代详情失败")
    }
  }, [projectId, sprintId])

  const loadSprintList = useCallback(async () => {
    try {
      const data = await sprintApi.getList(projectId)
      setSprints(data)
    } catch (error) {
      console.error("加载迭代列表失败", error)
    }
  }, [projectId])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([loadSprintDetail(), loadSprintList()])
      setLoading(false)
    }
    init()
  }, [loadSprintDetail, loadSprintList])

  const handleSprintChange = (newSprintId: string) => {
    router.push(`/projects/${projectId}/sprints/${newSprintId}`)
  }

  const handleBack = () => {
    router.push(`/projects/${projectId}/sprints`)
  }

  const handleOpenSetting = () => {
    if (sprint) {
      form.setFieldsValue({
        name: sprint.name,
        goal: sprint.goal,
        dateRange: [dayjs(sprint.startDate), dayjs(sprint.endDate)],
      })
      setIsSettingOpen(true)
    }
  }

  const handleSaveSetting = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await sprintApi.update(projectId, sprintId, {
        name: values.name,
        goal: values.goal,
        startDate: values.dateRange[0].format("YYYY-MM-DD"),
        endDate: values.dateRange[1].format("YYYY-MM-DD"),
      })
      message.success("保存成功")
      setIsSettingOpen(false)
      loadSprintDetail()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getRemainingInfo = () => {
    if (!sprint) return null
    
    const start = dayjs(sprint.startDate)
    const end = dayjs(sprint.endDate)
    const today = dayjs()
    const totalDays = end.diff(start, 'day')
    const passedDays = today.diff(start, 'day')
    const remainingDays = end.diff(today, 'day')
    
    return {
      totalDays,
      passedDays: Math.max(0, Math.min(passedDays, totalDays)),
      remainingDays,
      timeProgress: totalDays > 0 ? Math.round((Math.min(passedDays, totalDays) / totalDays) * 100) : 0,
    }
  }

  const handleStart = async () => {
    if (!sprint) return
    try {
      await sprintApi.update(projectId, sprintId, { status: "IN_PROGRESS" })
      message.success("迭代已开始")
      loadSprintDetail()
    } catch (error: any) {
      message.error(error.message || "操作失败")
    }
  }

  const handleComplete = async () => {
    if (!sprint) return
    try {
      await sprintApi.update(projectId, sprintId, { status: "COMPLETED" })
      message.success("迭代已完成")
      loadSprintDetail()
    } catch (error: any) {
      message.error(error.message || "操作失败")
    }
  }

  const handleDelete = () => {
    if (!sprint) return
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除迭代「${sprint.name}」吗？迭代下的工作项将变为未分配。`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await sprintApi.delete(projectId, sprintId)
          message.success("删除成功")
          router.push(`/projects/${projectId}/sprints`)
        } catch (error: any) {
          message.error(error.message || "删除失败")
        }
      },
    })
  }

  const memberColumns: TableProps<SprintMemberStats>["columns"] = [
    {
      title: "成员",
      dataIndex: "user",
      render: (user: SprintMemberStats["user"]) => (
        <Space>
          <Avatar size="small" src={user.avatar} style={{ background: "#a5b4fc" }}>
            {user.name?.[0]}
          </Avatar>
          <Text>{user.name}</Text>
        </Space>
      ),
    },
    {
      title: "工作项",
      dataIndex: "totalItems",
      width: 180,
      render: (_: unknown, record: SprintMemberStats) => (
        <Space direction="vertical" size={2}>
          <Progress 
            percent={record.totalItems > 0 ? Math.round((record.completedItems / record.totalItems) * 100) : 0}
            size="small"
            strokeColor="#7c7cff"
            style={{ width: 120 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.completedItems} / {record.totalItems} 完成
          </Text>
        </Space>
      ),
    },
    {
      title: "预估工时",
      dataIndex: "totalHours",
      width: 100,
      render: (hours: number, record: SprintMemberStats) => (
        <Space direction="vertical" size={0}>
          <Text>{hours}h</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>完成 {record.completedHours}h</Text>
        </Space>
      ),
    },
    {
      title: "实际工时",
      dataIndex: "actualHours",
      width: 80,
      render: (hours: number) => <Text>{hours}h</Text>,
    },
  ]

  const settingMenuItems = sprint ? [
    { key: "edit", icon: <EditOutlined />, label: "编辑迭代", onClick: handleOpenSetting },
    { type: "divider" } as const,
    ...(sprint.status === "PLANNING" ? [
      { key: "start", icon: <PlayCircleOutlined />, label: "开始迭代", onClick: handleStart },
    ] : []),
    ...(sprint.status === "IN_PROGRESS" || sprint.status === "ACTIVE" ? [
      { key: "complete", icon: <CheckCircleOutlined />, label: "完成迭代", onClick: handleComplete },
    ] : []),
    { type: "divider" } as const,
    { key: "delete", icon: <DeleteOutlined />, label: "删除迭代", danger: true, onClick: handleDelete },
  ] : []

  const statusInfo = sprint ? (sprintStatusConfig[sprint.status] || sprintStatusConfig.PLANNING) : sprintStatusConfig.PLANNING
  const remainingInfo = getRemainingInfo()
  const burndownData = sprint ? (burndownType === "hours" ? sprint.burndownByHours : sprint.burndownByItems) : []

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* 子 Header */}
      <div style={{ 
        padding: "10px 24px", 
        background: "#fff", 
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Space size={12}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            style={{ padding: "4px 8px" }}
          />
          <Select
            value={sprintId}
            onChange={handleSprintChange}
            style={{ width: 200 }}
            variant="borderless"
            loading={loading}
            options={sprints.map(s => ({
              value: s.id,
              label: (
                <Space>
                  <RocketOutlined style={{ 
                    color: s.status === "IN_PROGRESS" || s.status === "ACTIVE" ? "#7c7cff" : 
                           s.status === "COMPLETED" ? "#10b981" : "#94a3b8" 
                  }} />
                  <span style={{ fontWeight: s.id === sprintId ? 500 : 400 }}>{s.name}</span>
                </Space>
              ),
            }))}
            dropdownStyle={{ minWidth: 220 }}
          />
          <Dropdown menu={{ items: settingMenuItems }} trigger={["click"]} disabled={loading}>
            <Button type="text" icon={<SettingOutlined />} style={{ color: "#64748b" }} />
          </Dropdown>
        </Space>
        
        {/* Tab 切换 */}
        <Space size={0}>
          {tabs.map(tab => (
            <Button
              key={tab.key}
              type="text"
              icon={tab.icon}
              onClick={() => setActiveTab(tab.key)}
              style={{
                color: activeTab === tab.key ? "#7c7cff" : "#64748b",
                fontWeight: activeTab === tab.key ? 500 : 400,
                borderBottom: activeTab === tab.key ? "2px solid #7c7cff" : "2px solid transparent",
                borderRadius: 0,
                padding: "8px 16px",
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Space>

        {/* 操作按钮 */}
        <Space>
          {sprint?.status === "PLANNING" && (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStart} disabled={loading}>
              开始迭代
            </Button>
          )}
          {(sprint?.status === "IN_PROGRESS" || sprint?.status === "ACTIVE") && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleComplete} disabled={loading}>
              完成迭代
            </Button>
          )}
        </Space>
      </div>

      {/* 内容区 */}
      <div style={{ 
        flex: 1, 
        overflow: activeTab === "workitems" ? "hidden" : "auto", 
        padding: activeTab === "workitems" ? 0 : 24, 
        background: "#f8fafc",
        display: activeTab === "workitems" ? "flex" : "block",
        flexDirection: "column",
      }}>
        {activeTab === "overview" && (
          loading ? (
            <OverviewSkeleton />
          ) : sprint ? (
            <div>
              {/* 第一行：基本信息 + 燃尽图 */}
              <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={10}>
                  <Card style={{ height: "100%" }} styles={{ body: { padding: 0 } }}>
                    <div style={{ 
                      padding: "16px 20px", 
                      background: statusInfo.bg,
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <Space>
                        <Avatar
                          shape="square"
                          size={40}
                          style={{
                            background: sprint.status === "IN_PROGRESS" || sprint.status === "ACTIVE"
                              ? "linear-gradient(135deg, #22d3ee 0%, #7c7cff 100%)"
                              : sprint.status === "COMPLETED"
                              ? "#10b981"
                              : "#94a3b8",
                          }}
                          icon={<RocketOutlined />}
                        />
                        <div>
                          <Title level={5} style={{ margin: 0 }}>{sprint.name}</Title>
                          <Tag color={statusInfo.color} icon={statusInfo.icon} style={{ marginTop: 4 }}>
                            {statusInfo.label}
                          </Tag>
                        </div>
                      </Space>
                      <ProgressRing percent={sprint.stats.progress} size={64} strokeWidth={6} />
                    </div>
                    
                    <div style={{ padding: "16px 20px" }}>
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <div style={{ marginBottom: 12 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              开始日期
                            </Text>
                            <div><Text strong>{sprint.startDate}</Text></div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 12 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              结束日期
                            </Text>
                            <div><Text strong>{sprint.endDate}</Text></div>
                          </div>
                        </Col>
                        <Col span={24}>
                          {remainingInfo && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>时间进度</Text>
                                <Text style={{ 
                                  fontSize: 12,
                                  color: remainingInfo.remainingDays < 0 ? "#ef4444" : 
                                         remainingInfo.remainingDays <= 3 ? "#f59e0b" : "#64748b"
                                }}>
                                  {remainingInfo.remainingDays < 0 
                                    ? `已逾期 ${Math.abs(remainingInfo.remainingDays)} 天`
                                    : `剩余 ${remainingInfo.remainingDays} 天`}
                                </Text>
                              </div>
                              <Progress 
                                percent={remainingInfo.timeProgress} 
                                strokeColor="#f59e0b"
                                trailColor="#e2e8f0"
                                size="small"
                                showInfo={false}
                              />
                            </div>
                          )}
                        </Col>
                      </Row>
                      
                      <Divider style={{ margin: "12px 0" }} />
                      
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <AimOutlined style={{ marginRight: 4 }} />
                          迭代目标
                        </Text>
                        <Paragraph 
                          style={{ margin: "8px 0 0", color: sprint.goal ? "#475569" : "#94a3b8" }}
                          ellipsis={{ rows: 3, expandable: true }}
                        >
                          {sprint.goal || "暂未设置迭代目标"}
                        </Paragraph>
                      </div>
                    </div>
                  </Card>
                </Col>
                
                <Col xs={24} lg={14}>
                  <Card 
                    title={
                      <Space>
                        <FireOutlined style={{ color: "#f59e0b" }} />
                        <span>燃尽图</span>
                      </Space>
                    }
                    extra={
                      <Segmented
                        size="small"
                        value={burndownType}
                        onChange={(v) => setBurndownType(v as "hours" | "items")}
                        options={[
                          { label: "工作项", value: "items" },
                          { label: "工时", value: "hours" },
                        ]}
                      />
                    }
                    style={{ height: "100%" }}
                  >
                    <div style={{ marginBottom: 8, display: "flex", justifyContent: "flex-end", gap: 16 }}>
                      <Space size={4}>
                        <div style={{ width: 16, height: 2, background: "#94a3b8", borderStyle: "dashed" }} />
                        <Text type="secondary" style={{ fontSize: 11 }}>理想</Text>
                      </Space>
                      <Space size={4}>
                        <div style={{ width: 16, height: 2, background: "#7c7cff" }} />
                        <Text type="secondary" style={{ fontSize: 11 }}>实际</Text>
                      </Space>
                    </div>
                    <BurndownChart data={burndownData} unit={burndownType === "hours" ? "h" : ""} />
                  </Card>
                </Col>
              </Row>

              {/* 第二行：统计卡片 */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 600, color: "#475569" }}>{sprint.stats.totalWorkItems}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <FileTextOutlined style={{ marginRight: 4 }} />工作项总数
                    </Text>
                  </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 600, color: "#10b981" }}>{sprint.stats.completedWorkItems}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <CheckCircleOutlined style={{ marginRight: 4 }} />已完成
                    </Text>
                  </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 600, color: "#3b82f6" }}>{sprint.stats.inProgressWorkItems}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <SyncOutlined style={{ marginRight: 4 }} />进行中
                    </Text>
                  </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 600, color: "#ef4444" }}>{sprint.stats.totalBugs}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <BugOutlined style={{ marginRight: 4 }} />缺陷
                    </Text>
                  </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 600, color: "#f59e0b" }}>{sprint.stats.totalEstimatedHours}h</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <HourglassOutlined style={{ marginRight: 4 }} />预估工时
                    </Text>
                  </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 600, color: "#7c7cff" }}>{sprint.stats.totalActualHours}h</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <FieldTimeOutlined style={{ marginRight: 4 }} />实际工时
                    </Text>
                  </Card>
                </Col>
              </Row>

              {/* 第三行：成员工作统计 */}
              <Card 
                title={
                  <Space>
                    <TeamOutlined style={{ color: "#7c7cff" }} />
                    <span>成员工作统计</span>
                  </Space>
                }
                extra={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    共 {sprint.memberStats.length} 位成员参与
                  </Text>
                }
              >
                {sprint.memberStats.length > 0 ? (
                  <Table
                    columns={memberColumns}
                    dataSource={sprint.memberStats}
                    rowKey={(record) => record.user.id}
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <UserOutlined style={{ fontSize: 32, color: "#e2e8f0", marginBottom: 8 }} />
                    <br />
                    <Text type="secondary">暂无成员工作数据</Text>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 48 }}>
              <Text type="secondary">迭代不存在</Text>
              <br />
              <Button type="link" onClick={handleBack}>返回列表</Button>
            </div>
          )
        )}

        {activeTab === "workitems" && (
          <SprintWorkItemsTab projectId={projectId} sprintId={sprintId} />
        )}

        {activeTab === "timeline" && (
          <div style={{ padding: 24 }}>
            <Card>
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <FieldTimeOutlined style={{ fontSize: 48, color: "#e2e8f0", marginBottom: 16 }} />
                <br />
                <Text type="secondary">时间轴视图（开发中...）</Text>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* 设置弹窗 */}
      <Modal
        title="编辑迭代"
        open={isSettingOpen}
        onCancel={() => setIsSettingOpen(false)}
        onOk={handleSaveSetting}
        okText="保存"
        cancelText="取消"
        confirmLoading={submitting}
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="迭代名称" rules={[{ required: true, message: "请输入迭代名称" }]}>
            <Input placeholder="如: Sprint 1" />
          </Form.Item>
          <Form.Item name="dateRange" label="迭代周期" rules={[{ required: true, message: "请选择迭代周期" }]}>
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="goal" label="迭代目标">
            <Input.TextArea rows={3} placeholder="描述本迭代的主要目标" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
