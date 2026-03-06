"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
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
  Empty,
  Skeleton,
  Progress,
  Table,
  Checkbox,
} from "antd"
import type { TableProps } from "antd"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  EyeOutlined,
  ImportOutlined,
  FileTextOutlined,
  FilterOutlined,
  CloseOutlined,
  CopyOutlined,
  UnorderedListOutlined,
  SortAscendingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HolderOutlined,
  RocketOutlined,
  AppstoreOutlined,
  FolderOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons"
import { ListPageLayout, type SidebarItem, type BatchAction } from "@/components/ui/ListPageLayout"
import { RequirementDetailModal } from "@/components/requirement"
import { 
  projectApi,
  projectRequirementApi, 
  productApi,
  requirementApi,
  type ProjectDetail,
  type ProjectRequirement,
  type Product,
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

const getRequirementTypeInfo = (type: string | null) => {
  const info: Record<string, { label: string; color: string }> = {
    FEATURE: { label: "功能", color: "blue" },
    OPTIMIZATION: { label: "优化", color: "cyan" },
    SECURITY: { label: "安全", color: "red" },
    TECH_IMPROVEMENT: { label: "技改", color: "purple" },
  }
  return type ? info[type] || { label: type, color: "default" } : null
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
  { value: "requirementType", label: "需求类型", type: "select", options: [
    { value: "FEATURE", label: "功能" },
    { value: "OPTIMIZATION", label: "优化" },
    { value: "SECURITY", label: "安全" },
    { value: "TECH_IMPROVEMENT", label: "技改" },
  ]},
  { value: "creatorName", label: "创建人", type: "text" },
  { value: "assigneeName", label: "负责人", type: "text" },
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
  { value: "requirementType", label: "需求类型" },
  { value: "productName", label: "来源产品" },
  { value: "sprintName", label: "迭代" },
  { value: "progress", label: "进度" },
  { value: "createdAt", label: "创建时间" },
  { value: "updatedAt", label: "更新时间" },
]

export default function ProjectRequirementsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  
  // 数据状态
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([])
  const [loading, setLoading] = useState(true)
  
  // UI 状态
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([])
  
  // 产品模块数据
  const [productModules, setProductModules] = useState<{id: string, name: string, modules: {id: string, name: string}[]}[]>([])
  
  // 加载状态
  const [tableLoading, setTableLoading] = useState(false)
  
  // 弹窗状态
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
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

  // 导入弹窗状态
  const [importProducts, setImportProducts] = useState<Product[]>([])
  const [importSelectedProduct, setImportSelectedProduct] = useState<string | null>(null)
  const [importRequirements, setImportRequirements] = useState<Requirement[]>([])
  const [importSelectedKeys, setImportSelectedKeys] = useState<React.Key[]>([])
  const [importLoading, setImportLoading] = useState(false)

  // 需求详情弹窗状态
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null)

  // 表单
  const [form] = Form.useForm()

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

  // 加载项目详情
  const loadProject = useCallback(async () => {
    try {
      const data = await projectApi.getDetail(projectId)
      setProject(data)
    } catch (error) {
      console.error("加载项目失败", error)
    }
  }, [projectId])

  // 加载需求列表
  const loadRequirements = useCallback(async () => {
    try {
      setTableLoading(true)
      const data = await projectRequirementApi.getList(projectId, {
        search: searchQuery,
        productId: selectedProductId || undefined,
        moduleId: selectedModuleId || undefined,
        filters: appliedFilters.length > 0 ? appliedFilters : undefined,
        sorts: appliedSorts.length > 0 ? appliedSorts : undefined,
      })
      setRequirements(data)
    } catch (error) {
      console.error("加载需求失败", error)
    } finally {
      setTableLoading(false)
    }
  }, [projectId, searchQuery, selectedProductId, selectedModuleId, appliedFilters, appliedSorts])

  // 初始加载
  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([loadProject(), loadRequirements()])
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 筛选条件变化时重新加载
  useEffect(() => {
    if (!loading) {
      loadRequirements()
    }
  }, [searchQuery, selectedProductId, selectedModuleId, appliedFilters, appliedSorts]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // 加载产品和模块数据（基于项目关联的产品）
  useEffect(() => {
    if (project?.products && project.products.length > 0) {
      // 从关联产品获取模块信息
      const loadProductModules = async () => {
        try {
          const modulesData = await Promise.all(
            project.products.map(async (p) => {
              const res = await fetch(`/api/products/${p.id}/modules`)
              const modules = await res.json()
              return {
                id: p.id,
                name: p.name,
                modules: modules.map((m: any) => ({ id: m.id, name: m.name })),
              }
            })
          )
          setProductModules(modulesData)
          setExpandedProductIds(modulesData.map(p => p.id))
        } catch (error) {
          console.error("加载产品模块失败", error)
        }
      }
      loadProductModules()
    }
  }, [project?.products])

  // 复制 ID 到剪贴板
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      message.success("ID 已复制到剪贴板")
    }).catch(() => {
      message.error("复制失败")
    })
  }

  // 创建需求
  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await projectRequirementApi.create(projectId, values)
      message.success("创建成功")
      setIsCreateOpen(false)
      form.resetFields()
      loadRequirements()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 删除需求
  const handleDelete = (req: ProjectRequirement) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除需求「${req.title}」吗？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          // TODO: 添加删除 API
          message.success("删除成功")
          loadRequirements()
        } catch (error: any) {
          message.error(error.message || "删除失败")
        }
      },
    })
  }

  // 打开导入弹窗
  const handleOpenImport = async () => {
    setIsImportOpen(true)
    setImportLoading(true)
    try {
      const products = await productApi.getList()
      setImportProducts(products)
      // 如果项目有关联产品，默认选中第一个
      if (project?.products && project.products.length > 0) {
        setImportSelectedProduct(project.products[0].id)
        const reqs = await requirementApi.getList(project.products[0].id)
        // 显示所有需求，已导入的会有特殊标记
        setImportRequirements(reqs)
      }
    } catch (error) {
      console.error("加载产品列表失败", error)
    } finally {
      setImportLoading(false)
    }
  }

  // 切换产品时加载需求
  const handleProductChange = async (productId: string) => {
    setImportSelectedProduct(productId)
    setImportSelectedKeys([])
    setImportLoading(true)
    try {
      const reqs = await requirementApi.getList(productId)
      // 显示所有需求，已导入的会有特殊标记
      setImportRequirements(reqs)
    } catch (error) {
      console.error("加载需求失败", error)
    } finally {
      setImportLoading(false)
    }
  }

  // 执行导入
  const handleImport = async () => {
    if (importSelectedKeys.length === 0) {
      message.warning("请选择要导入的需求")
      return
    }
    try {
      setSubmitting(true)
      await projectRequirementApi.importFromProduct(projectId, importSelectedKeys as string[])
      message.success(`成功导入 ${importSelectedKeys.length} 条需求`)
      setIsImportOpen(false)
      setImportSelectedKeys([])
      setImportSelectedProduct(null)
      setImportRequirements([])
      loadRequirements()
    } catch (error: any) {
      message.error(error.message || "导入失败")
    } finally {
      setSubmitting(false)
    }
  }

  // 表格列
  const columns: TableProps<ProjectRequirement>["columns"] = [
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
      render: (_: unknown, record: ProjectRequirement) => (
        <Space direction="vertical" size={0}>
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
          {record.requirementType && (
            <Tag color={getRequirementTypeInfo(record.requirementType)?.color} style={{ fontSize: 11 }}>
              {getRequirementTypeInfo(record.requirementType)?.label}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "来源产品",
      dataIndex: "productName",
      width: 120,
      render: (name: string) => name || <Text type="secondary">-</Text>,
    },
    {
      title: "迭代",
      dataIndex: "sprintName",
      width: 100,
      render: (name: string) => name || <Tag color="warning">待分配</Tag>,
    },
    {
      title: "进度",
      dataIndex: "progress",
      width: 120,
      render: (progress: number, record: ProjectRequirement) => (
        <Space>
          <Progress 
            percent={progress} 
            size="small" 
            style={{ width: 60 }}
            strokeColor={{
              '0%': '#22d3ee',
              '100%': '#7c7cff',
            }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.childCount > 0 ? `${record.childCount}项` : '-'}
          </Text>
        </Space>
      ),
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
      title: "负责人",
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
      render: (_: unknown, record: ProjectRequirement) => (
        <Dropdown
          menu={{
            items: [
              { key: "view", icon: <EyeOutlined />, label: "查看详情" },
              { key: "edit", icon: <EditOutlined />, label: "编辑" },
              { key: "moveSprint", icon: <RocketOutlined />, label: "移入迭代" },
              { type: "divider" },
              { key: "delete", icon: <DeleteOutlined />, label: "删除", danger: true, onClick: () => handleDelete(record) },
            ],
          }}
          trigger={["click"]}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  // 构建产品/模块侧边栏
  const buildProductSidebarItems = (): SidebarItem[] => {
    const items: SidebarItem[] = [
      {
        id: null,
        name: "全部需求",
        icon: <FileTextOutlined style={{ color: "#7c7cff", fontSize: 13 }} />,
        count: requirements.length,
        activeColor: "#7c7cff",
      },
    ]
    
    // 添加产品及其模块
    productModules.forEach((product) => {
      const productReqCount = requirements.filter(r => r.productId === product.id).length
      items.push({
        id: `product-${product.id}`,
        name: product.name,
        icon: <AppstoreOutlined style={{ color: "#22d3ee", fontSize: 13 }} />,
        count: productReqCount,
        activeColor: "#22d3ee",
        children: product.modules.map((mod): SidebarItem => ({
          id: `module-${mod.id}`,
          name: mod.name,
          icon: <FolderOutlined style={{ color: "#a78bfa", fontSize: 12 }} />,
          count: requirements.filter(r => r.moduleId === mod.id).length,
          activeColor: "#a78bfa",
        })),
        expanded: expandedProductIds.includes(product.id),
        onToggleExpand: () => {
          setExpandedProductIds(prev => 
            prev.includes(product.id) 
              ? prev.filter(id => id !== product.id)
              : [...prev, product.id]
          )
        },
      })
    })
    
    // 添加未分类（没有产品关联的需求）
    const unassignedCount = requirements.filter(r => !r.productId).length
    if (unassignedCount > 0) {
      items.push({
        id: "unassigned",
        name: "未分类",
        icon: <FileTextOutlined style={{ color: "#f59e0b", fontSize: 13 }} />,
        count: unassignedCount,
        activeColor: "#f59e0b",
        activeBg: "#fef3c7",
      })
    }
    
    return items
  }
  
  // 处理侧边栏选择
  const handleSidebarSelect = (id: string | null) => {
    if (id === null) {
      setSelectedProductId(null)
      setSelectedModuleId(null)
    } else if (id === "unassigned") {
      setSelectedProductId("unassigned")
      setSelectedModuleId(null)
    } else if (id.startsWith("product-")) {
      setSelectedProductId(id.replace("product-", ""))
      setSelectedModuleId(null)
    } else if (id.startsWith("module-")) {
      setSelectedModuleId(id.replace("module-", ""))
      // 找到对应的产品
      const product = productModules.find(p => p.modules.some(m => m.id === id.replace("module-", "")))
      if (product) {
        setSelectedProductId(product.id)
      }
    }
  }
  
  // 获取当前选中的侧边栏 ID
  const getCurrentSidebarId = () => {
    if (selectedModuleId) return `module-${selectedModuleId}`
    if (selectedProductId === "unassigned") return "unassigned"
    if (selectedProductId) return `product-${selectedProductId}`
    return null
  }

  // 批量操作
  const batchActions: BatchAction[] = [
    {
      key: "moveSprint",
      label: "移入迭代",
      icon: <RocketOutlined />,
      onClick: (keys) => {
        message.info(`将 ${keys.length} 条需求移入迭代`)
        setSelectedRowKeys([])
      },
    },
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
            loadRequirements()
          },
        })
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
  
  // 右侧操作按钮（导入 + 新建）
  const headerActions = (
    <Space size={8}>
      <Button 
        color="primary"
        variant="dashed"
        size="small"
        icon={<ImportOutlined style={{ fontSize: 12 }} />} 
        onClick={handleOpenImport}
      >
        导入
      </Button>
      <Button 
        type="primary" 
        size="small"
        icon={<span style={{ fontSize: 12 }}>+</span>}
        onClick={handleOpenCreate}
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
        <ListPageLayout<ProjectRequirement>
          showSidebar
          sidebar={{
            title: "产品模块",
            icon: <AppstoreOutlined style={{ fontSize: 14, color: "#7c7cff" }} />,
            items: buildProductSidebarItems(),
            selectedId: getCurrentSidebarId(),
            onSelect: handleSidebarSelect,
          }}
          content={{
            title: "项目需求",
            icon: <UnorderedListOutlined style={{ fontSize: 14, color: "#7c7cff" }} />,
            columns: columns,
            dataSource: requirements.slice((currentPage - 1) * pageSize, currentPage * pageSize),
            rowKey: "id",
            loading: tableLoading,
            searchPlaceholder: "搜索需求标题...",
            searchValue: searchQuery,
            onSearch: setSearchQuery,
            headerActions: headerActions,
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
            batchActions: batchActions,
            rowSelection: {
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            },
          }}
        />
      </div>

      {/* 创建需求弹窗 */}
      <Modal 
        title="创建项目需求" 
        open={isCreateOpen} 
        onCancel={() => { setIsCreateOpen(false); form.resetFields() }} 
        onOk={handleCreate} 
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
              <Form.Item name="requirementType" label="需求类型">
                <Select 
                  allowClear 
                  placeholder="选择类型"
                  options={[
                    { value: "FEATURE", label: "功能" },
                    { value: "OPTIMIZATION", label: "优化" },
                    { value: "SECURITY", label: "安全" },
                    { value: "TECH_IMPROVEMENT", label: "技改" },
                  ]} 
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sprintId" label="所属迭代">
                <Select 
                  allowClear 
                  placeholder="选择迭代"
                  options={project?.sprints.map(s => ({ value: s.id, label: s.name })) || []} 
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 导入产品需求弹窗 */}
      <Modal 
        title="从产品导入需求" 
        open={isImportOpen} 
        onCancel={() => { 
          setIsImportOpen(false)
          setImportSelectedKeys([])
          setImportSelectedProduct(null)
          setImportRequirements([])
        }} 
        onOk={handleImport} 
        okText={`导入 (${importSelectedKeys.length})`}
        cancelText="取消" 
        confirmLoading={submitting} 
        width={800}
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong>选择产品：</Text>
            <Select
              style={{ width: 300, marginLeft: 12 }}
              placeholder="选择要导入需求的产品"
              value={importSelectedProduct}
              onChange={handleProductChange}
              loading={importLoading}
              options={importProducts.map(p => ({ value: p.id, label: `${p.name} (${p.code})` }))}
            />
          </div>
          
          {importSelectedProduct && (
            <Table
              size="small"
              loading={importLoading}
              dataSource={importRequirements}
              rowKey="id"
              rowSelection={{
                selectedRowKeys: importSelectedKeys,
                onChange: setImportSelectedKeys,
                getCheckboxProps: (record: Requirement) => ({
                  // 已导入到当前项目的需求禁用选择
                  disabled: record.projectId === projectId,
                }),
              }}
              columns={[
                { 
                  title: "编号", 
                  dataIndex: "id", 
                  width: 90,
                  render: (id: string) => (
                    <Text type="secondary" style={{ fontFamily: "monospace", fontSize: 12 }}>
                      {id.slice(-8)}
                    </Text>
                  ),
                },
                { title: "标题", dataIndex: "title", ellipsis: true },
                { title: "模块", dataIndex: "moduleName", width: 100, render: (v: string) => v || "-" },
                { title: "优先级", dataIndex: "priority", width: 70, render: (v: string) => <Tag color={getPriorityColor(v)}>{v}</Tag> },
                { title: "状态", dataIndex: "status", width: 80, render: (v: string) => {
                  const info = getStatusInfo(v)
                  return <Tag color={info.color}>{info.label}</Tag>
                }},
                { 
                  title: "导入状态", 
                  dataIndex: "projectId", 
                  width: 90,
                  render: (pid: string | null) => {
                    if (pid === projectId) {
                      return <Tag color="success" icon={<CheckCircleOutlined />}>已导入</Tag>
                    }
                    if (pid) {
                      return <Tag color="warning">已关联其他项目</Tag>
                    }
                    return <Tag>未导入</Tag>
                  },
                },
              ]}
              pagination={{ pageSize: 10 }}
              scroll={{ y: 300 }}
              locale={{ emptyText: <Empty description="该产品暂无需求" /> }}
            />
          )}
          
          {!importSelectedProduct && (
            <Empty description="请先选择产品" />
          )}
        </div>
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
        defaultProjectId={projectId}
        sprints={project?.sprints.map(s => ({ value: s.id, label: s.name })) || []}
        onSuccess={() => loadRequirements()}
      />
    </>
  )
}
