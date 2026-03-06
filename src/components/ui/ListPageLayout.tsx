"use client"

import React, { useState, ReactNode } from "react"
import { Input, Button, Space, Typography, Pagination, Dropdown } from "antd"
import type { MenuProps, TableProps } from "antd"
import { SearchOutlined, DeleteOutlined, EditOutlined, MoreOutlined } from "@ant-design/icons"
import { FixedTable } from "./FixedTable"

const { Text } = Typography

// 侧边栏项目类型
export interface SidebarItem {
  id: string | null
  name: string
  icon: ReactNode
  count: number
  children?: SidebarItem[]
  color?: string
  activeColor?: string
  activeBg?: string
  expanded?: boolean
  onToggleExpand?: () => void
}

// 批量操作项类型
export interface BatchAction {
  key: string
  label: string
  icon?: ReactNode
  danger?: boolean
  onClick: (selectedKeys: React.Key[]) => void
}

// 侧边栏配置
interface SidebarConfig {
  title: string
  icon: ReactNode
  items: SidebarItem[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  expandedIds?: string[]
  onToggleExpand?: (id: string) => void
  onAdd?: () => void
  renderItemExtra?: (item: SidebarItem) => ReactNode
}

// 主内容区配置
interface ContentConfig<T> {
  title: string
  icon: ReactNode
  columns: TableProps<T>["columns"]
  dataSource: T[]
  rowKey: keyof T | ((record: T) => string)
  loading?: boolean
  // 搜索
  searchPlaceholder?: string
  searchValue?: string
  onSearch?: (value: string) => void
  // 新建按钮
  onAdd?: () => void
  addButtonText?: string
  // 右侧自定义操作按钮（会替代默认的新建按钮）
  headerActions?: ReactNode
  // 额外的工具栏内容
  extraToolbar?: ReactNode
  // 分页
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  // 批量操作
  batchActions?: BatchAction[]
  // 行选择
  rowSelection?: {
    selectedRowKeys: React.Key[]
    onChange: (keys: React.Key[]) => void
  }
}

interface ListPageLayoutProps<T> {
  // 是否显示侧边栏
  showSidebar?: boolean
  sidebar?: SidebarConfig
  content: ContentConfig<T>
}

// 侧边栏组件
function Sidebar({ config }: { config: SidebarConfig }) {
  const { title, icon, items, selectedId, onSelect, expandedIds = [], onToggleExpand, onAdd, renderItemExtra } = config

  const renderItem = (item: SidebarItem, level: number = 0) => {
    const isSelected = selectedId === item.id
    // 支持两种方式：通过 expandedIds 或通过 item.expanded
    const isExpanded = item.expanded !== undefined ? item.expanded : expandedIds.includes(item.id || "")
    const hasChildren = item.children && item.children.length > 0
    const paddingLeft = 16 + level * 20

    return (
      <div key={item.id || "root"}>
        <div
          style={{
            padding: `6px 16px 6px ${paddingLeft}px`,
            cursor: "pointer",
            background: isSelected ? (item.activeBg || "#f8f9ff") : "transparent",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          onClick={() => onSelect(item.id)}
        >
          <Space size={6}>
            {hasChildren && (item.onToggleExpand || onToggleExpand) ? (
              <span 
                onClick={(e) => { 
                  e.stopPropagation() 
                  if (item.onToggleExpand) {
                    item.onToggleExpand()
                  } else if (onToggleExpand) {
                    onToggleExpand(item.id || "") 
                  }
                }}
                style={{ display: "flex", alignItems: "center" }}
              >
                {item.icon}
              </span>
            ) : (
              item.icon
            )}
            <Text style={{ 
              color: isSelected ? (item.activeColor || "#7c7cff") : (item.color || undefined), 
              fontSize: level === 0 ? 13 : 12 
            }}>
              {item.name}
            </Text>
          </Space>
          <Space size={2}>
            <Text type="secondary" style={{ fontSize: level === 0 ? 12 : 11 }}>{item.count}</Text>
            {renderItemExtra && renderItemExtra(item)}
          </Space>
        </div>
        {hasChildren && isExpanded && item.children?.map(child => renderItem(child, level + 1))}
      </div>
    )
  }

  return (
    <div style={{ width: 220, display: "flex", flexDirection: "column", flexShrink: 0, borderRight: "1px solid #e2e8f0", background: "#fff" }}>
      {/* Header */}
      <div style={{ 
        padding: "10px 16px", 
        borderBottom: "1px solid #e2e8f0", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        background: "linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%)", 
        height: 40, 
        flexShrink: 0 
      }}>
        <Space size={6}>
          {icon}
          <Text style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>{title}</Text>
        </Space>
        {onAdd && (
          <Button type="text" size="small" icon={<span style={{ fontSize: 12 }}>+</span>} onClick={onAdd} style={{ height: 24, width: 24, padding: 0 }} />
        )}
      </div>
      {/* 列表 */}
      <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
        {items.map(item => renderItem(item))}
      </div>
    </div>
  )
}

// 主组件
export function ListPageLayout<T extends object>({
  showSidebar = false,
  sidebar,
  content,
}: ListPageLayoutProps<T>) {
  const {
    title,
    icon,
    columns,
    dataSource,
    rowKey,
    loading,
    searchPlaceholder = "搜索...",
    searchValue,
    onSearch,
    onAdd,
    addButtonText = "新建",
    headerActions,
    extraToolbar,
    pagination,
    batchActions,
    rowSelection,
  } = content

  const selectedCount = rowSelection?.selectedRowKeys?.length || 0
  const hasBatchActions = batchActions && batchActions.length > 0 && selectedCount > 0

  // 批量操作下拉菜单
  const batchMenuItems: MenuProps["items"] = batchActions?.map(action => ({
    key: action.key,
    label: action.label,
    icon: action.icon,
    danger: action.danger,
    onClick: () => action.onClick(rowSelection?.selectedRowKeys || []),
  }))

  return (
    <div style={{ flex: 1, display: "flex", background: "#fff", border: "1px solid #e2e8f0", minHeight: 0 }}>
      {/* 侧边栏 */}
      {showSidebar && sidebar && <Sidebar config={sidebar} />}

      {/* 主内容区 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#fff" }}>
        {/* Header */}
        <div style={{ 
          padding: "10px 16px", 
          borderBottom: "1px solid #e2e8f0", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          background: "linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%)", 
          height: 40, 
          flexShrink: 0 
        }}>
          <Space size={6}>
            {icon}
            <Text style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>{title}</Text>
          </Space>
          {headerActions ? headerActions : onAdd && (
            <Button type="primary" size="small" icon={<span style={{ fontSize: 12 }}>+</span>} onClick={onAdd}>
              {addButtonText}
            </Button>
          )}
        </div>

        {/* 查询条件区域 */}
        <div style={{ padding: "8px 16px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {onSearch && (
                <Input
                  placeholder={searchPlaceholder}
                  prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                  style={{ width: 220, height: 28 }}
                  value={searchValue}
                  onChange={(e) => onSearch(e.target.value)}
                  allowClear
                  size="small"
                  variant="borderless"
                />
              )}
              {extraToolbar && (
                <>
                  <span style={{ 
                    width: 1, 
                    height: 20, 
                    background: "#e2e8f0", 
                    margin: "0 8px",
                    display: "inline-block",
                    verticalAlign: "middle"
                  }} />
                  {extraToolbar}
                </>
              )}
            </div>
            
            {/* 批量操作 */}
            {hasBatchActions && (
              <Space size={8}>
                <Text style={{ fontSize: 12, color: "#b8c5d3" }}>
                  已选择 {selectedCount} 项
                </Text>
                <Dropdown menu={{ items: batchMenuItems }} placement="bottomRight">
                  <Button size="small" type="text" className="toolbar-text-btn">
                    批量操作 <MoreOutlined />
                  </Button>
                </Dropdown>
                <Button 
                  size="small"
                  type="text"
                  className="toolbar-text-btn"
                  onClick={() => rowSelection?.onChange([])}
                >
                  取消选择
                </Button>
              </Space>
            )}
          </div>
        </div>

        {/* 表格区域 */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <FixedTable<T>
            columns={columns}
            dataSource={dataSource}
            rowKey={rowKey as string}
            size="small"
            loading={loading}
            rowSelection={rowSelection ? {
              selectedRowKeys: rowSelection.selectedRowKeys,
              onChange: (keys) => rowSelection.onChange(keys),
              columnWidth: 48,
            } : undefined}
          />
        </div>

        {/* 固定在底部的分页器 */}
        <div style={{
          padding: "8px 16px",
          borderTop: "1px solid #e2e8f0",
          background: "#f8f9fc",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          height: 40,
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            共 {pagination?.total || dataSource.length} 条
            {selectedCount > 0 ? `，已选 ${selectedCount} 条` : ""}
          </Text>
          {pagination && (
            <Pagination
              size="small"
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              showSizeChanger
              showQuickJumper
              pageSizeOptions={[10, 20, 50, 100]}
              onChange={pagination.onChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
