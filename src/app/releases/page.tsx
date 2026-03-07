"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Typography,
  Button,
  Input,
  Select,
  Tag,
  Avatar,
  Progress,
  Space,
  Empty,
  Tooltip,
  Dropdown,
  Modal,
  message,
  Segmented,
  Card,
} from "antd"
import {
  PlusOutlined,
  SearchOutlined,
  RocketOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  MoreOutlined,
  BugOutlined,
  FileTextOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/zh-cn"
import { useBreadcrumb } from "@/components/layout/main-layout"
import PilotIcon from "@/components/ui/PilotIcon"

dayjs.extend(relativeTime)
dayjs.locale("zh-cn")

const { Title, Text, Paragraph } = Typography

// 状态配置
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  PLANNING: { label: "规划中", color: "#64748b", bgColor: "#f1f5f9", icon: <ClockCircleOutlined /> },
  READY: { label: "待发布", color: "#7c7cff", bgColor: "#f5f3ff", icon: <ThunderboltOutlined /> },
  IN_PROGRESS: { label: "发布中", color: "#f59e0b", bgColor: "#fffbeb", icon: <RocketOutlined /> },
  COMPLETED: { label: "已完成", color: "#10b981", bgColor: "#ecfdf5", icon: <CheckCircleOutlined /> },
  CANCELLED: { label: "已取消", color: "#94a3b8", bgColor: "#f8fafc", icon: <ExclamationCircleOutlined /> },
}

// 风险等级配置
const riskConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  LOW: { label: "低风险", color: "#10b981", bgColor: "#ecfdf5" },
  MEDIUM: { label: "中风险", color: "#f59e0b", bgColor: "#fffbeb" },
  HIGH: { label: "高风险", color: "#ef4444", bgColor: "#fef2f2" },
}

// 模拟发布数据
const mockReleases = [
  {
    id: "1",
    name: "电商平台 v2.0 正式版",
    description: "全新改版的电商平台，包含新首页、商品详情页重构、购物车优化等核心功能升级",
    status: "IN_PROGRESS",
    riskLevel: "MEDIUM",
    aiRiskScore: 45,
    plannedDate: "2024-01-20",
    actualDate: null,
    project: { id: "1", name: "电商平台", code: "EC" },
    owner: { id: "1", name: "张三", avatar: null },
    creator: { id: "1", name: "李四", avatar: null },
    itemCount: 12,
    completedItemCount: 8,
    progress: 67,
    items: {
      requirements: 5,
      tasks: 4,
      bugs: 3,
    },
    createdAt: "2024-01-05T10:00:00Z",
    riskDescription: "部分接口性能待优化，建议在高峰期前完成压测",
  },
  {
    id: "2",
    name: "数据中台 v1.5 功能迭代",
    description: "新增数据报表导出功能，优化数据同步性能，修复已知问题",
    status: "READY",
    riskLevel: "LOW",
    aiRiskScore: 22,
    plannedDate: "2024-01-25",
    actualDate: null,
    project: { id: "2", name: "数据中台", code: "DC" },
    owner: { id: "2", name: "王五", avatar: null },
    creator: { id: "1", name: "张三", avatar: null },
    itemCount: 8,
    completedItemCount: 8,
    progress: 100,
    items: {
      requirements: 3,
      tasks: 3,
      bugs: 2,
    },
    createdAt: "2024-01-10T14:00:00Z",
    riskDescription: null,
  },
  {
    id: "3",
    name: "移动端 APP v3.2 热修复",
    description: "紧急修复登录闪退问题和支付回调异常",
    status: "COMPLETED",
    riskLevel: "HIGH",
    aiRiskScore: 78,
    plannedDate: "2024-01-12",
    actualDate: "2024-01-12",
    project: { id: "3", name: "移动APP", code: "APP" },
    owner: { id: "3", name: "赵六", avatar: null },
    creator: { id: "2", name: "王五", avatar: null },
    itemCount: 4,
    completedItemCount: 4,
    progress: 100,
    items: {
      requirements: 0,
      tasks: 1,
      bugs: 3,
    },
    createdAt: "2024-01-11T09:00:00Z",
    riskDescription: "紧急发布，回滚方案已准备",
  },
  {
    id: "4",
    name: "后台管理系统 v2.1",
    description: "新增用户行为分析模块，优化权限管理系统",
    status: "PLANNING",
    riskLevel: "LOW",
    aiRiskScore: 15,
    plannedDate: "2024-02-01",
    actualDate: null,
    project: { id: "1", name: "电商平台", code: "EC" },
    owner: { id: "1", name: "张三", avatar: null },
    creator: { id: "1", name: "张三", avatar: null },
    itemCount: 15,
    completedItemCount: 3,
    progress: 20,
    items: {
      requirements: 6,
      tasks: 7,
      bugs: 2,
    },
    createdAt: "2024-01-15T16:00:00Z",
    riskDescription: null,
  },
  {
    id: "5",
    name: "推荐系统 v2.0",
    description: "基于深度学习的新推荐算法上线，提升点击率和转化率",
    status: "READY",
    riskLevel: "MEDIUM",
    aiRiskScore: 52,
    plannedDate: "2024-01-22",
    actualDate: null,
    project: { id: "4", name: "推荐系统", code: "REC" },
    owner: { id: "2", name: "王五", avatar: null },
    creator: { id: "3", name: "赵六", avatar: null },
    itemCount: 10,
    completedItemCount: 9,
    progress: 90,
    items: {
      requirements: 4,
      tasks: 5,
      bugs: 1,
    },
    createdAt: "2024-01-08T11:00:00Z",
    riskDescription: "新算法需要A/B测试验证效果",
  },
]

