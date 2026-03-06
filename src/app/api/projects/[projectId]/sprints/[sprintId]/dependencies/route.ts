import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ projectId: string; sprintId: string }>
}

// GET /api/projects/[projectId]/sprints/[sprintId]/dependencies - 获取迭代依赖关系图数据
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params

    // 获取迭代基本信息
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId, projectId },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    })

    if (!sprint) {
      return NextResponse.json({ error: "迭代不存在" }, { status: 404 })
    }

    // 获取迭代中的任务和工作项（排除需求）
    const workItems = await prisma.workItem.findMany({
      where: { 
        sprintId,
        type: { in: ['TASK', 'BUG'] }  // 只获取任务和工作项/缺陷
      },
      include: {
        devOwner: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        module: { select: { id: true, name: true } },
        parent: { select: { id: true, title: true, type: true } },
        // 获取依赖关系
        dependencies: {
          include: {
            dependsOn: {
              select: { 
                id: true, 
                title: true, 
                type: true,
                devStatus: true,
                priority: true,
                sprintId: true,
              },
            },
          },
        },
        dependents: {
          include: {
            workItem: {
              select: { 
                id: true, 
                title: true, 
                type: true,
                devStatus: true,
                priority: true,
                sprintId: true,
              },
            },
          },
        },
      },
      orderBy: [
        { type: "asc" },
        { priority: "asc" },
        { createdAt: "asc" },
      ],
    })

    // 构建节点数据
    const nodes = workItems.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      priority: item.priority,
      status: item.devStatus,
      estimatedHours: item.estimatedHours,
      actualHours: item.actualHours,
      assignee: item.devOwner,
      module: item.module,
      parent: item.parent,
      // 依赖数量统计
      dependencyCount: item.dependencies.length,
      dependentCount: item.dependents.length,
      // 是否有阻塞（依赖的工作项未完成）
      isBlocked: item.dependencies.some(d => d.dependsOn.devStatus !== "COMPLETED"),
      // 是否阻塞其他（被依赖且自己未完成）
      isBlocking: item.devStatus !== "COMPLETED" && item.dependents.length > 0,
    }))

    // 构建边数据（依赖关系）
    type Edge = {
      id: string
      source: string
      target: string
      type: string
      sourceInSprint: boolean
      targetInSprint: boolean
      isBlocking: boolean // 是否阻塞（source 未完成）
    }
    
    const edges: Edge[] = []
    const edgeSet = new Set<string>() // 用于去重
    
    workItems.forEach(item => {
      // 处理当前工作项依赖的工作项
      item.dependencies.forEach(dep => {
        const edgeKey = `${dep.dependsOnId}->${item.id}`
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey)
          edges.push({
            id: dep.id,
            source: dep.dependsOnId,  // 被依赖的工作项
            target: item.id,           // 当前工作项
            type: dep.dependencyType,
            sourceInSprint: dep.dependsOn.sprintId === sprintId,
            targetInSprint: true,
            isBlocking: dep.dependsOn.devStatus !== "COMPLETED",
          })
        }
      })
    })

    // 获取迭代外被依赖的工作项（作为外部节点）
    const externalNodeIds = new Set<string>()
    edges.forEach(edge => {
      if (!edge.sourceInSprint) {
        externalNodeIds.add(edge.source)
      }
    })

    const externalNodes = externalNodeIds.size > 0 
      ? await prisma.workItem.findMany({
          where: { id: { in: Array.from(externalNodeIds) } },
          include: {
            devOwner: { select: { id: true, name: true, avatar: true } },
            sprint: { select: { id: true, name: true } },
          },
        })
      : []

    const externalNodesFormatted = externalNodes.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      priority: item.priority,
      status: item.devStatus,
      estimatedHours: item.estimatedHours,
      actualHours: item.actualHours,
      assignee: item.devOwner,
      sprint: item.sprint,
      isExternal: true,
    }))

    // 统计信息
    const stats = {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      blockedItems: nodes.filter(n => n.isBlocked).length,
      blockingItems: nodes.filter(n => n.isBlocking).length,
      externalDependencies: externalNodesFormatted.length,
      // 按类型统计
      requirementCount: nodes.filter(n => n.type === "REQUIREMENT").length,
      taskCount: nodes.filter(n => n.type === "TASK").length,
      bugCount: nodes.filter(n => n.type === "BUG").length,
      // 依赖链深度（简化计算）
      maxDependencyDepth: calculateMaxDepth(nodes, edges),
    }

    // 检测循环依赖
    const cycles = detectCycles(nodes.map(n => n.id), edges)

    return NextResponse.json({
      sprint: {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.startDate.toISOString().split("T")[0],
        endDate: sprint.endDate.toISOString().split("T")[0],
      },
      stats,
      nodes,
      externalNodes: externalNodesFormatted,
      edges,
      cycles,
    })
  } catch (error) {
    console.error("获取迭代依赖关系失败:", error)
    return NextResponse.json({ error: "获取迭代依赖关系失败" }, { status: 500 })
  }
}

// 计算最大依赖深度
function calculateMaxDepth(
  nodes: { id: string }[], 
  edges: { source: string; target: string }[]
): number {
  const nodeIds = new Set(nodes.map(n => n.id))
  const inDegree = new Map<string, number>()
  const adjList = new Map<string, string[]>()
  
  // 初始化
  nodeIds.forEach(id => {
    inDegree.set(id, 0)
    adjList.set(id, [])
  })
  
  // 构建邻接表和入度
  edges.forEach(edge => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjList.get(edge.source)!.push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    }
  })
  
  // 找到所有入度为 0 的节点（起始节点）
  const queue: { id: string; depth: number }[] = []
  nodeIds.forEach(id => {
    if (inDegree.get(id) === 0) {
      queue.push({ id, depth: 0 })
    }
  })
  
  let maxDepth = 0
  const visited = new Set<string>()
  
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    
    maxDepth = Math.max(maxDepth, depth)
    
    const neighbors = adjList.get(id) || []
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        queue.push({ id: neighbor, depth: depth + 1 })
      }
    })
  }
  
  return maxDepth
}

// 检测循环依赖
function detectCycles(
  nodeIds: string[], 
  edges: { source: string; target: string }[]
): string[][] {
  const adjList = new Map<string, string[]>()
  const nodeSet = new Set(nodeIds)
  
  // 初始化邻接表
  nodeIds.forEach(id => adjList.set(id, []))
  
  // 构建邻接表
  edges.forEach(edge => {
    if (nodeSet.has(edge.source) && nodeSet.has(edge.target)) {
      adjList.get(edge.source)!.push(edge.target)
    }
  })
  
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recStack = new Set<string>()
  const path: string[] = []
  
  function dfs(node: string): boolean {
    visited.add(node)
    recStack.add(node)
    path.push(node)
    
    const neighbors = adjList.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recStack.has(neighbor)) {
        // 找到循环
        const cycleStart = path.indexOf(neighbor)
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), neighbor])
        }
      }
    }
    
    path.pop()
    recStack.delete(node)
    return false
  }
  
  nodeIds.forEach(id => {
    if (!visited.has(id)) {
      dfs(id)
    }
  })
  
  return cycles
}
