import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

// GET /api/tasks/[taskId] - 获取任务详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params

    const task = await prisma.workItem.findUnique({
      where: { id: taskId, type: "TASK" },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        devOwner: { select: { id: true, name: true, avatar: true } },
        testOwner: { select: { id: true, name: true, avatar: true } },
        verifyOwner: { select: { id: true, name: true, avatar: true } },
        product: { select: { id: true, name: true, code: true } },
        project: { select: { id: true, name: true, code: true } },
        sprint: { select: { id: true, name: true } },
        version: { select: { id: true, name: true } },
        module: { select: { id: true, name: true } },
        parent: { select: { id: true, title: true } },
        // 子工作项
        children: {
          select: {
            id: true,
            type: true,
            title: true,
            priority: true,
            devStatus: true,
            devOwner: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        // 依赖关系
        dependencies: {
          include: {
            dependsOn: {
              select: { id: true, title: true, devStatus: true },
            },
          },
        },
        dependents: {
          include: {
            workItem: {
              select: { id: true, title: true, devStatus: true },
            },
          },
        },
        // 评论
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        // 操作记录
        activityLogs: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 })
    }

    // 计算进度
    const childCount = task.children.length
    const completedChildCount = task.children.filter(
      (c) => c.devStatus === "COMPLETED"
    ).length
    const progress = childCount > 0 ? Math.round((completedChildCount / childCount) * 100) : 0

    // 格式化返回数据
    const result = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.devStatus,
      currentPhase: task.currentPhase,
      
      // 父级需求
      parentId: task.parentId,
      parentTitle: task.parent?.title || null,
      
      // 关联信息
      productId: task.productId,
      productName: task.product?.name || null,
      projectId: task.projectId,
      projectName: task.project?.name || null,
      sprintId: task.sprintId,
      sprintName: task.sprint?.name || null,
      moduleId: task.moduleId,
      moduleName: task.module?.name || null,
      versionId: task.versionId,
      versionName: task.version?.name || null,
      
      // 人员
      creator: task.creator,
      assignee: task.devOwner,
      testOwner: task.testOwner,
      verifyOwner: task.verifyOwner,
      
      // 时间
      plannedStartDate: task.plannedStartDate?.toISOString().split("T")[0] || null,
      plannedEndDate: task.plannedEndDate?.toISOString().split("T")[0] || null,
      actualStartDate: task.actualStartDate?.toISOString().split("T")[0] || null,
      actualEndDate: task.actualEndDate?.toISOString().split("T")[0] || null,
      
      // 工时
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      
      // 进度
      progress,
      childCount,
      completedChildCount,
      
      // 时间戳
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      
      // 子工作项
      children: task.children.map((child) => ({
        id: child.id,
        type: child.type,
        title: child.title,
        priority: child.priority,
        status: child.devStatus,
        assignee: child.devOwner,
      })),
      
      // 依赖关系
      dependencies: task.dependencies.map((dep) => ({
        id: dep.id,
        type: dep.dependencyType,
        workItem: {
          id: dep.dependsOn.id,
          title: dep.dependsOn.title,
          status: dep.dependsOn.devStatus,
        },
      })),
      dependents: task.dependents.map((dep) => ({
        id: dep.id,
        type: dep.dependencyType,
        workItem: {
          id: dep.workItem.id,
          title: dep.workItem.title,
          status: dep.workItem.devStatus,
        },
      })),
      
      // 评论
      comments: task.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        user: comment.user,
        createdAt: comment.createdAt.toISOString(),
      })),
      
      // 操作记录
      activityLogs: task.activityLogs.map((log) => ({
        id: log.id,
        action: log.action,
        oldValue: log.oldValue,
        newValue: log.newValue,
        user: log.user,
        createdAt: log.createdAt.toISOString(),
      })),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取任务详情失败:", error)
    return NextResponse.json({ error: "获取任务详情失败" }, { status: 500 })
  }
}

