"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Modal,
  Input,
  Select,
  Tag,
  Avatar,
  Button,
  Space,
  Tabs,
  Typography,
  Divider,
  Tooltip,
  Empty,
  Skeleton,
  List,
  Timeline,
  message,
  DatePicker,
  InputNumber,
  Dropdown,
} from "antd"
import {
  CalendarOutlined,
  CloseOutlined,
  CopyOutlined,
  ExpandOutlined,
  CompressOutlined,
  PlusOutlined,
  DeleteOutlined,
  LinkOutlined,
  SendOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  CommentOutlined,
  BranchesOutlined,
  FieldTimeOutlined,
  CodeFilled,
  ThunderboltOutlined,
  ThunderboltFilled,
} from "@ant-design/icons"
import dayjs from "dayjs"
import {
  workItemDetailApi,
  type WorkItemDetail,
} from "@/lib/api/workitem"
import {
  userApi,
  optionsApi,
  type User,
  type SelectOption,
} from "@/lib/api/requirement"

const { Text, Title } = Typography
const { TextArea } = Input

// ==================== 配置 ====================

const priorityOptions = [
  { value: "P0", label: "P0 - 最高", color: "red" },
  { value: "P1", label: "P1 - 高", color: "orange" },
  { value: "P2", label: "P2 - 中", color: "gold" },
  { value: "P3", label: "P3 - 低", color: "blue" },
  { value: "P4", label: "P4 - 最低", color: "default" },
]

const statusOptions = [
  { value: "NOT_STARTED", label: "未开始", color: "default", icon: <ClockCircleOutlined /> },
  { value: "IN_PROGRESS", label: "进行中", color: "processing", icon: <SyncOutlined spin /> },
  { value: "COMPLETED", label: "已完成", color: "success", icon: <CheckCircleOutlined /> },
  { value: "BLOCKED", label: "已阻塞", color: "error", icon: <ExclamationCircleOutlined /> },
]

const getStatusInfo = (status: string) => {
  return statusOptions.find((s) => s.value === status) || statusOptions[0]
}

// ==================== Props ====================

export interface WorkItemDetailModalProps {
  open: boolean
  workItemId: string | null // null 表示新建模式
  onClose: () => void
  onSuccess?: () => void
  // 选项数据
  products?: SelectOption[]
  projects?: SelectOption[]
  sprints?: SelectOption[]
  versions?: SelectOption[]
  tasks?: SelectOption[] // 父级任务列表
  // 默认值（新建时使用）
  defaultProductId?: string
  defaultProjectId?: string
  defaultParentId?: string // 默认父级任务
}

// ==================== 组件 ====================

