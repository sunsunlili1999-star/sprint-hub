"use client"

import { useState, useEffect } from "react"
import {
  Typography,
  Card,
  Switch,
  Input,
  Button,
  Space,
  Tag,
  Divider,
  message,
  TimePicker,
  Select,
  Tabs,
  Alert,
  Form,
  InputNumber,
  Checkbox,
} from "antd"
import {
  DingdingOutlined,
  MailOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SendOutlined,
  CopyOutlined,
  ReloadOutlined,
  SettingOutlined,
  BellOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons"
import PilotIcon from "@/components/ui/PilotIcon"
import dayjs from "dayjs"
import { useBreadcrumb } from "@/components/layout/main-layout"

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

// OpenClaw 配置
interface OpenClawConfig {
  enabled: boolean
  apiEndpoint: string
  apiKey: string
  skills: {
    statusCheck: boolean
    riskAnalysis: boolean
    reportGeneration: boolean
  }
}

// 钉钉配置
interface DingTalkConfig {
  enabled: boolean
  webhook: string
  secret: string
  atMobiles: string[]
  isAtAll: boolean
}

// 推送配置
interface PushConfig {
  dailyStatus: {
    enabled: boolean
    time: string
    channels: string[]
  }
  riskAlert: {
    enabled: boolean
    threshold: number
    channels: string[]
  }
  weeklyReport: {
    enabled: boolean
    dayOfWeek: number
    time: string
    channels: string[]
  }
}

export default function IntegrationsPage() {
  const { setBreadcrumbs } = useBreadcrumb()
  
  const [openclawConfig, setOpenclawConfig] = useState<OpenClawConfig>({
    enabled: true,
    apiEndpoint: "https://api.openclaw.ai",
    apiKey: "",
    skills: {
      statusCheck: true,
      riskAnalysis: true,
      reportGeneration: true,
    },
  })
  
  const [dingtalkConfig, setDingtalkConfig] = useState<DingTalkConfig>({
    enabled: true,
    webhook: "",
    secret: "",
    atMobiles: [],
    isAtAll: false,
  })
  
  const [pushConfig, setPushConfig] = useState<PushConfig>({
    dailyStatus: {
      enabled: true,
      time: "09:00",
      channels: ["dingtalk"],
    },
    riskAlert: {
      enabled: true,
      threshold: 60,
      channels: ["dingtalk"],
    },
    weeklyReport: {
      enabled: true,
      dayOfWeek: 5,
      time: "17:00",
      channels: ["dingtalk", "email"],
    },
  })

  const [testSending, setTestSending] = useState(false)
  
  useEffect(() => {
    setBreadcrumbs([
      { title: "系统设置" },
      { title: "集成配置" },
    ])
  }, [setBreadcrumbs])

  // 测试钉钉连接
  const handleTestDingtalk = async () => {
    if (!dingtalkConfig.webhook) {
      message.warning("请先配置钉钉 Webhook 地址")
      return
    }
    setTestSending(true)
    // 模拟发送
    setTimeout(() => {
      message.success("测试消息发送成功！请检查钉钉群")
      setTestSending(false)
    }, 1500)
  }

  // 复制 API 地址
  const handleCopyApi = (api: string) => {
    navigator.clipboard.writeText(api)
    message.success("已复制到剪贴板")
  }

  // 保存配置
  const handleSave = () => {
    message.success("配置保存成功")
  }

  return (
    <div style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "calc(100vh - 56px)" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
          <ApiOutlined style={{ marginRight: 8, color: "#7c7cff" }} />
          集成配置
        </Title>
        <Text type="secondary">
          配置 OpenClaw AI 助手和钉钉消息推送，实现智能状态通知和风险预警
        </Text>
      </div>

      <Tabs
        defaultActiveKey="openclaw"
        items={[
          {
            key: "openclaw",
            label: (
              <span>
                <PilotIcon />
                OpenClaw 配置
              </span>
            ),
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* OpenClaw 介绍 */}
                <Alert
                  message="OpenClaw 集成说明"
                  description={
                    <div>
                      <Paragraph style={{ margin: 0 }}>
                        OpenClaw 是开源 AI 助手平台，通过 Skills 和 Lobster 工作流实现：
                      </Paragraph>
                      <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                        <li><strong>每日状态推送</strong> - 每天 9:00 定时推送迭代和发布状态到钉钉</li>
                        <li><strong>实时风险告警</strong> - 每小时检测风险，超过阈值立即通知</li>
                        <li><strong>智能周报生成</strong> - 每周五 17:00 自动生成并发送周报</li>
                      </ul>
                      <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer">
                        了解更多 OpenClaw →
                      </a>
                    </div>
                  }
                  type="info"
                  showIcon
                  icon={<PilotIcon />}
                />

                {/* 一键部署说明 */}
                {/* <Card
                  title={
                    <Space>
                      <ThunderboltOutlined style={{ color: "#10b981" }} />
                      <span>一键部署</span>
                    </Space>
                  }
                >
                  <Paragraph>
                    我们已为您准备好 OpenClaw Skills 和工作流配置，只需执行以下命令即可完成部署：
                  </Paragraph>
                  <div style={{ 
                    background: "#1e293b", 
                    padding: 16, 
                    borderRadius: 8, 
                    fontFamily: "monospace",
                    fontSize: 13,
                    color: "#e2e8f0",
                    marginBottom: 16,
                  }}>
                    <div style={{ color: "#94a3b8", marginBottom: 8 }}># 1. 进入项目目录</div>
                    <div style={{ marginBottom: 8 }}>cd sprint-hub</div>
                    <div style={{ color: "#94a3b8", marginBottom: 8 }}># 2. 运行部署脚本</div>
                    <div>bash openclaw/setup.sh</div>
                  </div>
                  <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
                    脚本会引导您完成以下步骤：安装 Skills → 配置钉钉 Webhook → 部署工作流 → 发送测试消息
                  </Paragraph>
                  <Space>
                    <Button 
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText("cd sprint-hub && bash openclaw/setup.sh")
                        message.success("命令已复制")
                      }}
                    >
                      复制命令
                    </Button>
                    <Button 
                      type="link"
                      onClick={() => window.open("https://github.com/your-org/projex/tree/main/openclaw", "_blank")}
                    >
                      查看完整文档 →
                    </Button>
                  </Space>
                </Card> */}

                {/* OpenClaw 配置卡片 */}
                <Card
                  title={
                    <Space>
                      <PilotIcon style={{ color: "#7c7cff" }} />
                      <span>OpenClaw 连接</span>
                      <Tag color={openclawConfig.enabled ? "success" : "default"}>
                        {openclawConfig.enabled ? "已启用" : "未启用"}
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Switch
                      checked={openclawConfig.enabled}
                      onChange={(checked) => setOpenclawConfig({ ...openclawConfig, enabled: checked })}
                    />
                  }
                >
                  <Form layout="vertical">
                    <Form.Item label="API 端点">
                      <Input
                        value={openclawConfig.apiEndpoint}
                        onChange={(e) => setOpenclawConfig({ ...openclawConfig, apiEndpoint: e.target.value })}
                        placeholder="https://api.openclaw.ai"
                        disabled={!openclawConfig.enabled}
                      />
                    </Form.Item>
                    <Form.Item label="API Key">
                      <Input.Password
                        value={openclawConfig.apiKey}
                        onChange={(e) => setOpenclawConfig({ ...openclawConfig, apiKey: e.target.value })}
                        placeholder="输入 OpenClaw API Key"
                        disabled={!openclawConfig.enabled}
                      />
                    </Form.Item>
                  </Form>

                  <Divider />

                  <Title level={5}>启用的 Skills</Title>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                      <Space>
                        <ClockCircleOutlined style={{ color: "#7c7cff" }} />
                        <div>
                          <Text strong>projex-status-skill</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>获取项目状态，用于每日推送</Text>
                        </div>
                      </Space>
                      <Switch
                        checked={openclawConfig.skills.statusCheck}
                        onChange={(checked) => setOpenclawConfig({
                          ...openclawConfig,
                          skills: { ...openclawConfig.skills, statusCheck: checked }
                        })}
                        disabled={!openclawConfig.enabled}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                      <Space>
                        <WarningOutlined style={{ color: "#f59e0b" }} />
                        <div>
                          <Text strong>projex-risk-skill</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>分析项目风险，生成推荐方案</Text>
                        </div>
                      </Space>
                      <Switch
                        checked={openclawConfig.skills.riskAnalysis}
                        onChange={(checked) => setOpenclawConfig({
                          ...openclawConfig,
                          skills: { ...openclawConfig.skills, riskAnalysis: checked }
                        })}
                        disabled={!openclawConfig.enabled}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                      <Space>
                        <FileTextOutlined style={{ color: "#10b981" }} />
                        <div>
                          <Text strong>projex-report-skill</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>生成日报/周报</Text>
                        </div>
                      </Space>
                      <Switch
                        checked={openclawConfig.skills.reportGeneration}
                        onChange={(checked) => setOpenclawConfig({
                          ...openclawConfig,
                          skills: { ...openclawConfig.skills, reportGeneration: checked }
                        })}
                        disabled={!openclawConfig.enabled}
                      />
                    </div>
                  </Space>
                </Card>

                {/* API 端点供 OpenClaw 调用 */}
                <Card
                  title={
                    <Space>
                      <ApiOutlined style={{ color: "#22d3ee" }} />
                      <span>Projex API 端点</span>
                    </Space>
                  }
                >
                  <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                    以下 API 供 OpenClaw Skills 调用，获取项目数据
                  </Text>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {[
                      { name: "获取迭代状态", url: "/api/openclaw/sprints/status", method: "GET" },
                      { name: "获取发布状态", url: "/api/openclaw/releases/status", method: "GET" },
                      { name: "获取风险分析", url: "/api/openclaw/risks/analysis", method: "GET" },
                      { name: "生成日报", url: "/api/openclaw/reports/daily", method: "POST" },
                      { name: "生成周报", url: "/api/openclaw/reports/weekly", method: "POST" },
                    ].map((api, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          background: "#f8fafc",
                          borderRadius: 6,
                        }}
                      >
                        <Space>
                          <Tag color={api.method === "GET" ? "blue" : "green"}>{api.method}</Tag>
                          <Text code style={{ fontSize: 13 }}>{api.url}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>- {api.name}</Text>
                        </Space>
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => handleCopyApi(`${window.location.origin}${api.url}`)}
                        />
                      </div>
                    ))}
                  </Space>
                </Card>
              </div>
            ),
          },
          {
            key: "dingtalk",
            label: (
              <span>
                <DingdingOutlined />
                钉钉配置
              </span>
            ),
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* 钉钉配置卡片 */}
                <Card
                  title={
                    <Space>
                      <DingdingOutlined style={{ color: "#1890ff" }} />
                      <span>钉钉群机器人</span>
                      <Tag color={dingtalkConfig.enabled ? "success" : "default"}>
                        {dingtalkConfig.enabled ? "已启用" : "未启用"}
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Switch
                      checked={dingtalkConfig.enabled}
                      onChange={(checked) => setDingtalkConfig({ ...dingtalkConfig, enabled: checked })}
                    />
                  }
                >
                  <Form layout="vertical">
                    <Form.Item
                      label="Webhook 地址"
                      help="在钉钉群设置中添加自定义机器人获取"
                    >
                      <Input
                        value={dingtalkConfig.webhook}
                        onChange={(e) => setDingtalkConfig({ ...dingtalkConfig, webhook: e.target.value })}
                        placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxx"
                        disabled={!dingtalkConfig.enabled}
                      />
                    </Form.Item>
                    <Form.Item
                      label="加签密钥 (可选)"
                      help="如果启用了加签安全设置"
                    >
                      <Input.Password
                        value={dingtalkConfig.secret}
                        onChange={(e) => setDingtalkConfig({ ...dingtalkConfig, secret: e.target.value })}
                        placeholder="SEC..."
                        disabled={!dingtalkConfig.enabled}
                      />
                    </Form.Item>
                    <Form.Item label="@指定成员 (手机号)">
                      <Select
                        mode="tags"
                        value={dingtalkConfig.atMobiles}
                        onChange={(value) => setDingtalkConfig({ ...dingtalkConfig, atMobiles: value })}
                        placeholder="输入手机号后回车添加"
                        disabled={!dingtalkConfig.enabled}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Checkbox
                        checked={dingtalkConfig.isAtAll}
                        onChange={(e) => setDingtalkConfig({ ...dingtalkConfig, isAtAll: e.target.checked })}
                        disabled={!dingtalkConfig.enabled}
                      >
                        @所有人
                      </Checkbox>
                    </Form.Item>
                  </Form>

                  <Divider />

                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleTestDingtalk}
                    loading={testSending}
                    disabled={!dingtalkConfig.enabled}
                  >
                    发送测试消息
                  </Button>
                </Card>

                {/* 消息预览 */}
                <Card
                  title={
                    <Space>
                      <BellOutlined style={{ color: "#7c7cff" }} />
                      <span>消息预览</span>
                    </Space>
                  }
                >
                  <div style={{ 
                    background: "#f5f5f5", 
                    borderRadius: 8, 
                    padding: 16,
                    maxWidth: 400,
                  }}>
                    <div style={{ 
                      background: "#fff", 
                      borderRadius: 8, 
                      padding: 16,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <img src="/aiavatar.png" alt="小派" style={{ width: 32, height: 32, borderRadius: 16 }} />
                        <Text strong>小派 · AI 助手</Text>
                      </div>
                      <Divider style={{ margin: "12px 0" }} />
                      <div style={{ marginBottom: 12 }}>
                        <Tag color="blue">每日状态播报</Tag>
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                          {dayjs().format("MM月DD日 HH:mm")}
                        </Text>
                      </div>
                      <div style={{ 
                        background: "#fff7e6", 
                        border: "1px solid #ffd591",
                        borderRadius: 6, 
                        padding: 12,
                        marginBottom: 12,
                      }}>
                        <Space>
                          <WarningOutlined style={{ color: "#fa8c16" }} />
                          <Text strong>Sprint 2 - 推荐算法</Text>
                          <Tag color="warning">进度滞后</Tag>
                        </Space>
                        <div style={{ marginTop: 8, fontSize: 13 }}>
                          <div>进度: 45% | 剩余 13 天</div>
                          <div style={{ color: "#666", marginTop: 4 }}>
                            ⚠️ 实际进度落后计划 15%
                          </div>
                          <div style={{ 
                            background: "#fffbe6", 
                            padding: 8, 
                            borderRadius: 4, 
                            marginTop: 8,
                            fontSize: 12,
                          }}>
                            💡 建议：重新评估任务优先级，考虑将非核心需求移至下个迭代
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        background: "#f6ffed", 
                        border: "1px solid #b7eb8f",
                        borderRadius: 6, 
                        padding: 12,
                      }}>
                        <Space>
                          <CheckCircleOutlined style={{ color: "#52c41a" }} />
                          <Text strong>Sprint 3 - 场景接入</Text>
                          <Tag color="success">状态健康</Tag>
                        </Space>
                        <div style={{ marginTop: 8, fontSize: 13 }}>
                          <div>进度: 68% | 剩余 29 天</div>
                          <div style={{ color: "#666", marginTop: 4 }}>
                            ✅ 进度符合预期，资源分配合理
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ),
          },
          {
            key: "schedule",
            label: (
              <span>
                <ClockCircleOutlined />
                推送计划
              </span>
            ),
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* 每日状态推送 */}
                <Card
                  title={
                    <Space>
                      <ClockCircleOutlined style={{ color: "#7c7cff" }} />
                      <span>每日状态推送</span>
                      <Tag color={pushConfig.dailyStatus.enabled ? "success" : "default"}>
                        {pushConfig.dailyStatus.enabled ? "已启用" : "未启用"}
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Switch
                      checked={pushConfig.dailyStatus.enabled}
                      onChange={(checked) => setPushConfig({
                        ...pushConfig,
                        dailyStatus: { ...pushConfig.dailyStatus, enabled: checked }
                      })}
                    />
                  }
                >
                  <Form layout="vertical">
                    <Form.Item label="推送时间">
                      <TimePicker
                        value={dayjs(pushConfig.dailyStatus.time, "HH:mm")}
                        format="HH:mm"
                        onChange={(time) => {
                          if (time) {
                            setPushConfig({
                              ...pushConfig,
                              dailyStatus: { ...pushConfig.dailyStatus, time: time.format("HH:mm") }
                            })
                          }
                        }}
                        disabled={!pushConfig.dailyStatus.enabled}
                      />
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        每天 {pushConfig.dailyStatus.time} 自动推送
                      </Text>
                    </Form.Item>
                    <Form.Item label="推送渠道">
                      <Checkbox.Group
                        value={pushConfig.dailyStatus.channels}
                        onChange={(value) => setPushConfig({
                          ...pushConfig,
                          dailyStatus: { ...pushConfig.dailyStatus, channels: value as string[] }
                        })}
                        disabled={!pushConfig.dailyStatus.enabled}
                      >
                        <Checkbox value="dingtalk">
                          <DingdingOutlined /> 钉钉
                        </Checkbox>
                        <Checkbox value="email">
                          <MailOutlined /> 邮件
                        </Checkbox>
                      </Checkbox.Group>
                    </Form.Item>
                  </Form>
                  <Alert
                    message="推送内容"
                    description="包含所有进行中迭代的状态、进度、风险预警及 AI 推荐方案"
                    type="info"
                    showIcon
                  />
                </Card>

                {/* 实时风险告警 */}
                <Card
                  title={
                    <Space>
                      <ThunderboltOutlined style={{ color: "#f59e0b" }} />
                      <span>实时风险告警</span>
                      <Tag color={pushConfig.riskAlert.enabled ? "success" : "default"}>
                        {pushConfig.riskAlert.enabled ? "已启用" : "未启用"}
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Switch
                      checked={pushConfig.riskAlert.enabled}
                      onChange={(checked) => setPushConfig({
                        ...pushConfig,
                        riskAlert: { ...pushConfig.riskAlert, enabled: checked }
                      })}
                    />
                  }
                >
                  <Form layout="vertical">
                    <Form.Item label="风险阈值">
                      <Space>
                        <InputNumber
                          value={pushConfig.riskAlert.threshold}
                          min={0}
                          max={100}
                          onChange={(value) => {
                            if (value !== null) {
                              setPushConfig({
                                ...pushConfig,
                                riskAlert: { ...pushConfig.riskAlert, threshold: value }
                              })
                            }
                          }}
                          disabled={!pushConfig.riskAlert.enabled}
                          addonAfter="%"
                        />
                        <Text type="secondary">
                          当风险指数超过 {pushConfig.riskAlert.threshold} 时立即告警
                        </Text>
                      </Space>
                    </Form.Item>
                    <Form.Item label="告警渠道">
                      <Checkbox.Group
                        value={pushConfig.riskAlert.channels}
                        onChange={(value) => setPushConfig({
                          ...pushConfig,
                          riskAlert: { ...pushConfig.riskAlert, channels: value as string[] }
                        })}
                        disabled={!pushConfig.riskAlert.enabled}
                      >
                        <Checkbox value="dingtalk">
                          <DingdingOutlined /> 钉钉
                        </Checkbox>
                        <Checkbox value="email">
                          <MailOutlined /> 邮件
                        </Checkbox>
                      </Checkbox.Group>
                    </Form.Item>
                  </Form>
                  <Alert
                    message="触发条件"
                    description="检测到阻塞、严重滞后、资源超载等风险时，立即推送告警消息并附带 AI 推荐方案"
                    type="warning"
                    showIcon
                  />
                </Card>

                {/* 周报生成 */}
                <Card
                  title={
                    <Space>
                      <FileTextOutlined style={{ color: "#10b981" }} />
                      <span>智能周报生成</span>
                      <Tag color={pushConfig.weeklyReport.enabled ? "success" : "default"}>
                        {pushConfig.weeklyReport.enabled ? "已启用" : "未启用"}
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Switch
                      checked={pushConfig.weeklyReport.enabled}
                      onChange={(checked) => setPushConfig({
                        ...pushConfig,
                        weeklyReport: { ...pushConfig.weeklyReport, enabled: checked }
                      })}
                    />
                  }
                >
                  <Form layout="vertical">
                    <Form.Item label="发送时间">
                      <Space>
                        <Select
                          value={pushConfig.weeklyReport.dayOfWeek}
                          onChange={(value) => setPushConfig({
                            ...pushConfig,
                            weeklyReport: { ...pushConfig.weeklyReport, dayOfWeek: value }
                          })}
                          disabled={!pushConfig.weeklyReport.enabled}
                          style={{ width: 100 }}
                          options={[
                            { value: 1, label: "周一" },
                            { value: 2, label: "周二" },
                            { value: 3, label: "周三" },
                            { value: 4, label: "周四" },
                            { value: 5, label: "周五" },
                            { value: 6, label: "周六" },
                            { value: 0, label: "周日" },
                          ]}
                        />
                        <TimePicker
                          value={dayjs(pushConfig.weeklyReport.time, "HH:mm")}
                          format="HH:mm"
                          onChange={(time) => {
                            if (time) {
                              setPushConfig({
                                ...pushConfig,
                                weeklyReport: { ...pushConfig.weeklyReport, time: time.format("HH:mm") }
                              })
                            }
                          }}
                          disabled={!pushConfig.weeklyReport.enabled}
                        />
                      </Space>
                    </Form.Item>
                    <Form.Item label="推送渠道">
                      <Checkbox.Group
                        value={pushConfig.weeklyReport.channels}
                        onChange={(value) => setPushConfig({
                          ...pushConfig,
                          weeklyReport: { ...pushConfig.weeklyReport, channels: value as string[] }
                        })}
                        disabled={!pushConfig.weeklyReport.enabled}
                      >
                        <Checkbox value="dingtalk">
                          <DingdingOutlined /> 钉钉
                        </Checkbox>
                        <Checkbox value="email">
                          <MailOutlined /> 邮件
                        </Checkbox>
                      </Checkbox.Group>
                    </Form.Item>
                  </Form>
                  <Alert
                    message="报告内容"
                    description="自动汇总本周完成事项、进度变化、风险项、下周计划等内容，AI 智能生成周报"
                    type="success"
                    showIcon
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* 保存按钮 */}
      <div style={{ marginTop: 24, textAlign: "right" }}>
        <Space>
          <Button icon={<ReloadOutlined />}>重置</Button>
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSave}>
            保存配置
          </Button>
        </Space>
      </div>
    </div>
  )
}
