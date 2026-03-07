"use client"

import React, { useState, useEffect } from "react"
import { Modal, Button, Typography, Select, Space, Spin } from "antd"
import {
  FileTextOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  RocketOutlined,
  RobotOutlined,
  EyeOutlined,
  AppstoreOutlined,
  ProjectOutlined,
  ArrowRightOutlined,
  LoadingOutlined,
} from "@ant-design/icons"
import { useRouter } from "next/navigation"

const { Text } = Typography

// 主要步骤配置（3步）
const planningSteps = [
  {
    icon: <FileTextOutlined />,
    title: "上传需求",
    description: "输入需求文档，AI 智能解析拆分任务",
    color: "#7c7cff",
    bgColor: "#f5f3ff",
  },
  {
    icon: <CheckCircleOutlined />,
    title: "确认需求",
    description: "确认 AI 解析的需求和任务拆分",
    color: "#22d3ee",
    bgColor: "#ecfeff",
  },
  {
    icon: <SettingOutlined />,
    title: "配置资源",
    description: "配置时间周期和团队成员",
    color: "#10b981",
    bgColor: "#ecfdf5",
  },
  {
    icon: <RocketOutlined />,
    title: "生成计划",
    description: "自动生成迭代计划与发布安排",
    color: "#ec4899",
    bgColor: "#fdf2f8",
  },
]

interface Product {
  id: string
  name: string
  code: string
}

interface Project {
  id: string
  name: string
  code: string
  productId: string
}

interface SmartPlanningModalProps {
  open: boolean
  onClose: () => void
}

