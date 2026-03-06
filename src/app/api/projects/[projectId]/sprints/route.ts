import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/sprints - 获取项目迭代列表
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params

    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { workItems: true },
        },
      },
      orderBy: { startDate: "desc" },
    })

    const result = sprints.map((sprint) => ({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.startDate.toISOString().split("T")[0],
      endDate: sprint.endDate.toISOString().split("T")[0],
      requirementCount: sprint._count.workItems,
      createdAt: sprint.createdAt.toISOString(),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取迭代列表失败:", error)
    return NextResponse.json({ error: "获取迭代列表失败" }, { status: 500 })
  }
}

// POST /api/projects/[projectId]/sprints - 创建迭代
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { name, goal, startDate, endDate } = body

    // 验证必填字段
    const trimmedName = name?.trim()
    if (!trimmedName) {
      return NextResponse.json({ error: "迭代名称不能为空" }, { status: 400 })
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "请选择迭代周期" }, { status: 400 })
    }

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        name: trimmedName,
        goal: goal || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "PLANNING",
      },
    })

    return NextResponse.json({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.startDate.toISOString().split("T")[0],
      endDate: sprint.endDate.toISOString().split("T")[0],
    }, { status: 201 })
  } catch (error) {
    console.error("创建迭代失败:", error)
    return NextResponse.json({ error: "创建迭代失败" }, { status: 500 })
  }
}
