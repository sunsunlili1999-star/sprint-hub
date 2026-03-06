"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Card,
  Input,
  Button,
  Space,
  Tag,
  Avatar,
  Dropdown,
  Modal,
  Form,
  Row,
  Col,
  Typography,
  Empty,
  Skeleton,
  Spin,
  message,
} from "antd"
import {
  SearchOutlined,
  PlusOutlined,
  StarOutlined,
  StarFilled,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  LoadingOutlined,
} from "@ant-design/icons"
import type { MenuProps } from "antd"
import { useBreadcrumb } from "@/components/layout/main-layout"
import { productApi, type Product } from "@/lib/api"

const { Text, Paragraph } = Typography

// Product card component
function ProductCard({ 
  product, 
  onEdit, 
  onDelete,
  onToggleStar,
}: { 
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onToggleStar: (product: Product) => void
}) {
  const getDropdownItems = (): MenuProps["items"] => [
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "编辑产品",
      onClick: () => onEdit(product),
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "删除产品",
      danger: true,
      onClick: () => onDelete(product),
    },
  ]

  return (
    <Card hoverable style={{ height: "100%", borderColor: "#e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <Link href={`/products/${product.id}`} style={{ flex: 1, minWidth: 0 }}>
          <Space align="start">
            <Avatar
              shape="square"
              size={40}
              style={{
                background: "linear-gradient(135deg, #22d3ee 0%, #7c7cff 100%)",
                flexShrink: 0,
              }}
              icon={<AppstoreOutlined />}
            />
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ fontSize: 15, color: "#475569" }}>
                {product.name}
              </Text>
              <br />
              <Tag style={{ marginTop: 4 }}>{product.code}</Tag>
            </div>
          </Space>
        </Link>
        <Space size={4}>
          <Button
            type="text"
            size="small"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleStar(product)
            }}
            icon={
              product.starred ? (
                <StarFilled style={{ color: "#faad14" }} />
              ) : (
                <StarOutlined />
              )
            }
          />
          <Dropdown menu={{ items: getDropdownItems() }} trigger={["click"]}>
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      </div>

      <Paragraph
        type="secondary"
        ellipsis={{ rows: 2 }}
        style={{ marginBottom: 16, minHeight: 44 }}
      >
        {product.description || "暂无描述"}
      </Paragraph>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Space size={8}>
          <Avatar
            size="small"
            style={{
              background: "#a5b4fc",
            }}
          >
            {product.owner?.name?.[0] || "?"}
          </Avatar>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {product.owner?.name || "未知"}
          </Text>
        </Space>
        <Space size={4}>
          <FileTextOutlined style={{ color: "#64748b", fontSize: 13 }} />
          <Text type="secondary" style={{ fontSize: 13 }}>
            {product.requirementCount} 需求
          </Text>
        </Space>
      </div>
    </Card>
  )
}

