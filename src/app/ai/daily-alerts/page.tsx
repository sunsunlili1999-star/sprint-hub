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
  Badge,
  List,
  Avatar,
  Checkbox,
  Tooltip,
  Divider,
  Empty,
  Segmented,
  message,
} from "antd"
import {
  BellOutlined,
  ArrowLeftOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FilterOutlined,
  CheckOutlined,
} from "@ant-design/icons"

const { Title, Text, Paragraph } = Typography

// 提醒类型配置
const alertTypeConfig = {
  risk: { label: "风险预警", color: "#ef4444", icon: <WarningOutlined />, bgColor: "#fef2f2" },
  deadline: { label: "截止提醒", color: "#f59e0b", icon: <ClockCircleOutlined />, bgColor: "#fffbeb" },
  progress: { label: "进度更新", color: "#7c7cff", icon: <ThunderboltOutlined />, bgColor: "#f5f3ff" },
  meeting: { label: "会议通知", color: "#22d3ee", icon: <TeamOutlined />, bgColor: "#ecfeff" },
  release: { label: "发布通知", color: "#10b981", icon: <RocketOutlined />, bgColor: "#ecfdf5" },
  suggestion: { label: "AI建议", color: "#8b5cf6", icon: <BulbOutlined />, bgColor: "#faf5ff" },
}

// 模拟提醒数据
const mockAlerts = [
  {
    id: "1",
    type: "risk",
    title: "用户认证模块开发风险较高",
    description: "技术复杂度高，当前进度 45%，预估可能延期 2 天",
    project: "电商平台 v2.0",
    time: "10 分钟前",
    isRead: false,
    priority: "high",
    action: { label: "查看详情", link: "/ai/risk-analysis" },
  },
  {
    id: "2",
    type: "deadline",
    title: "报表导出功能明日到期",
    description: "距离验收截止日期仅剩 1 天，当前进度 80%",
    project: "数据中台",
    time: "30 分钟前",
    isRead: false,
    priority: "high",
    action: { label: "查看任务", link: "/tasks" },
  },
  {
    id: "3",
    type: "meeting",
    title: "Sprint 评审会议",
    description: "今日 15:00 Sprint 1 评审会议，请准备演示内容",
    project: "电商平台 v2.0",
    time: "1 小时前",
    isRead: false,
    priority: "medium",
    action: { label: "查看日程", link: "/calendar" },
  },
  {
    id: "4",
    type: "suggestion",
    title: "AI 建议：优化任务分配",
    description: "检测到张三当前工作负荷较高，建议将部分任务分配给李四",
    project: "全局",
    time: "2 小时前",
    isRead: false,
    priority: "medium",
    action: { label: "查看建议", link: "/ai/team-resources" },
  },
  {
    id: "5",
    type: "progress",
    title: "订单管理 API 开发完成",
    description: "王五已完成订单管理 API 开发，进入代码审查阶段",
    project: "电商平台 v2.0",
    time: "3 小时前",
    isRead: true,
    priority: "low",
    action: { label: "查看详情", link: "/tasks" },
  },
  {
    id: "6",
    type: "release",
    title: "数据迁移脚本今日发布",
    description: "计划于今日 22:00 执行数据迁移，请相关人员准备",
    project: "数据中台",
    time: "4 小时前",
    isRead: true,
    priority: "high",
    action: { label: "查看发布", link: "/releases" },
  },
  {
    id: "7",
    type: "risk",
    title: "支付流程测试环境不稳定",
    description: "第三方支付沙箱响应超时，可能影响测试进度",
    project: "电商平台 v2.0",
    time: "5 小时前",
    isRead: true,
    priority: "medium",
    action: { label: "查看详情", link: "/ai/risk-analysis" },
  },
  {
    id: "8",
    type: "deadline",
    title: "Sprint 1 即将结束",
    description: "本次迭代将于 3 天后结束，还有 5 个任务未完成",
    project: "电商平台 v2.0",
    time: "昨天",
    isRead: true,
    priority: "medium",
    action: { label: "查看迭代", link: "/iterations" },
  },
]

