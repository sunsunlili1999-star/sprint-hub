"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Tag,
  Avatar,
  Button,
  Space,
  Input,
  Dropdown,
  Modal,
  Form,
  Row,
  Col,
  Typography,
  message,
  Select,
} from "antd"
import type { TableProps } from "antd"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  EyeOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  FileAddOutlined,
  FilterOutlined,
  CloseOutlined,
  CopyOutlined,
  UnorderedListOutlined,
  SortAscendingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HolderOutlined,
} from "@ant-design/icons"
import { ListPageLayout, type SidebarItem, type BatchAction } from "@/components/ui/ListPageLayout"
import { RequirementDetailModal } from "@/components/requirement"
import { 
  moduleApi, 
  requirementApi, 
  type Module,
  type Requirement,
  type SortCondition,
} from "@/lib/api"

const { Text } = Typography

// Helper functions
const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    P0: "red", P1: "orange", P2: "gold", P3: "blue", P4: "default",
  }
  return colors[priority] || "default"
}

const getStatusInfo = (status: string) => {
  const info: Record<string, { label: string; color: string }> = {
    NOT_STARTED: { label: "未开始", color: "default" },
    IN_PROGRESS: { label: "进行中", color: "processing" },
    COMPLETED: { label: "已完成", color: "success" },
    PLANNING: { label: "规划中", color: "default" },
    READY: { label: "待发布", color: "warning" },
    RELEASED: { label: "已发布", color: "success" },
  }
  return info[status] || { label: status, color: "default" }
}

// 筛选条件类型
interface FilterCondition {
  id: string
  logic: "AND" | "OR"
  field: string
  operator: string
  value: string | string[]
}

// 筛选字段配置
const filterFields = [
  { value: "title", label: "标题", type: "text" },
  { value: "description", label: "描述", type: "text" },
  { value: "status", label: "状态", type: "select", options: [
    { value: "NOT_STARTED", label: "未开始" },
    { value: "IN_PROGRESS", label: "进行中" },
    { value: "COMPLETED", label: "已完成" },
  ]},
  { value: "priority", label: "优先级", type: "select", options: [
    { value: "P0", label: "P0 - 最高" },
    { value: "P1", label: "P1 - 高" },
    { value: "P2", label: "P2 - 中" },
    { value: "P3", label: "P3 - 低" },
    { value: "P4", label: "P4 - 最低" },
  ]},
  { value: "creatorName", label: "创建人", type: "text" },
  { value: "assigneeName", label: "经办人", type: "text" },
]

// 运算符配置
const operatorsByType: Record<string, { value: string; label: string }[]> = {
  text: [
    { value: "contains", label: "包含" },
    { value: "equals", label: "等于" },
    { value: "notEquals", label: "不等于" },
    { value: "startsWith", label: "开头是" },
    { value: "endsWith", label: "结尾是" },
  ],
  select: [
    { value: "in", label: "包含" },
    { value: "notIn", label: "不包含" },
    { value: "equals", label: "等于" },
    { value: "notEquals", label: "不等于" },
  ],
}

// 可排序字段配置
const sortableFields = [
  { value: "title", label: "标题" },
  { value: "priority", label: "优先级" },
  { value: "status", label: "状态" },
  { value: "moduleName", label: "模块" },
  { value: "projectName", label: "关联项目" },
  { value: "sprintName", label: "迭代" },
  { value: "creatorName", label: "创建人" },
  { value: "assigneeName", label: "经办人" },
  { value: "createdAt", label: "创建时间" },
  { value: "updatedAt", label: "更新时间" },
]

interface ProductRequirementsTabProps {
  productId: string
  modules: Module[]
  requirements: Requirement[]
}

