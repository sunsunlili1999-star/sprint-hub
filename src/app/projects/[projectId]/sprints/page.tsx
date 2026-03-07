"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Typography,
  Tag,
  Button,
  Space,
  Skeleton,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Progress,
  Avatar,
  Dropdown,
  Select,
  Table,
  Tooltip,
} from "antd"
import type { TableProps } from "antd"
import {
  PlusOutlined,
  RocketOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CopyOutlined,
  SearchOutlined,
  FileTextFilled,
  ThunderboltFilled,
  CodeFilled,
  BugOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  TeamOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import PilotIcon from "@/components/ui/PilotIcon"
import { ListPageLayout, type SidebarItem } from "@/components/ui/ListPageLayout"
import { sprintApi, type Sprint, type SprintWorkItem } from "@/lib/api"

const { Text } = Typography
const { RangePicker } = DatePicker

// 迭代状态配置
const sprintStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PLANNING: { label: "规划中", color: "default", icon: <ClockCircleOutlined /> },
  IN_PROGRESS: { label: "进行中", color: "processing", icon: <SyncOutlined spin /> },
  ACTIVE: { label: "进行中", color: "processing", icon: <SyncOutlined spin /> },
  COMPLETED: { label: "已完成", color: "success", icon: <CheckCircleOutlined /> },
}

// AI 风险类型配置
const riskTypeConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  BLOCKED: { label: "存在阻塞", color: "#ef4444", bgColor: "#fef2f2", icon: <StopOutlined /> },
  DELAYED: { label: "进度滞后", color: "#f59e0b", bgColor: "#fffbeb", icon: <ClockCircleOutlined /> },
  OVERLOAD: { label: "资源超载", color: "#f97316", bgColor: "#fff7ed", icon: <TeamOutlined /> },
  SCOPE_CREEP: { label: "范围蔓延", color: "#8b5cf6", bgColor: "#f5f3ff", icon: <ExclamationCircleOutlined /> },
  HEALTHY: { label: "状态健康", color: "#10b981", bgColor: "#ecfdf5", icon: <CheckCircleOutlined /> },
}

// 模拟 AI 风险数据（仅用于进行中的迭代）
const mockRiskData: Record<string, { type: string; score: number; details: string[] }> = {
  default_blocked: {
    type: "BLOCKED",
    score: 85,
    details: ["2 个任务被依赖阻塞", "等待外部接口对接"],
  },
  default_delayed: {
    type: "DELAYED",
    score: 65,
    details: ["实际进度落后计划 15%", "3 个高优先级任务未开始"],
  },
  default_overload: {
    type: "OVERLOAD",
    score: 70,
    details: ["张三工作量超载 120%", "测试资源不足"],
  },
  default_healthy: {
    type: "HEALTHY",
    score: 0,
    details: ["进度符合预期", "资源分配合理", "无阻塞风险"],
  },
}

// 扩展 Sprint 类型添加统计信息和风险
interface SprintWithStats extends Sprint {
  completedCount?: number
  totalCount?: number
  progress?: number
  risk?: {
    type: string
    score: number
    details: string[]
  }
}