export function WorkItemDetailModal({
  open,
  workItemId,
  onClose,
  onSuccess,
  products = [],
  projects = [],
  sprints = [],
  versions = [],
  tasks = [],
  defaultProductId,
  defaultProjectId,
  defaultParentId,
}: WorkItemDetailModalProps) {
  const isCreateMode = !workItemId

  // 状态
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState("description")
  const [commentText, setCommentText] = useState("")

  // 数据
  const [workItem, setWorkItem] = useState<WorkItemDetail | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState("")
  const titleInputRef = useRef<any>(null)

  // 用户列表
  const [users, setUsers] = useState<User[]>([])
  
  // 选项数据
  const [loadedProducts, setLoadedProducts] = useState<SelectOption[]>([])
  const [loadedProjects, setLoadedProjects] = useState<SelectOption[]>([])
  
  // 动态加载的模块和迭代列表
  const [moduleOptions, setModuleOptions] = useState<SelectOption[]>([])
  const [sprintOptions, setSprintOptions] = useState<SelectOption[]>([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [loadingSprints, setLoadingSprints] = useState(false)

  // 编辑状态
  const [formData, setFormData] = useState<Partial<WorkItemDetail>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // 加载用户列表和选项数据
  useEffect(() => {
    if (!open) return
    
    userApi.getList().then(setUsers).catch(console.error)
    
    if (products.length === 0) {
      optionsApi.getProducts().then(setLoadedProducts).catch(console.error)
    }
    
    if (projects.length === 0) {
      optionsApi.getProjects().then(setLoadedProjects).catch(console.error)
    }
  }, [open, products.length, projects.length])
  
  // 当产品变更时，加载对应的模块列表
  const currentProductId = (formData.productId as string) ?? workItem?.productId
  useEffect(() => {
    if (!open) return
    
    if (currentProductId) {
      setLoadingModules(true)
      optionsApi.getModulesByProduct(currentProductId)
        .then(setModuleOptions)
        .catch(console.error)
        .finally(() => setLoadingModules(false))
    } else {
      setModuleOptions([])
    }
  }, [open, currentProductId])
  
  // 当项目变更时，加载对应的迭代列表
  const currentProjectId = (formData.projectId as string) ?? workItem?.projectId
  useEffect(() => {
    if (!open) return
    
    if (currentProjectId) {
      setLoadingSprints(true)
      optionsApi.getSprintsByProject(currentProjectId)
        .then(setSprintOptions)
        .catch(console.error)
        .finally(() => setLoadingSprints(false))
    } else {
      setSprintOptions(sprints)
    }
  }, [open, currentProjectId]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // 合并外部传入和自动加载的选项数据
  const productOptions = products.length > 0 ? products : loadedProducts
  const projectOptions = projects.length > 0 ? projects : loadedProjects

  const userOptions = users.map((u) => ({ value: u.id, label: u.name }))

  // 初始化新建模式的默认数据
  const initCreateMode = useCallback(() => {
    const newWorkItem: WorkItemDetail = {
      id: "",
      title: "",
      description: "",
      priority: "P2",
      status: "NOT_STARTED",
      currentPhase: "DEVELOPMENT",
      parentId: defaultParentId || null,
      parentTitle: null,
      productId: defaultProductId || null,
      productName: null,
      projectId: defaultProjectId || null,
      projectName: null,
      sprintId: null,
      sprintName: null,
      moduleId: null,
      moduleName: null,
      versionId: null,
      versionName: null,
      creator: { id: "", name: "当前用户", avatar: null },
      assignee: null,
      testOwner: null,
      verifyOwner: null,
      plannedStartDate: null,
      plannedEndDate: null,
      actualStartDate: null,
      actualEndDate: null,
      estimatedHours: null,
      actualHours: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dependencies: [],
      dependents: [],
      comments: [],
      activityLogs: [],
    }
    setWorkItem(newWorkItem)
    setTitleValue("")
    setFormData({})
    setHasChanges(false)
    setEditingTitle(true)
    setLoading(false)
  }, [defaultProductId, defaultProjectId, defaultParentId])

  // 加载工作项详情
  const loadWorkItem = useCallback(async () => {
    if (!workItemId) {
      initCreateMode()
      return
    }

    setLoading(true)
    try {
      const data = await workItemDetailApi.getDetail(workItemId)
      setWorkItem(data)
      setTitleValue(data.title)
      setFormData({})
      setHasChanges(false)
    } catch (error: any) {
      console.error("加载工作项失败:", error)
      message.error(error.message || "加载工作项失败")
    } finally {
      setLoading(false)
    }
  }, [workItemId, initCreateMode])

  useEffect(() => {
    if (open) {
      setLoading(true)
      if (workItemId) {
        loadWorkItem()
      } else {
        initCreateMode()
      }
      setActiveTab("description")
    } else {
      setWorkItem(null)
      setFormData({})
      setHasChanges(false)
      setTitleValue("")
      setEditingTitle(false)
      setCommentText("")
    }
  }, [open, workItemId, loadWorkItem, initCreateMode])

  // 更新表单数据
  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // 标题编辑
  const handleSaveTitle = () => {
    if (!titleValue.trim()) {
      if (isCreateMode) return
      setTitleValue(workItem?.title || "")
      setEditingTitle(false)
      return
    }
    if (titleValue !== (workItem?.title || "")) {
      updateField("title", titleValue)
    }
    setEditingTitle(false)
  }

  const handleTitleBlur = () => handleSaveTitle()

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSaveTitle()
    } else if (e.key === "Escape") {
      setTitleValue(workItem?.title || "")
      setEditingTitle(false)
    }
  }

  const startEditingTitle = () => {
    setEditingTitle(true)
    setTimeout(() => {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }, 50)
  }

  // 复制 ID
  const handleCopyId = () => {
    if (workItem?.id) {
      navigator.clipboard.writeText(workItem.id)
      message.success("ID 已复制")
    }
  }

  // 保存或创建
  const handleSave = async () => {
    if (isCreateMode && !titleValue.trim()) {
      message.error("请输入工作项标题")
      setEditingTitle(true)
      return
    }

    const dataToSave: Record<string, unknown> = {
      title: titleValue,
    }
    
    if (isCreateMode && workItem) {
      dataToSave.parentId = formData.parentId !== undefined ? formData.parentId : workItem.parentId
      dataToSave.productId = formData.productId !== undefined ? formData.productId : workItem.productId
      dataToSave.projectId = formData.projectId !== undefined ? formData.projectId : workItem.projectId
      dataToSave.sprintId = formData.sprintId !== undefined ? formData.sprintId : workItem.sprintId
      dataToSave.versionId = formData.versionId !== undefined ? formData.versionId : workItem.versionId
      dataToSave.moduleId = formData.moduleId !== undefined ? formData.moduleId : workItem.moduleId
      dataToSave.priority = formData.priority !== undefined ? formData.priority : workItem.priority
      dataToSave.status = formData.status !== undefined ? formData.status : workItem.status
      dataToSave.description = formData.description !== undefined ? formData.description : workItem.description
      dataToSave.plannedStartDate = formData.plannedStartDate !== undefined ? formData.plannedStartDate : workItem.plannedStartDate
      dataToSave.plannedEndDate = formData.plannedEndDate !== undefined ? formData.plannedEndDate : workItem.plannedEndDate
      dataToSave.estimatedHours = formData.estimatedHours !== undefined ? formData.estimatedHours : workItem.estimatedHours
      
      const assignee = formData.assignee !== undefined ? formData.assignee : workItem.assignee
      dataToSave.devOwnerId = assignee ? (assignee as { id: string }).id : undefined
    } else {
      Object.assign(dataToSave, formData)
      if (formData.assignee !== undefined) {
        dataToSave.devOwnerId = formData.assignee ? (formData.assignee as { id: string }).id : null
        delete dataToSave.assignee
      }
    }

    setSaving(true)
    try {
      if (isCreateMode) {
        await workItemDetailApi.create(dataToSave as any)
        message.success("创建成功")
        onSuccess?.()
        onClose()
      } else if (workItemId) {
        await workItemDetailApi.update(workItemId, dataToSave as any)
        message.success("保存成功")
        setHasChanges(false)
        loadWorkItem()
        onSuccess?.()
      }
    } catch (error: any) {
      message.error(error.message || (isCreateMode ? "创建失败" : "保存失败"))
    } finally {
      setSaving(false)
    }
  }

  // 发送评论
  const handleSendComment = async () => {
    if (!commentText.trim() || !workItemId) return

    try {
      const newComment = await workItemDetailApi.addComment(
        workItemId,
        commentText.trim()
      )
      setWorkItem((prev) =>
        prev
          ? { ...prev, comments: [newComment, ...prev.comments] }
          : prev
      )
      setCommentText("")
      message.success("评论已发送")
    } catch (error: any) {
      message.error(error.message || "发送评论失败")
    }
  }

  // 关闭弹窗
  const handleClose = () => {
    if (hasChanges) {
      Modal.confirm({
        title: "确认关闭",
        content: "有未保存的更改，确定要关闭吗？",
        okText: "关闭",
        cancelText: "取消",
        onOk: onClose,
      })
    } else {
      onClose()
    }
  }

  // 渲染工作项状态
  const renderWorkItemStatus = (status: string) => {
    const info = getStatusInfo(status)
    return (
      <Tag color={info.color} icon={info.icon}>
        {info.label}
      </Tag>
    )
  }

  const modalWidth = isFullscreen ? "100vw" : 1200
  const modalStyle = isFullscreen ? { top: 0, padding: 0, maxWidth: "100vw" } : {}

  // 当前显示的值
  const currentPriority = (formData.priority as string) || workItem?.priority || "P2"
  const currentStatus = (formData.status as string) || workItem?.status || "NOT_STARTED"
  const currentAssignee = formData.assignee !== undefined 
    ? formData.assignee 
    : workItem?.assignee
  const currentModuleId = formData.moduleId !== undefined
    ? formData.moduleId
    : workItem?.moduleId

  const showLoading = loading || !workItem

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      width={modalWidth}
      style={modalStyle}
      styles={{
        body: {
          padding: 0,
          height: isFullscreen ? "calc(100vh - 55px)" : 700,
          overflow: "hidden",
        },
      }}
      footer={null}
      closable={false}
      centered={!isFullscreen}
      maskClosable={false}
    >
      {showLoading ? (
        <div style={{ padding: 24 }}>
          <Skeleton active paragraph={{ rows: 12 }} />
        </div>
      ) : (
        <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
          {/* 顶部 Header */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #f0f0f0",
              background: "#fff",
              flexShrink: 0,
            }}
          >
            {/* 左侧主内容区 Header */}
            <div
              style={{
                flex: 1,
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: 56,
              }}
            >
              {/* 类型图标 + 标题 */}
              <div style={{ flex: 1, minWidth: 0, marginRight: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <CodeFilled style={{ fontSize: 20, color: "#60a5fa", flexShrink: 0 }} />
                {editingTitle ? (
                  <Input
                    ref={titleInputRef}
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    placeholder="输入工作项标题..."
                    variant="borderless"
                    style={{ fontSize: 18, fontWeight: 600, padding: "4px 0", flex: 1 }}
                  />
                ) : (
                  <div
                    style={{ cursor: "pointer", padding: "4px 0", borderRadius: 4, flex: 1 }}
                    onClick={startEditingTitle}
                  >
                    <Title
                      level={4}
                      style={{
                        margin: 0,
                        color:
                          formData.title || titleValue || workItem.title
                            ? "#1e293b"
                            : "#bfbfbf",
                      }}
                    >
                      {(formData.title as string) ||
                        titleValue ||
                        workItem.title ||
                        "点击输入工作项标题..."}
                    </Title>
                  </div>
                )}
              </div>

              {/* 右侧：标签 + 保存按钮 */}
              <Space size={12}>
                {!isCreateMode && (
                  <Space size={8}>
                    <Tooltip title="复制 ID">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={handleCopyId}
                        style={{ color: "#8c8c8c" }}
                      >
                        {workItem.id.slice(-8)}
                      </Button>
                    </Tooltip>
                  </Space>
                )}

                {(isCreateMode || hasChanges) && (
                  <Button
                    type="primary"
                    size="small"
                    loading={saving}
                    onClick={handleSave}
                  >
                    {isCreateMode ? "创建" : "保存"}
                  </Button>
                )}
              </Space>
            </div>

            {/* 右侧边栏 Header */}
            <div
              style={{
                width: 280,
                borderLeft: "1px solid #f0f0f0",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                background: "#fafafa",
                minHeight: 56,
              }}
            >
              <Space size={4}>
                <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
                  <Button
                    type="text"
                    size="small"
                    icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    style={{ color: "#8c8c8c" }}
                  />
                </Tooltip>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClose()
                  }}
                  style={{ color: "#8c8c8c" }}
                />
              </Space>
            </div>
          </div>

          {/* 主体内容区域 */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* 左侧主内容区域 */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* 主要信息区域 */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  {/* 负责人 */}
                  <Tooltip title={currentAssignee ? `负责人: ${currentAssignee.name}` : "点击指派负责人"}>
                    <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: [
                          { key: "unassign", label: <Text type="secondary">取消指派</Text>, disabled: !currentAssignee },
                          { type: "divider" },
                          ...users.map((u) => ({
                            key: u.id,
                            label: (
                              <Space>
                                <Avatar size="small" style={{ background: "#a5b4fc" }}>{u.name[0]}</Avatar>
                                <span>{u.name}</span>
                              </Space>
                            ),
                          })),
                        ],
                        onClick: ({ key }) => {
                          if (key === "unassign") {
                            updateField("assignee", null)
                          } else {
                            const user = users.find((u) => u.id === key)
                            if (user) {
                              updateField("assignee", { id: user.id, name: user.name, avatar: user.avatar })
                            }
                          }
                        },
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          background: "#fff",
                          borderRadius: 20,
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          transition: "all 0.2s",
                          border: "1px solid #e2e8f0",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(124,124,255,0.15)"
                          e.currentTarget.style.borderColor = "#7c7cff"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)"
                          e.currentTarget.style.borderColor = "#e2e8f0"
                        }}
                      >
                        {currentAssignee ? (
                          <Avatar size={24} style={{ background: "linear-gradient(135deg, #7c7cff 0%, #a78bfa 100%)" }}>
                            {currentAssignee.name[0]}
                          </Avatar>
                        ) : (
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              border: "2px dashed #cbd5e1",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <PlusOutlined style={{ fontSize: 12, color: "#94a3b8" }} />
                          </div>
                        )}
                        <Text style={{ fontSize: 13, color: currentAssignee ? "#334155" : "#94a3b8" }}>
                          {currentAssignee ? currentAssignee.name : "负责人"}
                        </Text>
                      </div>
                    </Dropdown>
                  </Tooltip>

                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />

                  {/* 状态 */}
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: statusOptions.map((s) => ({
                        key: s.value,
                        label: (
                          <Space>
                            <span style={{ 
                              color: s.color === 'processing' ? '#1677ff' : s.color === 'success' ? '#52c41a' : s.color === 'error' ? '#ff4d4f' : '#8c8c8c' 
                            }}>
                              {s.icon}
                            </span>
                            <span>{s.label}</span>
                          </Space>
                        ),
                      })),
                      selectedKeys: [currentStatus],
                      onClick: ({ key }) => updateField("status", key),
                    }}
                  >
                    {(() => {
                      const status = statusOptions.find((s) => s.value === currentStatus)
                      const bgColor = status?.color === 'processing' ? '#eff6ff' : status?.color === 'success' ? '#f0fdf4' : status?.color === 'error' ? '#fef2f2' : '#f8fafc'
                      const textColor = status?.color === 'processing' ? '#1677ff' : status?.color === 'success' ? '#16a34a' : status?.color === 'error' ? '#dc2626' : '#64748b'
                      const borderColor = status?.color === 'processing' ? '#bfdbfe' : status?.color === 'success' ? '#bbf7d0' : status?.color === 'error' ? '#fecaca' : '#e2e8f0'
                      return (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 14px",
                            background: bgColor,
                            borderRadius: 20,
                            cursor: "pointer",
                            border: `1px solid ${borderColor}`,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        >
                          <span style={{ color: textColor, display: "flex", alignItems: "center" }}>{status?.icon}</span>
                          <Text style={{ fontSize: 13, color: textColor, fontWeight: 500 }}>{status?.label}</Text>
                        </div>
                      )
                    })()}
                  </Dropdown>

                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />

                  {/* 优先级 */}
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: priorityOptions.map((p) => ({
                        key: p.value,
                        label: <Tag color={p.color}>{p.label}</Tag>,
                      })),
                      selectedKeys: [currentPriority],
                      onClick: ({ key }) => updateField("priority", key),
                    }}
                  >
                    {(() => {
                      const priority = priorityOptions.find((p) => p.value === currentPriority)
                      return (
                        <Tag
                          color={priority?.color}
                          style={{
                            margin: 0,
                            padding: "4px 12px",
                            borderRadius: 12,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          {priority?.label}
                        </Tag>
                      )
                    })()}
                  </Dropdown>

                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />

                  {/* 预估工时 */}
                  <Tooltip title="预估工时">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        background: "#fff",
                        borderRadius: 20,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <FieldTimeOutlined style={{ fontSize: 14, color: "#7c7cff" }} />
                      <InputNumber
                        value={(formData.estimatedHours as number) ?? workItem.estimatedHours}
                        onChange={(value) => updateField("estimatedHours", value)}
                        style={{ width: 50 }}
                        size="small"
                        min={0}
                        step={0.5}
                        placeholder="--"
                        variant="borderless"
                        controls={false}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>h</Text>
                    </div>
                  </Tooltip>

                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />

                  {/* 时间范围 */}
                  <Tooltip title="计划时间">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        background: "#fff",
                        borderRadius: 20,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <CalendarOutlined style={{ fontSize: 14, color: "#7c7cff" }} />
                      <DatePicker.RangePicker
                        value={[
                          (formData.plannedStartDate as string) ?? workItem.plannedStartDate
                            ? dayjs((formData.plannedStartDate as string) ?? workItem.plannedStartDate)
                            : null,
                          (formData.plannedEndDate as string) ?? workItem.plannedEndDate
                            ? dayjs((formData.plannedEndDate as string) ?? workItem.plannedEndDate)
                            : null,
                        ]}
                        onChange={(dates) => {
                          updateField("plannedStartDate", dates?.[0]?.format("YYYY-MM-DD") || null)
                          updateField("plannedEndDate", dates?.[1]?.format("YYYY-MM-DD") || null)
                        }}
                        size="small"
                        variant="borderless"
                        style={{ width: 200 }}
                        placeholder={["开始", "结束"]}
                        format="MM-DD"
                        separator={<span style={{ color: "#cbd5e1" }}>→</span>}
                      />
                    </div>
                  </Tooltip>
                </div>
              </div>

              {/* Tab 内容区域 */}
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                  tabBarStyle={{ padding: "0 20px", marginBottom: 0 }}
                  items={[
                    {
                      key: "description",
                      label: (
                        <span>
                          <FileTextOutlined /> 描述
                        </span>
                      ),
                      children: (
                        <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                          <TextArea
                            value={(formData.description as string) ?? workItem.description ?? ""}
                            onChange={(e) => updateField("description", e.target.value)}
                            placeholder="点击此处添加工作项描述...&#10;&#10;可以包含：&#10;• 任务背景&#10;• 实现方案&#10;• 验收标准&#10;• 其他备注"
                            autoSize={{ minRows: 8 }}
                            style={{
                              background: "#fafafa",
                              borderRadius: 8,
                              border: "1px solid #f0f0f0",
                              padding: 16,
                              fontSize: 14,
                              lineHeight: 1.8,
                              resize: "none",
                            }}
                            styles={{
                              textarea: {
                                background: "transparent",
                              }
                            }}
                          />
                        </div>
                      ),
                    },
                    {
                      key: "dependencies",
                      label: (
                        <span>
                          <BranchesOutlined /> 依赖关系
                        </span>
                      ),
                      children: (
                        <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                          <div style={{ marginBottom: 24 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: 12,
                              }}
                            >
                              <Text strong>前置依赖</Text>
                              <Text
                                type="secondary"
                                style={{ marginLeft: 8, fontSize: 12 }}
                              >
                                (当前工作项依赖的项)
                              </Text>
                              <Button
                                type="link"
                                size="small"
                                icon={<PlusOutlined />}
                                style={{ marginLeft: "auto" }}
                                disabled={isCreateMode}
                              >
                                添加
                              </Button>
                            </div>
                            {workItem.dependencies.length > 0 ? (
                              <List
                                size="small"
                                dataSource={workItem.dependencies}
                                renderItem={(dep) => (
                                  <List.Item
                                    style={{
                                      padding: "8px 12px",
                                      background: "#f6ffed",
                                      borderRadius: 6,
                                      marginBottom: 8,
                                    }}
                                    actions={[
                                      <Button
                                        key="del"
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                      />,
                                    ]}
                                  >
                                    <Space>
                                      <LinkOutlined style={{ color: "#52c41a" }} />
                                      <Text>{dep.workItem.title}</Text>
                                      {renderWorkItemStatus(dep.workItem.status)}
                                    </Space>
                                  </List.Item>
                                )}
                              />
                            ) : (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="无前置依赖"
                              />
                            )}
                          </div>

                          <Divider />

                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: 12,
                              }}
                            >
                              <Text strong>后置依赖</Text>
                              <Text
                                type="secondary"
                                style={{ marginLeft: 8, fontSize: 12 }}
                              >
                                (依赖当前工作项的项)
                              </Text>
                            </div>
                            {workItem.dependents.length > 0 ? (
                              <List
                                size="small"
                                dataSource={workItem.dependents}
                                renderItem={(dep) => (
                                  <List.Item
                                    style={{
                                      padding: "8px 12px",
                                      background: "#fff7e6",
                                      borderRadius: 6,
                                      marginBottom: 8,
                                    }}
                                  >
                                    <Space>
                                      <LinkOutlined style={{ color: "#fa8c16" }} />
                                      <Text>{dep.workItem.title}</Text>
                                      {renderWorkItemStatus(dep.workItem.status)}
                                    </Space>
                                  </List.Item>
                                )}
                              />
                            ) : (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="无后置依赖"
                              />
                            )}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "comments",
                      label: (
                        <span>
                          <CommentOutlined /> 评论 ({workItem.comments.length})
                        </span>
                      ),
                      children: (
                        <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                          <List
                            dataSource={workItem.comments}
                            renderItem={(comment) => (
                              <List.Item
                                style={{ padding: "12px 0", alignItems: "flex-start" }}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <Avatar style={{ background: "#a5b4fc" }}>
                                      {comment.user.name[0]}
                                    </Avatar>
                                  }
                                  title={
                                    <Space>
                                      <Text strong>{comment.user.name}</Text>
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        {dayjs(comment.createdAt).format(
                                          "YYYY-MM-DD HH:mm"
                                        )}
                                      </Text>
                                    </Space>
                                  }
                                  description={
                                    <div
                                      style={{
                                        marginTop: 8,
                                        padding: 12,
                                        background: "#f5f5f5",
                                        borderRadius: 8,
                                        whiteSpace: "pre-wrap",
                                      }}
                                    >
                                      {comment.content}
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                            locale={{ emptyText: <Empty description="暂无评论" /> }}
                          />
                        </div>
                      ),
                    },
                    // 操作记录 - 仅编辑模式显示
                    ...(!isCreateMode ? [{
                      key: "history",
                      label: (
                        <span>
                          <HistoryOutlined /> 操作记录
                        </span>
                      ),
                      children: (
                        <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                          <Timeline
                            items={workItem.activityLogs.map((log) => ({
                              color: "gray",
                              children: (
                                <div>
                                  <Space wrap>
                                    <Avatar
                                      size="small"
                                      style={{ background: "#a5b4fc" }}
                                    >
                                      {log.user.name[0]}
                                    </Avatar>
                                    <Text strong>{log.user.name}</Text>
                                    <Text>{log.action}</Text>
                                    {log.oldValue && (
                                      <Text type="secondary" delete>
                                        {log.oldValue}
                                      </Text>
                                    )}
                                    {log.newValue && (
                                      <Text type="success">{log.newValue}</Text>
                                    )}
                                  </Space>
                                  <div style={{ marginTop: 4 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {dayjs(log.createdAt).format("YYYY-MM-DD HH:mm")}
                                    </Text>
                                  </div>
                                </div>
                              ),
                            }))}
                          />
                        </div>
                      ),
                          }] : []),
                  ]}
                />
              </div>

              {/* 评论输入区域 */}
              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid #f0f0f0",
                  background: "#fafafa",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                  <Avatar style={{ background: "#7c7cff", flexShrink: 0 }}>我</Avatar>
                  <TextArea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="输入评论内容..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ flex: 1 }}
                    disabled={isCreateMode}
                    onPressEnter={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        handleSendComment()
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendComment}
                    disabled={!commentText.trim() || isCreateMode}
                  >
                    发送
                  </Button>
                </div>
                <Text
                  type="secondary"
                  style={{ fontSize: 11, marginLeft: 44, marginTop: 4, display: "block" }}
                >
                  Ctrl + Enter 快捷发送
                </Text>
              </div>
            </div>

            {/* 右侧边栏 */}
            <div
              style={{
                width: 280,
                borderLeft: "1px solid #f0f0f0",
                background: "#fafafa",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* 属性列表 */}
              <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                <div style={{ marginBottom: 20 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    所属任务
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    {workItem.parentTitle ? (
                      <Tag color="orange" style={{ margin: 0 }}>
                        <ThunderboltFilled style={{ marginRight: 4 }} />
                        {workItem.parentTitle}
                      </Tag>
                    ) : (
                      <Select
                        size="small"
                        placeholder="选择任务"
                        value={(formData.parentId as string) ?? workItem.parentId}
                        onChange={(value) => updateField("parentId", value)}
                        style={{ width: "100%" }}
                        allowClear
                        options={tasks}
                      />
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    产品
                  </Text>
                  <Select
                    size="small"
                    placeholder="选择产品"
                    value={(formData.productId as string) ?? workItem.productId}
                    onChange={(value) => updateField("productId", value)}
                    style={{ width: "100%", marginTop: 8 }}
                    allowClear
                    options={productOptions}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    模块
                  </Text>
                  <Select
                    size="small"
                    placeholder={currentProductId ? "选择模块" : "请先选择产品"}
                    value={currentModuleId as string}
                    onChange={(value) => updateField("moduleId", value)}
                    style={{ width: "100%", marginTop: 8 }}
                    allowClear
                    options={moduleOptions}
                    disabled={!currentProductId}
                    loading={loadingModules}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    项目
                  </Text>
                  <Select
                    size="small"
                    placeholder="选择项目"
                    value={(formData.projectId as string) ?? workItem.projectId}
                    onChange={(value) => updateField("projectId", value)}
                    style={{ width: "100%", marginTop: 8 }}
                    allowClear
                    options={projectOptions}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    迭代
                  </Text>
                  <Select
                    size="small"
                    placeholder={currentProjectId ? "选择迭代" : "请先选择项目"}
                    value={(formData.sprintId as string) ?? workItem.sprintId}
                    onChange={(value) => updateField("sprintId", value)}
                    style={{ width: "100%", marginTop: 8 }}
                    allowClear
                    options={sprintOptions}
                    disabled={!currentProjectId}
                    loading={loadingSprints}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>

                <Divider style={{ margin: "12px 0" }} />

                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    创建人
                  </Text>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar size="small" style={{ background: "#a5b4fc" }}>
                      {workItem.creator.name[0]}
                    </Avatar>
                    <Text>{workItem.creator.name}</Text>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    创建时间
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>{dayjs(workItem.createdAt).format("YYYY-MM-DD HH:mm")}</Text>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    更新时间
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>{dayjs(workItem.updatedAt).format("YYYY-MM-DD HH:mm")}</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
