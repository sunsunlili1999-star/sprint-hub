import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

// GET /api/requirements/[requirementId] - 获取需求详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requirementId: string }> }
) {
  try {
    const { requirementId } = await params

    const requirement = await prisma.workItem.findUnique({
      where: { id: requirementId, type: "REQUIREMENT" },
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

    if (!requirement) {
      return NextResponse.json({ error: "需求不存在" }, { status: 404 })
    }

    // 计算进度
    const childCount = requirement.children.length
    const completedChildCount = requirement.children.filter(
      (c) => c.devStatus === "COMPLETED"
    ).length
    const progress = childCount > 0 ? Math.round((completedChildCount / childCount) * 100) : 0

    // 格式化返回数据
    const result = {
      id: requirement.id,
      title: requirement.title,
      description: requirement.description,
      priority: requirement.priority,
      status: requirement.devStatus,
      requirementType: requirement.requirementType,
      currentPhase: requirement.currentPhase,
      
      // 关联信息
      productId: requirement.productId,
      productName: requirement.product?.name || null,
      projectId: requirement.projectId,
      projectName: requirement.project?.name || null,
      sprintId: requirement.sprintId,
      sprintName: requirement.sprint?.name || null,
      moduleId: requirement.moduleId,
      moduleName: requirement.module?.name || null,
      versionId: requirement.versionId,
      versionName: requirement.version?.name || null,
      
      // 人员
      creator: requirement.creator,
      assignee: requirement.devOwner,
      testOwner: requirement.testOwner,
      verifyOwner: requirement.verifyOwner,
      
      // 时间
      plannedStartDate: requirement.plannedStartDate?.toISOString().split("T")[0] || null,
      plannedEndDate: requirement.plannedEndDate?.toISOString().split("T")[0] || null,
      actualStartDate: requirement.actualStartDate?.toISOString().split("T")[0] || null,
      actualEndDate: requirement.actualEndDate?.toISOString().split("T")[0] || null,
      
      // 工时
      estimatedHours: requirement.estimatedHours,
      actualHours: requirement.actualHours,
      
      // 进度
      progress,
      childCount,
      completedChildCount,
      
      // 时间戳
      createdAt: requirement.createdAt.toISOString(),
      updatedAt: requirement.updatedAt.toISOString(),
      
      // 子工作项
      children: requirement.children.map((child) => ({
        id: child.id,
        type: child.type,
        title: child.title,
        priority: child.priority,
        status: child.devStatus,
        assignee: child.devOwner,
      })),
      
      // 依赖关系
      dependencies: requirement.dependencies.map((dep) => ({
        id: dep.id,
        type: dep.dependencyType,
        workItem: {
          id: dep.dependsOn.id,
          title: dep.dependsOn.title,
          status: dep.dependsOn.devStatus,
        },
      })),
      dependents: requirement.dependents.map((dep) => ({
        id: dep.id,
        type: dep.dependencyType,
        workItem: {
          id: dep.workItem.id,
          title: dep.workItem.title,
          status: dep.workItem.devStatus,
        },
      })),
      
      // 评论
      comments: requirement.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        user: comment.user,
        createdAt: comment.createdAt.toISOString(),
      })),
      
      // 操作记录
      activityLogs: requirement.activityLogs.map((log) => ({
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
    console.error("获取需求详情失败:", error)
    return NextResponse.json({ error: "获取需求详情失败" }, { status: 500 })
  }
}

// PUT /api/requirements/[requirementId] - 更新需求
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requirementId: string }> }
) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { requirementId } = await params
    const body = await request.json()

    // 获取原数据用于记录变更
    const original = await prisma.workItem.findUnique({
      where: { id: requirementId },
      include: {
        devOwner: { select: { name: true } },
      },
    })

    if (!original) {
      return NextResponse.json({ error: "需求不存在" }, { status: 404 })
    }

    const {
      title,
      description,
      priority,
      status,
      requirementType,
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

    if (requirementType !== undefined && requirementType !== original.requirementType) {
      updateData.requirementType = requirementType || null
      activityLogs.push({ 
        action: "修改需求类型", 
        oldValue: original.requirementType, 
        newValue: requirementType 
      })
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

    // 更新需求
    const updated = await prisma.workItem.update({
      where: { id: requirementId },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        devOwner: { select: { id: true, name: true, avatar: true } },
        product: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true } },
        version: { select: { id: true, name: true } },
        module: { select: { id: true, name: true } },
      },
    })

    // 如果需求同时关联了产品和项目，自动建立项目-产品关联
    const finalProductId = updateData.productId !== undefined ? updateData.productId : original.productId
    const finalProjectId = updateData.projectId !== undefined ? updateData.projectId : original.projectId
    
    if (finalProductId && finalProjectId) {
      // 检查项目是否已关联该产品
      const existingLink = await prisma.projectProduct.findUnique({
        where: {
          projectId_productId: {
            projectId: finalProjectId as string,
            productId: finalProductId as string,
          },
        },
      })
      // 如果没有关联，则创建关联
      if (!existingLink) {
        await prisma.projectProduct.create({
          data: {
            projectId: finalProjectId as string,
            productId: finalProductId as string,
          },
        })
      }
    }

    // 批量创建操作记录
    if (activityLogs.length > 0) {
      await prisma.activityLog.createMany({
        data: activityLogs.map((log) => ({
          workItemId: requirementId,
          userId: currentUserId,
          ...log,
        })),
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("更新需求失败:", error)
    return NextResponse.json({ error: "更新需求失败" }, { status: 500 })
  }
}

// DELETE /api/requirements/[requirementId] - 删除需求
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requirementId: string }> }
) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { requirementId } = await params

    await prisma.workItem.delete({
      where: { id: requirementId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除需求失败:", error)
    return NextResponse.json({ error: "删除需求失败" }, { status: 500 })
  }
}
