"use client"

import React, { useState, createContext, useContext, useCallback, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
  Button,
  Space,
  theme,
  Typography,
  Tooltip,
} from "antd"
import type { MenuProps } from "antd"
import {
  HomeOutlined,
  AppstoreOutlined,
  ProjectOutlined,
  RocketOutlined,
  CheckSquareOutlined,
  CalendarOutlined,
  BellOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  RightOutlined,
  CaretDownOutlined,
  StarOutlined,
  StarFilled,
  ThunderboltOutlined,
} from "@ant-design/icons"
import PilotIcon from "@/components/ui/PilotIcon"
import { AISidebar } from "@/components/ai/AISidebar"
import { SmartPlanningModal } from "@/components/ai/SmartPlanningModal"

const { Text } = Typography

const { Header, Sider, Content } = Layout

// Breadcrumb Context
export interface DropdownOption {
  key: string
  label: string
}

export interface HeaderTag {
  label: string
  color: string
}

export interface BreadcrumbItem {
  title: string
  href?: string
  // 支持下拉选择
  dropdown?: {
    options: DropdownOption[]
    currentKey: string
    onSelect: (key: string) => void
  }
  // 收藏功能
  star?: {
    starred: boolean
    onToggle: () => void
  }
  // Tag 样式
  tag?: {
    color?: string
    icon?: React.ReactNode
  }
  // 是否显示闪光装饰（用于智能规划）
  sparkle?: boolean
  // Header 右侧显示的 Tags（仅第一个面包屑项生效）
  headerTags?: HeaderTag[]
}

// Tab 配置
export interface HeaderTab {
  key: string
  label: string
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (items: BreadcrumbItem[]) => void
  // Header tabs
  tabs: HeaderTab[]
  activeTab: string
  setHeaderTabs: (tabs: HeaderTab[], activeKey: string, onChange: (key: string) => void) => void
  clearHeaderTabs: () => void
  // AI Sidebar
  showAISidebar: boolean
  setShowAISidebar: (show: boolean) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined)

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext)
  if (context === undefined) {
    throw new Error("useBreadcrumb must be used within MainLayout")
  }
  return context
}

