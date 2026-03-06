"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  Typography,
  Tag,
  Button,
  Space,
  Avatar,
  Select,
  Skeleton,
  Empty,
  Tooltip,
  Segmented,
  Popover,
  Progress,
} from "antd"
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FileTextFilled,
  ThunderboltFilled,
  CodeFilled,
  CalendarOutlined,
  ReloadOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  MinusCircleFilled,
  FieldTimeOutlined,
  AimOutlined,
  RightOutlined,
  DownOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
} from "@ant-design/icons"
import dayjs, { Dayjs } from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import "dayjs/locale/zh-cn"
import { 
  sprintTimelineApi, 
  type SprintTimelineResponse,
  type TimelineTreeItem,
  type TimelineFlatItem,
  type TimelineItemBase,
} from "@/lib/api"

dayjs.extend(isBetween)
dayjs.locale("zh-cn")

const { Text } = Typography

// 工作项类型配置
const workItemTypeConfig: Record<string, { 
  icon: React.ReactNode
  color: string
  bgGradient: string
  borderColor: string
  label: string 
}> = {
  REQUIREMENT: { 
    icon: <FileTextFilled style={{ fontSize: 11 }} />, 
    color: "#7c7cff", 
    bgGradient: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
    borderColor: "#c4b5fd",
    label: "需求"
  },
  TASK: { 
    icon: <ThunderboltFilled style={{ fontSize: 11 }} />, 
    color: "#f59e0b", 
    bgGradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    borderColor: "#fcd34d",
    label: "任务"
  },
  BUG: { 
    icon: <CodeFilled style={{ fontSize: 11 }} />, 
    color: "#60a5fa", 
    bgGradient: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    borderColor: "#93c5fd",
    label: "缺陷/工作项"
  },
}

// 状态配置
const statusConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  NOT_STARTED: { icon: <MinusCircleFilled />, color: "#94a3b8", bgColor: "#f1f5f9", label: "未开始" },
  IN_PROGRESS: { icon: <ClockCircleFilled />, color: "#3b82f6", bgColor: "#eff6ff", label: "进行中" },
  COMPLETED: { icon: <CheckCircleFilled />, color: "#10b981", bgColor: "#ecfdf5", label: "已完成" },
}

// 优先级配置
const priorityConfig: Record<string, { color: string; label: string }> = {
  P0: { color: "#ef4444", label: "最高" },
  P1: { color: "#f97316", label: "高" },
  P2: { color: "#eab308", label: "中" },
  P3: { color: "#3b82f6", label: "低" },
  P4: { color: "#94a3b8", label: "最低" },
}

// 缩放级别配置
const zoomLevels = [
  { key: "day", label: "日视图", dayWidth: 56 },
  { key: "week", label: "周视图", dayWidth: 28 },
  { key: "month", label: "月视图", dayWidth: 14 },
]

