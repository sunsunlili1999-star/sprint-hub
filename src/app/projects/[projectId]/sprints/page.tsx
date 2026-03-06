"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Empty,
  Skeleton,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Progress,
  Avatar,
  Dropdown,
} from "antd"
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
  FileTextOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import { projectApi, sprintApi, type ProjectDetail, type Sprint } from "@/lib/api"

const { Text, Title } = Typography
const { RangePicker } = DatePicker

// 迭代状态配置
const sprintStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PLANNING: { label: "规划中", color: "default", icon: <ClockCircleOutlined /> },
  IN_PROGRESS: { label: "进行中", color: "processing", icon: <SyncOutlined spin /> },
  ACTIVE: { label: "进行中", color: "processing", icon: <SyncOutlined spin /> },
  COMPLETED: { label: "已完成", color: "success", icon: <CheckCircleOutlined /> },
}

interface SprintWithCount extends Sprint {
  completedCount?: number
}

export default function ProjectSprintsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const loadProject = useCallback(async () => {
    try {
      setLoading(true)
      const data = await projectApi.getDetail(projectId)
      setProject(data)
    } catch (error) {
      console.error("加载项目失败", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  // 创建迭代
  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      
      // 调用创建迭代 API
      await sprintApi.create(projectId, {
        name: values.name,
        goal: values.goal,
        startDate: values.dateRange[0].format("YYYY-MM-DD"),
        endDate: values.dateRange[1].format("YYYY-MM-DD"),
      })
      
      message.success("创建成功")
      setIsCreateOpen(false)
      form.resetFields()
      loadProject()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 删除迭代
  const handleDelete = (sprint: { id: string; name: string }) => {
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
          loadProject()
        } catch (error: any) {
          message.error(error.message || "删除失败")
        }
      },
    })
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Row gutter={[20, 20]}>
          {[1, 2, 3, 4].map((i) => (
            <Col key={i} xs={24} sm={12} lg={8} xl={6}>
              <Card>
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  const sprints = project?.sprints || []

  return (
    <div style={{ padding: 24 }}>
      {/* 工具栏 */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between" }}>
        <Title level={5} style={{ margin: 0 }}>
          <Space>
            <RocketOutlined style={{ color: "#7c7cff" }} />
            迭代列表
            <Tag color="blue">{sprints.length}</Tag>
          </Space>
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
          新建迭代
        </Button>
      </div>

      {/* 迭代卡片 */}
      {sprints.length > 0 ? (
        <Row gutter={[20, 20]}>
          {sprints.map((sprint) => {
            const statusInfo = sprintStatusConfig[sprint.status] || sprintStatusConfig.PLANNING
            const progress = 0 // TODO: 从 API 获取进度
            const requirementCount = 0 // TODO: 从 API 获取需求数
            
            return (
              <Col key={sprint.id} xs={24} sm={12} lg={8} xl={6}>
                <Card 
                  hoverable
                  style={{ 
                    height: "100%", 
                    borderColor: sprint.status === "ACTIVE" ? "#7c7cff" : "#e2e8f0",
                    borderWidth: sprint.status === "ACTIVE" ? 2 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <Space align="start">
                      <Avatar
                        shape="square"
                        size={36}
                        style={{
                          background: sprint.status === "ACTIVE" 
                            ? "linear-gradient(135deg, #22d3ee 0%, #7c7cff 100%)"
                            : sprint.status === "COMPLETED"
                            ? "#10b981"
                            : "#94a3b8",
                          flexShrink: 0,
                        }}
                        icon={<RocketOutlined />}
                      />
                      <div style={{ minWidth: 0 }}>
                        <Text strong style={{ fontSize: 15, color: "#475569" }}>
                          {sprint.name}
                        </Text>
                        <br />
                        <Tag color={statusInfo.color} icon={statusInfo.icon} style={{ marginTop: 4 }}>
                          {statusInfo.label}
                        </Tag>
                      </div>
                    </Space>
                    <Dropdown
                      menu={{
                        items: [
                          { key: "edit", icon: <EditOutlined />, label: "编辑" },
                          { type: "divider" },
                          { key: "delete", icon: <DeleteOutlined />, label: "删除", danger: true, onClick: () => handleDelete(sprint) },
                        ],
                      }}
                      trigger={["click"]}
                    >
                      <Button type="text" size="small" icon={<MoreOutlined />} />
                    </Dropdown>
                  </div>

                  {/* 日期 */}
                  <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <CalendarOutlined style={{ color: "#64748b", fontSize: 12 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {sprint.startDate} ~ {sprint.endDate}
                    </Text>
                  </div>

                  {/* 进度 */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>完成进度</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{progress}%</Text>
                    </div>
                    <Progress 
                      percent={progress} 
                      size="small" 
                      showInfo={false}
                      strokeColor={{
                        '0%': '#22d3ee',
                        '100%': '#7c7cff',
                      }}
                      trailColor="#e2e8f0"
                    />
                  </div>

                  {/* 需求数 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <FileTextOutlined style={{ color: "#64748b", fontSize: 12 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {requirementCount} 个需求
                    </Text>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无迭代"
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            创建第一个迭代
          </Button>
        </Empty>
      )}

      {/* 创建迭代弹窗 */}
      <Modal
        title="创建迭代"
        open={isCreateOpen}
        onCancel={() => {
          setIsCreateOpen(false)
          form.resetFields()
        }}
        onOk={handleCreate}
        okText="创建"
        cancelText="取消"
        confirmLoading={submitting}
        width={480}
      >
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
      </Modal>
    </div>
  )
}