export default function ProjectSprintsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  
  const [sprints, setSprints] = useState<SprintWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  
  // 筛选状态
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // 弹窗状态
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // 表格选中状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  
  // 创建迭代时选择工作项
  const [createStep, setCreateStep] = useState<1 | 2>(1)
  const [newSprintId, setNewSprintId] = useState<string | null>(null)
  const [availableWorkItems, setAvailableWorkItems] = useState<SprintWorkItem[]>([])
  const [availableLoading, setAvailableLoading] = useState(false)
  const [selectedWorkItemKeys, setSelectedWorkItemKeys] = useState<React.Key[]>([])
  const [importSearch, setImportSearch] = useState("")
  const [importType, setImportType] = useState<string | null>(null)

  // 视图模式
  const [viewMode, setViewMode] = useState<"card" | "table">("card")

  // 加载迭代列表
  const loadSprints = useCallback(async () => {
    try {
      setTableLoading(true)
      const data = await sprintApi.getList(projectId)
      
      // 计算进度并添加模拟风险数据（仅进行中的迭代有风险预估）
      // 根据迭代ID分配风险状态：Sprint 2 有风险，Sprint 3 健康
      const sprintsWithStats = data.map((sprint) => {
        // 模拟进度
        const progress = sprint.status === "COMPLETED" ? 100 : Math.floor(Math.random() * 80) + 10
        
        // 只有进行中的迭代才有风险预估
        let risk = undefined
        if (sprint.status === "IN_PROGRESS" || sprint.status === "ACTIVE") {
          // Sprint 3 显示健康状态，其他显示风险
          if (sprint.id === "sprint-recommend-003" || sprint.name.includes("Sprint 3")) {
            risk = mockRiskData["default_healthy"]
          } else if (sprint.id === "sprint-recommend-002" || sprint.name.includes("Sprint 2")) {
            risk = mockRiskData["default_delayed"]
          } else {
            risk = mockRiskData["default_blocked"]
          }
        }
        
        return {
          ...sprint,
          totalCount: sprint.requirementCount || 0,
          completedCount: Math.floor((sprint.requirementCount || 0) * progress / 100),
          progress,
          risk,
        }
      })
      setSprints(sprintsWithStats)
    } catch (error) {
      console.error("加载迭代列表失败", error)
    } finally {
      setTableLoading(false)
    }
  }, [projectId])

  // 初始加载
  useEffect(() => {
    async function init() {
      setLoading(true)
      await loadSprints()
      setLoading(false)
    }
    init()
  }, [loadSprints])

  // 复制 ID 到剪贴板
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      message.success("ID 已复制到剪贴板")
    }).catch(() => {
      message.error("复制失败")
    })
  }

  // 创建迭代 - 第一步
  const handleCreateStep1 = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      
      const newSprint = await sprintApi.create(projectId, {
        name: values.name,
        goal: values.goal,
        startDate: values.dateRange[0].format("YYYY-MM-DD"),
        endDate: values.dateRange[1].format("YYYY-MM-DD"),
      })
      
      setNewSprintId(newSprint.id)
      setCreateStep(2)
      loadAvailableWorkItems(newSprint.id)
      loadSprints()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 加载可选工作项（任务）
  const loadAvailableWorkItems = async (sprintId: string) => {
    try {
      setAvailableLoading(true)
      const data = await sprintApi.getSprintTasks(projectId, sprintId, {
        search: importSearch,
        inSprint: false,
      })
      setAvailableWorkItems(data)
    } catch (error) {
      console.error("加载可选任务失败", error)
    } finally {
      setAvailableLoading(false)
    }
  }

  // 创建迭代 - 完成（添加工作项）
  const handleCreateComplete = async () => {
    if (!newSprintId) return
    
    try {
      if (selectedWorkItemKeys.length > 0) {
        setSubmitting(true)
        await sprintApi.addWorkItems(projectId, newSprintId, selectedWorkItemKeys as string[])
        message.success(`创建成功，已添加 ${selectedWorkItemKeys.length} 个工作项`)
      } else {
        message.success("创建成功")
      }
      
      // 重置状态
      setIsCreateOpen(false)
      setCreateStep(1)
      setNewSprintId(null)
      setSelectedWorkItemKeys([])
      setImportSearch("")
      setImportType(null)
      form.resetFields()
      loadSprints()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 跳过添加工作项
  const handleSkipWorkItems = () => {
    message.success("创建成功")
    setIsCreateOpen(false)
    setCreateStep(1)
    setNewSprintId(null)
    setSelectedWorkItemKeys([])
    setImportSearch("")
    setImportType(null)
    form.resetFields()
  }

  // 打开编辑弹窗
  const handleOpenEdit = (sprint: Sprint) => {
    setEditingSprint(sprint)
    editForm.setFieldsValue({
      name: sprint.name,
      goal: sprint.goal,
      dateRange: [dayjs(sprint.startDate), dayjs(sprint.endDate)],
    })
    setIsEditOpen(true)
  }

  // 编辑迭代
  const handleEdit = async () => {
    if (!editingSprint) return
    try {
      const values = await editForm.validateFields()
      setSubmitting(true)
      
      // TODO: 调用更新迭代 API
      message.success("更新成功")
      setIsEditOpen(false)
      editForm.resetFields()
      setEditingSprint(null)
      loadSprints()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 删除迭代
  const handleDelete = (sprint: Sprint) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除迭代「${sprint.name}」吗？迭代下的需求将变为未分配。`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await sprintApi.delete(projectId, sprint.id)
          message.success("删除成功")
          loadSprints()
        } catch (error: any) {
          message.error(error.message || "删除失败")
        }
      },
    })
  }

  // 开始迭代
  const handleStart = async (sprint: Sprint) => {
    // TODO: 调用开始迭代 API
    message.success(`迭代「${sprint.name}」已开始`)
    loadSprints()
  }

  // 完成迭代
  const handleComplete = async (sprint: Sprint) => {
    Modal.confirm({
      title: "确认完成",
      content: `确定要完成迭代「${sprint.name}」吗？`,
      okText: "确认完成",
      cancelText: "取消",
      onOk: async () => {
        // TODO: 调用完成迭代 API
        message.success(`迭代「${sprint.name}」已完成`)
        loadSprints()
      },
    })
  }

  // 进入迭代详情
  const handleViewDetail = (sprint: Sprint) => {
    router.push(`/projects/${projectId}/sprints/${sprint.id}`)
  }

  // 计算剩余天数
  const getRemainingDays = (endDate: string) => {
    const end = dayjs(endDate)
    const today = dayjs()
    const diff = end.diff(today, 'day')
    if (diff < 0) return { text: `已逾期 ${Math.abs(diff)} 天`, color: "#ef4444", urgent: true }
    if (diff === 0) return { text: "今天截止", color: "#f59e0b", urgent: true }
    if (diff <= 3) return { text: `剩余 ${diff} 天`, color: "#f59e0b", urgent: true }
    return { text: `剩余 ${diff} 天`, color: "#64748b", urgent: false }
  }

  // 计算迭代时长
  const getSprintDuration = (startDate: string, endDate: string) => {
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    return end.diff(start, 'day') + 1
  }

  // 构建侧边栏数据
  const buildSidebarItems = (): SidebarItem[] => {
    const allCount = sprints.length
    const planningCount = sprints.filter(s => s.status === "PLANNING").length
    const inProgressCount = sprints.filter(s => s.status === "IN_PROGRESS" || s.status === "ACTIVE").length
    const completedCount = sprints.filter(s => s.status === "COMPLETED").length
    
    // 风险统计（只统计进行中且有风险的迭代）
    const hasRiskCount = sprints.filter(s => 
      (s.status === "IN_PROGRESS" || s.status === "ACTIVE") && 
      s.risk && 
      s.risk.type !== "HEALTHY"
    ).length
    
    return [
      {
        id: null,
        name: "全部迭代",
        icon: <RocketOutlined style={{ color: "#7c7cff", fontSize: 13 }} />,
        count: allCount,
        activeColor: "#7c7cff",
      },
      {
        id: "PLANNING",
        name: "规划中",
        icon: <ClockCircleOutlined style={{ color: "#94a3b8", fontSize: 13 }} />,
        count: planningCount,
        activeColor: "#94a3b8",
      },
      {
        id: "IN_PROGRESS",
        name: "进行中",
        icon: <SyncOutlined style={{ color: "#3b82f6", fontSize: 13 }} />,
        count: inProgressCount,
        activeColor: "#3b82f6",
      },
      {
        id: "COMPLETED",
        name: "已完成",
        icon: <CheckCircleOutlined style={{ color: "#10b981", fontSize: 13 }} />,
        count: completedCount,
        activeColor: "#10b981",
      },
      { id: "divider", name: "", isDivider: true } as any,
      {
        id: "HAS_RISK",
        name: "存在风险",
        icon: <WarningOutlined style={{ color: "#f59e0b", fontSize: 13 }} />,
        count: hasRiskCount,
        activeColor: "#f59e0b",
      },
    ]
  }

  // 处理侧边栏选择
  const handleSidebarSelect = (id: string | null) => {
    setSelectedStatus(id)
    setCurrentPage(1)
  }

  // 过滤数据
  const getFilteredData = () => {
    let filtered = sprints
    
    // 按状态筛选
    if (selectedStatus) {
      if (selectedStatus === "IN_PROGRESS") {
        filtered = filtered.filter(s => s.status === "IN_PROGRESS" || s.status === "ACTIVE")
      } else if (selectedStatus === "HAS_RISK") {
        filtered = filtered.filter(s => 
          (s.status === "IN_PROGRESS" || s.status === "ACTIVE") && 
          s.risk && 
          s.risk.type !== "HEALTHY"
        )
      } else {
        filtered = filtered.filter(s => s.status === selectedStatus)
      }
    }
    
    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.goal?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }

  const filteredData = getFilteredData()

  // 渲染迭代卡片
  const renderSprintCard = (sprint: SprintWithStats) => {
    const statusInfo = sprintStatusConfig[sprint.status] || sprintStatusConfig.PLANNING
    const remaining = getRemainingDays(sprint.endDate)
    const duration = getSprintDuration(sprint.startDate, sprint.endDate)
    const riskInfo = sprint.risk ? riskTypeConfig[sprint.risk.type] : null

    return (
      <div
        key={sprint.id}
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 4,
          overflow: "hidden",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
        onClick={() => handleViewDetail(sprint)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#7c7cff"
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(124, 124, 255, 0.15)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e2e8f0"
          e.currentTarget.style.boxShadow = "none"
        }}
      >
        {/* 卡片头部 */}
        <div style={{ 
          padding: "16px 20px", 
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 4,
                background: sprint.status === "IN_PROGRESS" || sprint.status === "ACTIVE"
                  ? "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)"
                  : sprint.status === "COMPLETED"
                  ? "#10b981"
                  : "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <RocketOutlined style={{ color: "#fff", fontSize: 16 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ fontSize: 15, display: "block" }}>{sprint.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {sprint.startDate} ~ {sprint.endDate}（{duration}天）
                </Text>
              </div>
              <Tag 
                color={statusInfo.color} 
                icon={statusInfo.icon}
                style={{ margin: 0, borderRadius: 4 }}
              >
                {statusInfo.label}
              </Tag>
            </div>
            {sprint.goal && (
              <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 4 }} ellipsis>
                {sprint.goal}
              </Text>
            )}
          </div>
          <Dropdown
            menu={{
              items: [
                { key: "view", icon: <EyeOutlined />, label: "查看详情", onClick: () => handleViewDetail(sprint) },
                { key: "edit", icon: <EditOutlined />, label: "编辑", onClick: () => { handleOpenEdit(sprint) } },
                ...(sprint.status === "PLANNING" ? [
                  { key: "start", icon: <PlayCircleOutlined />, label: "开始迭代", onClick: () => handleStart(sprint) }
                ] : []),
                ...(sprint.status === "IN_PROGRESS" || sprint.status === "ACTIVE" ? [
                  { key: "complete", icon: <CheckCircleOutlined />, label: "完成迭代", onClick: () => handleComplete(sprint) }
                ] : []),
                { type: "divider" } as any,
                { key: "delete", icon: <DeleteOutlined />, label: "删除", danger: true, onClick: () => handleDelete(sprint) } as any,
              ]
            }}
            trigger={["click"]}
          >
            <Button 
              type="text" 
              icon={<MoreOutlined />} 
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>

        {/* 进度区域 */}
        <div style={{ padding: "12px 20px", background: "#fafbfc" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Space size={16}>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                <FileTextOutlined style={{ marginRight: 4 }} />
                {sprint.completedCount || 0}/{sprint.totalCount || 0} 项
              </span>
              {/* 已完成的迭代不显示剩余时间 */}
              {sprint.status !== "COMPLETED" && (
                <span style={{ fontSize: 12, color: remaining.color, fontWeight: remaining.urgent ? 500 : 400 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {remaining.text}
                </span>
              )}
            </Space>
            <Text style={{ fontSize: 13, fontWeight: 600, color: sprint.status === "COMPLETED" ? "#10b981" : "#7c7cff" }}>
              {sprint.progress || 0}%
            </Text>
          </div>
          <Progress 
            percent={sprint.progress || 0} 
            showInfo={false}
            strokeColor={sprint.status === "COMPLETED" ? "#10b981" : {
              '0%': '#7c7cff',
              '100%': '#22d3ee',
            }}
            trailColor="#e2e8f0"
            style={{ margin: 0 }}
            size="small"
          />
        </div>

        {/* AI 风险预估区域 - 仅进行中的迭代显示 */}
        {(sprint.status === "IN_PROGRESS" || sprint.status === "ACTIVE") && riskInfo && (
          <div style={{ 
            padding: "12px 20px", 
            background: riskInfo.bgColor,
            borderTop: `1px solid ${riskInfo.color}20`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: `${riskInfo.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <PilotIcon style={{ fontSize: 14 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>AI 风险预估</Text>
                  <Tag 
                    style={{ 
                      margin: 0, 
                      padding: "0 6px",
                      height: 20,
                      lineHeight: "18px",
                      fontSize: 11,
                      borderRadius: 4,
                      background: `${riskInfo.color}15`,
                      color: riskInfo.color,
                      border: "none",
                    }}
                    icon={riskInfo.icon}
                  >
                    {riskInfo.label}
                  </Tag>
                  {sprint.risk && sprint.risk.type !== "HEALTHY" && sprint.risk.score > 0 && (
                    <span style={{ 
                      fontSize: 11, 
                      color: riskInfo.color,
                      fontWeight: 600,
                    }}>
                      风险指数 {sprint.risk.score}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {sprint.risk?.details.map((detail, i) => (
                    <span 
                      key={i}
                      style={{ 
                        fontSize: 12, 
                        color: "#64748b",
                        background: "#fff",
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
              <Tooltip title="查看详细分析">
                <Button 
                  type="text" 
                  size="small"
                  icon={<ArrowRightOutlined />}
                  style={{ color: riskInfo.color }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewDetail(sprint)
                  }}
                />
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 表格列配置
  const columns: TableProps<SprintWithStats>["columns"] = [
    {
      title: "编号",
      dataIndex: "id",
      width: 100,
      fixed: 'left',
      render: (id: string) => (
        <Text 
          type="secondary" 
          style={{ fontFamily: "monospace", cursor: "pointer" }}
          onClick={() => handleCopyId(id)}
          title="点击复制 ID"
        >
          <Space size={4}>
            {id.slice(-8)}
            <CopyOutlined style={{ fontSize: 12, color: "#bfbfbf" }} />
          </Space>
        </Text>
      ),
    },
    {
      title: "迭代名称",
      dataIndex: "name",
      fixed: 'left',
      render: (_: unknown, record: SprintWithStats) => (
        <Space>
          <Avatar
            shape="square"
            size={28}
            style={{
              background: record.status === "IN_PROGRESS" || record.status === "ACTIVE"
                ? "linear-gradient(135deg, #22d3ee 0%, #7c7cff 100%)"
                : record.status === "COMPLETED"
                ? "#10b981"
                : "#94a3b8",
              flexShrink: 0,
              borderRadius: 4,
            }}
            icon={<RocketOutlined style={{ fontSize: 14 }} />}
          />
          <Text 
            style={{ 
              cursor: "pointer", 
              fontWeight: 500,
              transition: "color 0.2s",
            }}
            onClick={() => handleViewDetail(record)}
            onMouseEnter={(e) => e.currentTarget.style.color = "#7c7cff"}
            onMouseLeave={(e) => e.currentTarget.style.color = ""}
          >
            {record.name}
          </Text>
        </Space>
      ),
    },
    {
      title: "周期",
      dataIndex: "startDate",
      width: 180,
      render: (_: unknown, record: SprintWithStats) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: "#64748b", fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.startDate} ~ {record.endDate}
          </Text>
        </Space>
      ),
    },
    {
      title: "进度",
      dataIndex: "progress",
      width: 150,
      render: (_: unknown, record: SprintWithStats) => (
        <Space>
          <Progress 
            percent={record.progress || 0} 
            size="small" 
            style={{ width: 80 }}
            strokeColor={{
              '0%': '#7c7cff',
              '100%': '#22d3ee',
            }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.requirementCount || 0} 项
          </Text>
        </Space>
      ),
    },
    {
      title: "AI 风险",
      dataIndex: "risk",
      width: 120,
      render: (_: unknown, record: SprintWithStats) => {
        // 只有进行中的迭代显示风险预估
        if (record.status !== "IN_PROGRESS" && record.status !== "ACTIVE") {
          return <Text type="secondary">-</Text>
        }
        const riskInfo = record.risk ? riskTypeConfig[record.risk.type] : null
        if (!riskInfo) return <Text type="secondary">-</Text>
        return (
          <Tag 
            style={{ 
              margin: 0, 
              borderRadius: 4,
              background: `${riskInfo.color}15`,
              color: riskInfo.color,
              border: "none",
            }}
            icon={riskInfo.icon}
          >
            {riskInfo.label}
          </Tag>
        )
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      fixed: 'right',
      render: (status: string) => {
        const statusInfo = sprintStatusConfig[status] || sprintStatusConfig.PLANNING
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon} style={{ borderRadius: 4 }}>
            {statusInfo.label}
          </Tag>
        )
      },
    },
    {
      title: "操作",
      width: 60,
      fixed: 'right',
      render: (_: unknown, record: SprintWithStats) => {
        const menuItems = [
          { key: "view", icon: <EyeOutlined />, label: "查看详情", onClick: () => handleViewDetail(record) },
          { key: "edit", icon: <EditOutlined />, label: "编辑", onClick: () => handleOpenEdit(record) },
        ]
        
        if (record.status === "PLANNING") {
          menuItems.push({ key: "start", icon: <PlayCircleOutlined />, label: "开始迭代", onClick: () => handleStart(record) })
        } else if (record.status === "IN_PROGRESS" || record.status === "ACTIVE") {
          menuItems.push({ key: "complete", icon: <CheckCircleOutlined />, label: "完成迭代", onClick: () => handleComplete(record) })
        }
        
        menuItems.push({ type: "divider" } as any)
        menuItems.push({ key: "delete", icon: <DeleteOutlined />, label: "删除", danger: true, onClick: () => handleDelete(record) } as any)
        
        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  // 右侧操作按钮
  const headerActions = (
    <Space size={8}>
      <Button.Group size="small">
        <Button 
          type={viewMode === "card" ? "primary" : "default"}
          onClick={() => setViewMode("card")}
          style={viewMode === "card" ? { background: "#7c7cff", borderColor: "#7c7cff" } : {}}
        >
          卡片
        </Button>
        <Button 
          type={viewMode === "table" ? "primary" : "default"}
          onClick={() => setViewMode("table")}
          style={viewMode === "table" ? { background: "#7c7cff", borderColor: "#7c7cff" } : {}}
        >
          列表
        </Button>
      </Button.Group>
      <Button 
        type="primary" 
        size="small"
        icon={<PlusOutlined style={{ fontSize: 12 }} />}
        onClick={() => setIsCreateOpen(true)}
        style={{ background: "#7c7cff", borderColor: "#7c7cff" }}
      >
        新建
      </Button>
    </Space>
  )

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    )
  }

  return (
    <>
      <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {viewMode === "card" ? (
          // 卡片视图
          <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* 左侧边栏 */}
            <div style={{ 
              width: 200, 
              borderRight: "1px solid #e2e8f0", 
              background: "#fff",
              padding: "16px 0",
              flexShrink: 0,
              overflow: "auto",
            }}>
              <div style={{ 
                padding: "0 16px 12px", 
                display: "flex", 
                alignItems: "center", 
                gap: 8,
                borderBottom: "1px solid #f1f5f9",
                marginBottom: 8,
              }}>
                <RocketOutlined style={{ fontSize: 14, color: "#7c7cff" }} />
                <Text strong style={{ fontSize: 13 }}>迭代状态</Text>
              </div>
              {buildSidebarItems().map((item, index) => {
                if ((item as any).isDivider) {
                  return <div key={index} style={{ height: 1, background: "#f1f5f9", margin: "8px 16px" }} />
                }
                const isActive = selectedStatus === item.id
                return (
                  <div
                    key={item.id || index}
                    onClick={() => handleSidebarSelect(item.id)}
                    style={{
                      padding: "8px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      background: isActive ? `${item.activeColor}10` : "transparent",
                      borderRight: isActive ? `2px solid ${item.activeColor}` : "2px solid transparent",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "#f8fafc"
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent"
                    }}
                  >
                    <Space size={8}>
                      {item.icon}
                      <Text style={{ fontSize: 13, color: isActive ? item.activeColor : "#64748b" }}>
                        {item.name}
                      </Text>
                    </Space>
                    <Text style={{ fontSize: 12, color: "#94a3b8" }}>{item.count}</Text>
                  </div>
                )
              })}
            </div>

            {/* 右侧内容区 */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* 顶部工具栏 */}
              <div style={{ 
                padding: "12px 20px", 
                background: "#fff", 
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <Space>
                  <Input
                    placeholder="搜索迭代..."
                    prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: 240 }}
                    allowClear
                    size="small"
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    共 {filteredData.length} 个迭代
                  </Text>
                </Space>
                {headerActions}
              </div>

              {/* 卡片网格 */}
              <div style={{ 
                flex: 1, 
                overflow: "auto", 
                padding: 20,
                background: "#f8fafc",
              }}>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
                  gap: 16,
                }}>
                  {filteredData.map(sprint => renderSprintCard(sprint))}
                </div>

                {filteredData.length === 0 && (
                  <div style={{ 
                    textAlign: "center", 
                    padding: 60,
                    color: "#94a3b8",
                  }}>
                    <RocketOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
                    <div>暂无迭代数据</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // 表格视图
          <ListPageLayout<SprintWithStats>
            showSidebar
            sidebar={{
              title: "迭代状态",
              icon: <RocketOutlined style={{ fontSize: 14, color: "#7c7cff" }} />,
              items: buildSidebarItems().filter(item => !(item as any).isDivider),
              selectedId: selectedStatus,
              onSelect: handleSidebarSelect,
            }}
            content={{
              title: "迭代列表",
              icon: <RocketOutlined style={{ fontSize: 14, color: "#7c7cff" }} />,
              columns: columns,
              dataSource: filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize),
              rowKey: "id",
              loading: tableLoading,
              searchPlaceholder: "搜索迭代名称...",
              searchValue: searchQuery,
              onSearch: setSearchQuery,
              headerActions: headerActions,
              pagination: {
                current: currentPage,
                pageSize: pageSize,
                total: filteredData.length,
                onChange: (page, size) => {
                  setCurrentPage(page)
                  setPageSize(size)
                },
              },
              rowSelection: {
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              },
            }}
          />
        )}
      </div>

      {/* 创建迭代弹窗 - 两步流程 */}
      <Modal
        title={createStep === 1 ? "创建迭代" : "添加工作项（可选）"}
        open={isCreateOpen}
        onCancel={() => {
          if (createStep === 2) {
            handleSkipWorkItems()
          } else {
            setIsCreateOpen(false)
            form.resetFields()
          }
        }}
        footer={createStep === 1 ? (
          <Space>
            <Button onClick={() => { setIsCreateOpen(false); form.resetFields() }}>取消</Button>
            <Button type="primary" loading={submitting} onClick={handleCreateStep1}>
              下一步：添加工作项
            </Button>
          </Space>
        ) : (
          <Space>
            <Button onClick={handleSkipWorkItems}>跳过</Button>
            <Button 
              type="primary" 
              loading={submitting} 
              onClick={handleCreateComplete}
              disabled={selectedWorkItemKeys.length === 0}
            >
              完成 ({selectedWorkItemKeys.length} 项)
            </Button>
          </Space>
        )}
        width={createStep === 1 ? 480 : 900}
      >
        {createStep === 1 ? (
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="name"
              label="迭代名称"
              rules={[{ required: true, message: "请输入迭代名称" }]}
            >
              <Input placeholder="如: Sprint 1" />
            </Form.Item>
            <Form.Item
              name="dateRange"
              label="迭代周期"
              rules={[{ required: true, message: "请选择迭代周期" }]}
            >
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="goal" label="迭代目标">
              <Input.TextArea rows={3} placeholder="描述本迭代的主要目标" />
            </Form.Item>
          </Form>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Input
                  placeholder="搜索工作项..."
                  prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                  value={importSearch}
                  onChange={(e) => {
                    setImportSearch(e.target.value)
                    if (newSprintId) loadAvailableWorkItems(newSprintId)
                  }}
                  style={{ width: 240 }}
                  allowClear
                />
                <Select
                  placeholder="类型"
                  value={importType}
                  onChange={(v: string | null) => {
                    setImportType(v)
                    if (newSprintId) loadAvailableWorkItems(newSprintId)
                  }}
                  style={{ width: 120 }}
                  allowClear
                  options={[
                    { value: "REQUIREMENT", label: "需求" },
                    { value: "TASK", label: "任务" },
                    { value: "BUG", label: "缺陷" },
                  ]}
                />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  选择要添加到迭代的工作项
                </Text>
              </Space>
            </div>
            <Table
              columns={[
                {
                  title: "类型",
                  dataIndex: "type",
                  width: 80,
                  render: (type: string) => {
                    const icons: Record<string, React.ReactNode> = {
                      REQUIREMENT: <FileTextFilled style={{ color: "#7c7cff", fontSize: 16 }} />,
                      TASK: <ThunderboltFilled style={{ color: "#faad14", fontSize: 16 }} />,
                      WORK_ITEM: <CodeFilled style={{ color: "#60a5fa", fontSize: 16 }} />,
                      BUG: <BugOutlined style={{ color: "#ef4444", fontSize: 16 }} />,
                    }
                    return icons[type] || icons.TASK
                  },
                },
                {
                  title: "标题",
                  dataIndex: "title",
                  ellipsis: true,
                },
                {
                  title: "优先级",
                  dataIndex: "priority",
                  width: 80,
                  render: (p: string) => {
                    const colors: Record<string, string> = { P0: "#ef4444", P1: "#f97316", P2: "#eab308", P3: "#22c55e" }
                    return <Tag style={{ color: colors[p], borderColor: colors[p], background: `${colors[p]}10`, borderRadius: 4 }}>{p}</Tag>
                  },
                },
                {
                  title: "产品",
                  width: 120,
                  render: (_: unknown, r: SprintWorkItem) => r.product?.name || "-",
                },
                {
                  title: "负责人",
                  width: 100,
                  render: (_: unknown, r: SprintWorkItem) => r.assignee?.name || "-",
                },
              ]}
              dataSource={availableWorkItems}
              rowKey="id"
              loading={availableLoading}
              size="small"
              pagination={{ pageSize: 10 }}
              rowSelection={{
                selectedRowKeys: selectedWorkItemKeys,
                onChange: setSelectedWorkItemKeys,
              }}
              locale={{
                emptyText: <Text type="secondary">暂无可添加的工作项</Text>,
              }}
            />
          </div>
        )}
      </Modal>

      {/* 编辑迭代弹窗 */}
      <Modal
        title="编辑迭代"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false)
          editForm.resetFields()
          setEditingSprint(null)
        }}
        onOk={handleEdit}
        okText="保存"
        cancelText="取消"
        confirmLoading={submitting}
        width={480}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="迭代名称"
            rules={[{ required: true, message: "请输入迭代名称" }]}
          >
            <Input placeholder="如: Sprint 1" />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="迭代周期"
            rules={[{ required: true, message: "请选择迭代周期" }]}
          >
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="goal" label="迭代目标">
            <Input.TextArea rows={3} placeholder="描述本迭代的主要目标" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
