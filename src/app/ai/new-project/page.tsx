"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Typography,
  Card,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Form,
  Input,
  Select,
  DatePicker,
  Steps,
  Divider,
  Alert,
  message,
  Upload,
  Avatar,
  List,
  Checkbox,
} from "antd"
import {
  PlusOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ProjectOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  UserOutlined,
  CalendarOutlined,
  BulbOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
} from "@ant-design/icons"

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { RangePicker } = DatePicker

// 模拟产品列表
const mockProducts = [
  { id: "1", name: "电商平台", code: "EC" },
  { id: "2", name: "数据中台", code: "DC" },
  { id: "3", name: "移动 APP", code: "APP" },
]

// 模拟团队成员
const mockMembers = [
  { id: "1", name: "张三", role: "前端开发", avatar: null },
  { id: "2", name: "李四", role: "前端开发", avatar: null },
  { id: "3", name: "王五", role: "后端开发", avatar: null },
  { id: "4", name: "赵六", role: "后端开发", avatar: null },
  { id: "5", name: "钱七", role: "测试工程师", avatar: null },
  { id: "6", name: "孙八", role: "UI设计师", avatar: null },
]

// AI 建议
const aiSuggestions = {
  name: [
    "电商平台 v2.0 开发项目",
    "Q1 产品迭代计划",
    "用户体验优化专项",
  ],
  description: "建议在描述中包含：项目背景、主要目标、预期交付物、关键里程碑等信息，有助于团队成员快速了解项目全貌。",
  team: "根据项目规模，建议配置：2-3名开发、1名测试、1名设计师，确保各环节顺畅衔接。",
}

