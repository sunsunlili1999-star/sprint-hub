"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Checkbox,
  Empty,
  Spin,
  message,
  Steps,
  Card,
  Avatar,
  Alert,
} from "antd"
import {
  RocketOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import { releaseApi, projectRequirementApi, type Project, type ProjectRequirement } from "@/lib/api"

const { Text, Title } = Typography
const { TextArea } = Input

// 优先级配置
const priorityConfig: Record<string, { color: string; label: string }> = {
  P0: { color: "#ef4444", label: "P0" },
  P1: { color: "#f97316", label: "P1" },
  P2: { color: "#eab308", label: "P2" },
  P3: { color: "#3b82f6", label: "P3" },
  P4: { color: "#94a3b8", label: "P4" },
}

// 状态配置
const statusConfig: Record<string, { color: string; label: string }> = {
  NOT_STARTED: { color: "#94a3b8", label: "未开始" },
  IN_PROGRESS: { color: "#3b82f6", label: "进行中" },
  COMPLETED: { color: "#10b981", label: "已完成" },
}

interface CreateReleaseModalProps {
  open: boolean
  projects: Project[]
  onCancel: () => void
  onSuccess: () => void
}

export function CreateReleaseModal({ open, projects, onCancel, onSuccess }: CreateReleaseModalProps) {
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([])
  const [loadingRequirements, setLoadingRequirements] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [searchText, setSearchText] = useState("")

  const selectedProjectId = Form.useWatch("projectId", form)

  // 加载项目需求
  const loadRequirements = useCallback(async () => {
    if (!selectedProjectId) {
      setRequirements([])
      return
    }

    try {
      setLoadingRequirements(true)
      const data = await projectRequirementApi.getList(selectedProjectId)
      setRequirements(data)
    } catch (error) {
      console.error("加载需求失败", error)
      message.error("加载需求失败")
    } finally {
      setLoadingRequirements(false)
    }
  }, [selectedProjectId])

  useEffect(() => {
    if (currentStep === 1 && selectedProjectId) {
      loadRequirements()
    }
  }, [currentStep, selectedProjectId, loadRequirements])

  // 重置表单
  useEffect(() => {
    if (!open) {
      form.resetFields()
      setCurrentStep(0)
      setSelectedRowKeys([])
      setRequirements([])
      setSearchText("")
    }
  }, [open, form])

  // 过滤需求
  const filteredRequirements = requirements.filter((req) =>
    req.title.toLowerCase().includes(searchText.toLowerCase())
  )

  // 下一步
  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields(["name", "projectId", "plannedDate"])
        setCurrentStep(1)
      } catch {
        // 表单验证失败
      }
    } else if (currentStep === 1) {
      setCurrentStep(2)
    }
  }

  // 上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  // 提交创建
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      await releaseApi.create({
        name: values.name,
        description: values.description,
        projectId: values.projectId,
        plannedDate: values.plannedDate.format("YYYY-MM-DD"),
        ownerId: values.ownerId,
        requirementIds: selectedRowKeys,
        riskLevel: values.riskLevel || "LOW",
        riskDescription: values.riskDescription,
      })

      message.success("创建发布成功")
      onSuccess()
    } catch (error) {
      console.error("创建发布失败", error)
      message.error("创建发布失败")
    } finally {
      setLoading(false)
    }
  }

  // 需求表格列
  const requirementColumns = [
    {
      title: "需求",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: ProjectRequirement) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{title}</Text>
          {record.productName && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.productName} {record.moduleName && `/ ${record.moduleName}`}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority",
      width: 80,
      render: (priority: string) => {
        const config = priorityConfig[priority] || priorityConfig.P2
        return (
          <Tag style={{ margin: 0, background: `${config.color}15`, color: config.color, border: "none" }}>
            {config.label}
          </Tag>
        )
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status] || statusConfig.NOT_STARTED
        return (
          <Tag style={{ margin: 0, background: `${config.color}15`, color: config.color, border: "none" }}>
            {config.label}
          </Tag>
        )
      },
    },
    {
      title: "进度",
      key: "progress",
      width: 100,
      render: (_: unknown, record: ProjectRequirement) => (
        <Text style={{ fontSize: 12 }}>
          {record.progress}%
        </Text>
      ),
    },
    {
      title: "负责人",
      dataIndex: "assignee",
      key: "assignee",
      width: 100,
      render: (assignee: ProjectRequirement["assignee"]) =>
        assignee ? (
          <Space size={4}>
            <Avatar size={20} src={assignee.avatar} style={{ background: "#c4b5fd" }}>
              {assignee.name?.[0]}
            </Avatar>
            <Text style={{ fontSize: 12 }}>{assignee.name}</Text>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
        ),
    },
  ]

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ padding: "20px 0" }}>
            <Form.Item
              name="name"
              label="发布名称"
              rules={[{ required: true, message: "请输入发布名称" }]}
            >
              <Input placeholder="例如：v2.0.0 功能发布" size="large" />
            </Form.Item>

            <Form.Item
              name="projectId"
              label="所属项目"
              rules={[{ required: true, message: "请选择项目" }]}
            >
              <Select
                placeholder="选择项目"
                size="large"
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Form.Item>

            <Form.Item
              name="plannedDate"
              label="计划发布日期"
              rules={[{ required: true, message: "请选择发布日期" }]}
            >
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                placeholder="选择计划发布日期"
                disabledDate={(current) => current && current < dayjs().startOf("day")}
              />
            </Form.Item>

            <Form.Item name="description" label="发布说明">
              <TextArea rows={3} placeholder="描述本次发布的内容和目标..." />
            </Form.Item>

            <Form.Item name="riskLevel" label="风险等级" initialValue="LOW">
              <Select
                size="large"
                options={[
                  { value: "LOW", label: "低风险" },
                  { value: "MEDIUM", label: "中风险" },
                  { value: "HIGH", label: "高风险" },
                ]}
              />
            </Form.Item>

            <Form.Item name="riskDescription" label="风险说明">
              <TextArea rows={2} placeholder="描述可能存在的风险..." />
            </Form.Item>
          </div>
        )

      case 1:
        return (
          <div style={{ padding: "20px 0" }}>
            <div style={{ marginBottom: 16 }}>
              <Input
                placeholder="搜索需求..."
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Text type="secondary" style={{ marginLeft: 16, fontSize: 13 }}>
                已选择 <Text strong style={{ color: "#7c7cff" }}>{selectedRowKeys.length}</Text> 个需求
              </Text>
            </div>

            {loadingRequirements ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <Spin size="large" />
              </div>
            ) : filteredRequirements.length === 0 ? (
              <Empty description="暂无可选需求" style={{ padding: 60 }} />
            ) : (
              <Table
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys as string[]),
                }}
                columns={requirementColumns}
                dataSource={filteredRequirements}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
                scroll={{ y: 400 }}
              />
            )}
          </div>
        )

      case 2:
        const formValues = form.getFieldsValue()
        const selectedProject = projects.find((p) => p.id === formValues.projectId)
        const selectedRequirements = requirements.filter((r) => selectedRowKeys.includes(r.id))

        return (
          <div style={{ padding: "20px 0" }}>
            <Alert
              type="info"
              icon={<RocketOutlined />}
              message="确认发布信息"
              description="请确认以下发布信息无误后点击创建"
              style={{ marginBottom: 24, borderRadius: 8 }}
              showIcon
            />

            <Card
              size="small"
              style={{ marginBottom: 16, borderRadius: 12 }}
              styles={{ body: { padding: 16 } }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    发布名称
                  </Text>
                  <Text strong>{formValues.name}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    所属项目
                  </Text>
                  <Text strong>{selectedProject?.name}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    计划发布日期
                  </Text>
                  <Text strong>
                    <CalendarOutlined style={{ marginRight: 6 }} />
                    {formValues.plannedDate?.format("YYYY-MM-DD")}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    风险等级
                  </Text>
                  <Tag
                    color={
                      formValues.riskLevel === "HIGH"
                        ? "red"
                        : formValues.riskLevel === "MEDIUM"
                        ? "orange"
                        : "green"
                    }
                  >
                    {formValues.riskLevel === "HIGH"
                      ? "高风险"
                      : formValues.riskLevel === "MEDIUM"
                      ? "中风险"
                      : "低风险"}
                  </Tag>
                </div>
              </div>
              {formValues.description && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    发布说明
                  </Text>
                  <Text>{formValues.description}</Text>
                </div>
              )}
            </Card>

            <Card
              size="small"
              title={
                <Space>
                  <FileTextOutlined />
                  <span>包含需求 ({selectedRequirements.length})</span>
                </Space>
              }
              style={{ borderRadius: 12 }}
              styles={{ body: { padding: 0 } }}
            >
              {selectedRequirements.length === 0 ? (
                <Empty description="未选择任何需求" style={{ padding: 40 }} />
              ) : (
                <div style={{ maxHeight: 300, overflow: "auto" }}>
                  {selectedRequirements.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <Text style={{ fontSize: 13 }}>{req.title}</Text>
                        {req.productName && (
                          <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                            {req.productName}
                          </Text>
                        )}
                      </div>
                      <Space>
                        <Tag
                          style={{
                            margin: 0,
                            background: `${priorityConfig[req.priority]?.color}15`,
                            color: priorityConfig[req.priority]?.color,
                            border: "none",
                          }}
                        >
                          {req.priority}
                        </Tag>
                        <Tag
                          style={{
                            margin: 0,
                            background: `${statusConfig[req.status]?.color}15`,
                            color: statusConfig[req.status]?.color,
                            border: "none",
                          }}
                        >
                          {statusConfig[req.status]?.label}
                        </Tag>
                      </Space>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <RocketOutlined style={{ fontSize: 18 }} />
          </div>
          <div>
            <Title level={5} style={{ margin: 0 }}>创建发布</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>规划新的版本发布</Text>
          </div>
        </div>
      }
      width={800}
      onCancel={onCancel}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button onClick={onCancel}>取消</Button>
          <Space>
            {currentStep > 0 && <Button onClick={handlePrev}>上一步</Button>}
            {currentStep < 2 ? (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                loading={loading}
                onClick={handleSubmit}
                style={{
                  background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                  border: "none",
                }}
              >
                创建发布
              </Button>
            )}
          </Space>
        </div>
      }
      styles={{
        header: { borderBottom: "1px solid #f1f5f9", paddingBottom: 16 },
        body: { padding: "0 24px" },
      }}
    >
      <Steps
        current={currentStep}
        size="small"
        style={{ marginTop: 24, marginBottom: 8 }}
        items={[
          { title: "基本信息", icon: <FileTextOutlined /> },
          { title: "选择需求", icon: <CheckCircleOutlined /> },
          { title: "确认发布", icon: <RocketOutlined /> },
        ]}
      />

      <Form form={form} layout="vertical">
        {renderStepContent()}
      </Form>
    </Modal>
  )
}
