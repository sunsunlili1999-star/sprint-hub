"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Avatar,
  Button,
  Space,
  Tag,
  Typography,
  Dropdown,
  Modal,
  Upload,
  Input,
  Select,
  message,
} from "antd"
import type { TableProps } from "antd"
import {
  DeleteOutlined,
  MoreOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FileZipOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  CloseOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HolderOutlined,
} from "@ant-design/icons"
import { ListPageLayout, type BatchAction } from "@/components/ui/ListPageLayout"
import { 
  documentApi, 
  type Document as DocType,
  type FilterCondition,
  type SortCondition,
} from "@/lib/api"

const { Text } = Typography

// 筛选字段配置
const filterFields = [
  { value: "name", label: "文件名", type: "text" },
  { value: "fileType", label: "文件类型", type: "select", options: [
    { value: "pdf", label: "PDF" },
    { value: "docx", label: "Word" },
    { value: "xlsx", label: "Excel" },
    { value: "pptx", label: "PPT" },
    { value: "png", label: "PNG图片" },
    { value: "jpg", label: "JPG图片" },
    { value: "zip", label: "压缩包" },
    { value: "md", label: "Markdown" },
    { value: "txt", label: "文本" },
  ]},
  { value: "uploaderName", label: "上传人", type: "text" },
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
  { value: "name", label: "文件名" },
  { value: "fileType", label: "文件类型" },
  { value: "fileSize", label: "文件大小" },
  { value: "uploaderName", label: "上传人" },
  { value: "createdAt", label: "上传时间" },
]

// 文件图标
const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf": return <FilePdfOutlined style={{ color: "#ef4444", fontSize: 18 }} />
    case "docx": case "doc": return <FileTextOutlined style={{ color: "#3b82f6", fontSize: 18 }} />
    case "xlsx": case "xls": return <FileExcelOutlined style={{ color: "#22c55e", fontSize: 18 }} />
    case "zip": case "rar": return <FileZipOutlined style={{ color: "#f59e0b", fontSize: 18 }} />
    case "png": case "jpg": case "jpeg": case "gif": case "svg": return <FileImageOutlined style={{ color: "#8b5cf6", fontSize: 18 }} />
    case "ppt": case "pptx": return <FileTextOutlined style={{ color: "#f97316", fontSize: 18 }} />
    case "md": case "txt": return <FileTextOutlined style={{ color: "#64748b", fontSize: 18 }} />
    default: return <FileTextOutlined style={{ color: "#94a3b8", fontSize: 18 }} />
  }
}

interface ProductDocumentsTabProps {
  productId: string
  documents: DocType[]
}

