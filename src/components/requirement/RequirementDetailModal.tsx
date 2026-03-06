"use client"

import { useState, useEffect, useCallback } from "react"
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
} from "antd"
import {
  UserOutlined,
  CalendarOutlined,
  EditOutlined,
  SaveOutlined,
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
} from "@ant-design/icons"

const { Text, Title, Paragraph } = Typography
const { TextArea } = Input

// ==================== 类型定义 ====================

export interface RequirementDetail {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  requirementType: string | null
  
  // 关联信息
  productId: string | null
  productName: string | null
  projectId: string | null
  projectName: string | null
  sprintId: string | null
  sprintName: string | null
  moduleId: string | null
  moduleName: string | null
  versionId: string | null
  versionName: string | null
  
  // 人员
  creator: { id: string; name: string; avatar: string | null }
  assignee: { id: string; name: string; avatar: string | null } | null
  updater?: { id: string; name: string; avatar: string | null } | null
  
  // 进度
  progress: number
  childCount: number
  completedChildCount: number
  
  // 时间
  createdAt: string
  updatedAt: string
  
  // 子任务
  children?: WorkItem[]
  
  // 依赖
  dependencies?: Dependency[]
  dependents?: Dependency[]
  
  // 评论
  comments?: Comment[]
  
  // 操作记录
  activityLogs?: ActivityLog[]
}

interface WorkItem {
  id: string
  title: string
  type: string
  status: string
  priority: string
  assignee: { id: string; name: string; avatar: string | null } | null
}

interface Dependency {
  id: string
  workItem: { id: string; title: string; status: string }
  type: string
}

interface Comment {
  id: string
  content: string
  user: { id: string; name: string; avatar: string | null }
  createdAt: string
}

interface ActivityLog {
  id: string
  action: string
  oldValue: string | null
  newValue: string | null
  user: { id: string; name: string; avatar: string | null }
  createdAt: string
}

interface SelectOption {
  value: string
  label: string
}

export interface RequirementDetailModalProps {
  open: boolean
  requirementId: string | null  // null 表示新建模式
  onClose: () => void
  onSave?: (data: Partial<RequirementDetail>) => Promise<void>
  onCreate?: (data: Partial<RequirementDetail>) => Promise<void>  // 新建回调
  // 选项数据
  products?: SelectOption[]
  projects?: SelectOption[]
  sprints?: SelectOption[]
  versions?: SelectOption[]
  users?: SelectOption[]
  // 默认值（新建时使用）
  defaultProductId?: string
  defaultProjectId?: string
}

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
  return priorityOptions.find(p => p.value === priority)?.color || "default"
}

const getStatusInfo = (status: string) => {
  return statusOptions.find(s => s.value === status) || statusOptions[0]
}

const getRequirementTypeInfo = (type: string | null) => {
  return type ? requirementTypeOptions.find(t => t.value === type) : null
}

// ==================== 组件 ====================

