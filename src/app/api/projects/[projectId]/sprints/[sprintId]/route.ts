import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ projectId: string; sprintId: string }>
}

// GET /api/projects/[projectId]/sprints/[sprintId] - 获取迭代详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params

    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId, projectId },
      include: {
        workItems: {
          include: {
            creator: {
              select: { id: true, name: true, avatar: true },
            },
            devOwner: {
              select: { id: true, name: true, avatar: true },
            },
            children: {
              select: { id: true, devStatus: true, estimatedHours: true, actualHours: true },
            },
          },
        },
        project: {
          select: { 
            id: true, 
            name: true,
            members: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            },
          },
        },
      },
    })

    if (!sprint) {
      return NextResponse.json({ error: "迭代不存在" }, { status: 404 })
    }

    // 所有工作项统计
    const allWorkItems = sprint.workItems
    const totalWorkItems = allWorkItems.length
    const completedWorkItems = allWorkItems.filter(w => w.devStatus === "COMPLETED").length
    const inProgressWorkItems = allWorkItems.filter(w => w.devStatus === "IN_PROGRESS").length
    const notStartedWorkItems = allWorkItems.filter(w => w.devStatus === "NOT_STARTED").length
    
    // 按类型分类
    const requirements = allWorkItems.filter(w => w.type === "REQUIREMENT")
    const tasks = allWorkItems.filter(w => w.type === "TASK")
    const bugs = allWorkItems.filter(w => w.type === "BUG")
    
    // 计算进度（基于工作项）
    const progress = totalWorkItems > 0 
      ? Math.round((completedWorkItems / totalWorkItems) * 100) 
      : 0

    // 计算工时统计
    const totalEstimatedHours = allWorkItems.reduce((sum, w) => sum + (w.estimatedHours || 0), 0)
    const totalActualHours = allWorkItems.reduce((sum, w) => sum + (w.actualHours || 0), 0)
    const completedEstimatedHours = allWorkItems
      .filter(w => w.devStatus === "COMPLETED")
      .reduce((sum, w) => sum + (w.estimatedHours || 0), 0)

    // 按成员统计工作项和工时
    const memberStatsMap = new Map<string, {
      user: { id: string; name: string; avatar: string | null };
      totalItems: number;
      completedItems: number;
      inProgressItems: number;
      totalHours: number;
      completedHours: number;
      actualHours: number;
    }>()

    // 初始化项目成员
    sprint.project.members.forEach(m => {
      memberStatsMap.set(m.user.id, {
        user: m.user,
        totalItems: 0,
        completedItems: 0,
        inProgressItems: 0,
        totalHours: 0,
        completedHours: 0,
        actualHours: 0,
      })
    })

    // 统计每个成员的工作项
    allWorkItems.forEach(item => {
      if (item.devOwnerId && memberStatsMap.has(item.devOwnerId)) {
        const stats = memberStatsMap.get(item.devOwnerId)!
        stats.totalItems++
        stats.totalHours += item.estimatedHours || 0
        stats.actualHours += item.actualHours || 0
        
        if (item.devStatus === "COMPLETED") {
          stats.completedItems++
          stats.completedHours += item.estimatedHours || 0
        } else if (item.devStatus === "IN_PROGRESS") {
          stats.inProgressItems++
        }
      }
    })

    const memberStats = Array.from(memberStatsMap.values())
      .filter(s => s.totalItems > 0)
      .sort((a, b) => b.totalItems - a.totalItems)

    // 生成燃尽图数据
    const startDate = new Date(sprint.startDate)
    const endDate = new Date(sprint.endDate)
    const today = new Date()
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // 生成燃尽图数据的函数
    const generateBurndownData = (totalWork: number, completedWork: number) => {
      const data: { date: string; ideal: number; actual: number | null }[] = []
      
      for (let i = 0; i <= totalDays; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split("T")[0]
        
        // 理想值：线性下降
        const idealRemaining = totalWork - (totalWork / totalDays) * i
        
        // 实际值：只显示到今天
        let actualRemaining: number | null = null
        if (date <= today) {
          // 简化：使用当前剩余工作量
          actualRemaining = totalWork - completedWork
        }
        
        data.push({
          date: dateStr,
          ideal: Math.max(0, Math.round(idealRemaining * 10) / 10),
          actual: actualRemaining !== null ? Math.max(0, Math.round(actualRemaining * 10) / 10) : null,
        })
      }
      
      return data
    }
    
    // 基于工时的燃尽图
    const burndownByHours = generateBurndownData(totalEstimatedHours, completedEstimatedHours)
    // 基于工作项的燃尽图
    const burndownByItems = generateBurndownData(totalWorkItems, completedWorkItems)

    const result = {
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.startDate.toISOString().split("T")[0],
      endDate: sprint.endDate.toISOString().split("T")[0],
      createdAt: sprint.createdAt.toISOString(),
      project: {
        id: sprint.project.id,
        name: sprint.project.name,
      },
      // 统计数据（以工作项为单位）
      stats: {
        // 工作项总体统计
        totalWorkItems,
        completedWorkItems,
        inProgressWorkItems,
        notStartedWorkItems,
        progress,
        // 按类型统计
        totalRequirements: requirements.length,
        completedRequirements: requirements.filter(r => r.devStatus === "COMPLETED").length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.devStatus === "COMPLETED").length,
        totalBugs: bugs.length,
        completedBugs: bugs.filter(b => b.devStatus === "COMPLETED").length,
        // 工时统计
        totalEstimatedHours,
        totalActualHours,
        completedEstimatedHours,
      },
      // 成员统计
      memberStats,
      // 燃尽图数据（两种维度）
      burndownByHours,
      burndownByItems,
      // 需求列表
      requirements: requirements.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.devStatus,
        estimatedHours: item.estimatedHours,
        actualHours: item.actualHours,
        creator: item.creator,
        assignee: item.devOwner,
        childCount: item.children.length,
        completedChildCount: item.children.filter(c => c.devStatus === "COMPLETED").length,
      })),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取迭代详情失败:", error)
    return NextResponse.json({ error: "获取迭代详情失败" }, { status: 500 })
  }
}

// PUT /api/projects/[projectId]/sprints/[sprintId] - 更新迭代
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params
    const body = await request.json()
    const { name, goal, startDate, endDate, status } = body

    // 验证迭代存在
    const existing = await prisma.sprint.findUnique({
      where: { id: sprintId, projectId },
    })

    if (!existing) {
      return NextResponse.json({ error: "迭代不存在" }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (goal !== undefined) updateData.goal = goal || null
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (status !== undefined) updateData.status = status

    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: updateData,
    })

    return NextResponse.json({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.startDate.toISOString().split("T")[0],
      endDate: sprint.endDate.toISOString().split("T")[0],
    })
  } catch (error) {
    console.error("更新迭代失败:", error)
    return NextResponse.json({ error: "更新迭代失败" }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId]/sprints/[sprintId] - 删除迭代
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params

    // 验证迭代存在
    const existing = await prisma.sprint.findUnique({
      where: { id: sprintId, projectId },
    })

    if (!existing) {
      return NextResponse.json({ error: "迭代不存在" }, { status: 404 })
    }

    // 将迭代下的需求设为未分配
    await prisma.workItem.updateMany({
      where: { sprintId },
      data: { sprintId: null },
    })

    // 删除迭代
    await prisma.sprint.delete({
      where: { id: sprintId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除迭代失败:", error)
    return NextResponse.json({ error: "删除迭代失败" }, { status: 500 })
  }
}
