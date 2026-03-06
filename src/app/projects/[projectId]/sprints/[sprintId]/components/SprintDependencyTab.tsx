"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  Typography,
  Tag,
  Button,
  Space,
  Avatar,
  Skeleton,
  Empty,
  Tooltip,
  Segmented,
  Popover,
  Alert,
} from "antd"
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ThunderboltFilled,
  CodeFilled,
  ReloadOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  MinusCircleFilled,
  WarningFilled,
  ExclamationCircleFilled,
  NodeIndexOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons"
import { 
  sprintDependencyApi, 
  type SprintDependencyResponse,
  type DependencyNode,
  type DependencyEdge,
  type ExternalDependencyNode,
} from "@/lib/api"

const { Text } = Typography

// 工作项类型配置（只有任务和工作项）
const workItemTypeConfig: Record<string, { 
  icon: React.ReactNode
  color: string
  bgColor: string
  label: string 
}> = {
  TASK: { 
    icon: <ThunderboltFilled style={{ fontSize: 14 }} />, 
    color: "#f59e0b", 
    bgColor: "#fef3c7",
    label: "任务"
  },
  BUG: { 
    icon: <CodeFilled style={{ fontSize: 14 }} />, 
    color: "#60a5fa", 
    bgColor: "#eff6ff",
    label: "工作项"
  },
}

// 状态配置
const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  NOT_STARTED: { icon: <MinusCircleFilled />, color: "#94a3b8", label: "未开始" },
  IN_PROGRESS: { icon: <ClockCircleFilled />, color: "#3b82f6", label: "进行中" },
  COMPLETED: { icon: <CheckCircleFilled />, color: "#10b981", label: "已完成" },
}

// 优先级颜色
const priorityColors: Record<string, string> = {
  P0: "#ef4444",
  P1: "#f97316",
  P2: "#eab308",
  P3: "#3b82f6",
  P4: "#94a3b8",
}

// 节点尺寸
const NODE_WIDTH = 200
const NODE_HEIGHT = 56
const NODE_MARGIN_X = 100
const NODE_MARGIN_Y = 30

// 节点详情 Popover
function NodePopover({ node }: { node: DependencyNode | ExternalDependencyNode }) {
  const typeConfig = workItemTypeConfig[node.type] || workItemTypeConfig.TASK
  const status = statusConfig[node.status] || statusConfig.NOT_STARTED
  const isExternal = 'isExternal' in node && node.isExternal

  return (
    <div style={{ width: 260, padding: 4 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: typeConfig.bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: typeConfig.color,
          flexShrink: 0,
        }}>
          {typeConfig.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong style={{ fontSize: 13 }}>{node.title}</Text>
          <div style={{ marginTop: 4 }}>
            <Space size={4}>
              <Tag style={{ 
                margin: 0, fontSize: 10, padding: "0 4px",
                color: typeConfig.color, background: `${typeConfig.color}15`, border: "none",
              }}>
                {typeConfig.label}
              </Tag>
              <Tag style={{ 
                margin: 0, fontSize: 10, padding: "0 4px",
                color: priorityColors[node.priority], 
                background: `${priorityColors[node.priority]}15`, 
                border: "none",
              }}>
                {node.priority}
              </Tag>
              {isExternal && (
                <Tag color="purple" style={{ margin: 0, fontSize: 10, padding: "0 4px" }}>
                  外部
                </Tag>
              )}
            </Space>
          </div>
        </div>
      </div>

      <div style={{ 
        padding: "8px 12px", 
        background: status.color + "10", 
        borderRadius: 6,
        marginBottom: 12,
      }}>
        <Space size={6}>
          <span style={{ color: status.color }}>{status.icon}</span>
          <Text style={{ color: status.color, fontSize: 12 }}>{status.label}</Text>
        </Space>
      </div>

      <div style={{ fontSize: 12, color: "#64748b" }}>
        {node.assignee && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span>负责人:</span>
            <Avatar size={16} src={node.assignee.avatar} style={{ background: "#c4b5fd" }}>
              {node.assignee.name?.[0]}
            </Avatar>
            <span>{node.assignee.name}</span>
          </div>
        )}
        {!isExternal && 'dependencyCount' in node && (
          <>
            <div>依赖: {node.dependencyCount} 项 | 被依赖: {node.dependentCount} 项</div>
            {node.isBlocked && (
              <div style={{ color: "#f59e0b", marginTop: 4 }}>
                <WarningFilled /> 被阻塞（存在未完成的前置依赖）
              </div>
            )}
            {node.isBlocking && (
              <div style={{ color: "#ef4444", marginTop: 4 }}>
                <ExclamationCircleFilled /> 阻塞中（有其他工作项等待此项完成）
              </div>
            )}
          </>
        )}
        {isExternal && 'sprint' in node && node.sprint && (
          <div>所属迭代: {node.sprint.name}</div>
        )}
      </div>
    </div>
  )
}

