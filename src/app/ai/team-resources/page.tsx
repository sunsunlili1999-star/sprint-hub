"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Typography,
  Card,
  Button,
  Steps,
  Table,
  Tag,
  Space,
  Input,
  Select,
  InputNumber,
  Avatar,
  Progress,
  Alert,
  Divider,
  Slider,
  Row,
  Col,
  Statistic,
  message,
} from "antd"
import {
  TeamOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons"

const { Title, Text, Paragraph } = Typography

// 模拟团队成员数据
const mockTeamMembers = [
  { id: "1", name: "张三", role: "前端开发", skill: "React/Vue", capacity: 8, avatar: null },
  { id: "2", name: "李四", role: "前端开发", skill: "React", capacity: 8, avatar: null },
  { id: "3", name: "王五", role: "后端开发", skill: "Java/Spring", capacity: 8, avatar: null },
  { id: "4", name: "赵六", role: "后端开发", skill: "Node.js", capacity: 6, avatar: null },
  { id: "5", name: "钱七", role: "测试工程师", skill: "自动化测试", capacity: 8, avatar: null },
  { id: "6", name: "孙八", role: "UI设计师", skill: "Figma", capacity: 4, avatar: null },
]

// 角色配置
const roleConfig: Record<string, { color: string; label: string }> = {
  "前端开发": { color: "#7c7cff", label: "前端" },
  "后端开发": { color: "#22d3ee", label: "后端" },
  "测试工程师": { color: "#10b981", label: "测试" },
  "UI设计师": { color: "#f59e0b", label: "设计" },
  "产品经理": { color: "#ef4444", label: "产品" },
}

export default function TeamResourcesPage() {
  const router = useRouter()
  const [members, setMembers] = useState(mockTeamMembers)
  const [sprintDuration, setSprintDuration] = useState(2)
  const [bufferPercent, setBufferPercent] = useState(20)

  // 计算团队总容量
  const totalCapacity = members.reduce((acc, m) => acc + m.capacity * 5 * sprintDuration, 0)
  const effectiveCapacity = Math.round(totalCapacity * (1 - bufferPercent / 100))

  // 按角色统计
  const roleStats = Object.entries(
    members.reduce((acc, m) => {
      acc[m.role] = (acc[m.role] || 0) + m.capacity
      return acc
    }, {} as Record<string, number>)
  )

  // 表格列
  const columns = [
    {
      title: "成员",
      key: "member",
      render: (_: unknown, record: typeof mockTeamMembers[0]) => (
        <Space>
          <Avatar style={{ background: roleConfig[record.role]?.color || "#7c7cff" }}>
            {record.name[0]}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.skill}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (role: string) => {
        const config = roleConfig[role]
        return (
          <Tag style={{ margin: 0, background: `${config?.color}15`, color: config?.color, border: "none" }}>
            {config?.label || role}
          </Tag>
        )
      },
    },
    {
      title: "日均工时",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity: number, record: typeof mockTeamMembers[0]) => (
        <InputNumber
          min={1}
          max={10}
          value={capacity}
          onChange={(value) => {
            setMembers(members.map(m => m.id === record.id ? { ...m, capacity: value || 8 } : m))
          }}
          addonAfter="h"
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: "迭代工时",
      key: "sprintCapacity",
      render: (_: unknown, record: typeof mockTeamMembers[0]) => (
        <Text>{record.capacity * 5 * sprintDuration}h</Text>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: typeof mockTeamMembers[0]) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => setMembers(members.filter(m => m.id !== record.id))}
          />
        </Space>
      ),
    },
  ]

  // 下一步
  const handleNext = () => {
    router.push("/ai/iteration-plan")
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* 返回按钮 */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/ai/upload-requirements")}
        style={{ marginBottom: 16, padding: "4px 0" }}
      >
        返回需求确认
      </Button>

      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
          <TeamOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          配置团队资源
        </Title>
        <Text type="secondary">
          设置团队成员和工作时间，AI 将根据资源情况生成最优迭代计划
        </Text>
      </div>

      {/* 步骤条 */}
      <Steps
        current={2}
        style={{ marginBottom: 32 }}
        items={[
          { title: "上传文档", icon: <FileTextOutlined /> },
          { title: "确认需求", icon: <CheckCircleOutlined /> },
          { title: "配置资源", icon: <UserOutlined /> },
          { title: "生成计划", icon: <CalendarOutlined /> },
        ]}
      />

      <Row gutter={24}>
        {/* 左侧 - 团队成员 */}
        <Col span={16}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>团队成员</span>
                <Tag>{members.length} 人</Tag>
              </Space>
            }
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                添加成员
              </Button>
            }
            style={{ marginBottom: 24, borderRadius: 12 }}
          >
            <Table
              columns={columns}
              dataSource={members}
              rowKey="id"
              pagination={false}
            />
          </Card>

          {/* 迭代配置 */}
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <span>迭代配置</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            <Row gutter={48}>
              <Col span={12}>
                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ display: "block", marginBottom: 12 }}>迭代周期</Text>
                  <Slider
                    min={1}
                    max={4}
                    value={sprintDuration}
                    onChange={setSprintDuration}
                    marks={{ 1: "1周", 2: "2周", 3: "3周", 4: "4周" }}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ display: "block", marginBottom: 12 }}>
                    缓冲时间 <Text type="secondary">（会议、突发任务等）</Text>
                  </Text>
                  <Slider
                    min={0}
                    max={40}
                    step={5}
                    value={bufferPercent}
                    onChange={setBufferPercent}
                    marks={{ 0: "0%", 20: "20%", 40: "40%" }}
                  />
                </div>
              </Col>
            </Row>

            <Alert
              type="info"
              icon={<BulbOutlined />}
              message="建议"
              description="建议保留 15-25% 的缓冲时间用于处理会议、Code Review、突发问题等"
              style={{ borderRadius: 8 }}
            />
          </Card>
        </Col>

        {/* 右侧 - 资源统计 */}
        <Col span={8}>
          <Card style={{ marginBottom: 24, borderRadius: 12 }}>
            <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
              <ThunderboltOutlined style={{ marginRight: 8, color: "#7c7cff" }} />
              资源容量统计
            </Title>

            <div style={{ marginBottom: 24 }}>
              <Statistic
                title="单迭代总工时"
                value={totalCapacity}
                suffix="小时"
                valueStyle={{ color: "#7c7cff" }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <Statistic
                title="有效工时（扣除缓冲）"
                value={effectiveCapacity}
                suffix="小时"
                valueStyle={{ color: "#22d3ee" }}
              />
              <Progress
                percent={100 - bufferPercent}
                strokeColor="#22d3ee"
                trailColor="#f1f5f9"
                showInfo={false}
                style={{ marginTop: 8 }}
              />
            </div>

            <Divider style={{ margin: "16px 0" }} />

            <Title level={5} style={{ margin: 0, marginBottom: 16 }}>角色分布</Title>
            {roleStats.map(([role, hours]) => {
              const config = roleConfig[role]
              const percent = Math.round((hours / members.reduce((a, m) => a + m.capacity, 0)) * 100)
              return (
                <div key={role} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <Space size={4}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: config?.color || "#7c7cff",
                        }}
                      />
                      <Text>{config?.label || role}</Text>
                    </Space>
                    <Text type="secondary">{hours}h/天 ({percent}%)</Text>
                  </div>
                  <Progress
                    percent={percent}
                    strokeColor={config?.color || "#7c7cff"}
                    trailColor="#f1f5f9"
                    showInfo={false}
                    size="small"
                  />
                </div>
              )
            })}
          </Card>

          <Card
            style={{
              borderRadius: 12,
              background: "linear-gradient(135deg, #7c7cff08 0%, #22d3ee08 100%)",
              border: "1px solid #7c7cff20",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <ClockCircleOutlined style={{ fontSize: 32, color: "#7c7cff", marginBottom: 12 }} />
              <Title level={5} style={{ margin: 0, marginBottom: 8 }}>需求总工时</Title>
              <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                基于 AI 解析的需求估算
              </Text>
              <Statistic
                value={96}
                suffix="小时"
                valueStyle={{ color: "#7c7cff", fontSize: 32 }}
              />
              <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                预计需要 <strong>{Math.ceil(96 / effectiveCapacity * sprintDuration)}</strong> 个迭代完成
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 底部操作 */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
        <Space>
          <Button onClick={() => router.push("/ai/upload-requirements")}>
            <ArrowLeftOutlined /> 上一步
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleNext}
            style={{
              background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
              border: "none",
            }}
          >
            下一步：AI 生成迭代计划 <ArrowRightOutlined />
          </Button>
        </Space>
      </div>
    </div>
  )
}
