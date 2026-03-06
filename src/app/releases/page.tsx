"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Typography,
  Button,
  Input,
  Select,
  Table,
  Tag,
  Avatar,
  Progress,
  Space,
  Empty,
  Skeleton,
  Tooltip,
  Dropdown,
  Modal,
  message,
  Segmented,
  Card,
} from "antd"
import type { ColumnsType } from "antd/es/table"
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
  RobotOutlined,
  HistoryOutlined,
  MoreOutlined,
  ProjectOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/zh-cn"
import { releaseApi, projectApi, type ReleaseListItem, type Project } from "@/lib/api"
import { CreateReleaseModal } from "./components/CreateReleaseModal"
import { useBreadcrumb } from "@/components/layout/main-layout"

dayjs.extend(relativeTime)
dayjs.locale("zh-cn")

const { Title, Text } = Typography

// 状态配置
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PLANNING: { label: "规划中", color: "default", icon: <ClockCircleOutlined /> },
  READY: { label: "待发布", color: "processing", icon: <ThunderboltOutlined /> },
  IN_PROGRESS: { label: "发布中", color: "warning", icon: <RocketOutlined /> },
  COMPLETED: { label: "已完成", color: "success", icon: <CheckCircleOutlined /> },
  CANCELLED: { label: "已取消", color: "default", icon: <ExclamationCircleOutlined /> },
}

// 风险等级配置
const riskConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "低", color: "success" },
  MEDIUM: { label: "中", color: "warning" },
  HIGH: { label: "高", color: "error" },
}