export function RequirementDetailModal({
  open,
  requirementId,
  onClose,
  onSave,
  onCreate,
  products = [],
  projects = [],
  sprints = [],
  versions = [],
  users = [],
  defaultProductId,
  defaultProjectId,
}: RequirementDetailModalProps) {
  // 是否为新建模式
  const isCreateMode = !requirementId

  // 状态
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState("description")
  const [commentText, setCommentText] = useState("")
  
  // 数据
  const [requirement, setRequirement] = useState<RequirementDetail | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState("")
  
  // 编辑状态
  const [formData, setFormData] = useState<Partial<RequirementDetail>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // 初始化新建模式的默认数据
  const initCreateMode = useCallback(() => {
    const newRequirement: RequirementDetail = {
      id: "",
      title: "",
      description: "",
      priority: "P2",
      status: "NOT_STARTED",
      requirementType: null,
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
      progress: 0,
      childCount: 0,
      completedChildCount: 0,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
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
    setEditingTitle(true)  // 新建时自动进入标题编辑模式
  }, [defaultProductId, defaultProjectId])

  // 加载需求详情
  const loadRequirement = useCallback(async () => {
    if (!requirementId) {
      initCreateMode()
      return
    }
    
    setLoading(true)
    try {
      // TODO: 调用 API 获取需求详情
      // 模拟数据
      const mockData: RequirementDetail = {
        id: requirementId,
        title: "用户登录功能优化",
        description: "## 需求背景\n\n当前用户登录流程体验不佳，需要进行优化。\n\n## 需求目标\n\n1. 支持手机号验证码登录\n2. 支持第三方登录（微信、钉钉）\n3. 优化登录页面 UI\n\n## 验收标准\n\n- 登录成功率 > 99%\n- 页面加载时间 < 2s",
        priority: "P1",
        status: "IN_PROGRESS",
        requirementType: "FEATURE",
        productId: "product-1",
        productName: "SprintHub",
        projectId: "project-1",
        projectName: "2024 Q1 迭代",
        sprintId: "sprint-1",
        sprintName: "Sprint 1",
        moduleId: "module-1",
        moduleName: "用户中心",
        versionId: "version-1",
        versionName: "v1.2.0",
        creator: { id: "user-1", name: "张三", avatar: null },
        assignee: { id: "user-2", name: "李四", avatar: null },
        updater: { id: "user-2", name: "李四", avatar: null },
        progress: 60,
        childCount: 5,
        completedChildCount: 3,
        createdAt: "2024-01-15 10:30:00",
        updatedAt: "2024-01-20 14:20:00",
        children: [
          { id: "task-1", title: "设计登录页面 UI", type: "TASK", status: "COMPLETED", priority: "P1", assignee: { id: "user-3", name: "王五", avatar: null } },
          { id: "task-2", title: "实现手机号登录接口", type: "TASK", status: "COMPLETED", priority: "P1", assignee: { id: "user-2", name: "李四", avatar: null } },
          { id: "task-3", title: "实现验证码发送功能", type: "TASK", status: "COMPLETED", priority: "P2", assignee: { id: "user-2", name: "李四", avatar: null } },
          { id: "task-4", title: "对接微信登录", type: "TASK", status: "IN_PROGRESS", priority: "P2", assignee: { id: "user-2", name: "李四", avatar: null } },
          { id: "task-5", title: "对接钉钉登录", type: "TASK", status: "NOT_STARTED", priority: "P3", assignee: null },
        ],
        dependencies: [
          { id: "dep-1", workItem: { id: "req-2", title: "用户中心基础架构", status: "COMPLETED" }, type: "FF" },
        ],
        dependents: [
          { id: "dep-2", workItem: { id: "req-3", title: "单点登录集成", status: "NOT_STARTED" }, type: "FF" },
        ],
        comments: [
          { id: "comment-1", content: "UI 设计稿已确认，可以开始开发了", user: { id: "user-3", name: "王五", avatar: null }, createdAt: "2024-01-16 09:00:00" },
          { id: "comment-2", content: "手机号登录接口已完成，请测试同学验证", user: { id: "user-2", name: "李四", avatar: null }, createdAt: "2024-01-18 15:30:00" },
        ],
        activityLogs: [
          { id: "log-1", action: "创建需求", oldValue: null, newValue: null, user: { id: "user-1", name: "张三", avatar: null }, createdAt: "2024-01-15 10:30:00" },
          { id: "log-2", action: "修改状态", oldValue: "未开始", newValue: "进行中", user: { id: "user-2", name: "李四", avatar: null }, createdAt: "2024-01-16 09:30:00" },
          { id: "log-3", action: "指派负责人", oldValue: null, newValue: "李四", user: { id: "user-1", name: "张三", avatar: null }, createdAt: "2024-01-16 09:35:00" },
        ],
      }
      
      setRequirement(mockData)
      setTitleValue(mockData.title)
      setFormData({})
      setHasChanges(false)
    } catch (error) {
      console.error("加载需求失败:", error)
      message.error("加载需求失败")
    } finally {
      setLoading(false)
    }
  }, [requirementId, initCreateMode])

  useEffect(() => {
    if (open) {
      if (requirementId) {
        loadRequirement()
      } else {
        initCreateMode()
      }
      setActiveTab("description")
    }
  }, [open, requirementId, loadRequirement, initCreateMode])

  // 更新表单数据
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // 保存标题
  const handleSaveTitle = async () => {
    if (!titleValue.trim()) {
      message.error("标题不能为空")
      return
    }
    updateField("title", titleValue)
    setEditingTitle(false)
  }

  // 复制 ID
  const handleCopyId = () => {
    if (requirement && requirement.id) {
      navigator.clipboard.writeText(requirement.id)
      message.success("ID 已复制")
    }
  }

  // 发送评论
  const handleSendComment = () => {
    if (!commentText.trim()) return
    message.success("评论已发送")
    setCommentText("")
    // TODO: 调用 API 发送评论
  }

  // 保存或创建
  const handleSave = async () => {
    // 新建模式需要标题
    if (isCreateMode && !titleValue.trim()) {
      message.error("请输入需求标题")
      setEditingTitle(true)
      return
    }

    const dataToSave = { ...formData, title: titleValue }
    
    setSaving(true)
    try {
      if (isCreateMode) {
        // 新建模式
        if (onCreate) {
          await onCreate(dataToSave)
          message.success("创建成功")
          onClose()
        }
      } else {
        // 编辑模式
        if (onSave) {
          await onSave(dataToSave)
          message.success("保存成功")
          setHasChanges(false)
          loadRequirement()
        }
      }
    } catch (error) {
      message.error(isCreateMode ? "创建失败" : "保存失败")
    } finally {
      setSaving(false)
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

  // 渲染侧边栏字段
  const renderSidebarField = (
    label: string,
    value: React.ReactNode,
    icon?: React.ReactNode,
    editable?: boolean,
    onEdit?: () => void
  ) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        {icon && <span style={{ marginRight: 6, color: "#8c8c8c" }}>{icon}</span>}
        <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {value}
        {editable && (
          <Button type="text" size="small" icon={<EditOutlined />} onClick={onEdit} />
        )}
      </div>
    </div>
  )

  // 渲染工作项状态
  const renderWorkItemStatus = (status: string) => {
    const info = getStatusInfo(status)
    return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>
  }

  if (!requirement && !loading) {
    return null
  }

  const modalWidth = isFullscreen ? "100vw" : 1200
  const modalStyle = isFullscreen ? { top: 0, padding: 0, maxWidth: "100vw" } : {}

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
      {loading ? (
        <div style={{ padding: 24 }}>
          <Skeleton active paragraph={{ rows: 15 }} />
        </div>
      ) : requirement ? (
        <div style={{ display: "flex", height: "100%" }}>
          {/* 主内容区域 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* 顶部工具栏 */}
            <div style={{ 
              padding: "12px 20px", 
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fafafa",
            }}>
              <Space>
                {isCreateMode ? (
                  <Text strong style={{ color: "#7c7cff" }}>新建需求</Text>
                ) : (
                  <>
                    <Tooltip title="复制 ID">
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<CopyOutlined />}
                        onClick={handleCopyId}
                      >
                        {requirement.id.slice(-8)}
                      </Button>
                    </Tooltip>
                    <Tag color={getPriorityColor(formData.priority || requirement.priority)}>
                      {formData.priority || requirement.priority}
                    </Tag>
                    {renderWorkItemStatus(formData.status || requirement.status)}
                    {(formData.requirementType || requirement.requirementType) && (
                      <Tag color={getRequirementTypeInfo(formData.requirementType || requirement.requirementType)?.color}>
                        {getRequirementTypeInfo(formData.requirementType || requirement.requirementType)?.label}
                      </Tag>
                    )}
                  </>
                )}
              </Space>
              <Space>
                {(isCreateMode || hasChanges) && (
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={handleSave}
                  >
                    {isCreateMode ? "创建" : "保存"}
                  </Button>
                )}
                <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  />
                </Tooltip>
                <Tooltip title="关闭">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CloseOutlined />}
                    onClick={handleClose}
                  />
                </Tooltip>
              </Space>
            </div>

            {/* 标题区域 */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
              {editingTitle ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <Input
                    value={titleValue}
                    onChange={e => setTitleValue(e.target.value)}
                    onPressEnter={handleSaveTitle}
                    autoFocus
                    style={{ fontSize: 18, fontWeight: 600 }}
                  />
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveTitle} />
                  <Button icon={<CloseOutlined />} onClick={() => {
                    setTitleValue(requirement.title)
                    setEditingTitle(false)
                  }} />
                </div>
              ) : (
                <div 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    cursor: "pointer",
                    padding: "4px 8px",
                    margin: "-4px -8px",
                    borderRadius: 6,
                    transition: "background 0.2s",
                  }}
                  onClick={() => setEditingTitle(true)}
                  onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Title level={4} style={{ margin: 0, flex: 1 }}>
                    {formData.title || requirement.title}
                  </Title>
                  <EditOutlined style={{ color: "#bfbfbf", marginLeft: 8 }} />
                </div>
              )}
            </div>

            {/* Tab 内容区域 */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
                tabBarStyle={{ padding: "0 20px", marginBottom: 0 }}
                items={[
                  {
                    key: "description",
                    label: <span><FileTextOutlined /> 描述</span>,
                    children: (
                      <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                        <Paragraph
                          editable={{
                            onChange: (value) => updateField("description", value),
                            text: formData.description ?? requirement.description ?? "",
                          }}
                          style={{ 
                            whiteSpace: "pre-wrap", 
                            minHeight: 200,
                            padding: 16,
                            background: "#fafafa",
                            borderRadius: 8,
                          }}
                        >
                          {formData.description ?? requirement.description ?? "暂无描述，点击编辑"}
                        </Paragraph>
                      </div>
                    ),
                  },
                  {
                    key: "workitems",
                    label: <span><ApartmentOutlined /> 工作项 ({requirement.childCount})</span>,
                    children: (
                      <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Space>
                            <Text type="secondary">
                              已完成 {requirement.completedChildCount} / {requirement.childCount}
                            </Text>
                            <Progress 
                              percent={requirement.progress} 
                              size="small" 
                              style={{ width: 100 }}
                              strokeColor={{ '0%': '#22d3ee', '100%': '#7c7cff' }}
                            />
                          </Space>
                          <Button type="primary" size="small" icon={<PlusOutlined />}>
                            添加子任务
                          </Button>
                        </div>
                        
                        {/* 工作项表格样式列表 */}
                        <div style={{ 
                          border: "1px solid #f0f0f0", 
                          borderRadius: 8,
                          overflow: "hidden",
                        }}>
                          {requirement.children && requirement.children.length > 0 ? (
                            requirement.children.map((item, index) => (
                              <div
                                key={item.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "10px 16px",
                                  borderBottom: index < requirement.children!.length - 1 ? "1px solid #f0f0f0" : "none",
                                  background: "#fff",
                                  transition: "background 0.2s",
                                  cursor: "pointer",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                              >
                                {/* 左侧：标题 */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Text 
                                    ellipsis 
                                    style={{ color: "#1677ff" }}
                                  >
                                    {item.title}
                                  </Text>
                                </div>
                                
                                {/* 右侧：状态、优先级、负责人、操作 */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, marginLeft: 16 }}>
                                  {renderWorkItemStatus(item.status)}
                                  <Tag color={getPriorityColor(item.priority)} style={{ margin: 0 }}>
                                    {item.priority}
                                  </Tag>
                                  <div style={{ width: 70, textAlign: "center" }}>
                                    {item.assignee ? (
                                      <Tooltip title={item.assignee.name}>
                                        <Avatar size="small" style={{ background: "#a5b4fc" }}>
                                          {item.assignee.name[0]}
                                        </Avatar>
                                      </Tooltip>
                                    ) : (
                                      <Text type="secondary" style={{ fontSize: 12 }}>未分配</Text>
                                    )}
                                  </div>
                                  <Space size={0}>
                                    <Button type="text" size="small" icon={<EditOutlined />} style={{ color: "#8c8c8c" }} />
                                    <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: "#8c8c8c" }} danger />
                                  </Space>
                                </div>
                              </div>
                            ))
                          ) : (
                            <Empty 
                              image={Empty.PRESENTED_IMAGE_SIMPLE} 
                              description="暂无工作项" 
                              style={{ padding: "40px 0" }}
                            />
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "dependencies",
                    label: <span><BranchesOutlined /> 依赖关系</span>,
                    children: (
                      <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                            <Text strong>前置依赖</Text>
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                              (当前需求依赖的工作项)
                            </Text>
                            <Button type="link" size="small" icon={<PlusOutlined />} style={{ marginLeft: "auto" }}>
                              添加
                            </Button>
                          </div>
                          {requirement.dependencies && requirement.dependencies.length > 0 ? (
                            <List
                              size="small"
                              dataSource={requirement.dependencies}
                              renderItem={dep => (
                                <List.Item
                                  style={{ padding: "8px 12px", background: "#f6ffed", borderRadius: 6, marginBottom: 8 }}
                                  actions={[<Button key="del" type="text" size="small" danger icon={<DeleteOutlined />} />]}
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
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无前置依赖" />
                          )}
                        </div>
                        
                        <Divider />
                        
                        <div>
                          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                            <Text strong>后置依赖</Text>
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                              (依赖当前需求的工作项)
                            </Text>
                          </div>
                          {requirement.dependents && requirement.dependents.length > 0 ? (
                            <List
                              size="small"
                              dataSource={requirement.dependents}
                              renderItem={dep => (
                                <List.Item style={{ padding: "8px 12px", background: "#fff7e6", borderRadius: 6, marginBottom: 8 }}>
                                  <Space>
                                    <LinkOutlined style={{ color: "#fa8c16" }} />
                                    <Text>{dep.workItem.title}</Text>
                                    {renderWorkItemStatus(dep.workItem.status)}
                                  </Space>
                                </List.Item>
                              )}
                            />
                          ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无后置依赖" />
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "comments",
                    label: <span><CommentOutlined /> 评论 ({requirement.comments?.length || 0})</span>,
                    children: (
                      <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                        <List
                          dataSource={requirement.comments || []}
                          renderItem={comment => (
                            <List.Item style={{ padding: "12px 0", alignItems: "flex-start" }}>
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
                                      {comment.createdAt}
                                    </Text>
                                  </Space>
                                }
                                description={
                                  <div style={{ 
                                    marginTop: 8, 
                                    padding: 12, 
                                    background: "#f5f5f5", 
                                    borderRadius: 8,
                                    whiteSpace: "pre-wrap",
                                  }}>
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
                  {
                    key: "flow",
                    label: <span><SyncOutlined /> 流转</span>,
                    children: (
                      <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                        <Empty description="流转功能开发中..." />
                      </div>
                    ),
                  },
                  {
                    key: "activity",
                    label: <span><HistoryOutlined /> 操作记录</span>,
                    children: (
                      <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
                        <Timeline
                          items={requirement.activityLogs?.map(log => ({
                            color: "blue",
                            children: (
                              <div>
                                <Space>
                                  <Avatar size="small" style={{ background: "#a5b4fc" }}>
                                    {log.user.name[0]}
                                  </Avatar>
                                  <Text strong>{log.user.name}</Text>
                                  <Text>{log.action}</Text>
                                  {log.oldValue && log.newValue && (
                                    <>
                                      <Text type="secondary" delete>{log.oldValue}</Text>
                                      <Text>→</Text>
                                      <Text style={{ color: "#52c41a" }}>{log.newValue}</Text>
                                    </>
                                  )}
                                </Space>
                                <div style={{ marginTop: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>{log.createdAt}</Text>
                                </div>
                              </div>
                            ),
                          })) || []}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </div>

            {/* 评论输入区域 */}
            <div style={{ 
              padding: "12px 20px", 
              borderTop: "1px solid #f0f0f0",
              background: "#fafafa",
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <Avatar style={{ background: "#7c7cff", flexShrink: 0 }}>我</Avatar>
                <TextArea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="输入评论内容..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{ flex: 1 }}
                  onPressEnter={e => {
                    if (e.ctrlKey || e.metaKey) {
                      handleSendComment()
                    }
                  }}
                />
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={handleSendComment}
                  disabled={!commentText.trim()}
                >
                  发送
                </Button>
              </div>
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 44, marginTop: 4, display: "block" }}>
                Ctrl + Enter 快捷发送
              </Text>
            </div>
          </div>

          {/* 右侧边栏 */}
          <div style={{ 
            width: 280, 
            borderLeft: "1px solid #f0f0f0", 
            padding: 20,
            overflow: "auto",
            background: "#fafafa",
          }}>
            {/* 进度 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>进度</Text>
              </div>
              <Progress 
                percent={requirement.progress} 
                strokeColor={{ '0%': '#22d3ee', '100%': '#7c7cff' }}
                format={percent => (
                  <span style={{ fontSize: 12 }}>
                    {percent}% ({requirement.completedChildCount}/{requirement.childCount})
                  </span>
                )}
              />
            </div>

            <Divider style={{ margin: "16px 0" }} />

            {/* 负责人 */}
            {renderSidebarField(
              "负责人",
              <Select
                value={formData.assignee?.id || requirement.assignee?.id}
                onChange={(value) => updateField("assignee", { id: value })}
                style={{ width: "100%" }}
                placeholder="选择负责人"
                allowClear
                options={users}
                suffixIcon={<UserOutlined />}
              />,
              <UserOutlined />
            )}

            {/* 状态 */}
            {renderSidebarField(
              "状态",
              <Select
                value={formData.status || requirement.status}
                onChange={(value) => updateField("status", value)}
                style={{ width: "100%" }}
                options={statusOptions.map(s => ({ value: s.value, label: s.label }))}
              />
            )}

            {/* 优先级 */}
            {renderSidebarField(
              "优先级",
              <Select
                value={formData.priority || requirement.priority}
                onChange={(value) => updateField("priority", value)}
                style={{ width: "100%" }}
                options={priorityOptions.map(p => ({ value: p.value, label: p.label }))}
              />
            )}

            {/* 需求类型 */}
            {renderSidebarField(
              "需求类型",
              <Select
                value={formData.requirementType || requirement.requirementType}
                onChange={(value) => updateField("requirementType", value)}
                style={{ width: "100%" }}
                placeholder="选择类型"
                allowClear
                options={requirementTypeOptions.map(t => ({ value: t.value, label: t.label }))}
              />
            )}

            <Divider style={{ margin: "16px 0" }} />

            {/* 所属产品 */}
            {renderSidebarField(
              "所属产品",
              requirement.productName ? (
                <Tag color="purple">{requirement.productName}</Tag>
              ) : (
                <Text type="secondary">-</Text>
              )
            )}

            {/* 所属版本 */}
            {renderSidebarField(
              "所属版本",
              <Select
                value={formData.versionId || requirement.versionId}
                onChange={(value) => updateField("versionId", value)}
                style={{ width: "100%" }}
                placeholder="选择版本"
                allowClear
                options={versions}
              />
            )}

            {/* 所属项目 */}
            {renderSidebarField(
              "所属项目",
              requirement.projectName ? (
                <Tag color="blue">{requirement.projectName}</Tag>
              ) : (
                <Text type="secondary">-</Text>
              )
            )}

            {/* 所属迭代 */}
            {renderSidebarField(
              "所属迭代",
              <Select
                value={formData.sprintId || requirement.sprintId}
                onChange={(value) => updateField("sprintId", value)}
                style={{ width: "100%" }}
                placeholder="选择迭代"
                allowClear
                options={sprints}
              />
            )}

            <Divider style={{ margin: "16px 0" }} />

            {/* 创建人 */}
            {renderSidebarField(
              "创建人",
              <Space>
                <Avatar size="small" style={{ background: "#a5b4fc" }}>
                  {requirement.creator.name[0]}
                </Avatar>
                <Text>{requirement.creator.name}</Text>
              </Space>,
              <UserOutlined />
            )}

            {/* 创建时间 */}
            {renderSidebarField(
              "创建时间",
              <Text type="secondary">{requirement.createdAt}</Text>,
              <CalendarOutlined />
            )}

            {/* 更新人 */}
            {requirement.updater && renderSidebarField(
              "更新人",
              <Space>
                <Avatar size="small" style={{ background: "#c4b5fd" }}>
                  {requirement.updater.name[0]}
                </Avatar>
                <Text>{requirement.updater.name}</Text>
              </Space>,
              <UserOutlined />
            )}

            {/* 更新时间 */}
            {renderSidebarField(
              "更新时间",
              <Text type="secondary">{requirement.updatedAt}</Text>,
              <CalendarOutlined />
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export default RequirementDetailModal