export function ProductDocumentsTab({ 
  productId, 
  documents: initialDocuments,
}: ProductDocumentsTabProps) {
  const router = useRouter()
  
  // 数据状态
  const [documents, setDocuments] = useState<DocType[]>(initialDocuments)
  
  // 加载状态
  const [tableLoading, setTableLoading] = useState(false)
  
  // UI 状态
  const [docSearchQuery, setDocSearchQuery] = useState("")
  const [selectedDocKeys, setSelectedDocKeys] = useState<React.Key[]>([])
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false)
  
  // 筛选状态
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

  // 同步初始数据
  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  // 判断是否有筛选条件
  const hasFilters = docSearchQuery || appliedFilters.length > 0 || appliedSorts.length > 0

  // 加载文档列表 - 只在有筛选条件时才请求API
  const loadDocuments = useCallback(async () => {
    // 没有筛选条件时，使用初始数据
    if (!docSearchQuery && appliedFilters.length === 0 && appliedSorts.length === 0) {
      setDocuments(initialDocuments)
      return
    }
    
    try {
      setTableLoading(true)
      const data = await documentApi.getList(productId, {
        search: docSearchQuery,
        filters: appliedFilters.length > 0 ? appliedFilters : undefined,
        sorts: appliedSorts.length > 0 ? appliedSorts : undefined,
      })
      setDocuments(data)
    } catch (error) {
      console.error(error)
    } finally {
      setTableLoading(false)
    }
  }, [productId, docSearchQuery, appliedFilters, appliedSorts, initialDocuments])

  // 只在筛选条件变化时重新加载
  useEffect(() => {
    if (hasFilters) {
      loadDocuments()
    }
  }, [docSearchQuery, appliedFilters, appliedSorts]) // eslint-disable-line react-hooks/exhaustive-deps

  // 删除文档
  const handleDeleteDocument = (doc: DocType) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除文档「${doc.name}」吗？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await documentApi.delete(productId, doc.id)
          message.success("删除成功")
          if (hasFilters) {
            loadDocuments()
          } else {
            router.refresh()
          }
        } catch (error: any) {
          message.error(error.message || "删除失败")
        }
      },
    })
  }

  // 筛选和排序工具栏
  const filterToolbar = (
    <Space size={0}>
      <Button 
        type="text"
        size="small"
        icon={<FilterOutlined />} 
        className={`toolbar-text-btn ${appliedFilters.length > 0 ? "active" : ""}`}
        onClick={() => {
          setFilterConditions(appliedFilters.length > 0 ? [...appliedFilters] : [{ id: Date.now().toString(), logic: "AND", field: "name", operator: "contains", value: "" }])
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

  // 文档表格列
  const documentColumns: TableProps<DocType>["columns"] = [
    {
      title: "文件名",
      dataIndex: "name",
      render: (name: string, record: DocType) => (
        <Space>
          {getFileIcon(record.type)}
          <Text style={{ cursor: "pointer" }}>{name}</Text>
        </Space>
      ),
    },
    { title: "大小", dataIndex: "size", width: 100 },
    {
      title: "上传人",
      dataIndex: "uploadedBy",
      width: 120,
      render: (user: { name: string }) => (
        <Space size={8}>
          <Avatar size="small" style={{ background: "#a5b4fc" }}>
            {user?.name?.[0] || "?"}
          </Avatar>
          <Text>{user?.name || "未知"}</Text>
        </Space>
      ),
    },
    { title: "上传时间", dataIndex: "uploadedAt", width: 120 },
    {
      title: "操作",
      width: 100,
      render: (_: unknown, record: DocType) => (
        <Space>
          <Button type="text" icon={<DownloadOutlined />} />
          <Dropdown
            menu={{
              items: [
                { key: "preview", icon: <EyeOutlined />, label: "预览" },
                { key: "download", icon: <DownloadOutlined />, label: "下载" },
                { type: "divider" },
                { key: "delete", icon: <DeleteOutlined />, label: "删除", danger: true, onClick: () => handleDeleteDocument(record) },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ]

  // 文档批量操作
  const documentBatchActions: BatchAction[] = [
    {
      key: "delete",
      label: "批量删除",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: (keys) => {
        Modal.confirm({
          title: "确认删除",
          content: `确定要删除选中的 ${keys.length} 个文档吗？`,
          okText: "删除",
          okType: "danger",
          cancelText: "取消",
          onOk: async () => {
            message.success(`已删除 ${keys.length} 个文档`)
            setSelectedDocKeys([])
            if (hasFilters) {
              loadDocuments()
            } else {
              router.refresh()
            }
          },
        })
      },
    },
    {
      key: "download",
      label: "批量下载",
      icon: <DownloadOutlined />,
      onClick: (keys) => {
        message.success(`已下载 ${keys.length} 个文档`)
      },
    },
  ]

  return (
    <>
      <ListPageLayout<DocType>
        content={{
          title: "文档列表",
          icon: <FileTextOutlined style={{ fontSize: 14, color: "#7c7cff" }} />,
          columns: documentColumns,
          dataSource: documents.slice((currentPage - 1) * pageSize, currentPage * pageSize),
          rowKey: "id",
          loading: tableLoading,
          searchPlaceholder: "搜索文档...",
          searchValue: docSearchQuery,
          onSearch: setDocSearchQuery,
          onAdd: () => setIsUploadDocOpen(true),
          addButtonText: "上传",
          extraToolbar: filterToolbar,
          pagination: {
            current: currentPage,
            pageSize: pageSize,
            total: documents.length,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          },
          batchActions: documentBatchActions,
          rowSelection: {
            selectedRowKeys: selectedDocKeys,
            onChange: setSelectedDocKeys,
          },
        }}
      />

      {/* Upload Document Modal */}
      <Modal title="上传文档" open={isUploadDocOpen} onCancel={() => setIsUploadDocOpen(false)} footer={null}>
        <Upload.Dragger style={{ marginTop: 16 }}>
          <p className="ant-upload-drag-icon"><UploadOutlined style={{ fontSize: 48, color: "#7c7cff" }} /></p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持 PDF、Word、Excel、图片等格式</p>
        </Upload.Dragger>
      </Modal>

      {/* 高级筛选 Modal */}
      <Modal 
        title="高级筛选" 
        open={isFilterModalOpen} 
        onCancel={() => setIsFilterModalOpen(false)} 
        width={700}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setFilterConditions([{ id: Date.now().toString(), logic: "AND", field: "name", operator: "contains", value: "" }])}>
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
                { id: Date.now().toString(), logic: "AND", field: "name", operator: "contains", value: "" }
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
                    value={sort.field || undefined}
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
              setSortConditions([
                ...sortConditions, 
                { id: Date.now().toString(), field: nextField?.value || "", order: "desc" }
              ])
            }}
            disabled={sortConditions.length >= sortableFields.length}
            style={{ marginTop: 12, width: "100%" }}
          >
            添加排序字段
          </Button>
        </div>
      </Modal>
    </>
  )
}
