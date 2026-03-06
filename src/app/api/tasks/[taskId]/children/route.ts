import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

// GET /api/tasks/[taskId]/children - 获取任务下的工作项列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params

    const children = await prisma.workItem.findMany({
      where: { parentId: taskId },
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
    console.error("获取工作项列表失败:", error)
    return NextResponse.json({ error: "获取工作项列表失败" }, { status: 500 })
  }
}

// POST /api/tasks/[taskId]/children - 在任务下创建工作项
export async function POST(
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
    const { title, priority = "P2", devOwnerId } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 })
    }

    // 获取父任务信息，继承产品/项目/迭代/模块
    const parent = await prisma.workItem.findUnique({
      where: { id: taskId },
      select: { 
        type: true,
        productId: true, 
        projectId: true, 
        sprintId: true,
        moduleId: true,
      },
    })

    if (!parent) {
      return NextResponse.json({ error: "父任务不存在" }, { status: 404 })
    }

    if (parent.type !== "TASK") {
      return NextResponse.json({ error: "工作项只能添加在任务下" }, { status: 400 })
    }

    // 工作项使用 TASK 类型（最细粒度）
    const child = await prisma.workItem.create({
      data: {
        type: "TASK",
        title: title.trim(),
        priority,
        parentId: taskId,
        productId: parent.productId,
        projectId: parent.projectId,
        sprintId: parent.sprintId,
        moduleId: parent.moduleId,
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
        workItemId: taskId,
        userId: currentUserId,
        action: "添加工作项",
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
    console.error("创建工作项失败:", error)
    return NextResponse.json({ error: "创建工作项失败" }, { status: 500 })
  }
}