// 模拟项目数据
const mockProjects = [
  { id: "1", name: "电商平台", code: "EC" },
  { id: "2", name: "数据中台", code: "DC" },
  { id: "3", name: "移动APP", code: "APP" },
  { id: "4", name: "推荐系统", code: "REC" },
]

export default function ReleasesPage() {
  const router = useRouter()
  const { setBreadcrumbs } = useBreadcrumb()
  const [releases] = useState(mockReleases)
  const [projects] = useState(mockProjects)
  const [search, setSearch] = useState("")
  const [filterProject, setFilterProject] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("active")

  useEffect(() => {
    setBreadcrumbs([{ title: "发布管理" }])
  }, [setBreadcrumbs])

  // 删除发布
  const handleDelete = (release: typeof mockReleases[0]) => {
    Modal.confirm({
      title: "删除发布",
      content: `确定要删除「${release.name}」吗？此操作不可恢复。`,
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        message.success("删除成功")
      },
    })
  }

  // 过滤数据
  const filteredReleases = releases.filter((r) => {
    // 状态过滤
    if (filterStatus === "active") {
      if (r.status === "COMPLETED" || r.status === "CANCELLED") return false
    }
    if (filterStatus === "history") {
      if (r.status !== "COMPLETED" && r.status !== "CANCELLED") return false
    }
    // 项目过滤
    if (filterProject && r.project.id !== filterProject) return false
    // 搜索过滤
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // 统计数据
  const stats = {
    total: releases.length,
    active: releases.filter((r) => r.status !== "COMPLETED" && r.status !== "CANCELLED").length,
    inProgress: releases.filter((r) => r.status === "IN_PROGRESS").length,
    completed: releases.filter((r) => r.status === "COMPLETED").length,
    highRisk: releases.filter((r) => r.riskLevel === "HIGH" && r.status !== "COMPLETED").length,
  }

  // 渲染发布卡片
  const renderReleaseCard = (release: typeof mockReleases[0]) => {
    const statusCfg = statusConfig[release.status] || statusConfig.PLANNING
    const riskCfg = riskConfig[release.riskLevel] || riskConfig.LOW
    const plannedDate = dayjs(release.plannedDate)
    const isOverdue = release.status !== "COMPLETED" && release.status !== "CANCELLED" && plannedDate.isBefore(dayjs(), "day")
    const daysLeft = plannedDate.diff(dayjs(), "day")

    return (
      <Card
        key={release.id}
        hoverable
        style={{
          marginBottom: 16,
          borderRadius: 12,
          border: release.status === "IN_PROGRESS" ? "1px solid #f59e0b40" : "1px solid #e2e8f0",
          background: release.status === "IN_PROGRESS" ? "linear-gradient(135deg, #fffbeb 0%, #fff 100%)" : "#fff",
        }}
        styles={{ body: { padding: 0 } }}
        onClick={() => router.push(`/releases/${release.id}`)}
      >
        <div style={{ padding: "20px 24px" }}>
          {/* 顶部：状态标签行 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <Space size={8}>
              <Tag
                icon={statusCfg.icon}
                style={{
                  margin: 0,
                  padding: "4px 12px",
                  borderRadius: 16,
                  background: statusCfg.bgColor,
                  color: statusCfg.color,
                  border: "none",
                  fontWeight: 500,
                }}
              >
                {statusCfg.label}
              </Tag>
              <Tag
                style={{
                  margin: 0,
                  padding: "4px 12px",
                  borderRadius: 16,
                  background: riskCfg.bgColor,
                  color: riskCfg.color,
                  border: "none",
                }}
              >
                {riskCfg.label}
              </Tag>
              {release.aiRiskScore && (
                <Tooltip title="AI 风险评分">
                  <Tag
                    icon={<PilotIcon style={{ fontSize: 12 }} />}
                    style={{
                      margin: 0,
                      padding: "4px 10px",
                      borderRadius: 16,
                      background: "#f5f3ff",
                      color: "#7c7cff",
                      border: "none",
                    }}
                  >
                    {release.aiRiskScore}分
                  </Tag>
                </Tooltip>
              )}
            </Space>
            <Dropdown
              menu={{
                items: [
                  { key: "view", icon: <EyeOutlined />, label: "查看详情" },
                  { key: "edit", icon: <EditOutlined />, label: "编辑" },
                  { type: "divider" },
                  { key: "delete", icon: <DeleteOutlined />, label: "删除", danger: true },
                ],
                onClick: ({ key, domEvent }) => {
                  domEvent.stopPropagation()
                  if (key === "view") router.push(`/releases/${release.id}`)
                  if (key === "delete") handleDelete(release)
                },
              }}
              trigger={["click"]}
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </div>

          {/* 主体内容 */}
          <div style={{ display: "flex", gap: 24 }}>
            {/* 左侧：发布信息 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 标题和描述 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: release.status === "COMPLETED"
                        ? "linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                        : release.status === "IN_PROGRESS"
                        ? "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                        : "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    <RocketOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, display: "block" }}>{release.name}</Text>
                    <Space size={8} style={{ marginTop: 2 }}>
                      <Tag style={{ margin: 0, background: "#f1f5f9", border: "none", color: "#64748b" }}>
                        {release.project.code}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>{release.project.name}</Text>
                    </Space>
                  </div>
                </div>
                {release.description && (
                  <Paragraph
                    type="secondary"
                    style={{ margin: 0, fontSize: 13, paddingLeft: 52 }}
                    ellipsis={{ rows: 2 }}
                  >
                    {release.description}
                  </Paragraph>
                )}
              </div>

              {/* 发布内容统计 */}
              <div style={{ display: "flex", gap: 24, paddingLeft: 52 }}>
                <Space size={4}>
                  <FileTextOutlined style={{ color: "#7c7cff" }} />
                  <Text type="secondary" style={{ fontSize: 13 }}>需求 {release.items.requirements}</Text>
                </Space>
                <Space size={4}>
                  <CheckCircleOutlined style={{ color: "#22d3ee" }} />
                  <Text type="secondary" style={{ fontSize: 13 }}>任务 {release.items.tasks}</Text>
                </Space>
                <Space size={4}>
                  <BugOutlined style={{ color: "#f59e0b" }} />
                  <Text type="secondary" style={{ fontSize: 13 }}>缺陷 {release.items.bugs}</Text>
                </Space>
              </div>
            </div>

            {/* 中间：进度 */}
            <div style={{ width: 200, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>完成进度</Text>
                  <Text strong style={{ fontSize: 13, color: "#7c7cff" }}>{release.progress}%</Text>
                </div>
                <Progress
                  percent={release.progress}
                  strokeColor={{
                    "0%": "#7c7cff",
                    "100%": "#22d3ee",
                  }}
                  trailColor="#e2e8f0"
                  showInfo={false}
                  size="small"
                />
              </div>
              <Text type="secondary" style={{ fontSize: 12, textAlign: "center" }}>
                已完成 {release.completedItemCount}/{release.itemCount} 项
              </Text>
            </div>

            {/* 右侧：日期和负责人 */}
            <div style={{ width: 160, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
              {/* 计划日期 */}
              <div
                style={{
                  padding: "10px 12px",
                  background: isOverdue ? "#fef2f2" : "#f8fafc",
                  borderRadius: 8,
                  border: isOverdue ? "1px solid #fecaca" : "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <CalendarOutlined style={{ color: isOverdue ? "#ef4444" : "#64748b", fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {release.status === "COMPLETED" ? "实际发布" : "计划发布"}
                  </Text>
                  {isOverdue && (
                    <Tag color="error" style={{ margin: 0, padding: "0 4px", fontSize: 10, lineHeight: "16px" }}>
                      已逾期
                    </Tag>
                  )}
                </div>
                <Text strong style={{ color: isOverdue ? "#ef4444" : "#334155", fontSize: 14 }}>
                  {release.actualDate ? dayjs(release.actualDate).format("MM月DD日") : plannedDate.format("MM月DD日")}
                </Text>
                {!isOverdue && release.status !== "COMPLETED" && release.status !== "CANCELLED" && (
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                    {daysLeft === 0 ? "今天" : daysLeft > 0 ? `${daysLeft}天后` : ""}
                  </Text>
                )}
              </div>

              {/* 负责人 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar size={28} style={{ background: "#c4b5fd", flexShrink: 0 }}>
                  {release.owner.name?.[0]}
                </Avatar>
                <div>
                  <Text style={{ fontSize: 12, display: "block" }}>{release.owner.name}</Text>
                  <Text type="secondary" style={{ fontSize: 10 }}>负责人</Text>
                </div>
              </div>
            </div>
          </div>

          {/* 风险提示 */}
          {release.riskDescription && release.status !== "COMPLETED" && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 16px",
                background: release.riskLevel === "HIGH" ? "#fef2f2" : "#fffbeb",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <WarningOutlined style={{ color: release.riskLevel === "HIGH" ? "#ef4444" : "#f59e0b" }} />
              <Text style={{ fontSize: 13, color: release.riskLevel === "HIGH" ? "#ef4444" : "#92400e" }}>
                {release.riskDescription}
              </Text>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* 筛选栏 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          gap: 16,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
          }}
        >
          <Segmented
            value={filterStatus}
            onChange={(v) => setFilterStatus(v as string)}
            options={[
              {
                value: "active",
                label: (
                  <Space size={4}>
                    <ThunderboltOutlined />
                    <span>进行中</span>
                    <Tag style={{ margin: 0, padding: "0 6px", fontSize: 11 }}>{stats.active}</Tag>
                  </Space>
                ),
              },
              {
                value: "history",
                label: (
                  <Space size={4}>
                    <HistoryOutlined />
                    <span>历史记录</span>
                  </Space>
                ),
              },
              {
                value: "all",
                label: (
                  <Space size={4}>
                    <span>全部</span>
                    <Tag style={{ margin: 0, padding: "0 6px", fontSize: 11 }}>{stats.total}</Tag>
                  </Space>
                ),
              },
            ]}
            style={{ background: "#f1f5f9" }}
          />

          <Space size={12}>
            <Input
              placeholder="搜索发布名称..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240, borderRadius: 8 }}
              allowClear
            />
            <Select
              placeholder="全部项目"
              value={filterProject || undefined}
              onChange={(v) => setFilterProject(v || "")}
              style={{ width: 150 }}
              allowClear
              options={[
                { value: "", label: "全部项目" },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </Space>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => message.info("创建发布功能")}
          style={{
            background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
            border: "none",
            borderRadius: 8,
            height: 40,
            flexShrink: 0,
          }}
        >
          创建发布
        </Button>
      </div>

      {/* 发布列表 */}
      <div>
        {filteredReleases.length > 0 ? (
          filteredReleases.map(renderReleaseCard)
        ) : (
          <Card style={{ borderRadius: 12, textAlign: "center", padding: "60px 0" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "#94a3b8" }}>
                  {filterStatus === "history" ? "暂无历史发布记录" : "暂无发布计划"}
                </span>
              }
            >
              {filterStatus !== "history" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => message.info("创建发布功能")}
                  style={{
                    background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                    border: "none",
                    marginTop: 16,
                  }}
                >
                  创建第一个发布
                </Button>
              )}
            </Empty>
          </Card>
        )}
      </div>
    </div>
  )
}