export default function DailyAlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState(mockAlerts)
  const [filter, setFilter] = useState<string>("all")
  const [showRead, setShowRead] = useState(true)

  // 过滤后的提醒
  const filteredAlerts = alerts.filter(alert => {
    if (!showRead && alert.isRead) return false
    if (filter === "all") return true
    return alert.type === filter
  })

  // 统计数据
  const unreadCount = alerts.filter(a => !a.isRead).length
  const highPriorityCount = alerts.filter(a => a.priority === "high" && !a.isRead).length

  // 标记已读
  const markAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a))
    message.success("已标记为已读")
  }

  // 全部标记已读
  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, isRead: true })))
    message.success("已全部标记为已读")
  }

  // 渲染提醒项
  const renderAlertItem = (alert: typeof mockAlerts[0]) => {
    const config = alertTypeConfig[alert.type as keyof typeof alertTypeConfig]
    return (
      <List.Item
        key={alert.id}
        style={{
          padding: "16px",
          background: alert.isRead ? "#fff" : config.bgColor,
          borderRadius: 8,
          marginBottom: 12,
          border: `1px solid ${alert.isRead ? "#e2e8f0" : config.color}30`,
        }}
        actions={[
          <Button
            key="action"
            type="link"
            size="small"
            onClick={() => router.push(alert.action.link)}
          >
            {alert.action.label}
          </Button>,
          !alert.isRead && (
            <Button
              key="read"
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => markAsRead(alert.id)}
            >
              标记已读
            </Button>
          ),
        ].filter(Boolean)}
      >
        <List.Item.Meta
          avatar={
            <Badge dot={!alert.isRead} offset={[-4, 4]}>
              <Avatar
                style={{
                  background: `${config.color}20`,
                  color: config.color,
                }}
                icon={config.icon}
              />
            </Badge>
          }
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Text strong style={{ color: alert.isRead ? "#64748b" : undefined }}>
                {alert.title}
              </Text>
              {alert.priority === "high" && (
                <Tag color="error" style={{ margin: 0 }}>紧急</Tag>
              )}
            </div>
          }
          description={
            <div>
              <Paragraph
                type="secondary"
                style={{ margin: 0, fontSize: 13, color: alert.isRead ? "#94a3b8" : undefined }}
              >
                {alert.description}
              </Paragraph>
              <Space style={{ marginTop: 8 }} size={16}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {alert.project}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {alert.time}
                </Text>
              </Space>
            </div>
          }
        />
      </List.Item>
    )
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
            <BellOutlined style={{ marginRight: 12, color: "#7c7cff" }} />
            每日提醒
            {unreadCount > 0 && (
              <Badge count={unreadCount} style={{ marginLeft: 12 }} />
            )}
          </Title>
        <Text type="secondary">
          小派为您整理的今日待办和提醒事项
        </Text>
        </div>
        <Space>
          <Button
            icon={showRead ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setShowRead(!showRead)}
          >
            {showRead ? "隐藏已读" : "显示已读"}
          </Button>
          <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
            全部已读
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>未读提醒</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#7c7cff" }}>{unreadCount}</div>
              </div>
              <BellOutlined style={{ fontSize: 24, color: "#7c7cff", opacity: 0.5 }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>紧急事项</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#ef4444" }}>{highPriorityCount}</div>
              </div>
              <ExclamationCircleOutlined style={{ fontSize: 24, color: "#ef4444", opacity: 0.5 }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>风险预警</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#f59e0b" }}>
                  {alerts.filter(a => a.type === "risk").length}
                </div>
              </div>
              <WarningOutlined style={{ fontSize: 24, color: "#f59e0b", opacity: 0.5 }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>今日会议</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#22d3ee" }}>
                  {alerts.filter(a => a.type === "meeting").length}
                </div>
              </div>
              <TeamOutlined style={{ fontSize: 24, color: "#22d3ee", opacity: 0.5 }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选器 */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Space>
          <FilterOutlined />
          <Text strong>筛选：</Text>
          <Segmented
            value={filter}
            onChange={(value) => setFilter(value as string)}
            options={[
              { label: "全部", value: "all" },
              ...Object.entries(alertTypeConfig).map(([key, config]) => ({
                label: (
                  <Space size={4}>
                    {config.icon}
                    <span>{config.label}</span>
                  </Space>
                ),
                value: key,
              })),
            ]}
          />
        </Space>
      </Card>

      {/* 提醒列表 */}
      <Card style={{ borderRadius: 12 }}>
        {filteredAlerts.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={filteredAlerts}
            renderItem={renderAlertItem}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                {filter === "all" ? "暂无提醒" : `暂无${alertTypeConfig[filter as keyof typeof alertTypeConfig]?.label || "此类"}提醒`}
              </span>
            }
          />
        )}
      </Card>

      {/* AI 总结 */}
      <Card
        style={{
          marginTop: 24,
          borderRadius: 12,
          background: "linear-gradient(135deg, #7c7cff08 0%, #22d3ee08 100%)",
          border: "1px solid #7c7cff20",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <Avatar
            style={{ background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)", flexShrink: 0 }}
            icon={<BulbOutlined />}
            size={40}
          />
          <div>
            <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
              小派今日总结
            </Title>
            <Paragraph style={{ margin: 0 }}>
              今日有 <Text strong style={{ color: "#ef4444" }}>{highPriorityCount}</Text> 个紧急事项需要优先处理：
              <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                <li>用户认证模块风险较高，建议今日与张三沟通进度</li>
                <li>报表导出功能明日到期，确保验收准备工作就绪</li>
                <li>数据迁移脚本今晚执行，请确保值班人员在线</li>
              </ul>
              建议优先处理截止日期最近的任务，并关注高风险项的进展。
            </Paragraph>
          </div>
        </div>
      </Card>
    </div>
  )
}