export default function NewProjectPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [form] = Form.useForm()
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  // 下一步
  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(["name", "product", "dateRange"])
      }
      setCurrentStep(currentStep + 1)
    } catch {
      // 验证失败
    }
  }

  // 上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  // 创建项目
  const handleCreate = () => {
    setCreating(true)
    setTimeout(() => {
      setCreating(false)
      message.success("项目创建成功！正在跳转到需求上传页面...")
      router.push("/ai/upload-requirements")
    }, 1500)
  }

  // 使用 AI 建议
  const useSuggestion = (field: string, value: string) => {
    form.setFieldValue(field, value)
    message.success("已采纳 AI 建议")
  }

  // 切换成员选择
  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId))
    } else {
      setSelectedMembers([...selectedMembers, memberId])
    }
  }

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Row gutter={24}>
            <Col span={16}>
              <Card style={{ borderRadius: 12 }}>
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{
                    product: mockProducts[0].id,
                  }}
                >
                  <Form.Item
                    name="name"
                    label="项目名称"
                    rules={[{ required: true, message: "请输入项目名称" }]}
                  >
                    <Input placeholder="请输入项目名称" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="product"
                    label="所属产品"
                    rules={[{ required: true, message: "请选择所属产品" }]}
                  >
                    <Select size="large">
                      {mockProducts.map(p => (
                        <Select.Option key={p.id} value={p.id}>
                          <Space>
                            <Tag>{p.code}</Tag>
                            {p.name}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="dateRange"
                    label="项目周期"
                    rules={[{ required: true, message: "请选择项目周期" }]}
                  >
                    <RangePicker style={{ width: "100%" }} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="项目描述"
                  >
                    <TextArea
                      rows={4}
                      placeholder="请输入项目描述，包括背景、目标、关键交付物等"
                    />
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            {/* AI 建议侧边栏 */}
            <Col span={8}>
              <Card
                title={
                  <Space>
                    <BulbOutlined style={{ color: "#7c7cff" }} />
                    <span>AI 建议</span>
                  </Space>
                }
                style={{
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #7c7cff08 0%, #22d3ee08 100%)",
                  border: "1px solid #7c7cff20",
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: "block", marginBottom: 8 }}>推荐项目名称</Text>
                  {aiSuggestions.name.map((name, i) => (
                    <Tag
                      key={i}
                      style={{ marginBottom: 8, cursor: "pointer" }}
                      onClick={() => useSuggestion("name", name)}
                    >
                      <PlusOutlined style={{ marginRight: 4 }} />
                      {name}
                    </Tag>
                  ))}
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <div>
                  <Text strong style={{ display: "block", marginBottom: 8 }}>描述建议</Text>
                  <Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
                    {aiSuggestions.description}
                  </Paragraph>
                </div>
              </Card>
            </Col>
          </Row>
        )

      case 1:
        return (
          <Row gutter={24}>
            <Col span={16}>
              <Card
                title={
                  <Space>
                    <TeamOutlined />
                    <span>选择团队成员</span>
                    <Tag>{selectedMembers.length} / {mockMembers.length}</Tag>
                  </Space>
                }
                style={{ borderRadius: 12 }}
              >
                <List
                  dataSource={mockMembers}
                  renderItem={member => {
                    const isSelected = selectedMembers.includes(member.id)
                    return (
                      <List.Item
                        style={{
                          padding: "12px 16px",
                          background: isSelected ? "#7c7cff08" : undefined,
                          borderRadius: 8,
                          marginBottom: 8,
                          border: isSelected ? "1px solid #7c7cff30" : "1px solid #e2e8f0",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleMember(member.id)}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar style={{ background: "#7c7cff" }}>
                              {member.name[0]}
                            </Avatar>
                          }
                          title={member.name}
                          description={member.role}
                        />
                        <Checkbox checked={isSelected} />
                      </List.Item>
                    )
                  }}
                />
              </Card>
            </Col>

            {/* AI 建议侧边栏 */}
            <Col span={8}>
              <Card
                title={
                  <Space>
                    <BulbOutlined style={{ color: "#7c7cff" }} />
                    <span>AI 建议</span>
                  </Space>
                }
                style={{
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #7c7cff08 0%, #22d3ee08 100%)",
                  border: "1px solid #7c7cff20",
                }}
              >
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  {aiSuggestions.team}
                </Paragraph>

                <Divider style={{ margin: "16px 0" }} />

                <Button
                  block
                  onClick={() => setSelectedMembers(mockMembers.map(m => m.id))}
                >
                  全选团队成员
                </Button>
                <Button
                  block
                  style={{ marginTop: 8 }}
                  onClick={() => setSelectedMembers([])}
                >
                  清空选择
                </Button>
              </Card>

              {selectedMembers.length > 0 && (
                <Card
                  title="已选成员"
                  style={{ marginTop: 16, borderRadius: 12 }}
                  size="small"
                >
                  <Space wrap>
                    {selectedMembers.map(id => {
                      const member = mockMembers.find(m => m.id === id)
                      return member ? (
                        <Tag
                          key={id}
                          closable
                          onClose={() => toggleMember(id)}
                          style={{ margin: 0 }}
                        >
                          <UserOutlined style={{ marginRight: 4 }} />
                          {member.name}
                        </Tag>
                      ) : null
                    })}
                  </Space>
                </Card>
              )}
            </Col>
          </Row>
        )

      case 2:
        return (
          <Row gutter={24}>
            <Col span={16}>
              <Card
                title={
                  <Space>
                    <FileTextOutlined />
                    <span>上传需求文档（可选）</span>
                  </Space>
                }
                style={{ borderRadius: 12 }}
              >
                <Upload.Dragger
                  accept=".doc,.docx,.pdf,.md,.txt"
                  multiple
                  style={{ marginBottom: 24 }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined style={{ color: "#7c7cff", fontSize: 48 }} />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持 Word、PDF、Markdown、TXT 格式的需求文档
                  </p>
                </Upload.Dragger>

                <Alert
                  type="info"
                  icon={<BulbOutlined />}
                  message="跳过此步骤？"
                  description="您也可以先创建项目，之后再通过「AI 智能规划」功能上传需求文档"
                  style={{ borderRadius: 8 }}
                />
              </Card>
            </Col>

            <Col span={8}>
              <Card
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: "#10b981" }} />
                    <span>项目信息确认</span>
                  </Space>
                }
                style={{ borderRadius: 12 }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">项目名称</Text>
                  <div>
                    <Text strong>{form.getFieldValue("name") || "未填写"}</Text>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">所属产品</Text>
                  <div>
                    <Text strong>
                      {mockProducts.find(p => p.id === form.getFieldValue("product"))?.name || "未选择"}
                    </Text>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">团队成员</Text>
                  <div>
                    <Text strong>{selectedMembers.length} 人</Text>
                  </div>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<RocketOutlined />}
                  onClick={handleCreate}
                  loading={creating}
                  style={{
                    background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                    border: "none",
                  }}
                >
                  创建项目
                </Button>
              </Card>
            </Col>
          </Row>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* 返回按钮 */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/")}
        style={{ marginBottom: 16, padding: "4px 0" }}
      >
        返回首页
      </Button>

      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
          <ProjectOutlined style={{ marginRight: 12, color: "#7c7cff" }} />
          创建新项目
        </Title>
        <Text type="secondary">
          填写项目信息，AI 将协助您规划和管理项目
        </Text>
      </div>

      {/* 步骤条 */}
      <Steps
        current={currentStep}
        style={{ marginBottom: 32 }}
        items={[
          { title: "基本信息", icon: <ProjectOutlined /> },
          { title: "团队配置", icon: <TeamOutlined /> },
          { title: "需求文档", icon: <FileTextOutlined /> },
        ]}
      />

      {/* 步骤内容 */}
      {renderStepContent()}

      {/* 底部操作 */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={() => router.push("/")} disabled={creating}>
          取消
        </Button>
        <Space>
          {currentStep > 0 && (
            <Button onClick={handlePrev} disabled={creating}>
              <ArrowLeftOutlined /> 上一步
            </Button>
          )}
          {currentStep < 2 && (
            <Button type="primary" onClick={handleNext}>
              下一步 <ArrowRightOutlined />
            </Button>
          )}
          {currentStep === 2 && (
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={handleCreate}
              loading={creating}
              style={{
                background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                border: "none",
              }}
            >
              创建项目并开始规划
            </Button>
          )}
        </Space>
      </div>
    </div>
  )
}
