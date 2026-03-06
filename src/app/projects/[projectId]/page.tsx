"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Tag,
  Progress,
  Space,
  Skeleton,
  Empty,
  Statistic,
  List,
  Tooltip,
} from "antd"
import {
  ProjectOutlined,
  TeamOutlined,
  FileTextOutlined,
  RocketOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons"
import { projectApi, type ProjectDetail } from "@/lib/api"

const { Text, Title } = Typography

// 迭代状态配置
const sprintStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PLANNING: { label: "规划中", color: "default", icon: <ClockCircleOutlined /> },
  ACTIVE: { label: "进行中", color: "processing", icon: <SyncOutlined spin /> },
  COMPLETED: { label: "已完成", color: "success", icon: <CheckCircleOutlined /> },
}

export default function ProjectOverviewPage() {
  const params = useParams()
  const projectId = params.projectId as string
  
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Row gutter={[24, 24]}>
          <Col span={16}>
            <Card>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          </Col>
          <Col span={24}>
            <Card>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
          </Col>
        </Row>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="项目不存在" />
      </div>
    )
  }

  // 计算进度
  const activeSprints = project.sprints.filter(s => s.status === "ACTIVE").length
  const completedSprints = project.sprints.filter(s => s.status === "COMPLETED").length
  const totalSprints = project.sprints.length
  const sprintProgress = totalSprints > 0 ? Math.round((completedSprints / totalSprints) * 100) : 0

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        {/* 左侧：项目概览 */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <Avatar
                  shape="square"
                  size={32}
                  style={{ background: "linear-gradient(135deg, #7c7cff 0%, #a78bfa 100%)" }}
                  icon={<ProjectOutlined />}
                />
                <span>项目概览</span>
              </Space>
            }
          >
            {/* 统计卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ textAlign: "center", background: "#f8fafc" }}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>需求数</Text>}
                    value={project.requirementCount}
                    prefix={<FileTextOutlined style={{ color: "#7c7cff" }} />}
                    valueStyle={{ fontSize: 24, color: "#475569" }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ textAlign: "center", background: "#f8fafc" }}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>迭代数</Text>}
                    value={project.sprintCount}
                    prefix={<RocketOutlined style={{ color: "#22d3ee" }} />}
                    valueStyle={{ fontSize: 24, color: "#475569" }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ textAlign: "center", background: "#f8fafc" }}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>进行中迭代</Text>}
                    value={activeSprints}
                    prefix={<SyncOutlined style={{ color: "#f59e0b" }} />}
                    valueStyle={{ fontSize: 24, color: "#475569" }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ textAlign: "center", background: "#f8fafc" }}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>成员数</Text>}
                    value={project.memberCount}
                    prefix={<TeamOutlined style={{ color: "#10b981" }} />}
                    valueStyle={{ fontSize: 24, color: "#475569" }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 项目描述 */}
            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 8 }}>项目描述</Title>
              <Text type="secondary">
                {project.description || "暂无描述"}
              </Text>
            </div>

            {/* 迭代进度 */}
            <div>
              <Title level={5} style={{ marginBottom: 12 }}>迭代进度</Title>
              <div style={{ marginBottom: 8 }}>
                <Space>
                  <Text type="secondary">已完成 {completedSprints} / {totalSprints} 个迭代</Text>
                </Space>
              </div>
              <Progress 
                percent={sprintProgress} 
                strokeColor={{
                  '0%': '#22d3ee',
                  '100%': '#7c7cff',
                }}
                trailColor="#e2e8f0"
              />
            </div>
          </Card>
        </Col>

        {/* 右侧：项目信息 */}
        <Col xs={24} lg={8}>
          <Card title="项目信息">
            <Space direction="vertical" style={{ width: "100%" }} size={16}>
              {/* 关联产品 */}
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  关联产品
                </Text>
                {project.products && project.products.length > 0 ? (
                  <Space wrap>
                    {project.products.map(p => (
                      <Tag key={p.id} color="purple">{p.name}</Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">未关联</Text>
                )}
              </div>

              {/* 项目周期 */}
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  项目周期
                </Text>
                {project.startDate || project.endDate ? (
                  <Space>
                    <CalendarOutlined style={{ color: "#64748b" }} />
                    <Text>{project.startDate || "?"} ~ {project.endDate || "?"}</Text>
                  </Space>
                ) : (
                  <Text type="secondary">未设置</Text>
                )}
              </div>

              {/* 项目状态 */}
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  项目状态
                </Text>
                <Tag color={project.status === "ACTIVE" ? "processing" : "default"}>
                  {project.status === "ACTIVE" ? "进行中" : "已归档"}
                </Tag>
              </div>

              {/* 创建人 */}
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  创建人
                </Text>
                <Space>
                  <Avatar size="small" style={{ background: "#a5b4fc" }}>
                    {project.creator.name?.[0] || "?"}
                  </Avatar>
                  <Text>{project.creator.name}</Text>
                </Space>
              </div>

              {/* 创建时间 */}
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  创建时间
                </Text>
                <Text>{new Date(project.createdAt).toLocaleDateString("zh-CN")}</Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 下方：团队成员和迭代列表 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <TeamOutlined />
                <span>团队成员</span>
                <Tag color="blue">{project.members.length}</Tag>
              </Space>
            }
            style={{ height: "100%" }}
          >
            {project.members.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {project.members.map((member) => (
                  <Tooltip key={member.id} title={member.name}>
                    <div style={{ textAlign: "center" }}>
                      <Avatar 
                        size={40} 
                        style={{ background: "#a5b4fc", marginBottom: 4 }}
                      >
                        {member.name?.[0] || "?"}
                      </Avatar>
                      <div>
                        <Text style={{ fontSize: 12 }}>{member.name}</Text>
                      </div>
                    </div>
                  </Tooltip>
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无成员" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <RocketOutlined />
                <span>迭代列表</span>
                <Tag color="blue">{project.sprints.length}</Tag>
              </Space>
            }
            style={{ height: "100%" }}
          >
            {project.sprints.length > 0 ? (
              <List
                size="small"
                dataSource={project.sprints.slice(0, 5)}
                renderItem={(sprint) => {
                  const statusInfo = sprintStatusConfig[sprint.status] || sprintStatusConfig.PLANNING
                  return (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text>{sprint.name}</Text>
                            <Tag color={statusInfo.color} icon={statusInfo.icon}>
                              {statusInfo.label}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space size={4}>
                            <CalendarOutlined style={{ fontSize: 12 }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {sprint.startDate} ~ {sprint.endDate}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无迭代" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
