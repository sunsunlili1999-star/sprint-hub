"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Form, Input, Button, Card, Typography, message, Space, Spin } from "antd"
import { UserOutlined, LockOutlined } from "@ant-design/icons"

const { Title, Text } = Typography

interface LoginForm {
  email: string
  password: string
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")
  
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<LoginForm>()

  // 显示错误信息
  const getErrorMessage = (error: string) => {
    switch (error) {
      case "CredentialsSignin":
        return "邮箱或密码错误"
      default:
        return "登录失败，请重试"
    }
  }

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        message.error(result.error)
      } else {
        message.success("登录成功")
        // 使用 window.location 进行完整页面跳转，确保 session 状态正确加载
        window.location.href = callbackUrl
      }
    } catch (error) {
      message.error("登录失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 24,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
        styles={{
          body: { padding: "40px 32px" },
        }}
      >
        {/* Logo 和标题 */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(124, 124, 255, 0.4)",
            }}
          >
            <span style={{ fontSize: 28, color: "#fff", fontWeight: 700 }}>P</span>
          </div>
          <Title level={2} style={{ margin: 0, color: "#1e293b" }}>
            Projex
          </Title>
          <Text type="secondary">AI 驱动的智能项目管理平台</Text>
        </div>

        {/* 错误提示 */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "#fff2f0",
              border: "1px solid #ffccc7",
              borderRadius: 8,
              marginBottom: 24,
            }}
          >
            <Text type="danger">{getErrorMessage(error)}</Text>
          </div>
        )}

        {/* 登录表单 */}
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="邮箱地址"
              autoComplete="email"
              style={{ borderRadius: 8, height: 48 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="密码"
              autoComplete="current-password"
              style={{ borderRadius: 8, height: 48 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 500,
                background: "linear-gradient(135deg, #7c7cff 0%, #a78bfa 100%)",
                border: "none",
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* 测试账号提示 */}
        <div
          style={{
            padding: "16px",
            background: "#f8fafc",
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
            测试账号：
          </Text>
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12 }}>管理员</Text>
              <Text code style={{ fontSize: 11 }}>admin@example.com / 123456</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12 }}>普通用户</Text>
              <Text code style={{ fontSize: 11 }}>zhangsan@example.com / 123456</Text>
            </div>
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}>
        <Spin size="large" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
