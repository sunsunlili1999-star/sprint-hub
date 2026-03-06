"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Typography,
  Tag,
  Button,
  Space,
  Avatar,
  Modal,
  Table,
  Input,
  Select,
  message,
  Dropdown,
  Empty,
} from "antd"
import type { TableProps } from "antd"
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  BarsOutlined,
  ThunderboltFilled,
  CodeFilled,
  ImportOutlined,
  ExportOutlined,
  RightOutlined,
  CopyOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  CloseOutlined,
} from "@ant-design/icons"
import { ListPageLayout, type BatchAction } from "@/components/ui/ListPageLayout"
import { TaskDetailModal } from "@/components/task"
import { WorkItemDetailModal } from "@/components/workitem"
import { sprintApi, type SprintTaskItem, type SprintTaskChild } from "@/lib/api"

const { Text } = Typography

// Helper functions
const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    P0: "red", P1: "orange", P2: "gold", P3: "blue", P4: "default",
  }
  return colors[priority] || "default"
}

const getStatusInfo = (status: string) => {
  const info: Record<string, { label: string; color: string }> = {
    NOT_STARTED: { label: "未开始", color: "default" },
    IN_PROGRESS: { label: "进行中", color: "processing" },
    COMPLETED: { label: "已完成", color: "success" },
  }
  return info[status] || { label: status, color: "default" }
}

// 树形表格行类型（任务或工作项）
interface TaskWorkItemRow {
  id: string
  type: 'TASK' | 'WORK_ITEM'
  title: string
  priority: string
  status: string
  moduleId: string | null
  moduleName: string | null
  estimatedHours: number | null
  actualHours: number | null
  assignee: { id: string; name: string; avatar: string | null } | null
  creator: { id: string; name: string; avatar: string | null } | null
  parent: { id: string; title: string; type: string } | null
  createdAt: string | null
  updatedAt: string | null
  isInSprint: boolean
  childCount?: number
  completedChildCount?: number
  children?: TaskWorkItemRow[]
}

interface SprintWorkItemsTabProps {
  projectId: string
  sprintId: string
}

