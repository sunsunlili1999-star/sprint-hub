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
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Empty,
  Skeleton,
  message,
  Tooltip,
} from "antd"
import {
  SearchOutlined,
  PlusOutlined,
  StarOutlined,
  StarFilled,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ProjectOutlined,
  FileTextOutlined,
  CalendarOutlined,
  RocketOutlined,
} from "@ant-design/icons"
import type { MenuProps } from "antd"
import dayjs from "dayjs"
import { useBreadcrumb } from "@/components/layout/main-layout"
import { projectApi, productApi, type Project, type Product } from "@/lib/api"

const { Text, Paragraph } = Typography
const { RangePicker } = DatePicker

// 项目状态颜色
const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "进行中", color: "processing" },
  ARCHIVED: { label: "已归档", color: "default" },
}

// Project card component
function ProjectCard({ 
  project, 
  onEdit, 
  onDelete,
  onToggleStar,
}: { 
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onToggleStar: (project: Project) => void
}) {
  const getDropdownItems = (): MenuProps["items"] => [
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "编辑项目",
      onClick: () => onEdit(project),
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "删除项目",
      danger: true,
      onClick: () => onDelete(project),
    },
  ]

  const statusInfo = statusConfig[project.status] || { label: project.status, color: "default" }

  return (
    <Card hoverable style={{ height: "100%", borderColor: "#e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <Link href={`/projects/${project.id}`} style={{ flex: 1, minWidth: 0 }}>
          <Space align="start">
            <Avatar
              shape="square"
              size={40}
              style={{
                background: "linear-gradient(135deg, #7c7cff 0%, #a78bfa 100%)",
                flexShrink: 0,
              }}
              icon={<ProjectOutlined />}
            />
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ fontSize: 15, color: "#475569" }}>
                {project.name}
              </Text>
              <br />
              <Space size={4} style={{ marginTop: 4 }}>
                <Tag>{project.code}</Tag>
                <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
              </Space>
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
              onToggleStar(project)
            }}
            icon={
              project.starred ? (
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
        style={{ marginBottom: 12, minHeight: 44 }}
      >
        {project.description || "暂无描述"}
      </Paragraph>

      {/* 关联产品 */}
      {project.products && project.products.length > 0 && (
        <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 4 }}>
          {project.products.map(p => (
            <Tag key={p.id} color="purple" style={{ margin: 0 }}>
              {p.name}
            </Tag>
          ))}
        </div>
      )}

      {/* 日期 */}
      {(project.startDate || project.endDate) && (
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <CalendarOutlined style={{ color: "#64748b", fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {project.startDate || "?"} ~ {project.endDate || "?"}
          </Text>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* 团队成员 */}
        <Avatar.Group max={{ count: 4 }} size="small">
          {project.members.map((member) => (
            <Tooltip key={member.id} title={member.name}>
              <Avatar style={{ background: "#a5b4fc" }}>
                {member.name?.[0] || "?"}
              </Avatar>
            </Tooltip>
          ))}
        </Avatar.Group>

        {/* 统计 */}
        <Space size={12}>
          <Space size={4}>
            <FileTextOutlined style={{ color: "#64748b", fontSize: 13 }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              {project.requirementCount}
            </Text>
          </Space>
          <Space size={4}>
            <RocketOutlined style={{ color: "#64748b", fontSize: 13 }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              {project.sprintCount}
            </Text>
          </Space>
        </Space>
      </div>
    </Card>
  )
}

export default function ProjectsPage() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [projects, setProjects] = useState<Project[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "starred">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setBreadcrumbs([{ title: "项目管理" }])
  }, [setBreadcrumbs])

  // 加载产品列表（用于选择关联产品）
  const loadProducts = useCallback(async () => {
    try {
      const data = await productApi.getList()
      setProducts(data)
    } catch (error) {
      console.error("加载产品列表失败", error)
    }
  }, [])

  // 加载项目列表
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      const data = await projectApi.getList({
        search: searchQuery,
        starred: filter === "starred",
      })
      setProjects(data)
    } catch (error) {
      message.error("加载项目列表失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filter])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // 过滤项目
  const filteredProjects = projects.filter((project) => {
    if (filter === "starred") return project.starred
    return true
  })

  // 创建项目
  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      
      const data = {
        name: values.name,
        code: values.code,
        description: values.description,
        productIds: values.productIds,
        startDate: values.dateRange?.[0]?.format("YYYY-MM-DD"),
        endDate: values.dateRange?.[1]?.format("YYYY-MM-DD"),
      }
      
      await projectApi.create(data)
      message.success("创建成功")
      setIsCreateOpen(false)
      form.resetFields()
      loadProjects()
    } catch (error: any) {
      if (error.message) {
        message.error(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // 编辑项目
  const handleEdit = (project: Project) => {
    setEditingProject(project)
    editForm.setFieldsValue({
      name: project.name,
      code: project.code,
      description: project.description,
      productIds: project.products?.map(p => p.id) || [],
      dateRange: project.startDate && project.endDate 
        ? [dayjs(project.startDate), dayjs(project.endDate)]
        : undefined,
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingProject) return
    try {
      const values = await editForm.validateFields()
      setSubmitting(true)
      
      const data = {
        name: values.name,
        code: values.code,
        description: values.description,
        productIds: values.productIds,
        startDate: values.dateRange?.[0]?.format("YYYY-MM-DD"),
        endDate: values.dateRange?.[1]?.format("YYYY-MM-DD"),
      }
      
      await projectApi.update(editingProject.id, data)
      message.success("更新成功")
      setIsEditOpen(false)
      setEditingProject(null)
      editForm.resetFields()
      loadProjects()
    } catch (error: any) {
      if (error.message) {
        message.error(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // 切换收藏状态
  const handleToggleStar = async (project: Project) => {
    try {
      const result = await projectApi.toggleStar(project.id)
      setProjects(prev => 
        prev.map(p => 
          p.id === project.id ? { ...p, starred: result.starred } : p
        )
      )
      message.success(result.starred ? "已收藏" : "已取消收藏")
    } catch (error) {
      message.error("操作失败")
      console.error(error)
    }
  }

  // 删除项目
  const handleDelete = (project: Project) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除项目「${project.name}」吗？此操作将删除项目下所有数据。`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await projectApi.delete(project.id)
          message.success("删除成功")
          loadProjects()
        } catch (error: any) {
          message.error(error.message || "删除失败")
        }
      },
    })
  }

  // 表单项 - 产品选择
  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.name} (${p.code})`,
  }))

  return (
    <div style={{ padding: 24 }}>
      {/* 工具栏 */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between" }}>
        <Space size={16}>
          <Input
            placeholder="搜索项目..."
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={() => loadProjects()}
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
          新建项目
        </Button>
      </div>

      {/* 项目卡片 */}
      {loading ? (
        <Row gutter={[20, 20]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Col key={i} xs={24} sm={12} lg={8} xl={6}>
              <Card style={{ height: "100%", borderColor: "#e2e8f0" }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <Skeleton.Avatar active size={40} shape="square" />
                  <div style={{ flex: 1 }}>
                    <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 8 }} />
                    <Space size={4}>
                      <Skeleton.Button active size="small" style={{ width: 50, height: 22 }} />
                      <Skeleton.Button active size="small" style={{ width: 50, height: 22 }} />
                    </Space>
                  </div>
                </div>
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                  <Avatar.Group>
                    {[1, 2, 3].map(j => (
                      <Skeleton.Avatar key={j} active size="small" />
                    ))}
                  </Avatar.Group>
                  <Skeleton.Input active size="small" style={{ width: 80 }} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : filteredProjects.length > 0 ? (
        <Row gutter={[20, 20]}>
          {filteredProjects.map((project) => (
            <Col key={project.id} xs={24} sm={12} lg={8} xl={6}>
              <ProjectCard 
                project={project} 
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
          description={searchQuery ? "没有找到匹配的项目" : "暂无项目"}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            创建第一个项目
          </Button>
        </Empty>
      )}

      {/* 创建项目弹窗 */}
      <Modal
        title="创建新项目"
        open={isCreateOpen}
        onCancel={() => {
          setIsCreateOpen(false)
          form.resetFields()
        }}
        onOk={handleCreate}
        okText="创建"
        cancelText="取消"
        confirmLoading={submitting}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="项目名称"
                rules={[{ required: true, message: "请输入项目名称" }]}
              >
                <Input placeholder="输入项目名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="项目编码"
                rules={[{ required: true, message: "请输入项目编码" }]}
              >
                <Input placeholder="如: SPRINT-2024 (唯一标识)" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="productIds" label="关联产品">
            <Select
              mode="multiple"
              placeholder="选择关联的产品（可多选）"
              allowClear
              showSearch
              optionFilterProp="label"
              options={productOptions}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="项目周期">
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} placeholder="简要描述项目目标和范围" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑项目弹窗 */}
      <Modal
        title="编辑项目"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false)
          setEditingProject(null)
          editForm.resetFields()
        }}
        onOk={handleEditSubmit}
        okText="保存"
        cancelText="取消"
        confirmLoading={submitting}
        width={560}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="项目名称"
                rules={[{ required: true, message: "请输入项目名称" }]}
              >
                <Input placeholder="输入项目名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="项目编码"
                rules={[{ required: true, message: "请输入项目编码" }]}
              >
                <Input placeholder="如: SPRINT-2024 (唯一标识)" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="productIds" label="关联产品">
            <Select
              mode="multiple"
              placeholder="选择关联的产品（可多选）"
              allowClear
              showSearch
              optionFilterProp="label"
              options={productOptions}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="项目周期">
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} placeholder="简要描述项目目标和范围" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
