"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Typography,
  Card,
  Button,
  Input,
  Space,
  Tag,
  Avatar,
  Progress,
  DatePicker,
  Table,
  message,
  Spin,
  Select,
  InputNumber,
  Popconfirm,
  Modal,
  Tooltip,
  Switch,
} from "antd"
import {
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  AppstoreOutlined,
  ProjectOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import type { Dayjs } from "dayjs"
import { useBreadcrumb } from "@/components/layout/main-layout"
import PilotIcon from "@/components/ui/PilotIcon"

const { Text } = Typography
const { TextArea } = Input
const { RangePicker } = DatePicker

// ==================== 模拟数据 ====================

const requirementTemplate = `# 电商平台 v2.0 需求文档

## 一、项目背景
随着业务快速发展，现有电商平台已无法满足日益增长的用户需求...

## 二、功能需求

### 2.1 用户登录与注册模块
- 需求描述：支持手机号、邮箱、第三方登录
- 优先级：P0

### 2.2 商品展示模块  
- 需求描述：商品列表、详情、搜索、分类
- 优先级：P0

### 2.3 购物车模块
- 需求描述：添加、修改、删除商品
- 优先级：P0

### 2.4 订单管理模块
- 需求描述：创建订单、订单列表、状态跟踪
- 优先级：P1

### 2.5 支付模块
- 需求描述：微信支付、支付宝支付
- 优先级：P1
`

const initialWorkItems = [
  {
    id: "req-1",
    title: "用户登录与注册模块",
    type: "requirement",
    priority: "P0",
    estimatedHours: 52,
    description: "支持手机号、邮箱、第三方登录注册",
    children: [
      { id: "task-1-1", title: "登录页面UI开发", type: "task", role: "frontend", estimatedHours: 8 },
      { id: "task-1-2", title: "注册流程UI开发", type: "task", role: "frontend", estimatedHours: 8 },
      { id: "task-1-3", title: "登录注册API开发", type: "task", role: "backend", estimatedHours: 16 },
      { id: "task-1-4", title: "第三方登录集成", type: "task", role: "backend", estimatedHours: 12 },
      { id: "task-1-5", title: "登录注册功能测试", type: "test", role: "test", estimatedHours: 8 },
    ],
  },
  {
    id: "req-2",
    title: "商品展示模块",
    type: "requirement",
    priority: "P0",
    estimatedHours: 80,
    description: "商品列表、详情、搜索、分类",
    children: [
      { id: "task-2-1", title: "商品列表页开发", type: "task", role: "frontend", estimatedHours: 12 },
      { id: "task-2-2", title: "商品详情页开发", type: "task", role: "frontend", estimatedHours: 16 },
      { id: "task-2-3", title: "商品搜索功能", type: "task", role: "frontend", estimatedHours: 8 },
      { id: "task-2-4", title: "商品API开发", type: "task", role: "backend", estimatedHours: 20 },
      { id: "task-2-5", title: "商品搜索服务", type: "task", role: "backend", estimatedHours: 12 },
      { id: "task-2-6", title: "商品模块测试", type: "test", role: "test", estimatedHours: 12 },
    ],
  },
  {
    id: "req-3",
    title: "购物车模块",
    type: "requirement",
    priority: "P0",
    estimatedHours: 36,
    description: "添加、修改、删除商品",
    children: [
      { id: "task-3-1", title: "购物车页面开发", type: "task", role: "frontend", estimatedHours: 12 },
      { id: "task-3-2", title: "购物车API开发", type: "task", role: "backend", estimatedHours: 16 },
      { id: "task-3-3", title: "购物车功能测试", type: "test", role: "test", estimatedHours: 8 },
    ],
  },
  {
    id: "req-4",
    title: "订单管理模块",
    type: "requirement",
    priority: "P1",
    estimatedHours: 58,
    description: "创建订单、订单列表、状态跟踪",
    children: [
      { id: "task-4-1", title: "订单创建流程开发", type: "task", role: "frontend", estimatedHours: 12 },
      { id: "task-4-2", title: "订单列表页开发", type: "task", role: "frontend", estimatedHours: 8 },
      { id: "task-4-3", title: "订单API开发", type: "task", role: "backend", estimatedHours: 20 },
      { id: "task-4-4", title: "订单状态机实现", type: "task", role: "backend", estimatedHours: 8 },
      { id: "task-4-5", title: "订单模块测试", type: "test", role: "test", estimatedHours: 10 },
    ],
  },
  {
    id: "req-5",
    title: "支付模块",
    type: "requirement",
    priority: "P1",
    estimatedHours: 48,
    description: "微信支付、支付宝支付",
    children: [
      { id: "task-5-1", title: "支付页面开发", type: "task", role: "frontend", estimatedHours: 8 },
      { id: "task-5-2", title: "支付接口集成", type: "task", role: "backend", estimatedHours: 20 },
      { id: "task-5-3", title: "支付回调处理", type: "task", role: "backend", estimatedHours: 8 },
      { id: "task-5-4", title: "支付功能测试", type: "test", role: "test", estimatedHours: 12 },
    ],
  },
]

// 团队成员数据 - 添加可用工时
const teamMembers = [
  { id: "m1", name: "张三", role: "frontend", title: "高级前端工程师", availableHours: 80 },
  { id: "m2", name: "李四", role: "frontend", title: "前端工程师", availableHours: 96 },
  { id: "m3", name: "王五", role: "backend", title: "高级后端工程师", availableHours: 64 },
  { id: "m4", name: "赵六", role: "backend", title: "后端工程师", availableHours: 88 },
  { id: "m5", name: "钱七", role: "test", title: "测试工程师", availableHours: 72 },
  { id: "m6", name: "孙八", role: "test", title: "测试工程师", availableHours: 80 },
]

interface WorkItem {
  id: string
  title: string
  type: string
  priority?: string
  estimatedHours: number
  description?: string
  role?: string
  children?: WorkItem[]
}

// ==================== 辅助函数 ====================

const getRoleColor = (role: string) => {
  switch (role) {
    case "frontend": return "#7c7cff"
    case "backend": return "#22d3ee"
    case "test": return "#10b981"
    default: return "#64748b"
  }
}

const getRoleName = (role: string) => {
  switch (role) {
    case "frontend": return "前端"
    case "backend": return "后端"
    case "test": return "测试"
    default: return "其他"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "P0": return "error"
    case "P1": return "warning"
    case "P2": return "default"
    default: return "default"
  }
}

// ==================== 组件 ====================

function SmartPlanningContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setBreadcrumbs } = useBreadcrumb()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [requirementText, setRequirementText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [parseProgress, setParseProgress] = useState(0)
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [hasDateRange, setHasDateRange] = useState(true)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)

  const productId = searchParams.get("product")
  const projectId = searchParams.get("project")

  // 模拟产品项目名称
  const productName = "电商平台"
  const projectName = "电商平台 v2.0"

  useEffect(() => {
    setBreadcrumbs([
      { 
        title: "智能规划", 
        sparkle: true,
        headerTags: [
          { label: productName, color: "#7c7cff" },
          { label: projectName, color: "#0891b2" },
        ],
      },
    ])
  }, [setBreadcrumbs, productName, projectName])

  // AI 解析
  const handleParseRequirements = () => {
    if (!requirementText.trim()) {
      message.warning("请先输入需求文档内容")
      return
    }
    setIsParsing(true)
    setParseProgress(0)

    const interval = setInterval(() => {
      setParseProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsParsing(false)
          setWorkItems(initialWorkItems)
          setCurrentStep(1)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)
  }

  // 计算工时
  const calculateWorkload = () => {
    let frontend = 0, backend = 0, test = 0
    workItems.forEach((item) => {
      item.children?.forEach((child) => {
        if (child.role === "frontend") frontend += child.estimatedHours
        if (child.role === "backend") backend += child.estimatedHours
        if (child.role === "test") test += child.estimatedHours
      })
    })
    return { frontend, backend, test, total: frontend + backend + test }
  }

  // 计算预计工期
  const calculateEstimatedDays = () => {
    const workload = calculateWorkload()
    const selectedMemberData = teamMembers.filter(m => selectedMembers.includes(m.id))
    
    const frontendMembers = selectedMemberData.filter(m => m.role === "frontend")
    const backendMembers = selectedMemberData.filter(m => m.role === "backend")
    const testMembers = selectedMemberData.filter(m => m.role === "test")
    
    const frontendCapacity = frontendMembers.reduce((acc, m) => acc + 6, 0) // 每人每天6小时
    const backendCapacity = backendMembers.reduce((acc, m) => acc + 6, 0)
    const testCapacity = testMembers.reduce((acc, m) => acc + 6, 0)
    
    const frontendDays = frontendCapacity > 0 ? Math.ceil(workload.frontend / frontendCapacity) : 0
    const backendDays = backendCapacity > 0 ? Math.ceil(workload.backend / backendCapacity) : 0
    const testDays = testCapacity > 0 ? Math.ceil(workload.test / testCapacity) : 0
    
    return Math.max(frontendDays, backendDays) + Math.ceil(testDays * 0.5) + 3 // 并行+测试+缓冲
  }

  // 计算成员在时间段内的可用工时
  const getMemberAvailableHours = (memberId: string) => {
    if (!hasDateRange || !dateRange) return null
    const member = teamMembers.find(m => m.id === memberId)
    if (!member) return null
    const days = dateRange[1].diff(dateRange[0], "day") + 1
    const workDays = Math.ceil(days * 5 / 7)
    return workDays * 6 // 每天6小时有效工作时间
  }

  // 删除工作项
  const handleDeleteItem = (itemId: string, parentId?: string) => {
    if (parentId) {
      setWorkItems(workItems.map(item => {
        if (item.id === parentId) {
          return { ...item, children: item.children?.filter(c => c.id !== itemId) }
        }
        return item
      }))
    } else {
      setWorkItems(workItems.filter(item => item.id !== itemId))
    }
  }

  // 编辑工作项
  const handleEditItem = (item: WorkItem) => {
    setEditingItem({ ...item })
    setEditModalVisible(true)
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingItem) return
    
    const newItems = workItems.map(item => {
      if (item.id === editingItem.id) return editingItem
      if (item.children) {
        const childIndex = item.children.findIndex(c => c.id === editingItem.id)
        if (childIndex > -1) {
          const newChildren = [...item.children]
          newChildren[childIndex] = editingItem
          return { ...item, children: newChildren }
        }
      }
      return item
    })
    
    setWorkItems(newItems)
    setEditModalVisible(false)
    setEditingItem(null)
  }

  // 添加子任务
  const handleAddTask = (parentId: string) => {
    const newTask: WorkItem = {
      id: `task-new-${Date.now()}`,
      title: "新任务",
      type: "task",
      role: "frontend",
      estimatedHours: 8,
    }
    setWorkItems(workItems.map(item => {
      if (item.id === parentId) {
        return { ...item, children: [...(item.children || []), newTask] }
      }
      return item
    }))
  }

  // 生成计划
  const handleGeneratePlan = () => {
    setIsGenerating(true)
    
    setTimeout(() => {
      const workload = calculateWorkload()
      const startDate = dateRange?.[0] || dayjs()
      const estimatedDays = calculateEstimatedDays()
      const endDate = hasDateRange && dateRange ? dateRange[1] : dayjs().add(estimatedDays, "day")
      
      const selectedMemberData = teamMembers.filter(m => selectedMembers.includes(m.id))
      
      setGeneratedPlan({
        projectName: "电商平台 v2.0",
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
        totalDays: endDate.diff(startDate, "day") + 1,
        totalRequirements: workItems.length,
        totalTasks: workItems.reduce((acc, item) => acc + (item.children?.length || 0), 0),
        totalHours: workload.total,
        team: selectedMemberData,
        sprints: [
          {
            name: "Sprint 1 - 核心功能",
            startDate: startDate.format("YYYY-MM-DD"),
            endDate: startDate.add(14, "day").format("YYYY-MM-DD"),
            requirements: ["用户登录与注册模块", "商品展示模块"],
            tasks: 11,
          },
          {
            name: "Sprint 2 - 交易功能",
            startDate: startDate.add(15, "day").format("YYYY-MM-DD"),
            endDate: startDate.add(28, "day").format("YYYY-MM-DD"),
            requirements: ["购物车模块", "订单管理模块", "支付模块"],
            tasks: 12,
          },
        ],
        riskAnalysis: {
          level: "medium",
          issues: [
            "建议预留缓冲时间应对需求变更",
            "支付模块涉及第三方集成，建议提前对接",
          ],
        },
      })
      setIsGenerating(false)
      setCurrentStep(3)
    }, 2000)
  }

  const workload = calculateWorkload()
  const estimatedDays = selectedMembers.length > 0 ? calculateEstimatedDays() : 0

  // ==================== 渲染步骤 ====================

  const renderStepContent = () => {
    switch (currentStep) {
      // 步骤1：上传需求
      case 0:
        return (
          <Card
            style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ padding: 24, borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <Text strong style={{ fontSize: 16 }}>输入需求文档</Text>
                  <div style={{ fontSize: 13, color: "#64748b" }}>支持 Markdown 格式，AI 将智能解析并拆分任务</div>
                </div>
                <Space>
                  <Button 
                    icon={<PlusOutlined />}
                    onClick={() => message.info("文件上传功能开发中")}
                  >
                    上传文件
                  </Button>
                  <Button type="link" onClick={() => setRequirementText(requirementTemplate)}>
                    使用示例模板
                  </Button>
                </Space>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <TextArea
                value={requirementText}
                onChange={(e) => setRequirementText(e.target.value)}
                placeholder="请输入或粘贴需求文档内容，或点击上方按钮上传文件..."
                style={{ 
                  height: 340, 
                  fontFamily: "Monaco, Consolas, monospace",
                  fontSize: 13,
                  borderRadius: 8,
                }}
              />

              {isParsing && (
                <div style={{ 
                  marginTop: 20,
                  padding: 20, 
                  background: "linear-gradient(135deg, #f5f3ff 0%, #ecfeff 100%)",
                  borderRadius: 12,
                  border: "1px solid #e0e7ff",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <Avatar
                      style={{ background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)" }}
                      icon={<PilotIcon />}
                    />
                    <div>
                      <Text strong>小派正在分析需求文档...</Text>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {parseProgress < 30 && "识别需求模块..."}
                        {parseProgress >= 30 && parseProgress < 60 && "拆分任务..."}
                        {parseProgress >= 60 && parseProgress < 90 && "估算工时..."}
                        {parseProgress >= 90 && "即将完成..."}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    percent={Math.min(parseProgress, 100)} 
                    strokeColor={{ "0%": "#7c7cff", "100%": "#22d3ee" }}
                    status="active"
                  />
                </div>
              )}
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleParseRequirements}
                loading={isParsing}
                style={{
                  background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                  border: "none",
                  height: 44,
                }}
              >
                开始 AI 解析
              </Button>
            </div>
          </Card>
        )

      // 步骤2：需求确认 + 配置时间
      case 1:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 工时统计 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { label: "需求数", value: workItems.length, color: "#7c7cff", icon: <FileTextOutlined /> },
                { label: "前端工时", value: `${workload.frontend}h`, color: "#7c7cff", icon: <span>FE</span> },
                { label: "后端工时", value: `${workload.backend}h`, color: "#22d3ee", icon: <span>BE</span> },
                { label: "测试工时", value: `${workload.test}h`, color: "#10b981", icon: <span>QA</span> },
              ].map((stat, i) => (
                <Card key={i} size="small" style={{ borderRadius: 12, textAlign: "center" }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: `${stat.color}15`,
                    color: stat.color,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}>
                    {stat.icon}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{stat.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: stat.color }}>{stat.value}</div>
                </Card>
              ))}
            </div>

            {/* 工作项列表 */}
            <Card
              title={<Space><CheckCircleOutlined style={{ color: "#10b981" }} /><span>需求与任务列表</span><Tag color="success">可编辑</Tag></Space>}
              style={{ borderRadius: 16 }}
            >
              {workItems.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    marginBottom: index < workItems.length - 1 ? 16 : 0,
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "12px 16px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Space>
                      <Tag color={getPriorityColor(item.priority || "P2")}>{item.priority}</Tag>
                      <Text strong>{item.title}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>({item.description})</Text>
                    </Space>
                    <Space>
                      <Tag icon={<ClockCircleOutlined />}>{item.estimatedHours}h</Tag>
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditItem(item)} />
                      <Popconfirm title="确定删除？" onConfirm={() => handleDeleteItem(item.id)}>
                        <Button type="text" size="small" icon={<DeleteOutlined />} danger />
                      </Popconfirm>
                    </Space>
                  </div>
                  <div style={{ padding: 16 }}>
                    <Table
                      size="small"
                      dataSource={item.children}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        { title: "任务", dataIndex: "title", render: (t) => <Text style={{ fontSize: 13 }}>{t}</Text> },
                        { title: "类型", dataIndex: "role", width: 80, render: (r: string) => <Tag style={{ background: `${getRoleColor(r)}15`, color: getRoleColor(r), border: "none" }}>{getRoleName(r)}</Tag> },
                        { title: "工时", dataIndex: "estimatedHours", width: 70, render: (h: number) => `${h}h` },
                        { title: "操作", width: 80, render: (_: unknown, record: WorkItem) => (
                          <Space>
                            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditItem(record)} />
                            <Popconfirm title="确定删除？" onConfirm={() => handleDeleteItem(record.id, item.id)}>
                              <Button type="text" size="small" icon={<DeleteOutlined />} danger />
                            </Popconfirm>
                          </Space>
                        )},
                      ]}
                    />
                    <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => handleAddTask(item.id)} style={{ marginTop: 8 }}>
                      添加任务
                    </Button>
                  </div>
                </div>
              ))}
            </Card>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" onClick={() => setCurrentStep(2)} style={{ background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)", border: "none" }}>
                下一步：配置资源
              </Button>
            </div>
          </div>
        )

      // 步骤3：配置资源（时间 + 团队）
      case 2:
        const selectedMemberData = teamMembers.filter(m => selectedMembers.includes(m.id))
        const frontendMembers = selectedMemberData.filter(m => m.role === "frontend")
        const backendMembers = selectedMemberData.filter(m => m.role === "backend")
        const testMembers = selectedMemberData.filter(m => m.role === "test")

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 时间配置 */}
            <Card
              title={<Space><CalendarOutlined style={{ color: "#f59e0b" }} /><span>项目时间配置</span><Tag>可选</Tag></Space>}
              style={{ borderRadius: 16 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <Text>设置项目周期：</Text>
                <Switch checked={hasDateRange} onChange={setHasDateRange} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {hasDateRange ? "已开启，请选择时间范围" : "未设置，将根据团队配置自动计算"}
                </Text>
              </div>
              
              {hasDateRange && (
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs])}
                  style={{ width: "100%" }}
                  size="large"
                  placeholder={["开始时间", "上线时间"]}
                  disabledDate={(current) => current && current < dayjs().startOf("day")}
                />
              )}
            </Card>

            {/* 工时需求 */}
            <Card size="small" style={{ borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BulbOutlined style={{ color: "#f59e0b" }} />
                <Text>
                  需要：前端 <Text strong style={{ color: "#7c7cff" }}>{workload.frontend}h</Text>、
                  后端 <Text strong style={{ color: "#22d3ee" }}>{workload.backend}h</Text>、
                  测试 <Text strong style={{ color: "#10b981" }}>{workload.test}h</Text>
                  {!hasDateRange && selectedMembers.length > 0 && (
                    <span style={{ marginLeft: 16 }}>
                      | 预计工期：<Text strong style={{ color: "#7c7cff" }}>{estimatedDays} 个工作日</Text>
                    </span>
                  )}
                </Text>
              </div>
            </Card>

            {/* 成员选择 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[
                { role: "frontend", name: "前端开发", color: "#7c7cff", members: teamMembers.filter(m => m.role === "frontend"), selected: frontendMembers },
                { role: "backend", name: "后端开发", color: "#22d3ee", members: teamMembers.filter(m => m.role === "backend"), selected: backendMembers },
                { role: "test", name: "测试工程师", color: "#10b981", members: teamMembers.filter(m => m.role === "test"), selected: testMembers },
              ].map((group) => (
                <Card
                  key={group.role}
                  title={
                    <Space>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: group.color }} />
                      <span>{group.name}</span>
                      <Tag>{group.selected.length} 人</Tag>
                    </Space>
                  }
                  style={{ borderRadius: 12 }}
                >
                  {group.members.map(member => {
                    const isSelected = selectedMembers.includes(member.id)
                    const availableHours = getMemberAvailableHours(member.id)
                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMembers(selectedMembers.filter(id => id !== member.id))
                          } else {
                            setSelectedMembers([...selectedMembers, member.id])
                          }
                        }}
                        style={{
                          padding: 12,
                          marginBottom: 8,
                          borderRadius: 8,
                          border: `2px solid ${isSelected ? group.color : "#e2e8f0"}`,
                          background: isSelected ? `${group.color}08` : "#fff",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar style={{ background: isSelected ? group.color : "#e2e8f0", color: isSelected ? "#fff" : "#64748b" }}>
                            {member.name[0]}
                          </Avatar>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500 }}>{member.name}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{member.title}</div>
                          </div>
                          {isSelected && <CheckCircleOutlined style={{ color: group.color, fontSize: 18 }} />}
                        </div>
                        {hasDateRange && dateRange && (
                          <div style={{ marginTop: 8, padding: "6px 10px", background: "#f8fafc", borderRadius: 6, fontSize: 12 }}>
                            <span style={{ color: "#64748b" }}>可用工时：</span>
                            <span style={{ color: group.color, fontWeight: 600 }}>{availableHours}h</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </Card>
              ))}
            </div>

            {/* 已选概览 */}
            {selectedMembers.length > 0 && (
              <Card style={{ borderRadius: 12, background: "linear-gradient(135deg, #f5f3ff 0%, #ecfeff 100%)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Space>
                    <TeamOutlined style={{ color: "#7c7cff" }} />
                    <Text strong>已选 {selectedMembers.length} 人</Text>
                    <span style={{ color: "#64748b" }}>|</span>
                    <Text type="secondary">前端 {frontendMembers.length}、后端 {backendMembers.length}、测试 {testMembers.length}</Text>
                  </Space>
                  {!hasDateRange && (
                    <Tag color="#7c7cff" style={{ fontSize: 14, padding: "4px 12px" }}>
                      预计工期 {estimatedDays} 天
                    </Tag>
                  )}
                </div>
              </Card>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentStep(1)}>上一步</Button>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleGeneratePlan}
                disabled={selectedMembers.length === 0}
                loading={isGenerating}
                style={{ background: selectedMembers.length > 0 ? "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)" : undefined, border: "none" }}
              >
                生成迭代计划
              </Button>
            </div>

            {isGenerating && (
              <div style={{ padding: 40, background: "linear-gradient(135deg, #f5f3ff 0%, #ecfeff 100%)", borderRadius: 16, textAlign: "center" }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: "#7c7cff" }} spin />} />
                <div style={{ marginTop: 20 }}>
                  <Text strong style={{ fontSize: 16 }}>小派正在生成迭代计划...</Text>
                </div>
              </div>
            )}
          </div>
        )

      // 步骤4：生成计划
      case 3:
        if (!generatedPlan) return null
        
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 成功提示 */}
            <Card style={{ borderRadius: 16, background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", border: "1px solid #6ee7b7" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckOutlined style={{ color: "#fff", fontSize: 24 }} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 18 }}>迭代计划生成成功！</Text>
                  <div style={{ color: "#64748b" }}>小派已为您智能规划了项目迭代和任务分配</div>
                </div>
              </div>
            </Card>

            {/* 计划概览 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {[
                { icon: <CalendarOutlined />, label: "开始日期", value: generatedPlan.startDate, color: "#7c7cff" },
                { icon: <RocketOutlined />, label: "上线日期", value: generatedPlan.endDate, color: "#ec4899" },
                { icon: <FileTextOutlined />, label: "需求数", value: generatedPlan.totalRequirements, color: "#22d3ee" },
                { icon: <CheckCircleOutlined />, label: "任务数", value: generatedPlan.totalTasks, color: "#10b981" },
                { icon: <ClockCircleOutlined />, label: "总工时", value: `${generatedPlan.totalHours}h`, color: "#f59e0b" },
              ].map((stat, i) => (
                <Card key={i} size="small" style={{ borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 22, color: stat.color, marginBottom: 4 }}>{stat.icon}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{stat.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{stat.value}</div>
                </Card>
              ))}
            </div>

            {/* 迭代计划 + 风险 */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
              <Card title={<Space><ThunderboltOutlined style={{ color: "#7c7cff" }} /><span>迭代计划</span></Space>} style={{ borderRadius: 12 }}>
                {generatedPlan.sprints.map((sprint: any, idx: number) => (
                  <div key={idx} style={{ padding: 16, background: "#f8fafc", borderRadius: 8, marginBottom: idx < generatedPlan.sprints.length - 1 ? 12 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text strong>{sprint.name}</Text>
                      <Tag>{sprint.tasks} 任务</Tag>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}><CalendarOutlined /> {sprint.startDate} ~ {sprint.endDate}</div>
                    <Space wrap>{sprint.requirements.map((r: string, i: number) => <Tag key={i} style={{ background: "#f5f3ff", color: "#7c7cff", border: "none" }}>{r}</Tag>)}</Space>
                  </div>
                ))}
              </Card>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <Card title={<Space><TeamOutlined style={{ color: "#10b981" }} /><span>项目团队</span></Space>} style={{ borderRadius: 12 }}>
                  <Space wrap>
                    {generatedPlan.team.map((m: any) => (
                      <Tooltip key={m.id} title={m.title}>
                        <Tag style={{ padding: "4px 8px" }}>
                          <Avatar size={20} style={{ background: getRoleColor(m.role), marginRight: 4 }}>{m.name[0]}</Avatar>
                          {m.name}
                        </Tag>
                      </Tooltip>
                    ))}
                  </Space>
                </Card>

                <Card title={<Space><ExclamationCircleOutlined style={{ color: "#f59e0b" }} /><span>风险提示</span></Space>} style={{ borderRadius: 12 }}>
                  <ul style={{ margin: 0, paddingLeft: 16, color: "#64748b", fontSize: 13 }}>
                    {generatedPlan.riskAnalysis.issues.map((issue: string, i: number) => <li key={i} style={{ marginBottom: 6 }}>{issue}</li>)}
                  </ul>
                </Card>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentStep(2)}>返回修改</Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  message.success("项目已创建成功！")
                  router.push("/projects")
                }}
                style={{ background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)", border: "none" }}
              >
                确认创建迭代
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // 步骤配置
  const steps = [
    { key: 0, title: "上传需求", subtitle: "导入需求文档", icon: <FileTextOutlined />, color: "#7c7cff" },
    { key: 1, title: "确认需求", subtitle: "确认任务拆分", icon: <CheckCircleOutlined />, color: "#22d3ee" },
    { key: 2, title: "配置资源", subtitle: "时间与团队配置", icon: <TeamOutlined />, color: "#10b981" },
    { key: 3, title: "生成计划", subtitle: "生成迭代计划", icon: <RocketOutlined />, color: "#ec4899" },
  ]

  return (
    <div style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "calc(100vh - 56px)" }}>
      {/* 精美步骤条 */}
      <div
        style={{
          marginBottom: 24,
          padding: "24px 32px",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              {/* 步骤项 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  flex: 1,
                  cursor: currentStep > index ? "pointer" : "default",
                  opacity: currentStep >= index ? 1 : 0.4,
                  transition: "all 0.3s",
                }}
                onClick={() => currentStep > index && setCurrentStep(index)}
              >
                {/* 图标容器 */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: currentStep >= index 
                      ? currentStep === index 
                        ? `linear-gradient(135deg, ${step.color} 0%, ${step.color}cc 100%)`
                        : `${step.color}15`
                      : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    color: currentStep >= index 
                      ? currentStep === index ? "#fff" : step.color
                      : "#94a3b8",
                    boxShadow: currentStep === index ? `0 4px 12px ${step.color}40` : "none",
                    transition: "all 0.3s",
                    position: "relative",
                  }}
                >
                  {currentStep > index ? (
                    <CheckOutlined style={{ fontSize: 20 }} />
                  ) : (
                    step.icon
                  )}
                  {/* 当前步骤动画光圈 */}
                  {currentStep === index && (
                    <div
                      style={{
                        position: "absolute",
                        inset: -3,
                        borderRadius: 17,
                        border: `2px solid ${step.color}40`,
                        animation: "pulse 2s infinite",
                      }}
                    />
                  )}
                </div>
                {/* 文字 */}
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: currentStep >= index ? "#1e293b" : "#94a3b8",
                      marginBottom: 2,
                    }}
                  >
                    {step.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{step.subtitle}</div>
                </div>
              </div>

              {/* 连接线 */}
              {index < steps.length - 1 && (
                <div
                  style={{
                    flex: "0 0 60px",
                    height: 3,
                    margin: "0 8px",
                    borderRadius: 2,
                    background: currentStep > index
                      ? `linear-gradient(90deg, ${step.color} 0%, ${steps[index + 1].color} 100%)`
                      : "#e2e8f0",
                    transition: "all 0.3s",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 添加动画样式 */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
      `}</style>

      {/* 步骤内容 */}
      {renderStepContent()}

      {/* 编辑弹窗 */}
      <Modal
        title="编辑工作项"
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); setEditingItem(null) }}
        onOk={handleSaveEdit}
        okText="保存"
        cancelText="取消"
      >
        {editingItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>名称</Text>
              <Input value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} />
            </div>
            {editingItem.description !== undefined && (
              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>描述</Text>
                <TextArea value={editingItem.description} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} rows={2} />
              </div>
            )}
            {editingItem.priority && (
              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>优先级</Text>
                <Select value={editingItem.priority} onChange={(v) => setEditingItem({ ...editingItem, priority: v })} style={{ width: "100%" }}
                  options={[{ value: "P0", label: "P0 - 紧急" }, { value: "P1", label: "P1 - 高" }, { value: "P2", label: "P2 - 中" }]} />
              </div>
            )}
            {editingItem.role && (
              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>类型</Text>
                <Select value={editingItem.role} onChange={(v) => setEditingItem({ ...editingItem, role: v })} style={{ width: "100%" }}
                  options={[{ value: "frontend", label: "前端" }, { value: "backend", label: "后端" }, { value: "test", label: "测试" }]} />
              </div>
            )}
            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>预估工时（小时）</Text>
              <InputNumber value={editingItem.estimatedHours} onChange={(v) => setEditingItem({ ...editingItem, estimatedHours: v || 0 })} min={1} style={{ width: "100%" }} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default function SmartPlanningPage() {
  return (
    <Suspense fallback={<div style={{ padding: "24px 32px", textAlign: "center" }}><Spin size="large" /></div>}>
      <SmartPlanningContent />
    </Suspense>
  )
}
