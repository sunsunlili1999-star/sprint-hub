"use client"

import {
  Avatar,
  Button,
  Space,
  Typography,
  Empty,
  Form,
  Input,
  Modal,
  Tag,
  List,
} from "antd"
import {
  EditOutlined,
  PlusOutlined,
  AppstoreOutlined,
  RocketOutlined,
  ProjectOutlined,
  CalendarOutlined,
} from "@ant-design/icons"
import { productApi } from "@/lib/api"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { message } from "antd"
import Link from "next/link"

const { Text, Title } = Typography

interface RelatedProject {
  id: string
  name: string
  code: string
  status: string
  startDate: string | null
  endDate: string | null
}

interface ProductInfo {
  id: string
  name: string
  code: string
  description: string | null
  status: string
  owner: { id: string; name: string; avatar: string | null }
  creator: { id: string; name: string; avatar: string | null }
  requirementCount: number
  starred: boolean
  createdAt: string
  projects?: RelatedProject[]
}

interface ProductDetailTabProps {
  product: ProductInfo
}

export function ProductDetailTab({ product }: ProductDetailTabProps) {
  const router = useRouter()
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [productForm] = Form.useForm()

  // 更新产品
  const handleUpdateProduct = async () => {
    try {
      const values = await productForm.validateFields()
      setSubmitting(true)
      await productApi.update(product.id, values)
      message.success("更新成功")
      setIsEditProductOpen(false)
      router.refresh()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
      {/* 产品信息卡片 */}
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0" }}>
        {/* 头部：产品图标、名称、编码 */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Avatar 
              shape="square" 
              size={48} 
              style={{ 
                background: "linear-gradient(135deg, #22d3ee 0%, #7c7cff 100%)", 
                borderRadius: 10,
                flexShrink: 0 
              }} 
              icon={<AppstoreOutlined style={{ fontSize: 24 }} />} 
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Title level={5} style={{ margin: 0, fontSize: 18, color: "#475569" }}>{product.name}</Title>
                <span style={{ 
                  padding: "2px 8px", 
                  background: "#f1f5f9", 
                  borderRadius: 4, 
                  fontSize: 12,
                  color: "#64748b"
                }}>
                  {product.code}
                </span>
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>{product.description || "暂无产品描述"}</Text>
            </div>
          </div>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => { productForm.setFieldsValue(product); setIsEditProductOpen(true) }}
          >
            编辑
          </Button>
        </div>
        
        {/* 产品属性信息 */}
        <div style={{ padding: "16px 24px", display: "flex", gap: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar size={28} style={{ background: "#a5b4fc", fontSize: 12 }}>
              {product.owner?.name?.[0] || "?"}
            </Avatar>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", lineHeight: 1.2 }}>负责人</Text>
              <Text style={{ fontSize: 13 }}>{product.owner?.name || "未知"}</Text>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar size={28} style={{ background: "#c4b5fd", fontSize: 12 }}>
              {product.creator?.name?.[0] || "?"}
            </Avatar>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", lineHeight: 1.2 }}>创建人</Text>
              <Text style={{ fontSize: 13 }}>{product.creator?.name || "未知"}</Text>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f8f9fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarOutlined style={{ fontSize: 14, color: "#64748b" }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", lineHeight: 1.2 }}>创建时间</Text>
              <Text style={{ fontSize: 13 }}>{product.createdAt}</Text>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f8f9fc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#7c7cff" }}>
              {product.requirementCount}
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", lineHeight: 1.2 }}>需求数量</Text>
              <Text style={{ fontSize: 13 }}>{product.requirementCount} 个</Text>
            </div>
          </div>
        </div>
      </div>

      {/* 关联项目和发布 */}
      <div style={{ flex: 1, display: "flex", gap: 16, minHeight: 0 }}>
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f9fc" }}>
            <Space size={8}><ProjectOutlined style={{ fontSize: 15, color: "#7c7cff" }} /><Text style={{ fontWeight: 500, fontSize: 14 }}>关联项目</Text><Tag>{product.projects?.length || 0}</Tag></Space>
            <Button type="link" size="small" icon={<PlusOutlined />} style={{ padding: 0, height: "auto" }}>关联</Button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            {product.projects && product.projects.length > 0 ? (
              <List
                size="small"
                dataSource={product.projects}
                renderItem={(project) => (
                  <List.Item style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <div>
                        <Link href={`/projects/${project.id}`}>
                          <Text 
                            style={{ 
                              color: "#7c7cff",
                              borderBottom: "1px dashed #7c7cff",
                              paddingBottom: 2,
                            }}
                          >
                            {project.name}
                          </Text>
                        </Link>
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{project.code}</Text>
                      </div>
                      <Tag color={project.status === "ACTIVE" ? "processing" : "default"}>
                        {project.status === "ACTIVE" ? "进行中" : "已归档"}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关联项目" />
            )}
          </div>
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f9fc" }}>
            <Space size={8}><RocketOutlined style={{ fontSize: 15, color: "#22d3ee" }} /><Text style={{ fontWeight: 500, fontSize: 14 }}>关联发布</Text></Space>
            <Button type="link" size="small" icon={<PlusOutlined />} style={{ padding: 0, height: "auto" }}>创建</Button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无发布版本" />
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      <Modal 
        title="编辑产品" 
        open={isEditProductOpen} 
        onCancel={() => setIsEditProductOpen(false)} 
        onOk={handleUpdateProduct} 
        okText="保存" 
        cancelText="取消" 
        confirmLoading={submitting}
      >
        <Form form={productForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="产品名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="产品编码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="产品描述"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