interface SprintDependencyTabProps {
  projectId: string
  sprintId: string
}

export function SprintDependencyTab({ projectId, sprintId }: SprintDependencyTabProps) {
  const [data, setData] = useState<SprintDependencyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>("all")
  const [showExternal, setShowExternal] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await sprintDependencyApi.getDependencies(projectId, sprintId)
      setData(result)
    } catch (error) {
      console.error("加载依赖关系失败", error)
    } finally {
      setLoading(false)
    }
  }, [projectId, sprintId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 筛选后的节点（只显示任务和工作项）
  const filteredNodes = useMemo(() => {
    if (!data) return []
    return data.nodes.filter(node => {
      // 排除需求
      if (node.type === 'REQUIREMENT') return false
      if (filterType !== "all" && node.type !== filterType) return false
      return true
    })
  }, [data, filterType])

  // 包含外部节点的完整节点列表
  const allNodes = useMemo(() => {
    if (!data) return []
    const nodes: (DependencyNode | ExternalDependencyNode)[] = [...filteredNodes]
    if (showExternal) {
      // 外部节点也排除需求
      const externalFiltered = data.externalNodes.filter(n => n.type !== 'REQUIREMENT')
      nodes.push(...externalFiltered)
    }
    return nodes
  }, [data, filteredNodes, showExternal])

  // 筛选后的边
  const filteredEdges = useMemo(() => {
    if (!data) return []
    const nodeIds = new Set(allNodes.map(n => n.id))
    return data.edges.filter(edge => {
      return nodeIds.has(edge.source) && nodeIds.has(edge.target)
    })
  }, [data, allNodes])

  // 计算节点位置（分层布局）
  const nodePositions = useMemo(() => {
    if (!data || allNodes.length === 0) return new Map<string, { x: number; y: number }>()
    
    const positions = new Map<string, { x: number; y: number }>()
    const nodeIds = allNodes.map(n => n.id)
    const nodeIdSet = new Set(nodeIds)
    
    // 计算每个节点的入度
    const inDegree = new Map<string, number>()
    nodeIds.forEach(id => inDegree.set(id, 0))
    
    filteredEdges.forEach(edge => {
      if (nodeIdSet.has(edge.target)) {
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
      }
    })
    
    // 分层：按入度分组
    const layers: string[][] = []
    const assigned = new Set<string>()
    
    // 第一层：入度为 0 的节点
    const firstLayer = nodeIds.filter(id => inDegree.get(id) === 0)
    if (firstLayer.length > 0) {
      layers.push(firstLayer)
      firstLayer.forEach(id => assigned.add(id))
    }
    
    // 后续层：依赖前一层的节点
    while (assigned.size < nodeIds.length) {
      const nextLayer: string[] = []
      nodeIds.forEach(id => {
        if (assigned.has(id)) return
        const deps = filteredEdges
          .filter(e => e.target === id && nodeIdSet.has(e.source))
          .map(e => e.source)
        if (deps.every(d => assigned.has(d))) {
          nextLayer.push(id)
        }
      })
      
      if (nextLayer.length === 0) {
        const remaining = nodeIds.filter(id => !assigned.has(id))
        layers.push(remaining)
        break
      }
      
      layers.push(nextLayer)
      nextLayer.forEach(id => assigned.add(id))
    }
    
    // 计算位置
    let maxLayerHeight = 0
    layers.forEach(layer => {
      maxLayerHeight = Math.max(maxLayerHeight, layer.length)
    })
    
    layers.forEach((layer, layerIndex) => {
      const layerHeight = layer.length * (NODE_HEIGHT + NODE_MARGIN_Y) - NODE_MARGIN_Y
      const startY = (maxLayerHeight * (NODE_HEIGHT + NODE_MARGIN_Y) - layerHeight) / 2
      
      layer.forEach((nodeId, nodeIndex) => {
        positions.set(nodeId, {
          x: layerIndex * (NODE_WIDTH + NODE_MARGIN_X) + 50,
          y: startY + nodeIndex * (NODE_HEIGHT + NODE_MARGIN_Y) + 50,
        })
      })
    })
    
    return positions
  }, [allNodes, filteredEdges, data])

  // 计算画布尺寸
  const canvasSize = useMemo(() => {
    if (nodePositions.size === 0) return { width: 800, height: 600 }
    
    let maxX = 0, maxY = 0
    nodePositions.forEach(pos => {
      maxX = Math.max(maxX, pos.x + NODE_WIDTH)
      maxY = Math.max(maxY, pos.y + NODE_HEIGHT)
    })
    
    return {
      width: Math.max(800, maxX + 100),
      height: Math.max(600, maxY + 100),
    }
  }, [nodePositions])

  // 高亮的节点
  const highlightedNodes = useMemo(() => {
    if (!selectedNode || !data) return new Set<string>()
    const highlighted = new Set<string>([selectedNode])
    
    filteredEdges.forEach(edge => {
      if (edge.source === selectedNode) highlighted.add(edge.target)
      if (edge.target === selectedNode) highlighted.add(edge.source)
    })
    
    return highlighted
  }, [selectedNode, filteredEdges, data])

  // 鼠标拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDragging.current = true
      lastMouse.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  // 缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(prev => Math.min(2, Math.max(0.3, prev + delta)))
  }

  // 重置视图
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // 渲染节点
  const renderNode = (node: DependencyNode | ExternalDependencyNode) => {
    const pos = nodePositions.get(node.id)
    if (!pos) return null
    
    const typeConfig = workItemTypeConfig[node.type] || workItemTypeConfig.TASK
    const status = statusConfig[node.status] || statusConfig.NOT_STARTED
    const isExternal = 'isExternal' in node && node.isExternal
    const isBlocked = !isExternal && 'isBlocked' in node && node.isBlocked
    const isBlocking = !isExternal && 'isBlocking' in node && node.isBlocking
    const isSelected = selectedNode === node.id
    const isHighlighted = highlightedNodes.has(node.id)

    let borderColor = "#e2e8f0"
    if (isSelected) borderColor = "#7c7cff"
    else if (isBlocked) borderColor = "#f59e0b"
    else if (isBlocking) borderColor = "#ef4444"
    else if (isExternal) borderColor = "#a855f7"
    else if (node.status === "COMPLETED") borderColor = "#10b981"

    return (
      <Popover key={node.id} content={<NodePopover node={node} />} placement="right" trigger="hover">
        <g
          transform={`translate(${pos.x}, ${pos.y})`}
          style={{ cursor: "pointer" }}
          onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
        >
          {/* 节点背景 */}
          <rect
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            rx={8}
            fill={isHighlighted ? "#f0f4ff" : "#fff"}
            stroke={borderColor}
            strokeWidth={isSelected ? 2.5 : 1.5}
            filter={isHighlighted ? "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" : "drop-shadow(0 1px 3px rgba(0,0,0,0.08))"}
          />
          
          {/* 左侧类型指示条 */}
          <rect
            width={4}
            height={NODE_HEIGHT}
            rx={2}
            fill={typeConfig.color}
          />
          
          {/* 类型图标 */}
          <foreignObject x={14} y={(NODE_HEIGHT - 26) / 2} width={26} height={26}>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: typeConfig.bgColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: typeConfig.color,
            }}>
              {typeConfig.icon}
            </div>
          </foreignObject>
          
          {/* 标题 */}
          <foreignObject x={48} y={8} width={NODE_WIDTH - 60} height={22}>
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#334155",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: "22px",
            }}>
              {node.title}
            </div>
          </foreignObject>
          
          {/* 底部信息 */}
          <foreignObject x={48} y={30} width={NODE_WIDTH - 60} height={20}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: status.color, fontSize: 12 }}>{status.icon}</span>
              <span style={{ fontSize: 11, color: "#64748b" }}>{status.label}</span>
              {isExternal && (
                <span style={{ 
                  fontSize: 9, 
                  color: "#a855f7", 
                  background: "#f3e8ff", 
                  padding: "1px 4px", 
                  borderRadius: 3 
                }}>
                  外部
                </span>
              )}
              {isBlocked && <WarningFilled style={{ color: "#f59e0b", fontSize: 11 }} />}
              {isBlocking && <ExclamationCircleFilled style={{ color: "#ef4444", fontSize: 11 }} />}
            </div>
          </foreignObject>
        </g>
      </Popover>
    )
  }

  // 渲染边
  const renderEdge = (edge: DependencyEdge) => {
    const sourcePos = nodePositions.get(edge.source)
    const targetPos = nodePositions.get(edge.target)
    if (!sourcePos || !targetPos) return null

    const x1 = sourcePos.x + NODE_WIDTH
    const y1 = sourcePos.y + NODE_HEIGHT / 2
    const x2 = targetPos.x
    const y2 = targetPos.y + NODE_HEIGHT / 2

    const midX = (x1 + x2) / 2
    const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`

    const isHighlighted = highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target)
    const isExternal = !edge.sourceInSprint
    
    let strokeColor = "#cbd5e1"
    let strokeWidth = 1.5
    
    if (isHighlighted) {
      strokeColor = "#7c7cff"
      strokeWidth = 2.5
    } else if (edge.isBlocking) {
      strokeColor = "#fca5a5"
      strokeWidth = 2
    } else if (isExternal) {
      strokeColor = "#d8b4fe"
    }

    return (
      <g key={edge.id}>
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd={`url(#arrow-${isHighlighted ? 'highlighted' : edge.isBlocking ? 'blocking' : isExternal ? 'external' : 'normal'})`}
        />
      </g>
    )
  }

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

  // 统计数据（只计算任务和工作项）
  const filteredStats = {
    totalNodes: filteredNodes.length,
    totalEdges: filteredEdges.length,
    blockedItems: filteredNodes.filter(n => 'isBlocked' in n && n.isBlocked).length,
    blockingItems: filteredNodes.filter(n => 'isBlocking' in n && n.isBlocking).length,
    externalDependencies: data.externalNodes.filter(n => n.type !== 'REQUIREMENT').length,
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
            <NodeIndexOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 14 }}>依赖关系图</Text>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {data.sprint.name} · 任务与工作项
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginLeft: "auto" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#334155" }}>{filteredStats.totalNodes}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>节点</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#7c7cff" }}>{filteredStats.totalEdges}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>依赖</div>
          </div>
          <div style={{ width: 1, height: 32, background: "#e2e8f0" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#f59e0b" }}>{filteredStats.blockedItems}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>被阻塞</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#ef4444" }}>{filteredStats.blockingItems}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>阻塞中</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#a855f7" }}>{filteredStats.externalDependencies}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>外部</div>
          </div>
        </div>
      </div>

      {/* 循环依赖警告 */}
      {data.cycles.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningFilled />}
          message={
            <span>
              检测到 <strong>{data.cycles.length}</strong> 个循环依赖，可能导致工作项无法完成
            </span>
          }
          style={{ margin: "12px 20px 0", borderRadius: 8 }}
        />
      )}

      {/* 工具栏 */}
      <div style={{ 
        padding: "10px 20px", 
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
            { value: "TASK", label: "任务" },
            { value: "BUG", label: "工作项" },
          ]}
        />

        <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />

        <Button
          size="small"
          type={showExternal ? "primary" : "default"}
          ghost={showExternal}
          onClick={() => setShowExternal(!showExternal)}
        >
          显示外部依赖
        </Button>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <Button 
            size="small" 
            type="text" 
            icon={<ZoomOutOutlined />}
            onClick={() => setZoom(prev => Math.max(0.3, prev - 0.1))}
          />
          <Text style={{ fontSize: 11, color: "#64748b", minWidth: 40, textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </Text>
          <Button 
            size="small" 
            type="text" 
            icon={<ZoomInOutlined />}
            onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
          />
          
          <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
          
          <Button size="small" type="text" onClick={resetView}>
            重置视图
          </Button>
          
          <Button 
            size="small" 
            type="text" 
            icon={<ReloadOutlined />}
            onClick={loadData}
          />
        </div>
      </div>

      {/* 图表区域 */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          overflow: "hidden",
          position: "relative",
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          cursor: isDragging.current ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {allNodes.length === 0 ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Empty description="暂无任务或工作项" />
          </div>
        ) : (
          <>
            {/* 无依赖关系提示 */}
            {filteredEdges.length === 0 && (
              <div style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                background: "rgba(255, 255, 255, 0.95)",
                padding: "8px 16px",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <InfoCircleOutlined style={{ color: "#7c7cff" }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  共 {allNodes.length} 个节点，它们之间没有依赖关系
                </Text>
              </div>
            )}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: canvasSize.width * zoom,
                height: canvasSize.height * zoom,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
              }}
            >
              <svg
              width={canvasSize.width}
              height={canvasSize.height}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "0 0",
              }}
            >
              {/* 箭头标记 */}
              <defs>
                <marker id="arrow-normal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                </marker>
                <marker id="arrow-blocking" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
                <marker id="arrow-external" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
                </marker>
                <marker id="arrow-highlighted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c7cff" />
                </marker>
              </defs>
              
              {/* 网格背景 */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* 边 */}
              <g className="edges">
                {filteredEdges.map(edge => renderEdge(edge))}
              </g>
              
              {/* 节点 */}
              <g className="nodes">
                {allNodes.map(node => renderNode(node))}
              </g>
            </svg>
            </div>
          </>
        )}
      </div>

      {/* 底部图例 */}
      <div style={{
        padding: "8px 20px",
        borderTop: "1px solid #e2e8f0",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexShrink: 0,
        fontSize: 11,
        color: "#64748b",
      }}>
        <Space size={12}>
          <span style={{ fontWeight: 500 }}>节点状态:</span>
          <Space size={4}>
            <div style={{ width: 12, height: 12, borderRadius: 2, border: "2px solid #10b981" }} />
            <span>已完成</span>
          </Space>
          <Space size={4}>
            <div style={{ width: 12, height: 12, borderRadius: 2, border: "2px solid #f59e0b" }} />
            <span>被阻塞</span>
          </Space>
          <Space size={4}>
            <div style={{ width: 12, height: 12, borderRadius: 2, border: "2px solid #ef4444" }} />
            <span>阻塞中</span>
          </Space>
          <Space size={4}>
            <div style={{ width: 12, height: 12, borderRadius: 2, border: "2px solid #a855f7" }} />
            <span>外部</span>
          </Space>
        </Space>

        <div style={{ width: 1, height: 14, background: "#e2e8f0" }} />

        <Space size={12}>
          <span style={{ fontWeight: 500 }}>依赖线:</span>
          <Space size={4}>
            <div style={{ width: 20, height: 2, background: "#cbd5e1" }} />
            <span>正常</span>
          </Space>
          <Space size={4}>
            <div style={{ width: 20, height: 2, background: "#fca5a5" }} />
            <span>阻塞</span>
          </Space>
          <Space size={4}>
            <div style={{ width: 20, height: 2, background: "#d8b4fe" }} />
            <span>外部</span>
          </Space>
        </Space>

        <div style={{ marginLeft: "auto", color: "#94a3b8" }}>
          拖拽平移 | 滚轮缩放 | 点击节点高亮相关依赖
        </div>
      </div>
    </div>
  )
}
