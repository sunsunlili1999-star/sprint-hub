"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Input, 
  Avatar, 
  Typography, 
  Space,
  Button,
  Tag,
  Spin,
  Tooltip,
} from "antd"
import {
  RobotOutlined,
  SendOutlined,
  CloseOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  BulbOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons"
import { useRouter } from "next/navigation"

const { Text } = Typography
const { TextArea } = Input

// 模拟对话消息
interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: Date
  type?: "welcome" | "sprint-status" | "release-status" | "normal"
  data?: any
  actions?: { label: string; action: string }[]
}

// 迭代状态数据
interface SprintStatusData {
  id: string
  name: string
  projectName: string
  progress: number
  remainingDays: number
  status: "healthy" | "delayed" | "blocked" | "overload"
  riskDetails?: string[]
  recommendation?: string
}

// 发布状态数据
interface ReleaseStatusData {
  id: string
  name: string
  version: string
  plannedDate: string
  status: "on-track" | "at-risk" | "delayed"
  completedItems: number
  totalItems: number
  riskDetails?: string[]
  recommendation?: string
}

// 模拟迭代状态数据
const mockSprintStatuses: SprintStatusData[] = [
  {
    id: "sprint-recommend-002",
    name: "Sprint 2 - 推荐算法",
    projectName: "推荐系统",
    progress: 45,
    remainingDays: 13,
    status: "delayed",
    riskDetails: ["实际进度落后计划 15%", "3 个高优先级任务未开始"],
    recommendation: "建议：① 重新评估任务优先级，优先完成核心功能；② 考虑将非核心需求移至下个迭代；③ 安排每日站会跟踪进度",
  },
  {
    id: "sprint-recommend-003",
    name: "Sprint 3 - 场景接入",
    projectName: "推荐系统",
    progress: 68,
    remainingDays: 29,
    status: "healthy",
    riskDetails: ["进度符合预期", "资源分配合理", "无阻塞风险"],
  },
]

// 模拟发布状态数据
const mockReleaseStatuses: ReleaseStatusData[] = [
  {
    id: "release-001",
    name: "推荐系统",
    version: "v1.0.0",
    plannedDate: "2026-04-15",
    status: "at-risk",
    completedItems: 8,
    totalItems: 15,
    riskDetails: ["2 个 P0 需求未完成", "测试覆盖率不足"],
    recommendation: "建议：① 集中资源完成 P0 需求；② 增加自动化测试用例；③ 考虑分批发布，先上线核心功能",
  },
  {
    id: "release-002",
    name: "标签平台",
    version: "v2.1.0",
    plannedDate: "2026-03-30",
    status: "on-track",
    completedItems: 12,
    totalItems: 14,
    riskDetails: ["进度正常", "测试通过率 95%"],
  },
]

// 获取风险状态配置
const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    healthy: { label: "状态健康", color: "#10b981", icon: <CheckCircleOutlined /> },
    delayed: { label: "进度滞后", color: "#f59e0b", icon: <ClockCircleOutlined /> },
    blocked: { label: "存在阻塞", color: "#ef4444", icon: <StopOutlined /> },
    overload: { label: "资源超载", color: "#f97316", icon: <TeamOutlined /> },
    "on-track": { label: "进度正常", color: "#10b981", icon: <CheckCircleOutlined /> },
    "at-risk": { label: "存在风险", color: "#f59e0b", icon: <WarningOutlined /> },
  }
  return configs[status] || configs.healthy
}

// 生成今日日期字符串
const getTodayString = () => {
  const today = new Date()
  return `${today.getMonth() + 1}月${today.getDate()}日`
}

// 生成迭代状态消息
const generateSprintMessage = (sprint: SprintStatusData): Message => {
  const statusConfig = getStatusConfig(sprint.status)
  const hasRisk = sprint.status !== "healthy"
  
  return {
    id: `sprint-${sprint.id}-${Date.now()}`,
    role: "assistant",
    type: "sprint-status",
    content: "",
    timestamp: new Date(),
    data: sprint,
  }
}

