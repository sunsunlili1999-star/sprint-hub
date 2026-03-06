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
  Progress,
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
  UserOutlined,
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
  ApartmentOutlined,
  BranchesOutlined,
  TagOutlined,
  FieldTimeOutlined,
  EditOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import {
  requirementDetailApi,
  userApi,
  optionsApi,
  type RequirementDetail,
  type ChildWorkItem,
  type User,
  type SelectOption,
} from "@/lib/api/requirement"

const { Text, Title, Paragraph } = Typography
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

const requirementTypeOptions = [
  { value: "FEATURE", label: "功能", color: "blue" },
  { value: "OPTIMIZATION", label: "优化", color: "cyan" },
  { value: "SECURITY", label: "安全", color: "red" },
  { value: "TECH", label: "技改", color: "purple" },
]

const getPriorityColor = (priority: string) => {
  return priorityOptions.find((p) => p.value === priority)?.color || "default"
}

const getStatusInfo = (status: string) => {
  return statusOptions.find((s) => s.value === status) || statusOptions[0]
}

// ==================== Props ====================

export interface RequirementDetailModalProps {
  open: boolean
  requirementId: string | null // null 表示新建模式
  onClose: () => void
  onSuccess?: () => void // 保存/创建成功后回调
  // 选项数据
  products?: SelectOption[]
  projects?: SelectOption[]
  sprints?: SelectOption[]
  versions?: SelectOption[]
  // 默认值（新建时使用）
  defaultProductId?: string
  defaultProjectId?: string
}

// ==================== 组件 ====================

