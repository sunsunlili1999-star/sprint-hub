import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId] - 获取项目详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        product: {
          select: { id: true, name: true, code: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        sprints: {
          orderBy: { startDate: "desc" },
          take: 5,
        },
        _count: {
          select: {
            workItems: { where: { type: "REQUIREMENT" } },
            sprints: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    const result = {
      id: project.id,
      name: project.name,
      code: project.code,
      description: project.description,
      status: project.status,
      starred: project.starred,
      startDate: project.startDate?.toISOString().split("T")[0] || null,
      endDate: project.endDate?.toISOString().split("T")[0] || null,
      product: project.product,
      creator: project.creator,
      members: project.members.map(m => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt.toISOString().split("T")[0],
      })),
      sprints: project.sprints.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        startDate: s.startDate.toISOString().split("T")[0],
        endDate: s.endDate.toISOString().split("T")[0],
      })),
      requirementCount: project._count.workItems,
      sprintCount: project._count.sprints,
      createdAt: project.createdAt.toISOString().split("T")[0],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取项目详情失败:", error)
    return NextResponse.json({ error: "获取项目详情失败" }, { status: 500 })
  }
}

// PUT /api/projects/[projectId] - 更新项目
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { name, code, description, productId, startDate, endDate, status } = body

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(description !== undefined && { description }),
        ...(productId !== undefined && { productId }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status && { status }),
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        product: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("更新项目失败:", error)
    return NextResponse.json({ error: "更新项目失败" }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId] - 删除项目
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params

    await prisma.project.delete({
      where: { id: projectId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除项目失败:", error)
    return NextResponse.json({ error: "删除项目失败" }, { status: 500 })
  }
}
