"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Typography,
  Card,
  Button,
  Upload,
  Steps,
  Table,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Avatar,
  Progress,
  Alert,
  Spin,
  Divider,
  Collapse,
  Tooltip,
  message,
} from "antd"
import type { UploadProps } from "antd"
import {
  InboxOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  LinkOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"

const { Title, Text, Paragraph } = Typography
const { Dragger } = Upload
const { TextArea } = Input

// 模拟 AI 解析后的需求数据
const mockParsedRequirements = [
  {
    id: "req-1",
    title: "用户登录功能",
    description: "支持手机号、邮箱、第三方账号登录",
    priority: "P0",
    estimatedDays: 5,
    plannedRelease: "2026-03-20",
    tasks: [
      { id: "task-1-1", title: "登录页面UI开发", estimatedHours: 8, assignee: null },
      { id: "task-1-2", title: "登录接口对接", estimatedHours: 6, assignee: null },
      { id: "task-1-3", title: "第三方登录集成", estimatedHours: 12, assignee: null },
    ],
    dependencies: [],
  },
  {
    id: "req-2",
    title: "用户注册功能",
    description: "新用户注册流程，支持手机号验证",
    priority: "P0",
    estimatedDays: 4,
    plannedRelease: "2026-03-20",
    tasks: [
      { id: "task-2-1", title: "注册页面UI开发", estimatedHours: 6, assignee: null },
      { id: "task-2-2", title: "注册接口对接", estimatedHours: 4, assignee: null },
      { id: "task-2-3", title: "短信验证码功能", estimatedHours: 8, assignee: null },
    ],
    dependencies: ["req-1"],
  },
  {
    id: "req-3",
    title: "用户个人中心",
    description: "用户信息展示与编辑",
    priority: "P1",
    estimatedDays: 6,
    plannedRelease: "2026-03-25",
    tasks: [
      { id: "task-3-1", title: "个人中心页面开发", estimatedHours: 10, assignee: null },
      { id: "task-3-2", title: "用户信息编辑功能", estimatedHours: 8, assignee: null },
      { id: "task-3-3", title: "头像上传功能", estimatedHours: 6, assignee: null },
    ],
    dependencies: ["req-1", "req-2"],
  },
  {
    id: "req-4",
    title: "密码找回功能",
    description: "通过邮箱或手机号重置密码",
    priority: "P1",
    estimatedDays: 3,
    plannedRelease: "2026-03-25",
    tasks: [
      { id: "task-4-1", title: "找回密码页面开发", estimatedHours: 6, assignee: null },
      { id: "task-4-2", title: "重置密码接口对接", estimatedHours: 4, assignee: null },
    ],
    dependencies: ["req-2"],
  },
  {
    id: "req-5",
    title: "消息通知中心",
    description: "站内消息和推送通知管理",
    priority: "P2",
    estimatedDays: 8,
    plannedRelease: "2026-04-01",
    tasks: [
      { id: "task-5-1", title: "消息列表页面开发", estimatedHours: 10, assignee: null },
      { id: "task-5-2", title: "消息详情页面开发", estimatedHours: 6, assignee: null },
      { id: "task-5-3", title: "推送通知集成", estimatedHours: 12, assignee: null },
      { id: "task-5-4", title: "消息已读状态管理", estimatedHours: 4, assignee: null },
    ],
    dependencies: ["req-1"],
  },
]

// 优先级配置
const priorityConfig: Record<string, { color: string; label: string }> = {
  P0: { color: "#ef4444", label: "P0 - 紧急" },
  P1: { color: "#f97316", label: "P1 - 高" },
  P2: { color: "#eab308", label: "P2 - 中" },
  P3: { color: "#3b82f6", label: "P3 - 低" },
}

export default function UploadRequirementsPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [requirements, setRequirements] = useState<typeof mockParsedRequirements>([])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  // 上传配置
  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".doc,.docx,.pdf,.md,.txt",
    showUploadList: false,
    beforeUpload: (file) => {
      // 模拟上传和解析过程
      setUploading(true)
      setTimeout(() => {
        setUploading(false)
        setParsing(true)
        message.success(`${file.name} 上传成功，正在 AI 解析...`)
        
        // 模拟 AI 解析过程
        setTimeout(() => {
          setParsing(false)
          setRequirements(mockParsedRequirements)
          setExpandedKeys(mockParsedRequirements.slice(0, 2).map(r => r.id))
          setCurrentStep(1)
          message.success("AI 解析完成！已识别 5 个需求，15 个任务")
        }, 2500)
      }, 1500)
      return false
    },
  }

  // 下一步
  const handleNext = () => {
    if (currentStep === 1) {
      router.push("/ai/team-resources")
    }
  }

  // 需求表格列
  const taskColumns = [
    {
      title: "任务名称",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "预估工时",
      dataIndex: "estimatedHours",
      key: "estimatedHours",
      width: 100,
      render: (hours: number) => `${hours}h`,
    },
    {
      title: "负责人",
      dataIndex: "assignee",
      key: "assignee",
      width: 100,
      render: () => <Text type="secondary">待分配</Text>,
    },
  ]

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* 返回按钮 */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/")}
        style={{ marginBottom: 16, padding: "4px 0" }}
      >
        返回工作台
      </Button>

      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
          <FileTextOutlined style={{ marginRight: 12, color: "#7c7cff" }} />
          上传需求文档
        </Title>
        <Text type="secondary">
          上传需求文档，AI 将自动解析需求、拆分任务、识别依赖关系
        </Text>
      </div>

      {/* 步骤条 */}
      <Steps
        current={currentStep}
        style={{ marginBottom: 32 }}
        items={[
          { title: "上传文档", icon: <FileTextOutlined /> },
          { title: "确认需求", icon: <CheckCircleOutlined /> },
          { title: "配置资源", icon: <UserOutlined /> },
          { title: "生成计划", icon: <CalendarOutlined /> },
        ]}
      />

      {/* 步骤内容 */}
      {currentStep === 0 && (
        <Card style={{ borderRadius: 12 }}>
          {/* 上传区域 */}
          <Dragger {...uploadProps} style={{ padding: "40px 20px" }}>
            {uploading || parsing ? (
              <div>
                <Spin size="large" />
                <p style={{ marginTop: 16, color: "#7c7cff", fontWeight: 500 }}>
                  {uploading ? "正在上传文档..." : "AI 正在智能解析..."}
                </p>
                {parsing && (
                  <p style={{ color: "#64748b", fontSize: 13 }}>
                    正在识别需求点、拆分任务、分析依赖关系
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: "#7c7cff", fontSize: 48 }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 16 }}>
                  点击或拖拽文件到此区域上传
                </p>
                <p className="ant-upload-hint" style={{ color: "#64748b" }}>
                  支持 Word、PDF、Markdown、纯文本格式
                </p>
              </>
            )}
          </Dragger>

          {/* 文档模板说明 */}
          <Divider />
          
          <Alert
            type="info"
            icon={<BulbOutlined />}
            message="需求文档模板建议"
            description={
              <div style={{ marginTop: 8 }}>
                <Paragraph style={{ margin: 0, fontSize: 13 }}>
                  为了获得最佳的 AI 解析效果，建议您的需求文档包含以下内容：
                </Paragraph>
                <ul style={{ margin: "12px 0", paddingLeft: 20, fontSize: 13, color: "#64748b" }}>
                  <li><strong>需求标题</strong> - 简明扼要的功能描述</li>
                  <li><strong>需求描述</strong> - 详细的功能说明和验收标准</li>
                  <li><strong>优先级</strong> - P0/P1/P2/P3 优先级标注</li>
                  <li><strong>计划发布日期</strong> - 期望上线时间</li>
                  <li><strong>依赖关系</strong> - 与其他需求的前后置关系</li>
                  <li><strong>任务拆分</strong> - 如有预设的任务拆分更佳</li>
                </ul>
                <Button type="link" style={{ padding: 0 }}>
                  下载需求文档模板
                </Button>
              </div>
            }
            style={{ borderRadius: 8 }}
          />
        </Card>
      )}

      {currentStep === 1 && (
        <div>
          {/* AI 解析结果摘要 */}
          <Card style={{ marginBottom: 24, borderRadius: 12, background: "linear-gradient(135deg, #7c7cff08 0%, #22d3ee08 100%)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RobotOutlined style={{ fontSize: 24, color: "#fff" }} />
              </div>
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 16 }}>AI 解析完成</Text>
                <div style={{ marginTop: 4 }}>
                  <Space size={24}>
                    <Text>
                      <FileTextOutlined style={{ marginRight: 6, color: "#7c7cff" }} />
                      识别 <strong>{requirements.length}</strong> 个需求
                    </Text>
                    <Text>
                      <ThunderboltOutlined style={{ marginRight: 6, color: "#22d3ee" }} />
                      拆分 <strong>{requirements.reduce((acc, r) => acc + r.tasks.length, 0)}</strong> 个任务
                    </Text>
                    <Text>
                      <LinkOutlined style={{ marginRight: 6, color: "#10b981" }} />
                      发现 <strong>{requirements.filter(r => r.dependencies.length > 0).length}</strong> 个依赖关系
                    </Text>
                  </Space>
                </div>
              </div>
              <Button icon={<EditOutlined />}>批量编辑</Button>
            </div>
          </Card>

          {/* 需求列表 */}
          <Card title="需求清单" style={{ borderRadius: 12 }}>
            <Collapse
              activeKey={expandedKeys}
              onChange={(keys) => setExpandedKeys(keys as string[])}
              expandIconPosition="start"
              style={{ background: "transparent", border: "none" }}
            >
              {requirements.map((req, index) => {
                const priority = priorityConfig[req.priority]
                return (
                  <Collapse.Panel
                    key={req.id}
                    header={
                      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: `${priority.color}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: priority.color,
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Space>
                            <Text strong>{req.title}</Text>
                            <Tag style={{ margin: 0, background: `${priority.color}15`, color: priority.color, border: "none" }}>
                              {req.priority}
                            </Tag>
                          </Space>
                        </div>
                        <Space size={16}>
                          <Tooltip title="预估工期">
                            <Text type="secondary">
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {req.estimatedDays} 天
                            </Text>
                          </Tooltip>
                          <Tooltip title="计划发布">
                            <Text type="secondary">
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {dayjs(req.plannedRelease).format("MM/DD")}
                            </Text>
                          </Tooltip>
                          <Text type="secondary">
                            {req.tasks.length} 个任务
                          </Text>
                        </Space>
                      </div>
                    }
                    style={{ marginBottom: 8, background: "#fafbfc", borderRadius: 8 }}
                  >
                    <div style={{ padding: "0 12px" }}>
                      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                        {req.description}
                      </Paragraph>

                      {req.dependencies.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>依赖关系：</Text>
                          <Space size={4} style={{ marginLeft: 8 }}>
                            {req.dependencies.map(depId => {
                              const dep = requirements.find(r => r.id === depId)
                              return dep ? (
                                <Tag key={depId} style={{ margin: 0 }}>
                                  <LinkOutlined style={{ marginRight: 4 }} />
                                  {dep.title}
                                </Tag>
                              ) : null
                            })}
                          </Space>
                        </div>
                      )}

                      <Table
                        columns={taskColumns}
                        dataSource={req.tasks}
                        rowKey="id"
                        size="small"
                        pagination={false}
                      />

                      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <Button size="small" icon={<PlusOutlined />}>添加任务</Button>
                        <Button size="small" icon={<EditOutlined />}>编辑需求</Button>
                        <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                      </div>
                    </div>
                  </Collapse.Panel>
                )
              })}
            </Collapse>

            <Divider />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button icon={<PlusOutlined />}>添加需求</Button>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>
                  <ArrowLeftOutlined /> 重新上传
                </Button>
                <Button
                  type="primary"
                  onClick={handleNext}
                  style={{
                    background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                    border: "none",
                  }}
                >
                  下一步：配置团队资源 <ArrowRightOutlined />
                </Button>
              </Space>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