export default function ProductsPage() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "starred">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setBreadcrumbs([{ title: "产品管理" }])
  }, [setBreadcrumbs])

  // 加载产品列表
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await productApi.getList({
        search: searchQuery,
        starred: filter === "starred",
      })
      setProducts(data)
    } catch (error) {
      message.error("加载产品列表失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filter])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // 过滤产品（本地过滤收藏）
  const filteredProducts = products.filter((product) => {
    if (filter === "starred") return product.starred
    return true
  })

  // 创建产品
  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await productApi.create(values)
      message.success("创建成功")
      setIsCreateOpen(false)
      form.resetFields()
      loadProducts()
    } catch (error: any) {
      if (error.message) {
        message.error(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // 编辑产品
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    editForm.setFieldsValue({
      name: product.name,
      code: product.code,
      description: product.description,
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingProduct) return
    try {
      const values = await editForm.validateFields()
      setSubmitting(true)
      await productApi.update(editingProduct.id, values)
      message.success("更新成功")
      setIsEditOpen(false)
      setEditingProduct(null)
      editForm.resetFields()
      loadProducts()
    } catch (error: any) {
      if (error.message) {
        message.error(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // 切换收藏状态
  const handleToggleStar = async (product: Product) => {
    try {
      const result = await productApi.toggleStar(product.id)
      // 更新本地状态
      setProducts(prev => 
        prev.map(p => 
          p.id === product.id ? { ...p, starred: result.starred } : p
        )
      )
      message.success(result.starred ? "已收藏" : "已取消收藏")
    } catch (error) {
      message.error("操作失败")
      console.error(error)
    }
  }

  // 删除产品
  const handleDelete = (product: Product) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除产品「${product.name}」吗？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await productApi.delete(product.id)
          message.success("删除成功")
          loadProducts()
        } catch (error: any) {
          message.error(error.message || "删除失败")
        }
      },
    })
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 工具栏 */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between" }}>
        <Space size={16}>
          <Input
            placeholder="搜索产品..."
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={() => loadProducts()}
            allowClear
          />
          <Button.Group>
            <Button
              type={filter === "all" ? "primary" : "default"}
              onClick={() => setFilter("all")}
            >
              全部
            </Button>
            <Button
              type={filter === "starred" ? "primary" : "default"}
              icon={<StarFilled style={{ color: "#faad14" }} />}
              onClick={() => setFilter("starred")}
            >
              已收藏
            </Button>
          </Button.Group>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
          新建产品
        </Button>
      </div>

      {/* 产品卡片 */}
      {loading ? (
        <Row gutter={[20, 20]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Col key={i} xs={24} sm={12} lg={8} xl={6}>
              <Card style={{ height: "100%", borderColor: "#e2e8f0" }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <Skeleton.Avatar active size={40} shape="square" />
                  <div style={{ flex: 1 }}>
                    <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 8 }} />
                    <Skeleton.Button active size="small" style={{ width: 60, height: 22 }} />
                  </div>
                </div>
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                  <Space>
                    <Skeleton.Avatar active size="small" />
                    <Skeleton.Input active size="small" style={{ width: 60 }} />
                  </Space>
                  <Skeleton.Input active size="small" style={{ width: 60 }} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : filteredProducts.length > 0 ? (
        <Row gutter={[20, 20]}>
          {filteredProducts.map((product) => (
            <Col key={product.id} xs={24} sm={12} lg={8} xl={6}>
              <ProductCard 
                product={product} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={searchQuery ? "没有找到匹配的产品" : "暂无产品"}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            创建第一个产品
          </Button>
        </Empty>
      )}

      {/* 创建产品弹窗 */}
      <Modal
        title="创建新产品"
        open={isCreateOpen}
        onCancel={() => {
          setIsCreateOpen(false)
          form.resetFields()
        }}
        onOk={handleCreate}
        okText="创建"
        cancelText="取消"
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="产品名称"
            rules={[{ required: true, message: "请输入产品名称" }]}
          >
            <Input placeholder="输入产品名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="产品编码"
            rules={[{ required: true, message: "请输入产品编码" }]}
          >
            <Input placeholder="如: UC, PAY (唯一标识)" />
          </Form.Item>
          <Form.Item name="description" label="产品描述">
            <Input.TextArea rows={3} placeholder="简要描述产品定位和目标" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑产品弹窗 */}
      <Modal
        title="编辑产品"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false)
          setEditingProduct(null)
          editForm.resetFields()
        }}
        onOk={handleEditSubmit}
        okText="保存"
        cancelText="取消"
        confirmLoading={submitting}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="产品名称"
            rules={[{ required: true, message: "请输入产品名称" }]}
          >
            <Input placeholder="输入产品名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="产品编码"
            rules={[{ required: true, message: "请输入产品编码" }]}
          >
            <Input placeholder="如: UC, PAY (唯一标识)" />
          </Form.Item>
          <Form.Item name="description" label="产品描述">
            <Input.TextArea rows={3} placeholder="简要描述产品定位和目标" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
