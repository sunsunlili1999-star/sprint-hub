import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

// POST /api/workitems - 创建工作项（最细粒度，在任务下）
export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      priority = "P2",
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

    if (!title?.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 })
    }

    // 如果指定了父级任务，验证其存在且为 TASK 类型
    if (parentId) {
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

    // 工作项使用 TASK 类型但没有子项（最细粒度）
    const workItem = await prisma.workItem.create({
      data: {
        type: "TASK", // 工作项也用 TASK 类型
        title: title.trim(),
        description,
        priority,
        parentId: parentId || null,
        productId: productId || null,
        projectId: projectId || null,
        sprintId: sprintId || null,
        versionId: versionId || null,
        moduleId: moduleId || null,
        devOwnerId: devOwnerId || null,
        creatorId: currentUserId,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      },
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

    // 创建操作记录
    await prisma.activityLog.create({
      data: {
        workItemId: workItem.id,
        userId: currentUserId,
        action: "创建工作项",
        newValue: title.trim(),
      },
    })

    return NextResponse.json(workItem, { status: 201 })
  } catch (error) {
    console.error("创建工作项失败:", error)
    return NextResponse.json({ error: "创建工作项失败" }, { status: 500 })
  }
}