export function RequirementDetailModal({
  open,
  requirementId,
  onClose,
  onSuccess,
  products = [],
  projects = [],
  sprints = [],
  versions = [],
  defaultProductId,
  defaultProjectId,
}: RequirementDetailModalProps) {
  const isCreateMode = !requirementId

  // 状态
  const [loading, setLoading] = useState(true) // 默认为 true，避免闪烁
  const [saving, setSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState("description")
  const [commentText, setCommentText] = useState("")

  // 数据
  const [requirement, setRequirement] = useState<RequirementDetail | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState("")
  const titleInputRef = useRef<any>(null)

  // 用户列表
  const [users, setUsers] = useState<User[]>([])
  
  // 选项数据（如果外部没传入，则自动加载）
  const [loadedProducts, setLoadedProducts] = useState<SelectOption[]>([])
  const [loadedProjects, setLoadedProjects] = useState<SelectOption[]>([])
  
  // 动态加载的模块和迭代列表
  const [moduleOptions, setModuleOptions] = useState<SelectOption[]>([])
  const [sprintOptions, setSprintOptions] = useState<SelectOption[]>([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [loadingSprints, setLoadingSprints] = useState(false)

  // 编辑状态
  const [formData, setFormData] = useState<Partial<RequirementDetail>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // 新建工作项状态
  const [newWorkItem, setNewWorkItem] = useState<{
    isEditing: boolean
    title: string
    priority: string
    devOwnerId: string | null
  } | null>(null)
  const newWorkItemInputRef = useRef<any>(null)

  // 加载用户列表和选项数据
  useEffect(() => {
    if (!open) return
    
    userApi.getList().then(setUsers).catch(console.error)
    
    // 如果外部没传入产品列表，则自动加载
    if (products.length === 0) {
      optionsApi.getProducts().then(setLoadedProducts).catch(console.error)
    }
    
    // 如果外部没传入项目列表，则自动加载
    if (projects.length === 0) {
      optionsApi.getProjects().then(setLoadedProjects).catch(console.error)
    }
  }, [open, products.length, projects.length])
  
  // 当产品变更时，加载对应的模块列表
  const currentProductId = (formData.productId as string) ?? requirement?.productId
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
  const currentProjectId = (formData.projectId as string) ?? requirement?.projectId
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
    const newRequirement: RequirementDetail = {
      id: "",
      title: "",
      description: "",
      priority: "P2",
      status: "NOT_STARTED",
      requirementType: null,
      currentPhase: "DEVELOPMENT",
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
      progress: 0,
      childCount: 0,
      completedChildCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
      dependencies: [],
      dependents: [],
      comments: [],
      activityLogs: [],
    }
    setRequirement(newRequirement)
    setTitleValue("")
    setFormData({})
    setHasChanges(false)
    setEditingTitle(true)
    setLoading(false)
  }, [defaultProductId, defaultProjectId])

  // 加载需求详情
  const loadRequirement = useCallback(async () => {
    if (!requirementId) {
      initCreateMode()
      return
    }

    setLoading(true)
    try {
      const data = await requirementDetailApi.getDetail(requirementId)
      setRequirement(data)
      setTitleValue(data.title)
      setFormData({})
      setHasChanges(false)
    } catch (error: any) {
      console.error("加载需求失败:", error)
      message.error(error.message || "加载需求失败")
    } finally {
      setLoading(false)
    }
  }, [requirementId, initCreateMode])

  useEffect(() => {
    if (open) {
      setLoading(true) // 先设置为加载中
      if (requirementId) {
        loadRequirement()
      } else {
        initCreateMode()
      }
      setActiveTab("description")
    } else {
      // 弹窗关闭时重置状态
      setRequirement(null)
      setFormData({})
      setHasChanges(false)
      setTitleValue("")
      setEditingTitle(false)
      setCommentText("")
    }
  }, [open, requirementId, loadRequirement, initCreateMode])

  // 更新表单数据
  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // 标题编辑
  const handleSaveTitle = () => {
    if (!titleValue.trim()) {
      if (isCreateMode) return
      setTitleValue(requirement?.title || "")
      setEditingTitle(false)
      return
    }
    if (titleValue !== (requirement?.title || "")) {
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
      setTitleValue(requirement?.title || "")
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
    if (requirement?.id) {
      navigator.clipboard.writeText(requirement.id)
      message.success("ID 已复制")
    }
  }

  // 保存或创建
  const handleSave = async () => {
    if (isCreateMode && !titleValue.trim()) {
      message.error("请输入需求标题")
      setEditingTitle(true)
      return
    }

    // 构建保存数据
    const dataToSave: Record<string, unknown> = {
      title: titleValue,
    }
    
    // 新建模式：使用 requirement 的默认值 + formData 的修改值
    if (isCreateMode && requirement) {
      dataToSave.productId = formData.productId !== undefined ? formData.productId : requirement.productId
      dataToSave.projectId = formData.projectId !== undefined ? formData.projectId : requirement.projectId
      dataToSave.sprintId = formData.sprintId !== undefined ? formData.sprintId : requirement.sprintId
      dataToSave.versionId = formData.versionId !== undefined ? formData.versionId : requirement.versionId
      dataToSave.moduleId = formData.moduleId !== undefined ? formData.moduleId : requirement.moduleId
      dataToSave.priority = formData.priority !== undefined ? formData.priority : requirement.priority
      dataToSave.status = formData.status !== undefined ? formData.status : requirement.status
      dataToSave.requirementType = formData.requirementType !== undefined ? formData.requirementType : requirement.requirementType
      dataToSave.description = formData.description !== undefined ? formData.description : requirement.description
      dataToSave.plannedStartDate = formData.plannedStartDate !== undefined ? formData.plannedStartDate : requirement.plannedStartDate
      dataToSave.plannedEndDate = formData.plannedEndDate !== undefined ? formData.plannedEndDate : requirement.plannedEndDate
      dataToSave.estimatedHours = formData.estimatedHours !== undefined ? formData.estimatedHours : requirement.estimatedHours
      
      // 负责人
      const assignee = formData.assignee !== undefined ? formData.assignee : requirement.assignee
      dataToSave.devOwnerId = assignee ? (assignee as { id: string }).id : undefined
    } else {
      // 编辑模式：只传递修改过的字段
      Object.assign(dataToSave, formData)
      if (formData.assignee !== undefined) {
        dataToSave.devOwnerId = formData.assignee ? (formData.assignee as { id: string }).id : null
        delete dataToSave.assignee
      }
    }

    setSaving(true)
    try {
      if (isCreateMode) {
        await requirementDetailApi.create(dataToSave as any)
        message.success("创建成功")
        onSuccess?.()
        onClose()
      } else if (requirementId) {
        await requirementDetailApi.update(requirementId, dataToSave as any)
        message.success("保存成功")
        setHasChanges(false)
        loadRequirement()
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
    if (!commentText.trim() || !requirementId) return

    try {
      const newComment = await requirementDetailApi.addComment(
        requirementId,
        commentText.trim()
      )
      setRequirement((prev) =>
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

  // 添加子工作项
  const handleAddNewWorkItem = () => {
    setNewWorkItem({ isEditing: true, title: "", priority: "P2", devOwnerId: null })
    setTimeout(() => newWorkItemInputRef.current?.focus(), 50)
  }

  const handleSaveNewWorkItem = async () => {
    if (!newWorkItem?.title.trim() || !requirementId) {
      setNewWorkItem(null)
      return
    }

    try {
      const newChild = await requirementDetailApi.addChild(requirementId, {
        title: newWorkItem.title.trim(),
        priority: newWorkItem.priority,
        devOwnerId: newWorkItem.devOwnerId || undefined,
      })
      setRequirement((prev) =>
        prev
          ? {
              ...prev,
              children: [...prev.children, newChild],
              childCount: prev.childCount + 1,
            }
          : prev
      )
      setNewWorkItem(null)
      message.success("子任务已创建")
    } catch (error: any) {
      message.error(error.message || "创建子任务失败")
    }
  }

  const handleNewWorkItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSaveNewWorkItem()
    } else if (e.key === "Escape") {
      setNewWorkItem(null)
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

  // 当前显示的值（优先使用编辑中的值）
  const currentPriority = (formData.priority as string) || requirement?.priority || "P2"
  const currentStatus = (formData.status as string) || requirement?.status || "NOT_STARTED"
  const currentAssignee = formData.assignee !== undefined 
    ? formData.assignee 
    : requirement?.assignee
  const currentReqType = formData.requirementType !== undefined
    ? formData.requirementType
    : requirement?.requirementType

  // 是否显示加载状态（没有数据或正在加载）
  const showLoading = loading || !requirement

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
          <Skeleton active paragraph={{ rows: 15 }} />
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
              {/* 标题（可编辑） */}
              <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
                {editingTitle ? (
                  <Input
                    ref={titleInputRef}
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    placeholder="输入需求标题..."
                    variant="borderless"
                    style={{ fontSize: 18, fontWeight: 600, padding: "4px 0" }}
                  />
                ) : (
                  <div
                    style={{ cursor: "pointer", padding: "4px 0", borderRadius: 4 }}
                    onClick={startEditingTitle}
                  >
                    <Title
                      level={4}
                      style={{
                        margin: 0,
                        color:
                          formData.title || titleValue || requirement.title
                            ? "#1e293b"
                            : "#bfbfbf",
                      }}
                    >
                      {(formData.title as string) ||
                        titleValue ||
                        requirement.title ||
                        "点击输入需求标题..."}
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
                        {requirement.id.slice(-8)}
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
              {/* 主要信息区域 - 现代化卡片设计 */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f0f0f0",
                  // background: "linear-gradient(to right, #f8fafc, #f1f5f9)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  {/* 负责人 - 头像点击选择 */}
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

                  {/* 分隔点 */}
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />

                  {/* 状态 - 胶囊按钮 */}
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

                  {/* 分隔点 */}
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />

                  {/* 优先级 - 彩色标签 */}
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

                  {/* 分隔点 */}
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />

                  {/* 预估工时 - 紧凑卡片 */}
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
                        value={(formData.estimatedHours as number) ?? requirement.estimatedHours}
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

                  {/* 分隔点 */}
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />

                  {/* 时间范围 - 合并显示 */}
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
                          (formData.plannedStartDate as string) ?? requirement.plannedStartDate
                            ? dayjs((formData.plannedStartDate as string) ?? requirement.plannedStartDate)
                            : null,
                          (formData.plannedEndDate as string) ?? requirement.plannedEndDate
                            ? dayjs((formData.plannedEndDate as string) ?? requirement.plannedEndDate)
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
                            value={(formData.description as string) ?? requirement.description ?? ""}
                            onChange={(e) => updateField("description", e.target.value)}
                            placeholder="点击此处添加需求描述...&#10;&#10;可以包含：&#10;• 需求背景&#10;• 功能说明&#10;• 验收标准&#10;• 其他备注"
                            autoSize={{ minRows: 10 }}
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
                      key: "workitems",
                      label: (
                        <span>
                          <ApartmentOutlined /> 工作项 ({requirement.childCount})
                        </span>
                      ),
                      children: (
                        <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                          <div
                            style={{
                              marginBottom: 16,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Space>
                              <Text type="secondary">
                                已完成 {requirement.completedChildCount} /{" "}
                                {requirement.childCount}
                              </Text>
                              <Progress
                                percent={requirement.progress}
                                size="small"
                                style={{ width: 100 }}
                                strokeColor={{ "0%": "#22d3ee", "100%": "#7c7cff" }}
                              />
                            </Space>
                            <Button
                              type="primary"
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={handleAddNewWorkItem}
                              disabled={isCreateMode}
                            >
                              添加子任务
                            </Button>
                          </div>

                          {/* 工作项列表 */}
                          <div
                            style={{
                              border: "1px solid #f0f0f0",
                              overflow: "hidden",
                            }}
                          >
                            {/* 新建工作项输入行 */}
                            {newWorkItem?.isEditing && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "6px 16px",
                                  borderBottom:
                                    requirement.children.length > 0
                                      ? "1px solid #f0f0f0"
                                      : "none",
                                  background: "#fff",
                                }}
                              >
                                <PlusOutlined
                                  style={{ color: "#7c7cff", marginRight: 8 }}
                                />
                                <Input
                                  ref={newWorkItemInputRef}
                                  value={newWorkItem.title}
                                  onChange={(e) =>
                                    setNewWorkItem({
                                      ...newWorkItem,
                                      title: e.target.value,
                                    })
                                  }
                                  onBlur={(e) => {
                                    const relatedTarget = e.relatedTarget as HTMLElement
                                    if (relatedTarget?.closest(".ant-select")) {
                                      return
                                    }
                                    handleSaveNewWorkItem()
                                  }}
                                  onKeyDown={handleNewWorkItemKeyDown}
                                  placeholder="输入任务标题，回车保存，ESC取消"
                                  variant="borderless"
                                  style={{ flex: 1 }}
                                />
                                <Space size={8}>
                                  <Select
                                    size="small"
                                    value={newWorkItem.priority}
                                    onChange={(value) =>
                                      setNewWorkItem({ ...newWorkItem, priority: value })
                                    }
                                    style={{ width: 80 }}
                                    options={priorityOptions.map((p) => ({
                                      value: p.value,
                                      label: p.value,
                                    }))}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  />
                                  <Select
                                    size="small"
                                    placeholder="负责人"
                                    value={newWorkItem.devOwnerId}
                                    onChange={(value) =>
                                      setNewWorkItem({ ...newWorkItem, devOwnerId: value })
                                    }
                                    style={{ width: 90 }}
                                    allowClear
                                    options={userOptions}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  />
                                </Space>
                              </div>
                            )}

                            {/* 已有工作项列表 */}
                            {requirement.children.length > 0 ? (
                              requirement.children.map((item, index) => {
                                const isCompleted = item.status === "COMPLETED"
                                const bgColor = isCompleted ? "#f9fef9" : "#fff"
                                const hoverBgColor = isCompleted ? "#f0faf0" : "#fafafa"

                                return (
                                  <div
                                    key={item.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      padding: "10px 16px",
                                      borderBottom:
                                        index < requirement.children.length - 1
                                          ? "1px solid #f0f0f0"
                                          : "none",
                                      background: bgColor,
                                      transition: "background 0.2s",
                                      cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background = hoverBgColor)
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background = bgColor)
                                    }
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <Text
                                        ellipsis
                                        style={{
                                          color: isCompleted ? "#8c8c8c" : "#1e293b",
                                          textDecoration: isCompleted
                                            ? "line-through"
                                            : "none",
                                        }}
                                      >
                                        {item.title}
                                      </Text>
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        flexShrink: 0,
                                        marginLeft: 16,
                                      }}
                                    >
                                      {renderWorkItemStatus(item.status)}
                                      <Tag
                                        color={getPriorityColor(item.priority)}
                                        style={{ margin: 0 }}
                                      >
                                        {item.priority}
                                      </Tag>
                                      <div style={{ width: 70, textAlign: "center" }}>
                                        {item.assignee ? (
                                          <Tooltip title={item.assignee.name}>
                                            <Avatar
                                              size="small"
                                              style={{ background: "#a5b4fc" }}
                                            >
                                              {item.assignee.name[0]}
                                            </Avatar>
                                          </Tooltip>
                                        ) : (
                                          <Text
                                            type="secondary"
                                            style={{ fontSize: 12 }}
                                          >
                                            未分配
                                          </Text>
                                        )}
                                      </div>
                                      <Space size={0}>
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<EditOutlined />}
                                          style={{ color: "#8c8c8c" }}
                                        />
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<DeleteOutlined />}
                                          style={{ color: "#8c8c8c" }}
                                          danger
                                        />
                                      </Space>
                                    </div>
                                  </div>
                                )
                              })
                            ) : !newWorkItem?.isEditing ? (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="暂无工作项"
                                style={{ padding: "40px 0" }}
                              />
                            ) : null}
                          </div>
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
                                (当前需求依赖的工作项)
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
                            {requirement.dependencies.length > 0 ? (
                              <List
                                size="small"
                                dataSource={requirement.dependencies}
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
                                (依赖当前需求的工作项)
                              </Text>
                            </div>
                            {requirement.dependents.length > 0 ? (
                              <List
                                size="small"
                                dataSource={requirement.dependents}
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
                          <CommentOutlined /> 评论 ({requirement.comments.length})
                        </span>
                      ),
                      children: (
                        <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                          <List
                            dataSource={requirement.comments}
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
                    // 流转 - 仅编辑模式显示
                    ...(!isCreateMode ? [{
                      key: "flow",
                      label: (
                        <span>
                          <SyncOutlined /> 流转
                        </span>
                      ),
                      children: (
                        <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                          {/* 过滤负责人变更记录 */}
                          {requirement.activityLogs.filter(
                            (log) => log.action === "指派负责人"
                          ).length > 0 ? (
                            <Timeline
                              items={requirement.activityLogs
                                .filter((log) => log.action === "指派负责人")
                                .map((log) => ({
                                  color: "blue",
                                  children: (
                                    <div>
                                      <Space>
                                        <Avatar
                                          size="small"
                                          style={{ background: "#a5b4fc" }}
                                        >
                                          {log.user.name[0]}
                                        </Avatar>
                                        <Text strong>{log.user.name}</Text>
                                        <Text>将负责人</Text>
                                        {log.oldValue && (
                                          <>
                                            <Text>从</Text>
                                            <Text type="secondary" delete>
                                              {log.oldValue}
                                            </Text>
                                          </>
                                        )}
                                        <Text>变更为</Text>
                                        <Text style={{ color: "#52c41a" }}>
                                          {log.newValue || "未分配"}
                                        </Text>
                                      </Space>
                                      <div style={{ marginTop: 4 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                          {dayjs(log.createdAt).format(
                                            "YYYY-MM-DD HH:mm"
                                          )}
                                        </Text>
                                      </div>
                                    </div>
                                  ),
                                }))}
                            />
                          ) : (
                            <Empty description="暂无流转记录" />
                          )}
                        </div>
                      ),
                    }] : []),
                    // 操作记录 - 仅编辑模式显示
                    ...(!isCreateMode ? [{
                      key: "activity",
                      label: (
                        <span>
                          <HistoryOutlined /> 操作记录
                        </span>
                      ),
                      children: (
                        <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                          <Timeline
                            items={requirement.activityLogs.map((log) => ({
                              color: "blue",
                              children: (
                                <div>
                                  <Space>
                                    <Avatar
                                      size="small"
                                      style={{ background: "#a5b4fc" }}
                                    >
                                      {log.user.name[0]}
                                    </Avatar>
                                    <Text strong>{log.user.name}</Text>
                                    <Text>{log.action}</Text>
                                    {log.oldValue && log.newValue && (
                                      <>
                                        <Text type="secondary" delete>
                                          {log.oldValue}
                                        </Text>
                                        <Text>→</Text>
                                        <Text style={{ color: "#52c41a" }}>
                                          {log.newValue}
                                        </Text>
                                      </>
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
                padding: 20,
                overflow: "auto",
                background: "#fafafa",
                flexShrink: 0,
              }}
            >
              {/* 进度 - 放在最前面 */}
              <div style={{ marginBottom: 20 }}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                  进度
                </Text>
                <Progress
                  percent={requirement.progress}
                  strokeColor={{ "0%": "#22d3ee", "100%": "#7c7cff" }}
                  format={(percent) => (
                    <span style={{ fontSize: 12 }}>
                      {percent}% ({requirement.completedChildCount}/{requirement.childCount})
                    </span>
                  )}
                />
              </div>

              <Divider style={{ margin: "16px 0" }} />

              {/* 需求类型 */}
              {/* 需求类型 */}
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  需求类型
                </Text>
                <Select
                  value={currentReqType}
                  onChange={(value) => updateField("requirementType", value)}
                  style={{ width: "100%" }}
                  size="small"
                  placeholder="选择类型"
                  allowClear
                  optionRender={(option) => {
                    const type = requirementTypeOptions.find(t => t.value === option.value)
                    return <Tag color={type?.color} style={{ margin: 0 }}>{option.label}</Tag>
                  }}
                  labelRender={(props) => {
                    const type = requirementTypeOptions.find(t => t.value === props.value)
                    return type ? <Tag color={type.color} style={{ margin: 0 }}>{type.label}</Tag> : null
                  }}
                  options={requirementTypeOptions.map((t) => ({ value: t.value, label: t.label }))}
                />
              </div>

              <Divider style={{ margin: "16px 0" }} />

              {/* 产品信息 */}
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  所属产品
                </Text>
                <Select
                  value={(formData.productId as string) ?? requirement.productId}
                  onChange={(value) => {
                    updateField("productId", value)
                    // 切换产品时清空模块和版本选择
                    if (value !== currentProductId) {
                      updateField("moduleId", null)
                      updateField("versionId", null)
                    }
                  }}
                  style={{ width: "100%" }}
                  size="small"
                  placeholder="选择产品"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={productOptions}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  所属模块
                </Text>
                <Select
                  value={(formData.moduleId as string) ?? requirement.moduleId}
                  onChange={(value) => updateField("moduleId", value)}
                  style={{ width: "100%" }}
                  size="small"
                  placeholder={currentProductId ? "选择模块" : "请先选择产品"}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={moduleOptions}
                  loading={loadingModules}
                  disabled={!currentProductId}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  所属版本
                </Text>
                <Select
                  value={(formData.versionId as string) ?? requirement.versionId}
                  onChange={(value) => updateField("versionId", value)}
                  style={{ width: "100%" }}
                  size="small"
                  placeholder={currentProductId ? "选择版本" : "请先选择产品"}
                  allowClear
                  options={versions}
                  disabled={!currentProductId}
                />
              </div>

              <Divider style={{ margin: "16px 0" }} />

              {/* 项目信息 */}
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  所属项目
                </Text>
                <Select
                  value={(formData.projectId as string) ?? requirement.projectId}
                  onChange={(value) => {
                    updateField("projectId", value)
                    // 切换项目时清空迭代选择
                    if (value !== currentProjectId) {
                      updateField("sprintId", null)
                    }
                  }}
                  style={{ width: "100%" }}
                  size="small"
                  placeholder="选择项目"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={projectOptions}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  所属迭代
                </Text>
                <Select
                  value={(formData.sprintId as string) ?? requirement.sprintId}
                  onChange={(value) => updateField("sprintId", value)}
                  style={{ width: "100%" }}
                  size="small"
                  placeholder={currentProjectId ? "选择迭代" : "请先选择项目"}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={sprintOptions}
                  loading={loadingSprints}
                  disabled={!currentProjectId}
                />
              </div>

              <Divider style={{ margin: "16px 0" }} />

              {/* 发布信息 */}
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  所属发布
                </Text>
                <Select
                  style={{ width: "100%" }}
                  size="small"
                  placeholder="选择发布"
                  allowClear
                  options={[]}
                  disabled
                />
                <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                  发布管理中关联
                </Text>
              </div>

              {/* 创建信息 - 仅编辑模式显示 */}
              {!isCreateMode && (
                <>
                  <Divider style={{ margin: "16px 0" }} />

                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                      创建人
                    </Text>
                    <Space>
                      <Avatar size="small" style={{ background: "#a5b4fc" }}>
                        {requirement.creator.name[0]}
                      </Avatar>
                      <Text>{requirement.creator.name}</Text>
                    </Space>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                      创建时间
                    </Text>
                    <Text type="secondary">
                      {dayjs(requirement.createdAt).format("YYYY-MM-DD HH:mm")}
                    </Text>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                      更新时间
                    </Text>
                    <Text type="secondary">
                      {dayjs(requirement.updatedAt).format("YYYY-MM-DD HH:mm")}
                    </Text>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default RequirementDetailModal