export function SmartPlanningModal({ open, onClose }: SmartPlanningModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<"intro" | "select">("intro")
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)

  // 获取产品列表
  useEffect(() => {
    if (open && step === "select") {
      setLoadingProducts(true)
      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => {
          setProducts(data.products || data || [])
        })
        .catch(() => {
          // 如果 API 失败，使用假数据
          setProducts([
            { id: "prod-1", name: "电商平台", code: "EC" },
            { id: "prod-2", name: "数据中台", code: "DC" },
            { id: "prod-3", name: "移动APP", code: "APP" },
          ])
        })
        .finally(() => setLoadingProducts(false))
    }
  }, [open, step])

  // 获取项目列表
  useEffect(() => {
    if (selectedProduct) {
      setLoadingProjects(true)
      fetch("/api/projects")
        .then((res) => res.json())
        .then((data) => {
          const allProjects = data.projects || data || []
          // 过滤出属于当前产品的项目
          const filtered = allProjects.filter((p: any) => 
            p.productId === selectedProduct || 
            p.projectProducts?.some((pp: any) => pp.productId === selectedProduct)
          )
          setProjects(filtered.length > 0 ? filtered : allProjects.slice(0, 3))
        })
        .catch(() => {
          // 如果 API 失败，使用假数据
          setProjects([
            { id: "proj-1", name: "电商平台 v2.0", code: "EC-2.0", productId: selectedProduct },
            { id: "proj-2", name: "电商平台 v2.1", code: "EC-2.1", productId: selectedProduct },
          ])
        })
        .finally(() => setLoadingProjects(false))
    }
  }, [selectedProduct])

  const handleContinue = () => {
    setStep("select")
  }

  const handleStart = () => {
    if (!selectedProduct || !selectedProject) return
    const product = products.find((p) => p.id === selectedProduct)
    const project = projects.find((p) => p.id === selectedProject)
    onClose()
    router.push(`/ai/smart-planning?productId=${selectedProduct}&projectId=${selectedProject}&productName=${encodeURIComponent(product?.name || "")}&projectName=${encodeURIComponent(project?.name || "")}`)
    // 重置状态
    setTimeout(() => {
      setStep("intro")
      setSelectedProduct(null)
      setSelectedProject(null)
    }, 300)
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep("intro")
      setSelectedProduct(null)
      setSelectedProject(null)
    }, 300)
  }

  const selectedProductData = products.find((p) => p.id === selectedProduct)
  const selectedProjectData = projects.find((p) => p.id === selectedProject)

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={640}
      centered
      styles={{
        body: { padding: 0 },
        content: { borderRadius: 16, overflow: "hidden" },
      }}
      closable={false}
    >
      {/* 顶部渐变背景 */}
      <div
        style={{
          background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
          padding: "28px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景装饰 */}
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: -20,
            width: 80,
            height: 80,
            background: "rgba(255,255,255,0.08)",
            borderRadius: "50%",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RobotOutlined style={{ fontSize: 24, color: "#fff" }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: "#fff" }}>AI 智能规划</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
                让小派帮你快速完成项目规划
              </div>
            </div>
          </div>
        </div>
      </div>

      {step === "intro" ? (
        <>
          {/* 步骤展示区域 */}
          <div style={{ padding: "24px 32px 20px" }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 15 }}>规划流程</Text>
            </div>

            {/* 4个步骤 - 2x2 网格布局 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {planningSteps.map((s, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    background: s.bgColor,
                    borderRadius: 10,
                    border: `1px solid ${s.color}20`,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      color: s.color,
                      flexShrink: 0,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                      position: "relative",
                    }}
                  >
                    {s.icon}
                    <div
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: s.color,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 风险监控 */}
          <div style={{ padding: "0 32px 24px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 80,
                  height: 80,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <EyeOutlined style={{ fontSize: 22, color: "#fff" }} />
              </div>
              <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>AI 全程风险监控</span>
                  <span
                    style={{
                      padding: "2px 8px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: 4,
                      fontSize: 10,
                      color: "#fff",
                    }}
                  >
                    智能预警
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>
                  项目全周期风险识别，进度偏差预警，资源冲突提醒，确保按时交付
                </div>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div
            style={{
              padding: "16px 32px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <Button onClick={handleClose}>稍后再说</Button>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={handleContinue}
              style={{
                background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                border: "none",
                height: 40,
                paddingLeft: 20,
                paddingRight: 20,
                fontWeight: 500,
              }}
            >
              继续
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* 选择产品和项目 */}
          <div style={{ padding: "32px" }}>
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ fontSize: 15 }}>选择产品和项目</Text>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                请选择需要进行智能规划的产品和项目
              </div>
            </div>

            {/* 产品选择 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 8 }}>
                <Space>
                  <AppstoreOutlined style={{ color: "#7c7cff" }} />
                  <Text strong>选择产品</Text>
                </Space>
              </div>
              <Select
                placeholder="请选择产品"
                style={{ width: "100%" }}
                size="large"
                value={selectedProduct}
                loading={loadingProducts}
                onChange={(value) => {
                  setSelectedProduct(value)
                  setSelectedProject(null)
                }}
                notFoundContent={loadingProducts ? <Spin size="small" /> : "暂无产品"}
                options={products.map((p) => ({
                  value: p.id,
                  label: (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {(p.code || p.name)?.[0]}
                      </div>
                      <span>{p.name}</span>
                      {p.code && <span style={{ color: "#94a3b8", fontSize: 12 }}>({p.code})</span>}
                    </div>
                  ),
                }))}
              />
            </div>

            {/* 项目选择 */}
            <div>
              <div style={{ marginBottom: 8 }}>
                <Space>
                  <ProjectOutlined style={{ color: "#22d3ee" }} />
                  <Text strong>选择项目</Text>
                </Space>
              </div>
              <Select
                placeholder={selectedProduct ? "请选择项目" : "请先选择产品"}
                style={{ width: "100%" }}
                size="large"
                value={selectedProject}
                onChange={setSelectedProject}
                disabled={!selectedProduct}
                loading={loadingProjects}
                notFoundContent={loadingProjects ? <Spin size="small" /> : "暂无项目"}
                options={projects.map((p) => ({
                  value: p.id,
                  label: (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748b",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        <ProjectOutlined />
                      </div>
                      <span>{p.name}</span>
                      {p.code && <span style={{ color: "#94a3b8", fontSize: 12 }}>({p.code})</span>}
                    </div>
                  ),
                }))}
              />
            </div>

            {/* 已选信息预览 */}
            {selectedProduct && selectedProject && (
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  background: "linear-gradient(135deg, #f5f3ff 0%, #ecfeff 100%)",
                  borderRadius: 10,
                  border: "1px solid #e0e7ff",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <RobotOutlined style={{ color: "#7c7cff" }} />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    即将为 <Text strong>{selectedProductData?.name}</Text> / 
                    <Text strong> {selectedProjectData?.name}</Text> 开始智能规划
                  </Text>
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div
            style={{
              padding: "16px 32px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <Button onClick={() => setStep("intro")}>返回</Button>
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={handleStart}
              disabled={!selectedProduct || !selectedProject}
              style={{
                background: selectedProduct && selectedProject 
                  ? "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)" 
                  : undefined,
                border: "none",
                height: 40,
                paddingLeft: 20,
                paddingRight: 20,
                fontWeight: 500,
              }}
            >
              开始智能规划
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