// 工作项详情 Popover
function WorkItemPopover({ item }: { item: TimelineFlatItem }) {
  const typeConfig = workItemTypeConfig[item.type] || workItemTypeConfig.TASK
  const status = statusConfig[item.status] || statusConfig.NOT_STARTED
  const priority = priorityConfig[item.priority] || priorityConfig.P2

  return (
    <div style={{ width: 280, padding: 4 }}>
      {/* 标题 */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: typeConfig.bgGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: typeConfig.color,
          flexShrink: 0,
        }}>
          {typeConfig.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            {item.title}
          </Text>
          <Space size={4}>
            <Tag style={{ 
              margin: 0, 
              fontSize: 10, 
              padding: "0 4px",
              color: typeConfig.color,
              background: `${typeConfig.color}10`,
              border: "none",
            }}>
              {typeConfig.label}
            </Tag>
            <Tag style={{ 
              margin: 0, 
              fontSize: 10, 
              padding: "0 4px",
              color: priority.color,
              background: `${priority.color}15`,
              border: "none",
            }}>
              {item.priority}
            </Tag>
          </Space>
        </div>
      </div>

      {/* 状态和进度 */}
      <div style={{ 
        padding: "8px 12px", 
        background: status.bgColor, 
        borderRadius: 6, 
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Space size={6}>
          <span style={{ color: status.color }}>{status.icon}</span>
          <Text style={{ color: status.color, fontSize: 12 }}>{status.label}</Text>
        </Space>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Progress 
            percent={item.progress} 
            size="small" 
            style={{ width: 80, margin: 0 }}
            strokeColor={item.progress === 100 ? "#10b981" : "#7c7cff"}
            showInfo={false}
          />
          <Text style={{ fontSize: 11, color: "#64748b" }}>{item.progress}%</Text>
        </div>
      </div>

      {/* 详细信息 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 12 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 11 }}>负责人</Text>
          <div style={{ marginTop: 2 }}>
            {item.assignee ? (
              <Space size={4}>
                <Avatar size={16} src={item.assignee.avatar} style={{ background: "#c4b5fd" }}>
                  {item.assignee.name?.[0]}
                </Avatar>
                <span>{item.assignee.name}</span>
              </Space>
            ) : (
              <Text type="secondary">未指派</Text>
            )}
          </div>
        </div>
        
        <div>
          <Text type="secondary" style={{ fontSize: 11 }}>预估工时</Text>
          <div style={{ marginTop: 2 }}>
            {item.estimatedHours ? `${item.estimatedHours}h` : "-"}
          </div>
        </div>

        {item.plannedStartDate && (
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>计划开始</Text>
            <div style={{ marginTop: 2 }}>{item.plannedStartDate}</div>
          </div>
        )}

        {item.plannedEndDate && (
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>计划结束</Text>
            <div style={{ marginTop: 2 }}>{item.plannedEndDate}</div>
          </div>
        )}

        {item.childCount > 0 && (
          <div style={{ gridColumn: "span 2" }}>
            <Text type="secondary" style={{ fontSize: 11 }}>子项进度</Text>
            <div style={{ marginTop: 2 }}>
              已完成 {item.completedChildCount} / {item.childCount} 项
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface SprintTimelineTabProps {
  projectId: string
  sprintId: string
}

export function SprintTimelineTab({ projectId, sprintId }: SprintTimelineTabProps) {
  const [data, setData] = useState<SprintTimelineResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterAssignee, setFilterAssignee] = useState<string | undefined>()
  const [filterStatus, setFilterStatus] = useState<string>("all")
  
  // 展开状态
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  
  const timelineRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await sprintTimelineApi.getTimeline(projectId, sprintId)
      setData(result)
      // 默认展开所有第一层
      const firstLevelIds = new Set(result.treeData.map(item => item.id))
      setExpandedIds(firstLevelIds)
    } catch (error) {
      console.error("加载时间轴失败", error)
    } finally {
      setLoading(false)
    }
  }, [projectId, sprintId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 切换展开/折叠
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // 全部展开
  const expandAll = () => {
    if (!data) return
    const allIds = new Set<string>()
    const collectIds = (items: TimelineTreeItem[]) => {
      items.forEach((item: TimelineTreeItem) => {
        if (item.children && item.children.length > 0) {
          allIds.add(item.id)
          collectIds(item.children)
        }
      })
    }
    collectIds(data.treeData)
    setExpandedIds(allIds)
  }

  // 全部折叠
  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  // 可见的工作项（根据展开状态和筛选条件）
  const visibleItems = useMemo((): TimelineFlatItem[] => {
    if (!data) return []
    
    const result: TimelineFlatItem[] = []
    
    const processItem = (item: TimelineTreeItem, parentVisible: boolean): boolean => {
      // 检查筛选条件
      const matchesFilter = (
        (filterType === "all" || item.type === filterType) &&
        (!filterAssignee || item.assignee?.id === filterAssignee) &&
        (filterStatus === "all" || item.status === filterStatus)
      )
      
      // 如果自身匹配或者有子项匹配，则可见
      let hasVisibleChildren = false
      
      if (item.children && item.children.length > 0 && expandedIds.has(item.id)) {
        item.children.forEach((child: TimelineTreeItem) => {
          const childVisible = processItem(child, matchesFilter || parentVisible)
          if (childVisible) {
            hasVisibleChildren = true
          }
        })
      }
      
      if (matchesFilter || hasVisibleChildren) {
        result.push({
          id: item.id,
          title: item.title,
          type: item.type,
          priority: item.priority,
          status: item.status,
          plannedStartDate: item.plannedStartDate,
          plannedEndDate: item.plannedEndDate,
          actualStartDate: item.actualStartDate,
          actualEndDate: item.actualEndDate,
          estimatedHours: item.estimatedHours,
          actualHours: item.actualHours,
          assignee: item.assignee,
          creator: item.creator,
          module: item.module,
          parentId: item.parentId,
          childCount: item.childCount,
          completedChildCount: item.completedChildCount,
          progress: item.progress,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          level: item.level,
          hasChildren: (item.children?.length || 0) > 0,
          isLastChild: false,
          parentIds: [],
        })
        return true
      }
      
      return false
    }
    
    data.treeData.forEach((item: TimelineTreeItem) => processItem(item, true))
    
    return result
  }, [data, expandedIds, filterType, filterAssignee, filterStatus])

  // 时间范围计算
  const timeRange = useMemo(() => {
    if (!data) return { start: dayjs(), end: dayjs(), days: [] as Dayjs[] }
    
    const start = dayjs(data.sprint.startDate)
    const end = dayjs(data.sprint.endDate)
    const days: Dayjs[] = []
    
    let current = start
    while (current.isBefore(end) || current.isSame(end, "day")) {
      days.push(current)
      current = current.add(1, "day")
    }
    
    return { start, end, days }
  }, [data])

  // 当前缩放配置
  const currentZoom = zoomLevels[zoomLevel]
  const dayWidth = currentZoom.dayWidth

  // 今天的位置
  const today = dayjs()
  const todayOffset = useMemo(() => {
    if (!data) return -1
    const start = dayjs(data.sprint.startDate)
    if (today.isBefore(start)) return -1
    const end = dayjs(data.sprint.endDate)
    if (today.isAfter(end)) return -1
    return today.diff(start, "day") * dayWidth
  }, [data, dayWidth, today])

  // 滚动到今天
  const scrollToToday = useCallback(() => {
    if (timelineRef.current && todayOffset >= 0) {
      const containerWidth = timelineRef.current.clientWidth
      timelineRef.current.scrollLeft = Math.max(0, todayOffset - containerWidth / 3)
    }
  }, [todayOffset])

  // 初始滚动到今天
  useEffect(() => {
    if (!loading && data && todayOffset >= 0) {
      setTimeout(scrollToToday, 100)
    }
  }, [loading, data, todayOffset, scrollToToday])

  // 同步滚动
  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (listRef.current) {
      listRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  // 按周分组日期头
  const weekGroups = useMemo(() => {
    const groups: { weekStart: string; days: Dayjs[]; width: number }[] = []
    let currentWeek = ""
    let currentDays: Dayjs[] = []
    
    timeRange.days.forEach(day => {
      const weekStart = day.startOf("week").format("YYYY-MM-DD")
      if (weekStart !== currentWeek) {
        if (currentDays.length > 0) {
          groups.push({ 
            weekStart: currentWeek, 
            days: currentDays,
            width: currentDays.length * dayWidth,
          })
        }
        currentWeek = weekStart
        currentDays = [day]
      } else {
        currentDays.push(day)
      }
    })
    
    if (currentDays.length > 0) {
      groups.push({ 
        weekStart: currentWeek, 
        days: currentDays,
        width: currentDays.length * dayWidth,
      })
    }
    
    return groups
  }, [timeRange.days, dayWidth])

  // 计算工作项在时间轴上的位置和宽度
  const getItemStyle = useCallback((item: TimelineFlatItem) => {
    if (!data) return { left: 0, width: dayWidth }
    
    const sprintStart = dayjs(data.sprint.startDate)
    const sprintEnd = dayjs(data.sprint.endDate)
    
    const itemStart = item.plannedStartDate ? dayjs(item.plannedStartDate) : sprintStart
    const itemEnd = item.plannedEndDate ? dayjs(item.plannedEndDate) : sprintEnd
    
    const effectiveStart = itemStart.isBefore(sprintStart) ? sprintStart : itemStart
    const effectiveEnd = itemEnd.isAfter(sprintEnd) ? sprintEnd : itemEnd
    
    const startOffset = effectiveStart.diff(sprintStart, "day")
    const duration = effectiveEnd.diff(effectiveStart, "day") + 1
    
    return {
      left: startOffset * dayWidth + 2,
      width: Math.max(duration * dayWidth - 4, dayWidth * 0.8),
    }
  }, [data, dayWidth])

  // 判断是否周末
  const isWeekend = (day: Dayjs) => {
    const weekday = day.day()
    return weekday === 0 || weekday === 6
  }

  // 行高
  const ROW_HEIGHT = 40

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="加载失败" />
      </div>
    )
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
      {/* 顶部统计栏 */}
      <div style={{ 
        padding: "12px 20px", 
        borderBottom: "1px solid #e2e8f0",
        background: "linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)",
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "linear-gradient(135deg, #22d3ee 0%, #7c7cff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}>
            <AimOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 14 }}>{data.sprint.name}</Text>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {data.sprint.startDate} ~ {data.sprint.endDate}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginLeft: "auto" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#334155" }}>{data.stats.totalItems}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>总计</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#7c7cff" }}>{data.stats.requirementCount}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>需求</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#f59e0b" }}>{data.stats.taskCount}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>任务</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#ef4444" }}>{data.stats.workItemCount}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>工作项</div>
          </div>
          <div style={{ width: 1, height: 32, background: "#e2e8f0" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#10b981" }}>{data.stats.completedItems}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>已完成</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#3b82f6" }}>{data.stats.inProgressItems}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>进行中</div>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div style={{ 
        padding: "8px 20px", 
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
        background: "#fafbfc",
      }}>
        <Segmented
          size="small"
          value={filterType}
          onChange={(v) => setFilterType(v as string)}
          options={[
            { value: "all", label: "全部" },
            { value: "REQUIREMENT", label: "需求" },
            { value: "TASK", label: "任务" },
            { value: "BUG", label: "工作项" },
          ]}
        />
        
        <Select
          size="small"
          placeholder="负责人"
          style={{ width: 120 }}
          allowClear
          value={filterAssignee}
          onChange={setFilterAssignee}
          options={data.assignees.map(a => ({
            value: a.id,
            label: (
              <Space size={4}>
                <Avatar size={16} src={a.avatar} style={{ background: "#c4b5fd" }}>{a.name?.[0]}</Avatar>
                <span>{a.name}</span>
              </Space>
            ),
          }))}
        />
        
        <Segmented
          size="small"
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as string)}
          options={[
            { value: "all", label: "全部" },
            { value: "NOT_STARTED", label: "未开始" },
            { value: "IN_PROGRESS", label: "进行中" },
            { value: "COMPLETED", label: "已完成" },
          ]}
        />

        <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />

        {/* 展开/折叠 */}
        <Button size="small" type="text" icon={<ExpandAltOutlined />} onClick={expandAll}>
          展开
        </Button>
        <Button size="small" type="text" icon={<ShrinkOutlined />} onClick={collapseAll}>
          折叠
        </Button>
        
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <Button 
            size="small" 
            type="text" 
            icon={<ZoomOutOutlined />}
            disabled={zoomLevel >= 2}
            onClick={() => setZoomLevel(Math.min(2, zoomLevel + 1))}
          />
          <Text style={{ fontSize: 11, color: "#64748b", minWidth: 50, textAlign: "center" }}>
            {currentZoom.label}
          </Text>
          <Button 
            size="small" 
            type="text" 
            icon={<ZoomInOutlined />}
            disabled={zoomLevel <= 0}
            onClick={() => setZoomLevel(Math.max(0, zoomLevel - 1))}
          />
          
          <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
          
          <Tooltip title="定位到今天">
            <Button 
              size="small" 
              type="text" 
              icon={<CalendarOutlined />}
              onClick={scrollToToday}
              disabled={todayOffset < 0}
            >
              今天
            </Button>
          </Tooltip>
          
          <Button 
            size="small" 
            type="text" 
            icon={<ReloadOutlined />}
            onClick={loadData}
          />
        </div>
      </div>
      
      {/* 时间轴主体 */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* 左侧工作项列表 */}
        <div style={{ 
          width: 300, 
          flexShrink: 0, 
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
        }}>
          {/* 表头 */}
          <div style={{ 
            height: 48, 
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            background: "#f8fafc",
            fontWeight: 500,
            color: "#475569",
            fontSize: 12,
            flexShrink: 0,
          }}>
            <Space>
              <FieldTimeOutlined style={{ color: "#7c7cff" }} />
              工作项 ({visibleItems.length})
            </Space>
          </div>
          
          {/* 工作项列表 */}
          <div 
            ref={listRef}
            style={{ flex: 1, overflow: "auto" }}
            onScroll={handleListScroll}
          >
            {visibleItems.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center" }}>
                <Empty description="暂无工作项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              visibleItems.map((item: TimelineFlatItem) => {
                const typeConfig = workItemTypeConfig[item.type] || workItemTypeConfig.TASK
                const status = statusConfig[item.status] || statusConfig.NOT_STARTED
                const isExpanded = expandedIds.has(item.id)
                const indent = item.level * 20
                
                return (
                  <Popover
                    key={item.id}
                    content={<WorkItemPopover item={item} />}
                    placement="right"
                    trigger="hover"
                    mouseEnterDelay={0.3}
                  >
                    <div 
                      style={{ 
                        height: ROW_HEIGHT,
                        padding: "0 12px",
                        paddingLeft: 12 + indent,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        background: item.level === 0 ? "#fafbfc" : "transparent",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f0f4ff"}
                      onMouseLeave={(e) => e.currentTarget.style.background = item.level === 0 ? "#fafbfc" : ""}
                    >
                      {/* 展开/折叠图标 */}
                      {item.hasChildren ? (
                        <span 
                          onClick={(e) => { e.stopPropagation(); toggleExpand(item.id) }}
                          style={{ 
                            width: 16, 
                            height: 16, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#94a3b8",
                            transition: "transform 0.2s",
                          }}
                        >
                          {isExpanded ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
                        </span>
                      ) : (
                        <span style={{ width: 16 }} />
                      )}
                      
                      {/* 类型图标 */}
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        background: typeConfig.bgGradient,
                        border: `1px solid ${typeConfig.borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: typeConfig.color,
                        flexShrink: 0,
                      }}>
                        {typeConfig.icon}
                      </div>
                      
                      {/* 标题 */}
                      <Text 
                        style={{ 
                          flex: 1, 
                          fontSize: 12,
                          fontWeight: item.level === 0 ? 500 : 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </Text>
                      
                      {/* 子项数量 */}
                      {item.childCount > 0 && (
                        <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>
                          {item.completedChildCount}/{item.childCount}
                        </Text>
                      )}
                      
                      {/* 状态 */}
                      <span style={{ color: status.color, fontSize: 12, flexShrink: 0 }}>
                        {status.icon}
                      </span>
                    </div>
                  </Popover>
                )
              })
            )}
          </div>
        </div>
        
        {/* 右侧时间轴区域 */}
        <div 
          ref={timelineRef}
          style={{ 
            flex: 1, 
            overflow: "auto",
            position: "relative",
          }}
          onScroll={handleTimelineScroll}
        >
          {/* 时间轴头部 */}
          <div style={{ 
            position: "sticky", 
            top: 0, 
            zIndex: 10,
            background: "#fff",
          }}>
            {/* 周行 */}
            <div style={{ 
              height: 24, 
              display: "flex",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}>
              {weekGroups.map((group) => (
                <div 
                  key={group.weekStart}
                  style={{
                    width: group.width,
                    borderRight: "1px solid #e2e8f0",
                    padding: "0 8px",
                    display: "flex",
                    alignItems: "center",
                    fontSize: 10,
                    fontWeight: 500,
                    color: "#64748b",
                  }}
                >
                  {dayjs(group.weekStart).format("M/D")} - {group.days[group.days.length - 1].format("M/D")}
                </div>
              ))}
            </div>
            
            {/* 日期行 */}
            <div style={{ 
              height: 24, 
              display: "flex",
              borderBottom: "1px solid #e2e8f0",
              background: "#fafbfc",
            }}>
              {timeRange.days.map((day, i) => {
                const isToday = day.isSame(today, "day")
                const weekend = isWeekend(day)
                
                return (
                  <div 
                    key={i}
                    style={{
                      width: dayWidth,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRight: "1px solid #f1f5f9",
                      background: isToday 
                        ? "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)" 
                        : weekend 
                          ? "#f1f5f9" 
                          : "transparent",
                      fontSize: 10,
                      color: isToday ? "#7c7cff" : weekend ? "#94a3b8" : "#64748b",
                      fontWeight: isToday ? 600 : 400,
                    }}
                  >
                    {day.format("D")}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* 时间轴内容 */}
          <div style={{ position: "relative" }}>
            {/* 背景网格 */}
            <div style={{ 
              position: "absolute", 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              display: "flex",
              pointerEvents: "none",
            }}>
              {timeRange.days.map((day, i) => {
                const isToday = day.isSame(today, "day")
                const weekend = isWeekend(day)
                
                return (
                  <div 
                    key={i}
                    style={{
                      width: dayWidth,
                      borderRight: "1px solid #f1f5f9",
                      background: isToday 
                        ? "rgba(124, 124, 255, 0.04)" 
                        : weekend 
                          ? "rgba(148, 163, 184, 0.04)" 
                          : "transparent",
                    }}
                  />
                )
              })}
            </div>
            
            {/* 今日线 */}
            {todayOffset >= 0 && (
              <div style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: todayOffset + dayWidth / 2 - 1,
                width: 2,
                background: "linear-gradient(180deg, #7c7cff 0%, #22d3ee 100%)",
                zIndex: 5,
                pointerEvents: "none",
              }}>
                <div style={{
                  position: "absolute",
                  top: -6,
                  left: -5,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#7c7cff",
                  border: "2px solid #fff",
                  boxShadow: "0 2px 4px rgba(124,124,255,0.3)",
                }}/>
              </div>
            )}
            
            {/* 行分隔线和工作项条形 */}
            {visibleItems.map((item: TimelineFlatItem, index: number) => {
              const style = getItemStyle(item)
              const typeConfig = workItemTypeConfig[item.type] || workItemTypeConfig.TASK
              const priority = priorityConfig[item.priority] || priorityConfig.P2
              const rowTop = index * ROW_HEIGHT
              
              return (
                <div key={item.id}>
                  {/* 行背景 */}
                  <div style={{
                    position: "absolute",
                    top: rowTop,
                    left: 0,
                    right: 0,
                    height: ROW_HEIGHT,
                    borderBottom: "1px solid #f1f5f9",
                    background: item.level === 0 ? "rgba(248,250,252,0.5)" : "transparent",
                  }} />
                  
                  {/* 条形 */}
                  <Popover
                    content={<WorkItemPopover item={item} />}
                    placement="top"
                    trigger="hover"
                    mouseEnterDelay={0.3}
                  >
                    <div 
                      style={{
                        position: "absolute",
                        top: rowTop + (ROW_HEIGHT - 26) / 2,
                        left: style.left,
                        width: style.width,
                        height: 26,
                        borderRadius: 5,
                        background: typeConfig.bgGradient,
                        border: `1px solid ${typeConfig.borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 6px",
                        gap: 4,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        overflow: "hidden",
                        zIndex: 2,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"
                        e.currentTarget.style.transform = "translateY(-1px)"
                        e.currentTarget.style.zIndex = "10"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)"
                        e.currentTarget.style.transform = ""
                        e.currentTarget.style.zIndex = "2"
                      }}
                    >
                      {/* 优先级指示条 */}
                      <div style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: priority.color,
                        borderRadius: "5px 0 0 5px",
                      }}/>
                      
                      {/* 进度背景 */}
                      {item.progress > 0 && (
                        <div style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${item.progress}%`,
                          background: item.status === "COMPLETED" 
                            ? "rgba(16, 185, 129, 0.2)" 
                            : `${typeConfig.color}15`,
                          borderRadius: 5,
                        }}/>
                      )}
                      
                      {/* 内容 */}
                      <div style={{ 
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flex: 1,
                        minWidth: 0,
                        paddingLeft: 2,
                      }}>
                        <span style={{ color: typeConfig.color, flexShrink: 0, fontSize: 10 }}>
                          {typeConfig.icon}
                        </span>
                        
                        {style.width > 60 && (
                          <Text style={{ 
                            fontSize: 10, 
                            fontWeight: 500,
                            color: "#334155",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}>
                            {item.title}
                          </Text>
                        )}
                        
                        {item.status === "COMPLETED" && (
                          <CheckCircleFilled style={{ 
                            color: "#10b981", 
                            fontSize: 10,
                            flexShrink: 0,
                          }} />
                        )}
                      </div>
                    </div>
                  </Popover>
                </div>
              )
            })}
            
            {/* 填充高度 */}
            <div style={{ height: visibleItems.length * ROW_HEIGHT + 20 }} />
          </div>
        </div>
      </div>
      
      {/* 底部图例 */}
      <div style={{
        padding: "6px 20px",
        borderTop: "1px solid #e2e8f0",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexShrink: 0,
        fontSize: 10,
        color: "#64748b",
      }}>
        <Space size={10}>
          <span style={{ fontWeight: 500 }}>层级:</span>
          <Space size={4}>
            <FileTextFilled style={{ color: "#7c7cff", fontSize: 11 }} />
            <span>需求</span>
          </Space>
          <RightOutlined style={{ fontSize: 8, color: "#cbd5e1" }} />
          <Space size={4}>
            <ThunderboltFilled style={{ color: "#f59e0b", fontSize: 11 }} />
            <span>任务</span>
          </Space>
          <RightOutlined style={{ fontSize: 8, color: "#cbd5e1" }} />
          <Space size={4}>
            <CodeFilled style={{ color: "#60a5fa", fontSize: 11 }} />
            <span>工作项</span>
          </Space>
        </Space>
        
        <div style={{ width: 1, height: 12, background: "#e2e8f0" }} />
        
        <Space size={10}>
          <span style={{ fontWeight: 500 }}>优先级:</span>
          {["P0", "P1", "P2"].map(p => (
            <Space key={p} size={3}>
              <div style={{ width: 3, height: 10, borderRadius: 1, background: priorityConfig[p].color }} />
              <span>{p}</span>
            </Space>
          ))}
        </Space>
        
        <div style={{ width: 1, height: 12, background: "#e2e8f0" }} />
        
        <Space size={3}>
          <div style={{ width: 2, height: 12, background: "linear-gradient(180deg, #7c7cff 0%, #22d3ee 100%)", borderRadius: 1 }} />
          <span>今天</span>
        </Space>
        
        <div style={{ marginLeft: "auto", color: "#94a3b8" }}>
          点击箭头展开/折叠 | 悬停查看详情
        </div>
      </div>
    </div>
  )
}
