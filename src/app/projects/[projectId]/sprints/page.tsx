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
  PauseCircleOutlined,
  EyeOutlined,
  CopyOutlined,
  SearchOutlined,
  FileTextFilled,
  ThunderboltFilled,
  CodeFilled,
  BugOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
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

// 扩展 Sprint 类型添加统计信息
interface SprintWithStats extends Sprint {
  completedCount?: number
  totalCount?: number
  progress?: number
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

  // 加载迭代列表
  const loadSprints = useCallback(async () => {
    try {
      setTableLoading(true)
      const data = await sprintApi.getList(projectId)
      // 计算进度
      const sprintsWithStats = data.map(sprint => ({
        ...sprint,
        totalCount: sprint.requirementCount || 0,
        completedCount: 0, // TODO: 从API获取已完成数
        progress: 0, // TODO: 计算进度
      }))
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
    if (diff < 0) return { text: `已逾期 ${Math.abs(diff)} 天`, color: "#ef4444" }
    if (diff === 0) return { text: "今天截止", color: "#f59e0b" }
    if (diff <= 3) return { text: `剩余 ${diff} 天`, color: "#f59e0b" }
    return { text: `剩余 ${diff} 天`, color: "#64748b" }
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
      title: "目标",
      dataIndex: "goal",
      width: 200,
      ellipsis: true,
      render: (goal: string | null) => goal || <Text type="secondary">-</Text>,
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
      title: "剩余时间",
      dataIndex: "endDate",
      width: 100,
      render: (endDate: string, record: SprintWithStats) => {
        if (record.status === "COMPLETED") {
          return <Text type="secondary">已完成</Text>
        }
        const remaining = getRemainingDays(endDate)
        return <Text style={{ color: remaining.color, fontSize: 12 }}>{remaining.text}</Text>
      },
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
              '0%': '#22d3ee',
              '100%': '#7c7cff',
            }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.requirementCount || 0} 项
          </Text>
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      fixed: 'right',
      render: (status: string) => {
        const statusInfo = sprintStatusConfig[status] || sprintStatusConfig.PLANNING
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
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
        
        // 根据状态添加不同操作
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

  // 构建侧边栏数据
  const buildSidebarItems = (): SidebarItem[] => {
    const allCount = sprints.length
    const planningCount = sprints.filter(s => s.status === "PLANNING").length
    const inProgressCount = sprints.filter(s => s.status === "IN_PROGRESS" || s.status === "ACTIVE").length
    const completedCount = sprints.filter(s => s.status === "COMPLETED").length
    
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

  // 右侧操作按钮
  const headerActions = (
    <Button 
      type="primary" 
      size="small"
      icon={<PlusOutlined style={{ fontSize: 12 }} />}
      onClick={() => setIsCreateOpen(true)}
    >
      新建
    </Button>
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
        <ListPageLayout<SprintWithStats>
          showSidebar
          sidebar={{
            title: "迭代状态",
            icon: <RocketOutlined style={{ fontSize: 14, color: "#7c7cff" }} />,
            items: buildSidebarItems(),
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
      </div>

      {/* 创建迭代弹窗 - 两步流程 */}
      <Modal
        title={createStep === 1 ? "创建迭代" : "添加工作项（可选）"}
        open={isCreateOpen}
        onCancel={() => {
          if (createStep === 2) {
            // 第二步取消时跳过工作项
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
                    return <Tag style={{ color: colors[p], borderColor: colors[p], background: `${colors[p]}10` }}>{p}</Tag>
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