export function SprintWorkItemsTab({ projectId, sprintId }: SprintWorkItemsTabProps) {
  // 数据状态
  const [tasks, setTasks] = useState<SprintTaskItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // UI 状态
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // 导入弹窗状态
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importSearch, setImportSearch] = useState("")
  const [availableTasks, setAvailableTasks] = useState<SprintTaskItem[]>([])
  const [availableLoading, setAvailableLoading] = useState(false)
  const [selectedImportKeys, setSelectedImportKeys] = useState<React.Key[]>([])
  
  // 详情弹窗状态
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isWorkItemDetailOpen, setIsWorkItemDetailOpen] = useState(false)
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null)

  // 加载迭代中的任务
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const data = await sprintApi.getSprintTasks(projectId, sprintId, {
        search: searchQuery,
        inSprint: true,
      })
      setTasks(data)
    } catch (error) {
      console.error("加载任务失败", error)
    } finally {
      setLoading(false)
    }
  }, [projectId, sprintId, searchQuery])

  // 加载可导入的任务
  const loadAvailableTasks = useCallback(async () => {
    try {
      setAvailableLoading(true)
      const data = await sprintApi.getSprintTasks(projectId, sprintId, {
        search: importSearch,
        inSprint: false,
      })
      setAvailableTasks(data)
    } catch (error) {
      console.error("加载可导入任务失败", error)
    } finally {
      setAvailableLoading(false)
    }
  }, [projectId, sprintId, importSearch])

  // 初始加载
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // 导入弹窗打开时加载
  useEffect(() => {
    if (isImportModalOpen) {
      loadAvailableTasks()
    }
  }, [isImportModalOpen, loadAvailableTasks])

  // 复制 ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      message.success("ID 已复制到剪贴板")
    }).catch(() => {
      message.error("复制失败")
    })
  }

  // 打开任务详情
  const handleOpenTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId)
    setIsTaskDetailOpen(true)
  }

  // 打开工作项详情
  const handleOpenWorkItemDetail = (workItemId: string) => {
    setSelectedWorkItemId(workItemId)
    setIsWorkItemDetailOpen(true)
  }

  // 移入任务
  const handleImportTasks = async () => {
    if (selectedImportKeys.length === 0) {
      message.warning("请选择要移入的任务")
      return
    }
    try {
      const result = await sprintApi.addWorkItems(projectId, sprintId, selectedImportKeys as string[])
      message.success(result.message)
      setSelectedImportKeys([])
      setIsImportModalOpen(false)
      loadTasks()
    } catch (error: any) {
      message.error(error.message || "移入失败")
    }
  }

  // 批量移出任务
  const handleRemoveTasks = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("请选择要移出的任务")
      return
    }
    Modal.confirm({
      title: "确认移出",
      content: `确定要将 ${selectedRowKeys.length} 个任务移出迭代吗？`,
      okText: "确认移出",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          const result = await sprintApi.removeWorkItems(projectId, sprintId, selectedRowKeys as string[])
          message.success(result.message)
          setSelectedRowKeys([])
          loadTasks()
        } catch (error: any) {
          message.error(error.message || "移出失败")
        }
      },
    })
  }

  // 移出单个任务
  const handleRemoveSingleTask = async (taskId: string) => {
    try {
      const result = await sprintApi.removeWorkItems(projectId, sprintId, [taskId])
      message.success(result.message)
      loadTasks()
    } catch (error: any) {
      message.error(error.message || "移出失败")
    }
  }

  // 将任务数据转换为树形表格数据
  const treeData: TaskWorkItemRow[] = tasks.map(task => ({
    id: task.id,
    type: 'TASK' as const,
    title: task.title,
    priority: task.priority,
    status: task.status,
    moduleId: task.module?.id || null,
    moduleName: task.module?.name || null,
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    assignee: task.assignee,
    creator: task.creator,
    parent: task.parent,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    isInSprint: task.isInSprint,
    childCount: task.childCount,
    completedChildCount: task.completedChildCount,
    children: task.children?.map(child => ({
      id: child.id,
      type: 'WORK_ITEM' as const,
      title: child.title,
      priority: child.priority,
      status: child.status,
      moduleId: child.module?.id || null,
      moduleName: child.module?.name || null,
      estimatedHours: child.estimatedHours,
      actualHours: child.actualHours,
      assignee: child.assignee,
      creator: null,
      parent: null,
      createdAt: null,
      updatedAt: null,
      isInSprint: true,
    })),
  }))

  // 树形表格列定义
  const columns: TableProps<TaskWorkItemRow>["columns"] = [
    {
      title: "编号",
      dataIndex: "id",
      width: 120,
      fixed: 'left',
      render: (id: string) => (
        <Text 
          type="secondary" 
          style={{ 
            fontFamily: "monospace", 
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
          onClick={(e) => {
            e.stopPropagation()
            handleCopyId(id)
          }}
          title="点击复制 ID"
        >
          {id.slice(-8)}
          <CopyOutlined style={{ fontSize: 12, color: "#bfbfbf" }} />
        </Text>
      ),
    },
    {
      title: "标题",
      dataIndex: "title",
      fixed: 'left',
      render: (_: unknown, record: TaskWorkItemRow) => {
        const isTask = record.type === 'TASK'
        const isWorkItem = record.type === 'WORK_ITEM'
        const hasChildren = isTask && record.childCount && record.childCount > 0
        const isExpanded = expandedRowKeys.includes(record.id)
        
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* 展开图标 - 只有有子工作项的任务才显示 */}
            {isTask && hasChildren ? (
              <RightOutlined
                style={{
                  fontSize: 10,
                  color: '#8c8c8c',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (isExpanded) {
                    setExpandedRowKeys(expandedRowKeys.filter(k => k !== record.id))
                  } else {
                    setExpandedRowKeys([...expandedRowKeys, record.id])
                  }
                }}
              />
            ) : (
              <span style={{ width: 10, flexShrink: 0 }} />
            )}
            {/* 工作项行额外缩进 */}
            {isWorkItem && <span style={{ width: 8 }} />}
            {/* 类型图标 */}
            {isTask ? (
              <ThunderboltFilled style={{ color: "#faad14", fontSize: 14, flexShrink: 0 }} />
            ) : (
              <CodeFilled style={{ color: "#60a5fa", fontSize: 14, flexShrink: 0 }} />
            )}
            {/* 标题 */}
            <Text 
              style={{ 
                cursor: "pointer", 
                transition: "color 0.2s",
              }}
              onClick={() => {
                if (isTask) {
                  handleOpenTaskDetail(record.id)
                } else {
                  handleOpenWorkItemDetail(record.id)
                }
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#7c7cff"}
              onMouseLeave={(e) => e.currentTarget.style.color = ""}
            >
              {record.title}
            </Text>
            {/* 子项统计 */}
            {isTask && hasChildren && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({record.completedChildCount}/{record.childCount})
              </Text>
            )}
          </div>
        )
      },
    },
    {
      title: "模块",
      dataIndex: "moduleName",
      width: 100,
      render: (name: string) => name || <Text type="secondary">-</Text>,
    },
    {
      title: "所属需求",
      width: 150,
      render: (_: unknown, record: TaskWorkItemRow) => {
        if (record.type === 'WORK_ITEM' || !record.parent) {
          return <Text type="secondary">-</Text>
        }
        return (
          <Text 
            style={{ 
              color: "#7c7cff",
              cursor: "pointer",
              fontSize: 12,
            }}
            ellipsis
            title={record.parent.title}
          >
            {record.parent.title}
          </Text>
        )
      },
    },
    {
      title: "负责人",
      dataIndex: "assignee",
      width: 80,
      render: (assignee: { name: string; avatar: string | null } | null) => (
        assignee ? (
          <Avatar size="small" src={assignee.avatar} style={{ background: "#c4b5fd" }}>
            {assignee.name?.[0] || "?"}
          </Avatar>
        ) : <Text type="secondary">-</Text>
      ),
    },
    {
      title: "预估",
      dataIndex: "estimatedHours",
      width: 70,
      render: (hours: number | null) => hours ? `${hours}h` : <Text type="secondary">-</Text>,
    },
    {
      title: "优先级",
      dataIndex: "priority",
      width: 70,
      fixed: 'right',
      render: (priority: string) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      fixed: 'right',
      render: (status: string) => {
        const info = getStatusInfo(status)
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: "操作",
      width: 60,
      fixed: 'right',
      render: (_: unknown, record: TaskWorkItemRow) => {
        const isTask = record.type === 'TASK'
        return (
          <Dropdown
            menu={{
              items: [
                { 
                  key: "view", 
                  icon: <EyeOutlined />, 
                  label: "查看详情",
                  onClick: () => {
                    if (isTask) {
                      handleOpenTaskDetail(record.id)
                    } else {
                      handleOpenWorkItemDetail(record.id)
                    }
                  }
                },
                { key: "edit", icon: <EditOutlined />, label: "编辑" },
                { type: "divider" },
                ...(isTask ? [
                  { 
                    key: "remove", 
                    icon: <ExportOutlined />, 
                    label: "移出迭代", 
                    danger: true,
                    onClick: () => handleRemoveSingleTask(record.id)
                  } as const,
                ] : []),
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        )
      },
    },
  ]

  // 可导入任务表格列
  const importColumns: TableProps<SprintTaskItem>["columns"] = [
    {
      title: "标题",
      dataIndex: "title",
      ellipsis: true,
      render: (title: string, record: SprintTaskItem) => (
        <Space>
          <ThunderboltFilled style={{ color: "#faad14", fontSize: 14 }} />
          <Text>{title}</Text>
          {record.childCount && record.childCount > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              (含 {record.childCount} 个工作项)
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "所属需求",
      width: 150,
      render: (_: unknown, record: SprintTaskItem) => {
        return record.parent?.title || <Text type="secondary">-</Text>
      },
    },
    {
      title: "模块",
      width: 100,
      render: (_: unknown, record: SprintTaskItem) => record.module?.name || "-",
    },
    {
      title: "优先级",
      dataIndex: "priority",
      width: 70,
      render: (p: string) => <Tag color={getPriorityColor(p)}>{p}</Tag>,
    },
    {
      title: "负责人",
      width: 80,
      render: (_: unknown, record: SprintTaskItem) => record.assignee?.name || "-",
    },
  ]

  // 批量操作
  const batchActions: BatchAction[] = [
    {
      key: "remove",
      label: "移出迭代",
      icon: <ExportOutlined />,
      danger: true,
      onClick: handleRemoveTasks,
    },
  ]

  // 分页后的树形数据
  const paginatedTreeData = treeData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // 右侧操作按钮
  const headerActions = (
    <Space size={8}>
      <Button 
        color="primary"
        variant="dashed"
        size="small"
        icon={<ImportOutlined style={{ fontSize: 12 }} />} 
        onClick={() => setIsImportModalOpen(true)}
      >
        移入
      </Button>
    </Space>
  )

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <ListPageLayout<TaskWorkItemRow>
        content={{
          title: "任务列表",
          icon: <BarsOutlined style={{ fontSize: 14, color: "#7c7cff" }} />,
          columns: columns,
          dataSource: paginatedTreeData,
          rowKey: "id",
          loading: loading,
          searchPlaceholder: "搜索任务标题...",
          searchValue: searchQuery,
          onSearch: setSearchQuery,
          headerActions: headerActions,
          pagination: {
            current: currentPage,
            pageSize: pageSize,
            total: treeData.length,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          },
          batchActions: batchActions,
          rowSelection: {
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          },
          expandable: {
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as React.Key[]),
            indentSize: 0,
            expandIcon: () => null,
          },
        }}
      />

      {/* 移入任务弹窗 */}
      <Modal
        title={
          <Space>
            <ImportOutlined style={{ color: "#7c7cff" }} />
            <span>移入任务到迭代</span>
          </Space>
        }
        open={isImportModalOpen}
        onCancel={() => {
          setIsImportModalOpen(false)
          setSelectedImportKeys([])
          setImportSearch("")
        }}
        onOk={handleImportTasks}
        okText={`移入 (${selectedImportKeys.length})`}
        okButtonProps={{ disabled: selectedImportKeys.length === 0 }}
        cancelText="取消"
        width={800}
        styles={{ body: { maxHeight: "60vh", overflow: "auto" } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Input
              placeholder="搜索任务..."
              value={importSearch}
              onChange={(e) => setImportSearch(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              显示项目关联产品中未分配迭代的任务
            </Text>
          </Space>
        </div>
        <Table
          columns={importColumns}
          dataSource={availableTasks}
          rowKey="id"
          loading={availableLoading}
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共 ${total} 个任务可移入` }}
          rowSelection={{
            selectedRowKeys: selectedImportKeys,
            onChange: setSelectedImportKeys,
          }}
          locale={{
            emptyText: (
              <Empty description="没有可移入的任务" />
            ),
          }}
        />
      </Modal>

      {/* 任务详情弹窗 */}
      <TaskDetailModal
        open={isTaskDetailOpen}
        taskId={selectedTaskId}
        onClose={() => {
          setIsTaskDetailOpen(false)
          setSelectedTaskId(null)
        }}
        onWorkItemClick={handleOpenWorkItemDetail}
        onSuccess={() => loadTasks()}
      />

      {/* 工作项详情弹窗 */}
      <WorkItemDetailModal
        open={isWorkItemDetailOpen}
        workItemId={selectedWorkItemId}
        onClose={() => {
          setIsWorkItemDetailOpen(false)
          setSelectedWorkItemId(null)
        }}
        onSuccess={() => loadTasks()}
      />
    </div>
  )
}