export function ProductRequirementsTab({ 
  productId, 
  modules: initialModules, 
  requirements: initialRequirements,
}: ProductRequirementsTabProps) {
  const router = useRouter()
  // 数据状态
  const [requirements, setRequirements] = useState<Requirement[]>(initialRequirements)
  const [modules, setModules] = useState<Module[]>(initialModules)
  
  // UI 状态
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<string[]>(initialModules.map(m => m.id))
  
  // 加载状态
  const [tableLoading, setTableLoading] = useState(false)
  
  // 弹窗状态
  const [isCreateRequirementOpen, setIsCreateRequirementOpen] = useState(false)
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // 表格选中状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  
  // 高级筛选状态
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])
  const [appliedFilters, setAppliedFilters] = useState<FilterCondition[]>([])
  
  // 排序状态
  const [isSortModalOpen, setIsSortModalOpen] = useState(false)
  const [sortConditions, setSortConditions] = useState<SortCondition[]>([])
  const [appliedSorts, setAppliedSorts] = useState<SortCondition[]>([])
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 需求详情弹窗状态
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null)

  // 表单
  const [form] = Form.useForm()
  const [moduleForm] = Form.useForm()

  // 打开需求详情（编辑模式）
  const handleOpenDetail = (requirementId: string) => {
    setSelectedRequirementId(requirementId)
    setIsDetailOpen(true)
  }

  // 打开需求详情（新建模式）
  const handleOpenCreate = () => {
    setSelectedRequirementId(null)
    setIsDetailOpen(true)
  }

  // 关闭需求详情
  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setSelectedRequirementId(null)
  }

  // 同步初始数据
  useEffect(() => {
    setRequirements(initialRequirements)
  }, [initialRequirements])

  useEffect(() => {
    setExpandedModules(modules.map(m => m.id))
  }, [modules])

  // 判断是否有筛选条件（搜索、模块筛选、高级筛选、排序）
  const hasFilters = searchQuery || selectedModule || appliedFilters.length > 0 || appliedSorts.length > 0

  // 加载模块列表
  const loadModules = useCallback(async () => {
    try {
      const data = await moduleApi.getList(productId)
      setModules(data)
      setExpandedModules(data.map(m => m.id))
    } catch (error) {
      console.error("加载模块失败:", error)
    }
  }, [productId])

  // 加载需求列表（带筛选和排序）- 只在有筛选条件时才请求API
  const loadRequirements = useCallback(async () => {
    // 没有筛选条件时，使用初始数据
    if (!searchQuery && !selectedModule && appliedFilters.length === 0 && appliedSorts.length === 0) {
      setRequirements(initialRequirements)
      return
    }
    
    try {
      setTableLoading(true)
      const data = await requirementApi.getList(productId, {
        search: searchQuery,
        moduleId: selectedModule || undefined,
        filters: appliedFilters.length > 0 ? appliedFilters : undefined,
        sorts: appliedSorts.length > 0 ? appliedSorts : undefined,
      })
      setRequirements(data)
    } catch (error) {
      console.error(error)
    } finally {
      setTableLoading(false)
    }
  }, [productId, searchQuery, selectedModule, appliedFilters, appliedSorts, initialRequirements])

  // 只在筛选条件变化时重新加载（不在组件挂载时加载）
  useEffect(() => {
    if (hasFilters) {
      loadRequirements()
    }
  }, [searchQuery, selectedModule, appliedFilters, appliedSorts]) // eslint-disable-line react-hooks/exhaustive-deps

  // 获取模块下的需求数量
  const getModuleRequirementCount = (moduleId: string | null): number => {
    if (moduleId === null) return requirements.length
    if (moduleId === "unassigned") return requirements.filter(r => !r.moduleId).length
    const module = modules.find(m => m.id === moduleId)
    if (module) {
      const childIds = module.children?.map(c => c.id) || []
      return requirements.filter(r => r.moduleId === moduleId || childIds.includes(r.moduleId || "")).length
    }
    return requirements.filter(r => r.moduleId === moduleId).length
  }

  // 切换模块展开/收起
  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    )
  }

  // 创建需求
  const handleCreateRequirement = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await requirementApi.create(productId, values)
      message.success("创建成功")
      setIsCreateRequirementOpen(false)
      form.resetFields()
      // 刷新页面数据
      if (hasFilters) {
        loadRequirements()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      if (error.message) message.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 创建模块
  const handleCreateModule = async () => {
    try {
      const values = await moduleForm.validateFields()
      setSubmitting(true)
      await moduleApi.create(productId, values)
      message.success("创建成功")
      setIsCreateModuleOpen(false)
      moduleForm.resetFields()
      loadModules()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 删除需求
  const handleDeleteRequirement = (req: Requirement) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除需求「${req.title}」吗？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await requirementApi.delete(productId, req.id)
          message.success("删除成功")
          if (hasFilters) {
            loadRequirements()
          } else {
            router.refresh()
          }
        } catch (error: any) {
          message.error(error.message || "删除失败")
        }
      },
    })
  }

  // 删除模块
  const handleDeleteModule = (moduleId: string, moduleName: string) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除模块「${moduleName}」吗？模块下的需求将变为未分配。`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await moduleApi.delete(productId, moduleId)
          message.success("删除成功")
          if (selectedModule === moduleId) setSelectedModule(null)
          loadModules()
        } catch (error: any) {
          message.error(error.message || "删除失败")
        }
      },
    })
  }

  // 复制 ID 到剪贴板
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      message.success("ID 已复制到剪贴板")
    }).catch(() => {
      message.error("复制失败")
    })
  }

  // 需求表格列
  const requirementColumns: TableProps<Requirement>["columns"] = [
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
      title: "标题",
      dataIndex: "title",
      fixed: 'left',
      render: (_: unknown, record: Requirement) => (
        <Text 
          style={{ 
            cursor: "pointer", 
            transition: "color 0.2s",
          }}
          onClick={() => handleOpenDetail(record.id)}
          onMouseEnter={(e) => e.currentTarget.style.color = "#7c7cff"}
          onMouseLeave={(e) => e.currentTarget.style.color = ""}
        >
          {record.title}
        </Text>
      ),
    },
    {
      title: "模块",
      dataIndex: "moduleName",
      width: 100,
      render: (name: string) => name || <Text type="secondary">-</Text>,
    },
    {
      title: "关联项目",
      dataIndex: "projectName",
      width: 130,
      render: (name: string, record: Requirement) => (
        name ? (
          <Link href={`/projects/${record.projectId}`}>
            <Text 
              style={{ 
                color: "#7c7cff",
                borderBottom: "1px dashed #7c7cff",
                paddingBottom: 2,
              }}
            >
              {name}
            </Text>
          </Link>
        ) : (
          <Tag color="warning">待分配</Tag>
        )
      ),
    },
    {
      title: "迭代",
      dataIndex: "sprintName",
      width: 100,
      render: (name: string) => name || "-",
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 100,
    },
    {
      title: "创建人",
      dataIndex: "creator",
      width: 80,
      render: (creator: { name: string }) => (
        <Avatar size="small" style={{ background: "#a5b4fc" }}>
          {creator?.name?.[0] || "?"}
        </Avatar>
      ),
    },
    {
      title: "经办人",
      dataIndex: "assignee",
      width: 80,
      render: (assignee: { name: string } | null) => (
        assignee ? (
          <Avatar size="small" style={{ background: "#c4b5fd" }}>
            {assignee.name?.[0] || "?"}
          </Avatar>
        ) : "-"
      ),
    },
    {
      title: "优先级",
      dataIndex: "priority",
      width: 80,
      fixed: 'right',
      render: (priority: string) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      fixed: 'right',
      render: (status: string) => {
        const info = getStatusInfo(status)
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: "操作",
      width: 60,
      fixed: 'right',
      render: (_: unknown, record: Requirement) => (
        <Dropdown
          menu={{
            items: [
              { key: "view", icon: <EyeOutlined />, label: "查看详情" },
              { key: "edit", icon: <EditOutlined />, label: "编辑" },
              { type: "divider" },
              { key: "delete", icon: <DeleteOutlined />, label: "删除", danger: true, onClick: () => handleDeleteRequirement(record) },
            ],
          }}
          trigger={["click"]}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  // 构建模块侧边栏数据
  const buildModuleSidebarItems = (): SidebarItem[] => {
    const items: SidebarItem[] = [
      {
        id: null,
        name: "全部需求",
        icon: <FolderOutlined style={{ color: "#7c7cff", fontSize: 13 }} />,
        count: requirements.length,
        activeColor: "#7c7cff",
      },
      ...modules.map((module): SidebarItem => ({
        id: module.id,
        name: module.name,
        icon: expandedModules.includes(module.id) 
          ? <FolderOpenOutlined style={{ color: "#9999ff", fontSize: 13 }} /> 
          : <FolderOutlined style={{ color: "#9999ff", fontSize: 13 }} />,
        count: getModuleRequirementCount(module.id),
        activeColor: "#7c7cff",
        children: module.children?.map((child): SidebarItem => ({
          id: child.id,
          name: child.name,
          icon: <FileTextOutlined style={{ color: "#64748b", fontSize: 12 }} />,
          count: requirements.filter(r => r.moduleId === child.id).length,
          activeColor: "#7c7cff",
        })),
      })),
      {
        id: "unassigned",
        name: "未分配",
        icon: <FileAddOutlined style={{ color: "#f59e0b", fontSize: 13 }} />,
        count: getModuleRequirementCount("unassigned"),
        activeColor: "#f59e0b",
        activeBg: "#fef3c7",
      },
    ]
    return items
  }

  // 需求批量操作
  const requirementBatchActions: BatchAction[] = [
    {
      key: "delete",
      label: "批量删除",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: (keys) => {
        Modal.confirm({
          title: "确认删除",
          content: `确定要删除选中的 ${keys.length} 条需求吗？`,
          okText: "删除",
          okType: "danger",
          cancelText: "取消",
          onOk: async () => {
            message.success(`已删除 ${keys.length} 条需求`)
            setSelectedRowKeys([])
            if (hasFilters) {
              loadRequirements()
            } else {
              router.refresh()
            }
          },
        })
      },
    },
    {
      key: "export",
      label: "批量导出",
      icon: <DownloadOutlined />,
      onClick: (keys) => {
        message.success(`已导出 ${keys.length} 条需求`)
      },
    },
  ]

  // 筛选和排序工具栏
  const filterToolbar = (
    <Space size={0}>
      <Button 
        type="text"
        size="small"
        icon={<FilterOutlined />} 
        className={`toolbar-text-btn ${appliedFilters.length > 0 ? "active" : ""}`}
        onClick={() => {
          setFilterConditions(appliedFilters.length > 0 ? [...appliedFilters] : [{ id: Date.now().toString(), logic: "AND", field: "status", operator: "equals", value: "" }])
          setIsFilterModalOpen(true)
        }}
      >
        筛选
        {appliedFilters.length > 0 && (
          <Tag color="blue" style={{ marginLeft: 4, marginRight: -4, height: 18, lineHeight: "16px", fontSize: 11 }}>{appliedFilters.length}</Tag>
        )}
      </Button>
      {appliedFilters.length > 0 && (
        <Button 
          type="text" 
          size="small" 
          icon={<CloseOutlined />}
          className="toolbar-clear-btn"
          style={{ padding: "0 4px", fontSize: 12, width: 20, minWidth: 20 }} 
          onClick={() => { 
            setAppliedFilters([])
            setFilterConditions([])
          }}
        />
      )}
      <Button 
        type="text"
        size="small"
        icon={<SortAscendingOutlined />} 
        className={`toolbar-text-btn ${appliedSorts.length > 0 ? "active" : ""}`}
        onClick={() => {
          setSortConditions(appliedSorts.length > 0 ? [...appliedSorts] : [])
          setIsSortModalOpen(true)
        }}
      >
        排序
        {appliedSorts.length > 0 && (
          <Tag color="purple" style={{ marginLeft: 4, marginRight: -4, height: 18, lineHeight: "16px", fontSize: 11 }}>{appliedSorts.length}</Tag>
        )}
      </Button>
      {appliedSorts.length > 0 && (
        <Button 
          type="text" 
          size="small" 
          icon={<CloseOutlined />}
          className="toolbar-clear-btn"
          style={{ padding: "0 4px", fontSize: 12, width: 20, minWidth: 20 }} 
          onClick={() => { 
            setAppliedSorts([])
            setSortConditions([])
          }}
        />
      )}
    </Space>
  )

  return (
    <>
      <ListPageLayout<Requirement>
        showSidebar
        sidebar={{
          title: "模块",
          icon: <AppstoreOutlined style={{ fontSize: 14, color: "#7c7cff" }} />,
          items: buildModuleSidebarItems(),
          selectedId: selectedModule,
          onSelect: setSelectedModule,
          expandedIds: expandedModules,
          onToggleExpand: toggleModuleExpand,
          onAdd: () => setIsCreateModuleOpen(true),
          renderItemExtra: (item) => {
            if (item.id === null || item.id === "unassigned") return null
            const module = modules.find(m => m.id === item.id)
            if (!module) return null
            return (
              <Dropdown 
                menu={{ 
                  items: [
                    { key: "addChild", icon: <PlusOutlined />, label: "添加子模块" }, 
                    { key: "edit", icon: <EditOutlined />, label: "编辑" }, 
                    { type: "divider" }, 
                    { key: "delete", icon: <DeleteOutlined />, label: "删除", danger: true, onClick: () => handleDeleteModule(module.id, module.name) }
                  ] 
                }} 
                trigger={["click"]}
              >
                <MoreOutlined onClick={(e) => e.stopPropagation()} style={{ color: "#94a3b8", padding: 2, fontSize: 12 }} />
              </Dropdown>
            )
          },
        }}
        content={{
          title: "需求列表",
          icon: <UnorderedListOutlined style={{ fontSize: 14, color: "#7c7cff" }} />,
          columns: requirementColumns,
          dataSource: requirements.slice((currentPage - 1) * pageSize, currentPage * pageSize),
          rowKey: "id",
          loading: tableLoading,
          searchPlaceholder: "搜索需求标题...",
          searchValue: searchQuery,
          onSearch: setSearchQuery,
          onAdd: handleOpenCreate,
          addButtonText: "新建",
          extraToolbar: filterToolbar,
          pagination: {
            current: currentPage,
            pageSize: pageSize,
            total: requirements.length,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          },
          batchActions: requirementBatchActions,
          rowSelection: {
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          },
        }}
      />

      {/* Create Requirement Modal */}
      <Modal 
        title="创建产品需求" 
        open={isCreateRequirementOpen} 
        onCancel={() => { setIsCreateRequirementOpen(false); form.resetFields() }} 
        onOk={handleCreateRequirement} 
        okText="创建" 
        cancelText="取消" 
        confirmLoading={submitting} 
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="需求标题" rules={[{ required: true, message: "请输入需求标题" }]}>
            <Input placeholder="输入需求标题" />
          </Form.Item>
          <Form.Item name="description" label="需求描述">
            <Input.TextArea rows={4} placeholder="详细描述需求内容、背景和目标" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" initialValue="P2">
                <Select options={[
                  { value: "P0", label: "P0 - 最高" }, 
                  { value: "P1", label: "P1 - 高" }, 
                  { value: "P2", label: "P2 - 中" }, 
                  { value: "P3", label: "P3 - 低" }, 
                  { value: "P4", label: "P4 - 最低" }
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="moduleId" label="所属模块">
                <Select 
                  allowClear 
                  placeholder="选择模块" 
                  options={modules.flatMap(m => [
                    { value: m.id, label: m.name }, 
                    ...(m.children?.map(c => ({ value: c.id, label: `  ${c.name}` })) || [])
                  ])} 
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Create Module Modal */}
      <Modal 
        title="创建模块" 
        open={isCreateModuleOpen} 
        onCancel={() => { setIsCreateModuleOpen(false); moduleForm.resetFields() }} 
        onOk={handleCreateModule} 
        okText="创建" 
        cancelText="取消" 
        confirmLoading={submitting}
      >
        <Form form={moduleForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="模块名称" rules={[{ required: true, message: "请输入模块名称" }]}>
            <Input placeholder="输入模块名称" />
          </Form.Item>
          <Form.Item name="parentId" label="父模块（可选）">
            <Select allowClear placeholder="选择父模块，不选则为顶级模块" options={modules.map(m => ({ value: m.id, label: m.name }))} />
          </Form.Item>
          <Form.Item name="description" label="模块描述">
            <Input.TextArea rows={3} placeholder="简要描述模块的功能范围" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 高级筛选 Modal */}
      <Modal 
        title="高级筛选" 
        open={isFilterModalOpen} 
        onCancel={() => setIsFilterModalOpen(false)} 
        width={750}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setFilterConditions([{ id: Date.now().toString(), logic: "AND", field: "status", operator: "equals", value: "" }])}>
              重置条件
            </Button>
            <Space>
              <Button onClick={() => setIsFilterModalOpen(false)}>取消</Button>
              <Button 
                type="primary" 
                onClick={() => {
                  const validConditions = filterConditions.filter(c => c.field && c.operator && c.value)
                  setAppliedFilters(validConditions)
                  setIsFilterModalOpen(false)
                }}
              >
                应用筛选
              </Button>
            </Space>
          </div>
        }
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filterConditions.map((condition, index) => {
              const fieldConfig = filterFields.find(f => f.value === condition.field)
              const operators = operatorsByType[fieldConfig?.type || "text"] || operatorsByType.text
              
              return (
                <div key={condition.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 70, flexShrink: 0 }}>
                    {index === 0 ? (
                      <Text type="secondary">条件</Text>
                    ) : (
                      <Select
                        value={condition.logic}
                        onChange={(v) => {
                          const newConditions = [...filterConditions]
                          newConditions[index] = { ...condition, logic: v }
                          setFilterConditions(newConditions)
                        }}
                        style={{ width: 70 }}
                        options={[
                          { value: "AND", label: "且" },
                          { value: "OR", label: "或" },
                        ]}
                      />
                    )}
                  </div>
                  
                  <Select
                    value={condition.field}
                    onChange={(v) => {
                      const newConditions = [...filterConditions]
                      const newFieldConfig = filterFields.find(f => f.value === v)
                      newConditions[index] = { 
                        ...condition, 
                        field: v, 
                        operator: operatorsByType[newFieldConfig?.type || "text"][0].value,
                        value: "" 
                      }
                      setFilterConditions(newConditions)
                    }}
                    style={{ width: 120 }}
                    placeholder="选择字段"
                    options={filterFields.map(f => ({ value: f.value, label: f.label }))}
                  />
                  
                  <Select
                    value={condition.operator}
                    onChange={(v) => {
                      const newConditions = [...filterConditions]
                      const isMultiple = v === "in" || v === "notIn"
                      const wasMultiple = condition.operator === "in" || condition.operator === "notIn"
                      const newValue = isMultiple !== wasMultiple ? (isMultiple ? [] : "") : condition.value
                      newConditions[index] = { ...condition, operator: v, value: newValue }
                      setFilterConditions(newConditions)
                    }}
                    style={{ width: 100 }}
                    placeholder="运算符"
                    options={operators}
                  />
                  
                  {fieldConfig?.type === "select" ? (
                    condition.operator === "in" || condition.operator === "notIn" ? (
                      <Select
                        mode="multiple"
                        value={Array.isArray(condition.value) ? condition.value : []}
                        onChange={(v) => {
                          const newConditions = [...filterConditions]
                          newConditions[index] = { ...condition, value: v }
                          setFilterConditions(newConditions)
                        }}
                        style={{ flex: 1 }}
                        placeholder="选择值（可多选）"
                        options={fieldConfig.options}
                        allowClear
                      />
                    ) : (
                      <Select
                        value={typeof condition.value === "string" ? condition.value || undefined : undefined}
                        onChange={(v) => {
                          const newConditions = [...filterConditions]
                          newConditions[index] = { ...condition, value: v }
                          setFilterConditions(newConditions)
                        }}
                        style={{ flex: 1 }}
                        placeholder="选择值"
                        options={fieldConfig.options}
                        allowClear
                      />
                    )
                  ) : (
                    <Input
                      value={typeof condition.value === "string" ? condition.value : ""}
                      onChange={(e) => {
                        const newConditions = [...filterConditions]
                        newConditions[index] = { ...condition, value: e.target.value }
                        setFilterConditions(newConditions)
                      }}
                      style={{ flex: 1 }}
                      placeholder="输入值"
                    />
                  )}
                  
                  <Button 
                    type="text" 
                    icon={<CloseOutlined />} 
                    style={{ color: "#ff4d4f" }}
                    disabled={filterConditions.length === 1}
                    onClick={() => {
                      const newConditions = filterConditions.filter(c => c.id !== condition.id)
                      setFilterConditions(newConditions)
                    }}
                  />
                </div>
              )
            })}
          </div>

          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            onClick={() => {
              setFilterConditions([
                ...filterConditions, 
                { id: Date.now().toString(), logic: "AND", field: "status", operator: "equals", value: "" }
              ])
            }}
            style={{ marginTop: 12, width: "100%" }}
          >
            添加条件
          </Button>
        </div>
      </Modal>

      {/* 排序 Modal */}
      <Modal 
        title="排序设置" 
        open={isSortModalOpen} 
        onCancel={() => setIsSortModalOpen(false)} 
        width={500}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setSortConditions([])}>
              重置排序
            </Button>
            <Space>
              <Button onClick={() => setIsSortModalOpen(false)}>取消</Button>
              <Button 
                type="primary" 
                onClick={() => {
                  const validSorts = sortConditions.filter(s => s.field)
                  setAppliedSorts(validSorts)
                  setIsSortModalOpen(false)
                }}
              >
                应用排序
              </Button>
            </Space>
          </div>
        }
      >
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 12, display: "block" }}>
            拖拽调整排序优先级，排在前面的字段优先级更高
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortConditions.map((sort, index) => {
              // 获取已选择的字段，排除当前项
              const usedFields = sortConditions.filter((_, i) => i !== index).map(s => s.field)
              const availableFields = sortableFields.filter(f => !usedFields.includes(f.value))
              
              return (
                <div 
                  key={sort.id} 
                  style={{ 
                    display: "flex", 
                    gap: 8, 
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "#f8f9fc",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <HolderOutlined style={{ color: "#94a3b8", cursor: "move" }} />
                  <Text style={{ width: 20, color: "#64748b", fontSize: 12 }}>{index + 1}</Text>
                  
                  <Select
                    value={sort.field}
                    onChange={(v) => {
                      const newSorts = [...sortConditions]
                      newSorts[index] = { ...sort, field: v }
                      setSortConditions(newSorts)
                    }}
                    style={{ flex: 1 }}
                    placeholder="选择排序字段"
                    options={availableFields.map(f => ({ value: f.value, label: f.label }))}
                  />
                  
                  <Button.Group>
                    <Button 
                      type={sort.order === "asc" ? "primary" : "default"}
                      icon={<ArrowUpOutlined />}
                      onClick={() => {
                        const newSorts = [...sortConditions]
                        newSorts[index] = { ...sort, order: "asc" }
                        setSortConditions(newSorts)
                      }}
                      style={{ width: 36 }}
                      title="升序"
                    />
                    <Button 
                      type={sort.order === "desc" ? "primary" : "default"}
                      icon={<ArrowDownOutlined />}
                      onClick={() => {
                        const newSorts = [...sortConditions]
                        newSorts[index] = { ...sort, order: "desc" }
                        setSortConditions(newSorts)
                      }}
                      style={{ width: 36 }}
                      title="降序"
                    />
                  </Button.Group>
                  
                  <Button 
                    type="text" 
                    icon={<CloseOutlined />} 
                    style={{ color: "#ff4d4f" }}
                    disabled={sortConditions.length === 1}
                    onClick={() => {
                      const newSorts = sortConditions.filter(s => s.id !== sort.id)
                      setSortConditions(newSorts)
                    }}
                  />
                </div>
              )
            })}
          </div>

          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            onClick={() => {
              // 找到第一个未使用的字段
              const usedFields = sortConditions.map(s => s.field)
              const nextField = sortableFields.find(f => !usedFields.includes(f.value))
              if (nextField) {
                setSortConditions([
                  ...sortConditions, 
                  { id: Date.now().toString(), field: nextField.value, order: "desc" }
                ])
              }
            }}
            disabled={sortConditions.length >= sortableFields.length}
            style={{ marginTop: 12, width: "100%" }}
          >
            添加排序字段
          </Button>
        </div>
      </Modal>

      {/* 需求详情弹窗 */}
      <RequirementDetailModal
        open={isDetailOpen}
        requirementId={selectedRequirementId}
        onClose={handleCloseDetail}
        defaultProductId={productId}
        onSuccess={async () => {
          // 始终重新加载数据
          try {
            setTableLoading(true)
            const data = await requirementApi.getList(productId, {
              search: searchQuery || undefined,
              moduleId: selectedModule || undefined,
              filters: appliedFilters.length > 0 ? appliedFilters : undefined,
              sorts: appliedSorts.length > 0 ? appliedSorts : undefined,
            })
            setRequirements(data)
          } catch (error) {
            console.error(error)
          } finally {
            setTableLoading(false)
          }
        }}
      />
    </>
  )
}
