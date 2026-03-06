import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ projectId: string; sprintId: string }>
}

// 格式化单个工作项
function formatWorkItem(item: any, childCount = 0, completedChildCount = 0) {
  const progress = childCount > 0 
    ? Math.round((completedChildCount / childCount) * 100)
    : (item.devStatus === "COMPLETED" ? 100 : item.devStatus === "IN_PROGRESS" ? 50 : 0)

  return {
    id: item.id,
    title: item.title,
    type: item.type,
    priority: item.priority,
    status: item.devStatus,
    plannedStartDate: item.plannedStartDate?.toISOString().split("T")[0] || null,
    plannedEndDate: item.plannedEndDate?.toISOString().split("T")[0] || null,
    actualStartDate: item.actualStartDate?.toISOString().split("T")[0] || null,
    actualEndDate: item.actualEndDate?.toISOString().split("T")[0] || null,
    estimatedHours: item.estimatedHours,
    actualHours: item.actualHours,
    assignee: item.devOwner,
    creator: item.creator,
    module: item.module,
    parentId: item.parentId,
    childCount,
    completedChildCount,
    progress,
    createdAt: item.createdAt.toISOString().split("T")[0],
    updatedAt: item.updatedAt.toISOString().split("T")[0],
  }
}

// GET /api/projects/[projectId]/sprints/[sprintId]/timeline - 获取迭代时间轴（甘特图数据，树形结构）
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
        goal: true,
      },
    })

    if (!sprint) {
      return NextResponse.json({ error: "迭代不存在" }, { status: 404 })
    }

    // 获取迭代中的所有需求（顶层）
    const requirements = await prisma.workItem.findMany({
      where: { 
        sprintId,
        type: "REQUIREMENT",
      },
      include: {
        devOwner: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        module: { select: { id: true, name: true } },
        // 获取子任务
        children: {
          where: { type: "TASK" },
          include: {
            devOwner: { select: { id: true, name: true, avatar: true } },
            creator: { select: { id: true, name: true, avatar: true } },
            module: { select: { id: true, name: true } },
            // 获取工作项（任务的子项）
            children: {
              where: { type: "BUG" }, // 工作项可能是 BUG 类型或其他
              include: {
                devOwner: { select: { id: true, name: true, avatar: true } },
                creator: { select: { id: true, name: true, avatar: true } },
                module: { select: { id: true, name: true } },
              },
              orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
            },
          },
          orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    })

    // 获取迭代中的独立任务（没有父需求的任务）
    const standaloneTasks = await prisma.workItem.findMany({
      where: { 
        sprintId,
        type: "TASK",
        parentId: null,
      },
      include: {
        devOwner: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        module: { select: { id: true, name: true } },
        // 获取子工作项
        children: {
          include: {
            devOwner: { select: { id: true, name: true, avatar: true } },
            creator: { select: { id: true, name: true, avatar: true } },
            module: { select: { id: true, name: true } },
          },
          orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    })

    // 获取迭代中的独立工作项（没有父任务的工作项/缺陷）
    const standaloneWorkItems = await prisma.workItem.findMany({
      where: { 
        sprintId,
        type: "BUG",
        parentId: null,
      },
      include: {
        devOwner: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        module: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    })

    // 构建树形结构
    type TreeItem = ReturnType<typeof formatWorkItem> & { 
      children?: TreeItem[]
      level: number 
    }
    
    const treeData: TreeItem[] = []

    // 添加需求及其子任务和工作项
    requirements.forEach(req => {
      const reqChildren = req.children || []
      const completedTasks = reqChildren.filter(t => t.devStatus === "COMPLETED").length
      
      const reqItem: TreeItem = {
        ...formatWorkItem(req, reqChildren.length, completedTasks),
        level: 0,
        children: [],
      }

      // 添加子任务
      reqChildren.forEach(task => {
        const taskChildren = task.children || []
        const completedWorkItems = taskChildren.filter(w => w.devStatus === "COMPLETED").length
        
        const taskItem: TreeItem = {
          ...formatWorkItem(task, taskChildren.length, completedWorkItems),
          level: 1,
          children: [],
        }

        // 添加工作项
        taskChildren.forEach(workItem => {
          taskItem.children!.push({
            ...formatWorkItem(workItem),
            level: 2,
          })
        })

        reqItem.children!.push(taskItem)
      })

      treeData.push(reqItem)
    })

    // 添加独立任务及其工作项
    standaloneTasks.forEach(task => {
      const taskChildren = task.children || []
      const completedWorkItems = taskChildren.filter(w => w.devStatus === "COMPLETED").length
      
      const taskItem: TreeItem = {
        ...formatWorkItem(task, taskChildren.length, completedWorkItems),
        level: 0,
        children: [],
      }

      // 添加工作项
      taskChildren.forEach(workItem => {
        taskItem.children!.push({
          ...formatWorkItem(workItem),
          level: 1,
        })
      })

      treeData.push(taskItem)
    })

    // 添加独立工作项/缺陷
    standaloneWorkItems.forEach(workItem => {
      treeData.push({
        ...formatWorkItem(workItem),
        level: 0,
      })
    })

    // 展平树形数据为列表（用于渲染）
    type FlatItem = Omit<TreeItem, 'children'> & { 
      hasChildren: boolean
      isLastChild: boolean
      parentIds: string[]
    }
    
    const flattenTree = (items: TreeItem[], parentIds: string[] = []): FlatItem[] => {
      const result: FlatItem[] = []
      items.forEach((item, index) => {
        const { children, ...rest } = item
        const isLastChild = index === items.length - 1
        result.push({
          ...rest,
          hasChildren: (children?.length || 0) > 0,
          isLastChild,
          parentIds,
        })
        if (children && children.length > 0) {
          result.push(...flattenTree(children, [...parentIds, item.id]))
        }
      })
      return result
    }

    const flatData = flattenTree(treeData)

    // 获取所有负责人
    const assigneeMap = new Map<string, { id: string; name: string; avatar: string | null }>()
    flatData.forEach(item => {
      if (item.assignee) {
        assigneeMap.set(item.assignee.id, item.assignee)
      }
    })
    const assignees = Array.from(assigneeMap.values())

    // 统计信息
    const stats = {
      totalItems: flatData.length,
      completedItems: flatData.filter(w => w.status === "COMPLETED").length,
      inProgressItems: flatData.filter(w => w.status === "IN_PROGRESS").length,
      notStartedItems: flatData.filter(w => w.status === "NOT_STARTED").length,
      totalEstimatedHours: flatData.reduce((sum, w) => sum + (w.estimatedHours || 0), 0),
      totalActualHours: flatData.reduce((sum, w) => sum + (w.actualHours || 0), 0),
      requirementCount: flatData.filter(w => w.type === "REQUIREMENT").length,
      taskCount: flatData.filter(w => w.type === "TASK").length,
      workItemCount: flatData.filter(w => w.type === "BUG").length,
    }

    return NextResponse.json({
      sprint: {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        goal: sprint.goal,
        startDate: sprint.startDate.toISOString().split("T")[0],
        endDate: sprint.endDate.toISOString().split("T")[0],
      },
      stats,
      assignees,
      treeData,
      flatData,
    })
  } catch (error) {
    console.error("获取迭代时间轴失败:", error)
    return NextResponse.json({ error: "获取迭代时间轴失败" }, { status: 500 })
  }
}
