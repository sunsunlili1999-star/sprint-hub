import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ releaseId: string }>
}

// GET /api/releases/[releaseId] - 获取发布详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { releaseId } = await params

    const release = await prisma.release.findUnique({
      where: { id: releaseId },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        owner: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        items: {
          include: {
            workItem: {
              select: {
                id: true,
                title: true,
                type: true,
                priority: true,
                description: true,
                devStatus: true,
                testStatus: true,
                verifyStatus: true,
                currentPhase: true,
                plannedStartDate: true,
                plannedEndDate: true,
                actualStartDate: true,
                actualEndDate: true,
                estimatedHours: true,
                actualHours: true,
                devOwner: { select: { id: true, name: true, avatar: true } },
                testOwner: { select: { id: true, name: true, avatar: true } },
                product: { select: { id: true, name: true } },
                module: { select: { id: true, name: true } },
                sprint: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        logs: {
          include: {
            createdBy: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!release) {
      return NextResponse.json({ error: "发布不存在" }, { status: 404 })
    }

    // 计算统计信息
    const totalItems = release.items.length
    const completedItems = release.items.filter(
      (item) =>
        item.workItem.verifyStatus === "COMPLETED" ||
        (item.workItem.devStatus === "COMPLETED" && item.workItem.testStatus === "COMPLETED")
    ).length
    const inProgressItems = release.items.filter(
      (item) =>
        item.workItem.devStatus === "IN_PROGRESS" ||
        item.workItem.testStatus === "IN_PROGRESS" ||
        item.workItem.verifyStatus === "IN_PROGRESS"
    ).length

    // 按状态分组
    const byStatus = {
      notStarted: release.items.filter((i) => i.workItem.devStatus === "NOT_STARTED").length,
      inDevelopment: release.items.filter((i) => i.workItem.devStatus === "IN_PROGRESS").length,
      devCompleted: release.items.filter(
        (i) => i.workItem.devStatus === "COMPLETED" && i.workItem.testStatus !== "COMPLETED"
      ).length,
      inTesting: release.items.filter((i) => i.workItem.testStatus === "IN_PROGRESS").length,
      testCompleted: release.items.filter(
        (i) => i.workItem.testStatus === "COMPLETED" && i.workItem.verifyStatus !== "COMPLETED"
      ).length,
      verified: release.items.filter((i) => i.workItem.verifyStatus === "COMPLETED").length,
    }

    // 按优先级分组
    const byPriority = {
      P0: release.items.filter((i) => i.workItem.priority === "P0").length,
      P1: release.items.filter((i) => i.workItem.priority === "P1").length,
      P2: release.items.filter((i) => i.workItem.priority === "P2").length,
      P3: release.items.filter((i) => i.workItem.priority === "P3").length,
      P4: release.items.filter((i) => i.workItem.priority === "P4").length,
    }

    // 工时统计
    const totalEstimatedHours = release.items.reduce(
      (sum, i) => sum + (i.workItem.estimatedHours || 0),
      0
    )
    const totalActualHours = release.items.reduce(
      (sum, i) => sum + (i.workItem.actualHours || 0),
      0
    )

    return NextResponse.json({
      id: release.id,
      name: release.name,
      description: release.description,
      plannedDate: release.plannedDate.toISOString(),
      actualDate: release.actualDate?.toISOString() || null,
      status: release.status,
      riskLevel: release.riskLevel,
      riskDescription: release.riskDescription,
      aiRiskScore: release.aiRiskScore,
      aiRiskAnalysis: release.aiRiskAnalysis,
      project: release.project,
      owner: release.owner,
      creator: release.creator,
      createdAt: release.createdAt.toISOString(),
      updatedAt: release.updatedAt.toISOString(),
      // 统计
      stats: {
        totalItems,
        completedItems,
        inProgressItems,
        notStartedItems: totalItems - completedItems - inProgressItems,
        progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        byStatus,
        byPriority,
        totalEstimatedHours,
        totalActualHours,
      },
      // 需求列表
      items: release.items.map((item) => ({
        id: item.workItem.id,
        title: item.workItem.title,
        type: item.workItem.type,
        priority: item.workItem.priority,
        description: item.workItem.description,
        devStatus: item.workItem.devStatus,
        testStatus: item.workItem.testStatus,
        verifyStatus: item.workItem.verifyStatus,
        currentPhase: item.workItem.currentPhase,
        plannedStartDate: item.workItem.plannedStartDate?.toISOString() || null,
        plannedEndDate: item.workItem.plannedEndDate?.toISOString() || null,
        actualStartDate: item.workItem.actualStartDate?.toISOString() || null,
        actualEndDate: item.workItem.actualEndDate?.toISOString() || null,
        estimatedHours: item.workItem.estimatedHours,
        actualHours: item.workItem.actualHours,
        devOwner: item.workItem.devOwner,
        testOwner: item.workItem.testOwner,
        product: item.workItem.product,
        module: item.workItem.module,
        sprint: item.workItem.sprint,
        addedAt: item.createdAt.toISOString(),
      })),
      // 发布日志
      logs: release.logs.map((log) => ({
        id: log.id,
        action: log.action,
        description: log.description,
        snapshot: log.snapshot,
        createdBy: log.createdBy,
        createdAt: log.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("获取发布详情失败:", error)
    return NextResponse.json({ error: "获取发布详情失败" }, { status: 500 })
  }
}

// PUT /api/releases/[releaseId] - 更新发布
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { releaseId } = await params
    const body = await request.json()
    const { name, description, plannedDate, ownerId, riskLevel, riskDescription, status } = body

    const userId = session.user.id as string

    // 获取原发布信息
    const existingRelease = await prisma.release.findUnique({
      where: { id: releaseId },
    })

    if (!existingRelease) {
      return NextResponse.json({ error: "发布不存在" }, { status: 404 })
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {}
    const changes: string[] = []

    if (name !== undefined && name !== existingRelease.name) {
      updateData.name = name
      changes.push(`名称: ${existingRelease.name} -> ${name}`)
    }
    if (description !== undefined) {
      updateData.description = description
    }
    if (plannedDate !== undefined) {
      updateData.plannedDate = new Date(plannedDate)
      changes.push(`计划日期变更`)
    }
    if (ownerId !== undefined) {
      updateData.ownerId = ownerId
    }
    if (riskLevel !== undefined) {
      updateData.riskLevel = riskLevel
      changes.push(`风险等级: ${existingRelease.riskLevel} -> ${riskLevel}`)
    }
    if (riskDescription !== undefined) {
      updateData.riskDescription = riskDescription
    }

    // 状态变更特殊处理
    let logAction = "UPDATED"
    if (status !== undefined && status !== existingRelease.status) {
      updateData.status = status
      changes.push(`状态: ${existingRelease.status} -> ${status}`)
      logAction = "STATUS_CHANGED"

      // 如果状态变为完成，记录实际完成时间
      if (status === "COMPLETED") {
        updateData.actualDate = new Date()
        logAction = "COMPLETED"
      }
      if (status === "CANCELLED") {
        logAction = "CANCELLED"
      }
    }

    // 更新发布
    const release = await prisma.release.update({
      where: { id: releaseId },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, code: true } },
        owner: { select: { id: true, name: true, avatar: true } },
      },
    })

    // 记录日志
    if (changes.length > 0) {
      await prisma.releaseLog.create({
        data: {
          releaseId,
          action: logAction as "UPDATED" | "STATUS_CHANGED" | "COMPLETED" | "CANCELLED",
          description: changes.join("; "),
          snapshot: { changes, previousStatus: existingRelease.status },
          createdById: userId,
        },
      })
    }

    return NextResponse.json({
      id: release.id,
      name: release.name,
      description: release.description,
      plannedDate: release.plannedDate.toISOString(),
      actualDate: release.actualDate?.toISOString() || null,
      status: release.status,
      riskLevel: release.riskLevel,
      project: release.project,
      owner: release.owner,
      updatedAt: release.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("更新发布失败:", error)
    return NextResponse.json({ error: "更新发布失败" }, { status: 500 })
  }
}

// DELETE /api/releases/[releaseId] - 删除发布
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { releaseId } = await params

    await prisma.release.delete({
      where: { id: releaseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除发布失败:", error)
    return NextResponse.json({ error: "删除发布失败" }, { status: 500 })
  }
}
