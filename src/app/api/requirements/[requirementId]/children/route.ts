import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

// GET /api/requirements/[requirementId]/children - 获取子工作项列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requirementId: string }> }
) {
  try {
    const { requirementId } = await params

    const children = await prisma.workItem.findMany({
      where: { parentId: requirementId },
      include: {
        devOwner: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(
      children.map((child) => ({
        id: child.id,
        type: child.type,
        title: child.title,
        priority: child.priority,
        status: child.devStatus,
        assignee: child.devOwner,
      }))
    )
  } catch (error) {
    console.error("获取子工作项失败:", error)
    return NextResponse.json({ error: "获取子工作项失败" }, { status: 500 })
  }
}

// POST /api/requirements/[requirementId]/children - 创建子工作项
export async function POST(
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
    const { title, type = "TASK", priority = "P2", devOwnerId } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 })
    }

    // 获取父需求信息，继承产品/项目/迭代
    const parent = await prisma.workItem.findUnique({
      where: { id: requirementId },
      select: { productId: true, projectId: true, sprintId: true },
    })

    if (!parent) {
      return NextResponse.json({ error: "父需求不存在" }, { status: 404 })
    }

    const child = await prisma.workItem.create({
      data: {
        type,
        title: title.trim(),
        priority,
        parentId: requirementId,
        productId: parent.productId,
        projectId: parent.projectId,
        sprintId: parent.sprintId,
        devOwnerId: devOwnerId || null,
        creatorId: currentUserId,
      },
      include: {
        devOwner: { select: { id: true, name: true, avatar: true } },
      },
    })

    // 记录操作
    await prisma.activityLog.create({
      data: {
        workItemId: requirementId,
        userId: currentUserId,
        action: "添加子任务",
        newValue: title.trim(),
      },
    })

    return NextResponse.json({
      id: child.id,
      type: child.type,
      title: child.title,
      priority: child.priority,
      status: child.devStatus,
      assignee: child.devOwner,
    }, { status: 201 })
  } catch (error) {
    console.error("创建子工作项失败:", error)
    return NextResponse.json({ error: "创建子工作项失败" }, { status: 500 })
  }
}
