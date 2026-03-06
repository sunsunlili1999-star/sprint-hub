import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

// GET /api/workitems/[workItemId] - 获取工作项详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workItemId: string }> }
) {
  try {
    const { workItemId } = await params

    const workItem = await prisma.workItem.findUnique({
      where: { id: workItemId },
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

    if (!workItem) {
      return NextResponse.json({ error: "工作项不存在" }, { status: 404 })
    }

    // 格式化返回数据
    const result = {
      id: workItem.id,
      title: workItem.title,
      description: workItem.description,
      priority: workItem.priority,
      status: workItem.devStatus,
      currentPhase: workItem.currentPhase,
      
      // 父级任务
      parentId: workItem.parentId,
      parentTitle: workItem.parent?.title || null,
      
      // 关联信息
      productId: workItem.productId,
      productName: workItem.product?.name || null,
      projectId: workItem.projectId,
      projectName: workItem.project?.name || null,
      sprintId: workItem.sprintId,
      sprintName: workItem.sprint?.name || null,
      moduleId: workItem.moduleId,
      moduleName: workItem.module?.name || null,
      versionId: workItem.versionId,
      versionName: workItem.version?.name || null,
      
      // 人员
      creator: workItem.creator,
      assignee: workItem.devOwner,
      testOwner: workItem.testOwner,
      verifyOwner: workItem.verifyOwner,
      
      // 时间
      plannedStartDate: workItem.plannedStartDate?.toISOString().split("T")[0] || null,
      plannedEndDate: workItem.plannedEndDate?.toISOString().split("T")[0] || null,
      actualStartDate: workItem.actualStartDate?.toISOString().split("T")[0] || null,
      actualEndDate: workItem.actualEndDate?.toISOString().split("T")[0] || null,
      
      // 工时
      estimatedHours: workItem.estimatedHours,
      actualHours: workItem.actualHours,
      
      // 时间戳
      createdAt: workItem.createdAt.toISOString(),
      updatedAt: workItem.updatedAt.toISOString(),
      
      // 依赖关系
      dependencies: workItem.dependencies.map((dep) => ({
        id: dep.id,
        type: dep.dependencyType,
        workItem: {
          id: dep.dependsOn.id,
          title: dep.dependsOn.title,
          status: dep.dependsOn.devStatus,
        },
      })),
      dependents: workItem.dependents.map((dep) => ({
        id: dep.id,
        type: dep.dependencyType,
        workItem: {
          id: dep.workItem.id,
          title: dep.workItem.title,
          status: dep.workItem.devStatus,
        },
      })),
      
      // 评论
      comments: workItem.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        user: comment.user,
        createdAt: comment.createdAt.toISOString(),
      })),
      
      // 操作记录
      activityLogs: workItem.activityLogs.map((log) => ({
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
    console.error("获取工作项详情失败:", error)
    return NextResponse.json({ error: "获取工作项详情失败" }, { status: 500 })
  }
}

// PUT /api/workitems/[workItemId] - 更新工作项
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workItemId: string }> }
) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { workItemId } = await params
    const body = await request.json()

    // 获取原数据用于记录变更
    const original = await prisma.workItem.findUnique({
      where: { id: workItemId },
      include: {
        devOwner: { select: { name: true } },
      },
    })

    if (!original) {
      return NextResponse.json({ error: "工作项不存在" }, { status: 404 })
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

    // 如果指定了父级任务，验证其存在且为 TASK 类型
    if (parentId !== undefined && parentId !== null) {
      const parent = await prisma.workItem.findUnique({
        where: { id: parentId },
        select: { id: true, type: true },
      })
      if (!parent) {
        return NextResponse.json({ error: "父级任务不存在" }, { status: 400 })
      }
      if (parent.type !== "TASK") {
        return NextResponse.json({ error: "工作项只能属于任务" }, { status: 400 })
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

    // 更新工作项
    const updated = await prisma.workItem.update({
      where: { id: workItemId },
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
          workItemId: workItemId,
          userId: currentUserId,
          ...log,
        })),
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("更新工作项失败:", error)
    return NextResponse.json({ error: "更新工作项失败" }, { status: 500 })
  }
}

// DELETE /api/workitems/[workItemId] - 删除工作项
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workItemId: string }> }
) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { workItemId } = await params

    await prisma.workItem.delete({
      where: { id: workItemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除工作项失败:", error)
    return NextResponse.json({ error: "删除工作项失败" }, { status: 500 })
  }
}
