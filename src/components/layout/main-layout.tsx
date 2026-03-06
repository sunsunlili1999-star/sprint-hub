"use client"

import React, { useState, createContext, useContext, useCallback } from "react"
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
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  FileTextOutlined,
  RightOutlined,
  CaretDownOutlined,
  StarOutlined,
  StarFilled,
} from "@ant-design/icons"

const { Text } = Typography

const { Header, Sider, Content } = Layout

// Breadcrumb Context
export interface DropdownOption {
  key: string
  label: string
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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          ) : (
            <span style={{ color: token.colorText, fontWeight: 500 }}>
              {item.title}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Menu items
const menuItems: MenuProps["items"] = [
  {
    key: "/",
    icon: <HomeOutlined />,
    label: "工作台",
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
    key: "/calendar",
    icon: <CalendarOutlined />,
    label: "日历",
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
  },
]

// Quick create menu
const createMenuItems: MenuProps["items"] = [
  {
    key: "requirement",
    icon: <FileTextOutlined style={{ color: "#7c7cff" }} />,
    label: "新建需求",
  },
  {
    key: "task",
    icon: <CheckSquareOutlined style={{ color: "#6366f1" }} />,
    label: "新建任务",
  },
  {
    key: "bug",
    icon: <FileTextOutlined style={{ color: "#ff4d4f" }} />,
    label: "新建缺陷",
  },
  {
    type: "divider",
  },
  {
    key: "project",
    label: "新建项目",
  },
  {
    key: "sprint",
    label: "新建迭代",
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
  const { token } = theme.useToken()

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

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs, tabs, activeTab, setHeaderTabs, clearHeaderTabs }}>
      <Layout style={{ minHeight: "100vh", background: "transparent" }}>
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
            <div
              style={{
                width: 32,
                height: 32,
                background: "linear-gradient(135deg, #22d3ee 0%, #7c7cff 100%)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              S
            </div>
            {!collapsed && (
              <span
                style={{
                  marginLeft: 12,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                SprintHub
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

        <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: "margin-left 0.2s", background: "transparent" }}>
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
            <Space size={16}>
              {/* Quick Create */}
              <Dropdown menu={{ items: createMenuItems }} placement="bottomRight">
                <Button type="primary" icon={<PlusOutlined />}>
                  创建
                </Button>
              </Dropdown>

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
              minHeight: "calc(100vh - 64px)",
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </BreadcrumbContext.Provider>
  )
}