export default function ReleasesPage() {
  const router = useRouter()
  const { setBreadcrumbs } = useBreadcrumb()
  const [releases, setReleases] = useState<ReleaseListItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterProject, setFilterProject] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("active") // active | history | all
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    setBreadcrumbs([{ title: "发布管理" }])
  }, [setBreadcrumbs])

  // 加载发布列表
  const loadReleases = useCallback(async () => {
    try {
      setLoading(true)
      const data = await releaseApi.getList({
        search: search || undefined,
        projectId: filterProject || undefined,
      })
      setReleases(data)
    } catch (error) {
      console.error("加载发布列表失败", error)
      message.error("加载发布列表失败")
    } finally {
      setLoading(false)
    }
  }, [search, filterProject])

  // 加载项目列表
  const loadProjects = useCallback(async () => {
    try {
      const data = await projectApi.getList()
      setProjects(data)
    } catch (error) {
      console.error("加载项目列表失败", error)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    loadReleases()
  }, [loadReleases])

  // 删除发布
  const handleDelete = async (release: ReleaseListItem) => {
    Modal.confirm({
      title: "删除发布",
      content: `确定要删除「${release.name}」吗？此操作不可恢复。`,
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        try {
          await releaseApi.delete(release.id)
          message.success("删除成功")
          loadReleases()
        } catch (error) {
          console.error("删除失败", error)
          message.error("删除失败")
        }
      },
    })
  }

  // 过滤数据
  const filteredReleases = releases.filter((r) => {
    if (filterStatus === "active") {
      return r.status !== "COMPLETED" && r.status !== "CANCELLED"
    }
    if (filterStatus === "history") {
      return r.status === "COMPLETED" || r.status === "CANCELLED"
    }
    return true
  })

  // 统计数据
  const stats = {
    active: releases.filter((r) => r.status !== "COMPLETED" && r.status !== "CANCELLED").length,
    history: releases.filter((r) => r.status === "COMPLETED" || r.status === "CANCELLED").length,
    all: releases.length,
  }

  // 表格列定义
  const columns: ColumnsType<ReleaseListItem> = [
    {
      title: "发布名称",
      dataIndex: "name",
      key: "name",
      width: 280,
      render: (name: string, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: record.status === "COMPLETED" 
                ? "linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                : record.status === "IN_PROGRESS"
                ? "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                : "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <RocketOutlined style={{ fontSize: 16 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ display: "block", marginBottom: 2 }}>{name}</Text>
            {record.description && (
              <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                {record.description}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "所属项目",
      dataIndex: "project",
      key: "project",
      width: 150,
      render: (project) => (
        <Space size={4}>
          <ProjectOutlined style={{ color: "#64748b" }} />
          <Text>{project.name}</Text>
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status] || statusConfig.PLANNING
        return (
          <Tag color={config.color} style={{ margin: 0 }}>
            {config.icon} {config.label}
          </Tag>
        )
      },
    },
    {
      title: "风险",
      dataIndex: "riskLevel",
      key: "riskLevel",
      width: 80,
      render: (riskLevel: string, record) => {
        const config = riskConfig[riskLevel] || riskConfig.LOW
        return (
          <Space size={4}>
            <Tag color={config.color} style={{ margin: 0 }}>{config.label}</Tag>
            {record.aiRiskScore !== null && (
              <Tooltip title="AI风险评分">
                <Tag style={{ margin: 0, background: "#f0f0ff", color: "#7c7cff", border: "none" }}>
                  <RobotOutlined /> {record.aiRiskScore}
                </Tag>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
    {
      title: "进度",
      key: "progress",
      width: 180,
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Progress
            percent={record.progress}
            size="small"
            strokeColor={{
              "0%": "#7c7cff",
              "100%": "#22d3ee",
            }}
            style={{ flex: 1, margin: 0 }}
            showInfo={false}
          />
          <Text style={{ fontSize: 12, minWidth: 60 }}>
            {record.completedItemCount}/{record.itemCount}
          </Text>
        </div>
      ),
    },
    {
      title: "计划日期",
      dataIndex: "plannedDate",
      key: "plannedDate",
      width: 120,
      render: (date: string, record) => {
        const plannedDate = dayjs(date)
        const isOverdue = record.status !== "COMPLETED" && record.status !== "CANCELLED" && plannedDate.isBefore(dayjs(), "day")
        return (
          <Space size={4}>
            <CalendarOutlined style={{ color: isOverdue ? "#ef4444" : "#64748b" }} />
            <Text style={{ color: isOverdue ? "#ef4444" : undefined }}>
              {plannedDate.format("MM-DD")}
            </Text>
            {isOverdue && (
              <Tooltip title="已逾期">
                <WarningOutlined style={{ color: "#ef4444", fontSize: 12 }} />
              </Tooltip>
            )}
          </Space>
        )
      },
    },
    {
      title: "负责人",
      dataIndex: "owner",
      key: "owner",
      width: 100,
      render: (owner) => (
        <Tooltip title={owner.name}>
          <Space size={4}>
            <Avatar size={24} src={owner.avatar} style={{ background: "#c4b5fd" }}>
              {owner.name?.[0]}
            </Avatar>
            <Text style={{ fontSize: 13 }}>{owner.name}</Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: "view", icon: <EyeOutlined />, label: "查看详情" },
              { key: "edit", icon: <EditOutlined />, label: "编辑" },
              { type: "divider" },
              { key: "delete", icon: <DeleteOutlined />, label: "删除", danger: true },
            ],
            onClick: ({ key }) => {
              if (key === "view") router.push(`/releases/${record.id}`)
              if (key === "delete") handleDelete(record)
            },
          }}
          trigger={["click"]}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <div style={{ padding: "24px 32px" }}>
      {/* 页面头部 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
            发布管理
          </Title>
          <Text type="secondary">管理项目发布计划，追踪发布进度</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          style={{
            background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
            border: "none",
          }}
        >
          创建发布
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card
        size="small"
        style={{ marginBottom: 16, borderRadius: 8 }}
        styles={{ body: { padding: "12px 16px" } }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Space size={12}>
            <Segmented
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as string)}
              options={[
                { value: "active", label: `进行中 (${stats.active})` },
                { value: "history", label: <span><HistoryOutlined /> 历史记录 ({stats.history})</span> },
                { value: "all", label: `全部 (${stats.all})` },
              ]}
            />
          </Space>

          <Space size={12}>
            <Input
              placeholder="搜索发布名称..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            <Select
              placeholder="选择项目"
              value={filterProject || undefined}
              onChange={(v) => setFilterProject(v || "")}
              style={{ width: 160 }}
              allowClear
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Space>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card
        style={{ borderRadius: 8 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={filteredReleases}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onRow={(record) => ({
            onClick: () => router.push(`/releases/${record.id}`),
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  filterStatus === "history" 
                    ? "暂无历史发布记录" 
                    : "暂无发布计划"
                }
              >
                {filterStatus !== "history" && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalOpen(true)}
                    style={{
                      background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                      border: "none",
                    }}
                  >
                    创建第一个发布
                  </Button>
                )}
              </Empty>
            ),
          }}
        />
      </Card>

      {/* 创建发布弹窗 */}
      <CreateReleaseModal
        open={createModalOpen}
        projects={projects}
        onCancel={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false)
          loadReleases()
        }}
      />
    </div>
  )
}