// PUT /api/tasks/[taskId] - 更新任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { taskId } = await params
    const body = await request.json()

    // 获取原数据用于记录变更
    const original = await prisma.workItem.findUnique({
      where: { id: taskId },
      include: {
        devOwner: { select: { name: true } },
      },
    })

    if (!original) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 })
    }

    const {
      title,
      description,
      priority,
      status,
      parentId,
      productId,
      projectId,
      sprintId,
      versionId,
      moduleId,
      devOwnerId,
      plannedStartDate,
      plannedEndDate,
      estimatedHours,
    } = body

    // 如果指定了父级需求，验证其存在且为 REQUIREMENT 类型
    if (parentId !== undefined && parentId !== null) {
      const parent = await prisma.workItem.findUnique({
        where: { id: parentId },
        select: { id: true, type: true },
      })
      if (!parent) {
        return NextResponse.json({ error: "父级需求不存在" }, { status: 400 })
      }
      if (parent.type !== "REQUIREMENT") {
        return NextResponse.json({ error: "任务只能属于需求" }, { status: 400 })
      }
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {}
    const activityLogs: { action: string; oldValue: string | null; newValue: string | null }[] = []

    if (title !== undefined && title !== original.title) {
      updateData.title = title
      activityLogs.push({ action: "修改标题", oldValue: original.title, newValue: title })
    }

    if (description !== undefined && description !== original.description) {
      updateData.description = description
      activityLogs.push({ action: "修改描述", oldValue: null, newValue: null })
    }

    if (priority !== undefined && priority !== original.priority) {
      updateData.priority = priority
      activityLogs.push({ action: "修改优先级", oldValue: original.priority, newValue: priority })
    }

    if (status !== undefined && status !== original.devStatus) {
      updateData.devStatus = status
      activityLogs.push({ action: "修改状态", oldValue: original.devStatus, newValue: status })
    }

    if (devOwnerId !== undefined) {
      const newOwnerId = devOwnerId || null
      if (newOwnerId !== original.devOwnerId) {
        updateData.devOwnerId = newOwnerId
        // 获取新负责人名称
        let newOwnerName = null
        if (newOwnerId) {
          const newOwner = await prisma.user.findUnique({ 
            where: { id: newOwnerId }, 
            select: { name: true } 
          })
          newOwnerName = newOwner?.name || null
        }
        activityLogs.push({ 
          action: "指派负责人", 
          oldValue: original.devOwner?.name || null, 
          newValue: newOwnerName 
        })
      }
    }

    if (parentId !== undefined) updateData.parentId = parentId || null
    if (productId !== undefined) updateData.productId = productId || null
    if (projectId !== undefined) updateData.projectId = projectId || null
    if (sprintId !== undefined) updateData.sprintId = sprintId || null
    if (versionId !== undefined) updateData.versionId = versionId || null
    if (moduleId !== undefined) updateData.moduleId = moduleId || null

    if (plannedStartDate !== undefined) {
      updateData.plannedStartDate = plannedStartDate ? new Date(plannedStartDate) : null
    }
    if (plannedEndDate !== undefined) {
      updateData.plannedEndDate = plannedEndDate ? new Date(plannedEndDate) : null
    }
    if (estimatedHours !== undefined) {
      updateData.estimatedHours = estimatedHours ? parseFloat(estimatedHours) : null
    }

    // 更新任务
    const updated = await prisma.workItem.update({
      where: { id: taskId },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        devOwner: { select: { id: true, name: true, avatar: true } },
        product: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true } },
        version: { select: { id: true, name: true } },
        module: { select: { id: true, name: true } },
        parent: { select: { id: true, title: true } },
      },
    })

    // 批量创建操作记录
    if (activityLogs.length > 0) {
      await prisma.activityLog.createMany({
        data: activityLogs.map((log) => ({
          workItemId: taskId,
          userId: currentUserId,
          ...log,
        })),
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("更新任务失败:", error)
    return NextResponse.json({ error: "更新任务失败" }, { status: 500 })
  }
}

// DELETE /api/tasks/[taskId] - 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { taskId } = await params

    await prisma.workItem.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除任务失败:", error)
    return NextResponse.json({ error: "删除任务失败" }, { status: 500 })
  }
}