// 自定义面包屑组件
function CustomBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { token } = theme.useToken()

  // 获取第一个面包屑项的 headerTags
  const headerTags = items[0]?.headerTags

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%" }}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <RightOutlined style={{ fontSize: 12, color: token.colorTextSecondary }} />
          )}
          {item.dropdown ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Dropdown
                menu={{
                  items: item.dropdown.options.map((opt) => ({
                    key: opt.key,
                    label: opt.label,
                  })),
                  selectedKeys: [item.dropdown.currentKey],
                  onClick: ({ key }) => item.dropdown?.onSelect(key),
                }}
                trigger={["click"]}
              >
                <div
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: token.colorText,
                    fontWeight: 500,
                    minWidth: 180,
                    gap: 6,
                    height: 35,
                    paddingLeft: 20,
                    paddingRight: 12,
                    background: "#f8f9fc",
                    borderRadius: 6,
                  }}
                >
                  {item.title}
                  <CaretDownOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                </div>
              </Dropdown>
              {item.star && (
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    item.star?.onToggle()
                  }}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 4,
                  }}
                >
                  {item.star.starred ? (
                    <StarFilled style={{ fontSize: 16, color: "#faad14" }} />
                  ) : (
                    <StarOutlined style={{ fontSize: 16, color: token.colorTextSecondary }} />
                  )}
                </span>
              )}
            </div>
          ) : item.href ? (
            <Link
              href={item.href}
              style={{
                color: token.colorTextSecondary,
                textDecoration: "none",
              }}
            >
              {item.title}
            </Link>
          ) : item.sparkle ? (
            // 智能规划特殊样式：渐变色文字+闪光图标
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                {item.title}
              </span>
              <span style={{ display: "flex", alignItems: "flex-start" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#sparkle-gradient)"/>
                  <defs>
                    <linearGradient id="sparkle-gradient" x1="2" y1="2" x2="22" y2="22">
                      <stop stopColor="#7c7cff"/>
                      <stop offset="1" stopColor="#22d3ee"/>
                    </linearGradient>
                  </defs>
                </svg>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" style={{ marginLeft: -2, marginTop: -1 }}>
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#sparkle-gradient-sm)" opacity="0.6"/>
                  <defs>
                    <linearGradient id="sparkle-gradient-sm" x1="2" y1="2" x2="22" y2="22">
                      <stop stopColor="#7c7cff"/>
                      <stop offset="1" stopColor="#22d3ee"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </span>
          ) : item.tag ? (
            // Tag 样式
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 10px",
                borderRadius: 4,
                background: item.tag.color ? `${item.tag.color}15` : "#f1f5f9",
                color: item.tag.color || "#64748b",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {item.tag.icon}
              {item.title}
            </span>
          ) : (
            <span style={{ color: token.colorText, fontWeight: 500 }}>
              {item.title}
            </span>
          )}
        </React.Fragment>
      ))}
      
      {/* Header Tags - 显示在面包屑右侧 */}
      {headerTags && headerTags.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 12 }}>
          {headerTags.map((tag, index) => (
            <span
              key={index}
              style={{
                padding: "1px 8px",
                borderRadius: 4,
                background: `${tag.color}15`,
                color: tag.color,
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: "nowrap",
                lineHeight: "18px",
                height: 20,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Menu items
const menuItems: MenuProps["items"] = [
  {
    key: "/",
    icon: <PilotIcon />,
    label: "AI 工作台",
  },
  {
    key: "/products",
    icon: <AppstoreOutlined />,
    label: "产品管理",
  },
  {
    key: "/projects",
    icon: <ProjectOutlined />,
    label: "项目管理",
  },
  {
    key: "/releases",
    icon: <RocketOutlined />,
    label: "发布管理",
  },
  {
    key: "/todos",
    icon: <CheckSquareOutlined />,
    label: "智能待办",
  },
  {
    type: "divider",
  },
  {
    key: "/messages",
    icon: <BellOutlined />,
    label: "消息中心",
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "设置",
    children: [
      {
        key: "/settings/integrations",
        label: "集成配置",
      },
    ],
  },
]

// User menu
const userMenuItems: MenuProps["items"] = [
  {
    key: "profile",
    icon: <UserOutlined />,
    label: "个人中心",
  },
  {
    key: "my-work",
    label: "我的工作项",
  },
  {
    key: "my-follow",
    label: "我的关注",
  },
  {
    type: "divider",
  },
  {
    key: "daily-report",
    label: "生成日报",
  },
  {
    key: "weekly-report",
    label: "生成周报",
  },
  {
    type: "divider",
  },
  {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "退出登录",
    danger: true,
  },
]

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [tabs, setTabs] = useState<HeaderTab[]>([])
  const [activeTab, setActiveTab] = useState<string>("")
  const [tabChangeHandler, setTabChangeHandler] = useState<((key: string) => void) | null>(null)
  const [showAISidebar, setShowAISidebar] = useState(false) // 默认不显示 AI 侧边栏
  const [hasUnread, setHasUnread] = useState(true) // 是否有未读消息
  const [showPlanningModal, setShowPlanningModal] = useState(false)
  const { token } = theme.useToken()

  // 悬浮按钮拖动相关状态
  const [pilotPosition, setPilotPosition] = useState({ x: 12, y: 12 }) // 右下角位置（相对于右下角的偏移）
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const dragStartOffset = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false) // 是否发生了实际移动

  // 拖动事件处理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const deltaX = dragStartPos.current.x - e.clientX
      const deltaY = dragStartPos.current.y - e.clientY
      
      // 检测是否有明显移动（超过5px才算拖动）
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        hasMoved.current = true
      }
      
      const newX = Math.max(0, Math.min(window.innerWidth - 160, dragStartOffset.current.x + deltaX))
      const newY = Math.max(0, Math.min(window.innerHeight - 160, dragStartOffset.current.y + deltaY))
      
      setPilotPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      // 如果没有移动，则触发点击
      if (!hasMoved.current) {
        handleOpenAISidebar()
      }
      // 延迟重置，避免影响判断
      setTimeout(() => {
        hasMoved.current = false
      }, 50)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handlePilotMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    hasMoved.current = false
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    dragStartOffset.current = { ...pilotPosition }
  }

  // 登录页面不使用 MainLayout，直接渲染内容
  if (pathname === "/login") {
    return <>{children}</>
  }

  // 用户菜单项（动态生成）
  const dynamicUserMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div style={{ padding: "8px 0" }}>
          <Text strong style={{ display: "block" }}>{session?.user?.name || "用户"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{session?.user?.email}</Text>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "my-work",
      label: "我的工作项",
    },
    {
      key: "my-follow",
      label: "我的关注",
    },
    { type: "divider" },
    {
      key: "daily-report",
      label: "生成日报",
    },
    {
      key: "weekly-report",
      label: "生成周报",
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      danger: true,
      onClick: () => signOut({ callbackUrl: "/login" }),
    },
  ]

  // Get selected menu key based on pathname
  const getSelectedKey = () => {
    if (pathname === "/") return "/"
    const found = menuItems?.find((item) => {
      if (item && "key" in item && typeof item.key === "string") {
        return item.key !== "/" && pathname.startsWith(item.key)
      }
      return false
    })
    return found && "key" in found ? (found.key as string) : pathname
  }

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key)
  }

  // 设置 header tabs
  const setHeaderTabs = useCallback((newTabs: HeaderTab[], activeKey: string, onChange: (key: string) => void) => {
    setTabs(newTabs)
    setActiveTab(activeKey)
    setTabChangeHandler(() => onChange)
  }, [])

  // 清除 header tabs
  const clearHeaderTabs = useCallback(() => {
    setTabs([])
    setActiveTab("")
    setTabChangeHandler(null)
  }, [])

  // 面包屑数据（不再添加首页图标，由各页面自行控制）
  const breadcrumbItems = breadcrumbs

  // 不再为侧边栏预留空间，改为悬浮面板
  const rightPadding = 0
  
  // 打开 AI 面板时标记为已读
  const handleOpenAISidebar = () => {
    setShowAISidebar(true)
    setHasUnread(false)
  }

  return (
    <BreadcrumbContext.Provider value={{ 
      breadcrumbs, 
      setBreadcrumbs, 
      tabs, 
      activeTab, 
      setHeaderTabs, 
      clearHeaderTabs,
      showAISidebar,
      setShowAISidebar,
    }}>
      <Layout style={{ minHeight: "100vh", background: "transparent" }}>
        {/* 左侧菜单 */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={220}
          style={{
            background: "#242c40",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
          }}
        >
          {/* Logo */}
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? 0 : "0 16px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <img
              src="/logo.png"
              alt="Projex"
              style={{
                width: 32,
                height: 32,
                objectFit: "contain",
              }}
            />
            {!collapsed && (
              <span
                style={{
                  marginLeft: 12,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                Projex
              </span>
            )}
          </div>

          {/* Menu */}
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          />

          {/* Collapse button */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                width: "100%",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              {!collapsed && "收起菜单"}
            </Button>
          </div>
        </Sider>

        {/* 主内容区 */}
        <Layout 
          style={{ 
            marginLeft: collapsed ? 80 : 220, 
            marginRight: rightPadding,
            transition: "all 0.3s", 
            background: "transparent" 
          }}
        >
          {/* Header */}
          <Header
            style={{
              background: "#ffffff",
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #e2e8f0",
              position: "sticky",
              top: 0,
              zIndex: 99,
              height: 56,
            }}
          >
            {/* Left: Breadcrumb + Divider + Tabs */}
            <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
              <CustomBreadcrumb items={breadcrumbItems} />
              
              {/* Header Tabs */}
              {tabs.length > 0 && (
                <>
                  {/* 分隔线 */}
                  <div style={{ 
                    width: 1, 
                    height: 24, 
                    background: "#e8e8e8", 
                    margin: "0 20px",
                  }} />
                  
                  {/* Tab 菜单 */}
                  <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.key
                      return (
                        <div
                          key={tab.key}
                          onClick={() => {
                            setActiveTab(tab.key)
                            tabChangeHandler?.(tab.key)
                          }}
                          className={`header-tab-item ${isActive ? 'header-tab-active' : ''}`}
                          style={{
                            height: "100%",
                            padding: "0 16px",
                            fontSize: 14,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            position: "relative",
                            color: isActive ? token.colorPrimary : token.colorTextSecondary,
                            fontWeight: isActive ? 500 : 400,
                            transition: "all 0.2s",
                            background: "transparent",
                          }}
                        >
                          {tab.label}
                          {/* 底部激活指示条 */}
                          {isActive && (
                            <div style={{
                              position: "absolute",
                              bottom: 0,
                              left: 16,
                              right: 16,
                              height: 2,
                              background: token.colorPrimary,
                              borderRadius: "1px 1px 0 0",
                            }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <Space size={12}>
              {/* 开始智能规划按钮 - 在智能规划页面隐藏 */}
              {!pathname.startsWith("/ai/smart-planning") && (
                <Button
                  type="primary"
                  onClick={() => setShowPlanningModal(true)}
                  style={{
                    background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                    border: "none",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {/* AI 双闪光图标 */}
                  <span style={{ display: "flex", alignItems: "flex-start", marginRight: 2 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor"/>
                    </svg>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" style={{ marginLeft: -3, marginTop: -2, opacity: 0.7 }}>
                      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor"/>
                    </svg>
                  </span>
                  开始智能规划
                </Button>
              )}

              {/* Notifications */}
              <Badge count={3} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  onClick={() => router.push("/messages")}
                />
              </Badge>

              {/* User */}
              <Dropdown menu={{ items: dynamicUserMenuItems }} placement="bottomRight">
                <Avatar
                  style={{
                    background: "#a5b4fc",
                    cursor: "pointer",
                  }}
                  src={session?.user?.avatar}
                >
                  {session?.user?.name?.[0] || "?"}
                </Avatar>
              </Dropdown>

            </Space>
          </Header>

          {/* Content */}
          <Content
            style={{
              background: "transparent",
              minHeight: "calc(100vh - 56px)",
            }}
          >
            {children}
          </Content>
        </Layout>

        {/* 右侧 AI 聊天面板 - 悬浮显示 */}
        {showAISidebar && (
          <>
            {/* 遮罩层 */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.3)",
                zIndex: 199,
              }}
              onClick={() => setShowAISidebar(false)}
            />
            {/* 聊天面板 */}
            <div
              style={{
                position: "fixed",
                right: 24,
                bottom: 24,
                width: 400,
                height: "calc(100vh - 120px)",
                maxHeight: 700,
                zIndex: 200,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              }}
            >
              <AISidebar onCollapse={() => setShowAISidebar(false)} />
            </div>
          </>
        )}

        {/* 右下角悬浮机器人按钮 - 可拖动 */}
        {!showAISidebar && (
          <>
            <style jsx>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
              }
              @keyframes pulse-ring {
                0% { transform: scale(0.8); opacity: 0.6; }
                100% { transform: scale(1.5); opacity: 0; }
              }
            `}</style>
            <div
              ref={dragRef}
              onMouseDown={handlePilotMouseDown}
              style={{
                position: "fixed",
                right: pilotPosition.x,
                bottom: pilotPosition.y,
                width: 160,
                height: 160,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isDragging ? "grabbing" : "grab",
                zIndex: 100,
                animation: isDragging ? "none" : "float 3s ease-in-out infinite",
                userSelect: "none",
              }}
            >
              {/* 脉冲光环效果 - 仅未读时显示 */}
              {hasUnread && !isDragging && (
                <div
                  style={{
                    position: "absolute",
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
                    animation: "pulse-ring 2s ease-out infinite",
                  }}
                />
              )}
              {/* 机器人图片 */}
              <img
                src="/pilot.png"
                alt="AI 助手 - 拖动可移动位置"
                draggable={false}
                style={{
                  width: 160,
                  height: 160,
                  objectFit: "contain",
                  transition: isDragging ? "none" : "transform 0.3s",
                  position: "relative",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              />
            </div>
          </>
        )}

        {/* 智能规划弹窗 */}
        <SmartPlanningModal 
          open={showPlanningModal} 
          onClose={() => setShowPlanningModal(false)} 
        />
      </Layout>
    </BreadcrumbContext.Provider>
  )
}