// 生成发布状态消息
const generateReleaseMessage = (release: ReleaseStatusData): Message => {
  return {
    id: `release-${release.id}-${Date.now()}`,
    role: "assistant",
    type: "release-status",
    content: "",
    timestamp: new Date(),
    data: release,
  }
}

// 初始欢迎消息
const generateWelcomeMessage = (): Message => ({
  id: "welcome-1",
  role: "assistant",
  type: "welcome",
  content: `早上好！我是小派 👋\n\n今天是 ${getTodayString()}，我已经为你分析了当前进行中的迭代和发布状态，请查看下方的状态报告。\n\n如有任何问题，随时可以问我！`,
  timestamp: new Date(),
})

interface AISidebarProps {
  onCollapse: () => void
}

export function AISidebar({ onCollapse }: AISidebarProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 初始化消息
  useEffect(() => {
    const initialMessages: Message[] = [
      generateWelcomeMessage(),
      ...mockSprintStatuses.map(generateSprintMessage),
      ...mockReleaseStatuses.map(generateReleaseMessage),
    ]
    setMessages(initialMessages)
  }, [])

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 模拟 AI 回复
  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true)
    
    setTimeout(() => {
      let response: Message

      if (userMessage.includes("建议") || userMessage.includes("怎么办") || userMessage.includes("如何")) {
        response = {
          id: Date.now().toString(),
          role: "assistant",
          content: "根据当前项目状态，我有以下建议：\n\n**针对进度滞后的迭代：**\n1. 重新评估剩余任务的优先级\n2. 考虑增加资源或调整范围\n3. 与团队沟通，识别具体阻塞点\n\n**针对有风险的发布：**\n1. 优先完成 P0 级别需求\n2. 增加测试资源，提高覆盖率\n3. 准备回滚方案，降低发布风险\n\n需要我帮你生成详细的调整计划吗？",
          timestamp: new Date(),
          actions: [
            { label: "生成调整计划", action: "/ai/adjustment-plan" },
            { label: "查看详细分析", action: "/ai/risk-analysis" },
          ],
        }
      } else if (userMessage.includes("进度") || userMessage.includes("状态")) {
        response = {
          id: Date.now().toString(),
          role: "assistant",
          content: "📊 **项目进度汇总**\n\n当前有 **2** 个进行中的迭代：\n• Sprint 2 进度 45%，存在滞后风险\n• Sprint 3 进度 68%，状态健康\n\n当前有 **2** 个待发布版本：\n• 推荐系统 v1.0.0 存在风险\n• 标签平台 v2.1.0 进度正常\n\n整体项目健康度：**中等**\n建议关注 Sprint 2 的进度问题。",
          timestamp: new Date(),
          actions: [
            { label: "查看迭代详情", action: "/projects" },
            { label: "生成周报", action: "/ai/weekly-report" },
          ],
        }
      } else if (userMessage.includes("日报") || userMessage.includes("周报")) {
        response = {
          id: Date.now().toString(),
          role: "assistant",
          content: "好的，我来帮你生成报告！\n\n请选择报告类型：\n• **日报** - 包含今日完成、明日计划、风险项\n• **周报** - 包含本周进度、下周计划、里程碑状态\n\n报告将自动汇总所有项目的进度数据。",
          timestamp: new Date(),
          actions: [
            { label: "生成日报", action: "/ai/daily-report" },
            { label: "生成周报", action: "/ai/weekly-report" },
          ],
        }
      } else {
        response = {
          id: Date.now().toString(),
          role: "assistant",
          content: "我理解你的问题。作为你的 AI 项目经理助手，我可以帮你：\n\n1. **状态分析** - 分析迭代和发布的健康状态\n2. **风险预警** - 提前识别潜在风险\n3. **优化建议** - 提供改进方案\n4. **报告生成** - 自动生成日报/周报\n\n你想了解哪方面的信息？",
          timestamp: new Date(),
        }
      }

      setMessages(prev => [...prev, response])
      setIsTyping(false)
    }, 1500)
  }

  // 发送消息
  const handleSend = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    simulateAIResponse(inputValue)
  }

  // 处理动作按钮
  const handleAction = (action: string) => {
    router.push(action)
  }

  // 渲染迭代状态消息
  const renderSprintStatusMessage = (message: Message) => {
    const sprint = message.data as SprintStatusData
    const statusConfig = getStatusConfig(sprint.status)
    const hasRisk = sprint.status !== "healthy"

    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: `1px solid ${hasRisk ? statusConfig.color + "30" : "#e2e8f0"}`,
        }}
      >
        {/* 标题行 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <RocketOutlined style={{ color: "#fff", fontSize: 14 }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 13, display: "block" }}>{sprint.name}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{sprint.projectName}</Text>
            </div>
          </div>
          <Tag
            icon={statusConfig.icon}
            style={{
              margin: 0,
              borderRadius: 4,
              background: `${statusConfig.color}15`,
              color: statusConfig.color,
              border: "none",
              fontSize: 11,
            }}
          >
            {statusConfig.label}
          </Tag>
        </div>

        {/* 进度条 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: "#64748b" }}>进度 {sprint.progress}%</Text>
            <Text style={{ fontSize: 11, color: "#64748b" }}>剩余 {sprint.remainingDays} 天</Text>
          </div>
          <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${sprint.progress}%`,
              background: hasRisk 
                ? statusConfig.color 
                : "linear-gradient(90deg, #7c7cff 0%, #22d3ee 100%)",
              borderRadius: 3,
            }} />
          </div>
        </div>

        {/* 风险详情 */}
        {sprint.riskDetails && (
          <div style={{ 
            background: hasRisk ? `${statusConfig.color}08` : "#f8fafc", 
            padding: 10, 
            borderRadius: 6,
            marginBottom: sprint.recommendation ? 10 : 0,
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {sprint.riskDetails.map((detail, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    background: "#fff",
                    padding: "2px 8px",
                    borderRadius: 4,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {detail}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 推荐方案 - 仅有风险时显示 */}
        {hasRisk && sprint.recommendation && (
          <div style={{
            background: `${statusConfig.color}08`,
            padding: 10,
            borderRadius: 6,
            borderLeft: `3px solid ${statusConfig.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <BulbOutlined style={{ color: statusConfig.color, fontSize: 12, marginTop: 2 }} />
              <Text style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                {sprint.recommendation}
              </Text>
            </div>
          </div>
        )}

        {/* 时间戳 */}
        <Text type="secondary" style={{ fontSize: 10, display: "block", marginTop: 8 }}>
          {message.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </div>
    )
  }

  // 渲染发布状态消息
  const renderReleaseStatusMessage = (message: Message) => {
    const release = message.data as ReleaseStatusData
    const statusConfig = getStatusConfig(release.status)
    const hasRisk = release.status !== "on-track"
    const progress = Math.round((release.completedItems / release.totalItems) * 100)

    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: `1px solid ${hasRisk ? statusConfig.color + "30" : "#e2e8f0"}`,
        }}
      >
        {/* 标题行 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: hasRisk ? `${statusConfig.color}15` : "#10b98115",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <CalendarOutlined style={{ color: hasRisk ? statusConfig.color : "#10b981", fontSize: 14 }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 13, display: "block" }}>
                {release.name} {release.version}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>计划发布：{release.plannedDate}</Text>
            </div>
          </div>
          <Tag
            icon={statusConfig.icon}
            style={{
              margin: 0,
              borderRadius: 4,
              background: `${statusConfig.color}15`,
              color: statusConfig.color,
              border: "none",
              fontSize: 11,
            }}
          >
            {statusConfig.label}
          </Tag>
        </div>

        {/* 进度条 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: "#64748b" }}>完成进度 {progress}%</Text>
            <Text style={{ fontSize: 11, color: "#64748b" }}>{release.completedItems}/{release.totalItems} 项</Text>
          </div>
          <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: hasRisk ? statusConfig.color : "#10b981",
              borderRadius: 3,
            }} />
          </div>
        </div>

        {/* 风险详情 */}
        {release.riskDetails && (
          <div style={{ 
            background: hasRisk ? `${statusConfig.color}08` : "#f8fafc", 
            padding: 10, 
            borderRadius: 6,
            marginBottom: release.recommendation ? 10 : 0,
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {release.riskDetails.map((detail, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    background: "#fff",
                    padding: "2px 8px",
                    borderRadius: 4,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {detail}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 推荐方案 - 仅有风险时显示 */}
        {hasRisk && release.recommendation && (
          <div style={{
            background: `${statusConfig.color}08`,
            padding: 10,
            borderRadius: 6,
            borderLeft: `3px solid ${statusConfig.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <BulbOutlined style={{ color: statusConfig.color, fontSize: 12, marginTop: 2 }} />
              <Text style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                {release.recommendation}
              </Text>
            </div>
          </div>
        )}

        {/* 时间戳 */}
        <Text type="secondary" style={{ fontSize: 10, display: "block", marginTop: 8 }}>
          {message.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </div>
    )
  }

  // 渲染普通消息
  const renderNormalMessage = (message: Message) => (
    <div
      style={{
        maxWidth: "85%",
        padding: "10px 14px",
        borderRadius: message.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
        background: message.role === "user" 
          ? "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)" 
          : "#fff",
        color: message.role === "user" ? "#fff" : "#334155",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6 }}>
        {message.content}
      </div>
      {message.actions && message.actions.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {message.actions.map((action, idx) => (
            <Button
              key={idx}
              size="small"
              type={message.role === "user" ? "default" : "primary"}
              ghost={message.role === "assistant"}
              onClick={() => handleAction(action.action)}
              style={{
                borderRadius: 12,
                fontSize: 11,
                height: 26,
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
      <Text 
        type="secondary" 
        style={{ 
          fontSize: 10, 
          display: "block", 
          marginTop: 6,
          textAlign: message.role === "user" ? "right" : "left",
          color: message.role === "user" ? "rgba(255,255,255,0.7)" : undefined,
        }}
      >
        {message.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </div>
  )

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 56,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e2e8f0",
          background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
          flexShrink: 0,
        }}
      >
        <Space>
          <img
            src="/aiavatar.png"
            alt="小派"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              objectFit: "cover",
            }}
          />
          <div>
            <Text strong style={{ fontSize: 14, display: "block", color: "#fff" }}>小派 · AI 助手</Text>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>实时监控项目状态</Text>
          </div>
        </Space>
        <Tooltip title="关闭">
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined style={{ color: "#fff" }} />}
            onClick={onCollapse}
          />
        </Tooltip>
      </div>

      {/* 消息列表 */}
      <div style={{ 
        flex: 1, 
        overflowY: "auto", 
        padding: 16,
        background: "#f8fafc",
      }}>
        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: "flex",
              flexDirection: message.role === "user" ? "row-reverse" : "row",
              marginBottom: 16,
              gap: 8,
            }}
          >
            {message.role === "assistant" && (
              <img
                src="/aiavatar.png"
                alt="小派"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            )}
            
            {/* 根据消息类型渲染不同样式 */}
            {message.type === "sprint-status" ? (
              <div style={{ flex: 1, maxWidth: "calc(100% - 36px)" }}>
                {renderSprintStatusMessage(message)}
              </div>
            ) : message.type === "release-status" ? (
              <div style={{ flex: 1, maxWidth: "calc(100% - 36px)" }}>
                {renderReleaseStatusMessage(message)}
              </div>
            ) : (
              renderNormalMessage(message)
            )}
          </div>
        ))}
        
        {isTyping && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <img
              src="/aiavatar.png"
              alt="小派"
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                objectFit: "cover",
              }}
            />
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "12px 12px 12px 4px",
                background: "#fff",
              }}
            >
              <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>正在思考...</Text>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{ 
        padding: 12, 
        borderTop: "1px solid #f0f0f0",
        background: "#fff",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <TextArea
            placeholder="输入消息，按 Enter 发送..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ 
              flex: 1, 
              borderRadius: 18,
              resize: "none",
              fontSize: 13,
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim()}
            style={{
              borderRadius: 18,
              width: 40,
              height: 40,
              background: inputValue.trim() 
                ? "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)" 
                : undefined,
              border: "none",
            }}
          />
        </div>
        <Text type="secondary" style={{ fontSize: 10, marginTop: 6, display: "block", textAlign: "center" }}>
          Shift + Enter 换行
        </Text>
      </div>
    </div>
  )
}
