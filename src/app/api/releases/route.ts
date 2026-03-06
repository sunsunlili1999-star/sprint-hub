import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/releases - 获取发布列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (status) {
      where.status = status
    }

    const releases = await prisma.release.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        owner: {
          select: { id: true, name: true, avatar: true },
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
                devStatus: true,
                testStatus: true,
                verifyStatus: true,
              },
            },
          },
        },
        _count: {
          select: { items: true, logs: true },
        },
      },
      orderBy: [{ plannedDate: "desc" }, { createdAt: "desc" }],
    })

    // 计算需求完成度
    const result = releases.map((release) => {
      const totalItems = release.items.length
      const completedItems = release.items.filter(
        (item) => item.workItem.verifyStatus === "COMPLETED" || 
                  (item.workItem.devStatus === "COMPLETED" && item.workItem.testStatus === "COMPLETED")
      ).length
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

      return {
        id: release.id,
        name: release.name,
        description: release.description,
        plannedDate: release.plannedDate.toISOString(),
        actualDate: release.actualDate?.toISOString() || null,
        status: release.status,
        riskLevel: release.riskLevel,
        riskDescription: release.riskDescription,
        aiRiskScore: release.aiRiskScore,
        project: release.project,
        owner: release.owner,
        creator: release.creator,
        itemCount: totalItems,
        completedItemCount: completedItems,
        progress,
        logCount: release._count.logs,
        createdAt: release.createdAt.toISOString(),
        updatedAt: release.updatedAt.toISOString(),
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取发布列表失败:", error)
    return NextResponse.json({ error: "获取发布列表失败" }, { status: 500 })
  }
}

// POST /api/releases - 创建发布
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      projectId, 
      plannedDate, 
      ownerId,
      requirementIds = [],
      riskLevel = "LOW",
      riskDescription,
    } = body

    if (!name || !projectId || !plannedDate) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    // 验证项目存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    const userId = session.user.id as string

    // 创建发布
    const release = await prisma.release.create({
      data: {
        name,
        description,
        projectId,
        plannedDate: new Date(plannedDate),
        ownerId: ownerId || userId,
        creatorId: userId,
        riskLevel,
        riskDescription,
        // 添加需求关联
        items: {
          create: requirementIds.map((workItemId: string) => ({
            workItemId,
          })),
        },
        // 创建日志
        logs: {
          create: {
            action: "CREATED",
            description: `创建发布「${name}」，包含 ${requirementIds.length} 个需求`,
            snapshot: {
              requirementIds,
              plannedDate,
            },
            createdById: userId,
          },
        },
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        owner: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        items: {
          include: {
            workItem: { select: { id: true, title: true, type: true, priority: true } },
          },
        },
      },
    })

    return NextResponse.json({
      id: release.id,
      name: release.name,
      description: release.description,
      plannedDate: release.plannedDate.toISOString(),
      status: release.status,
      riskLevel: release.riskLevel,
      project: release.project,
      owner: release.owner,
      creator: release.creator,
      itemCount: release.items.length,
      createdAt: release.createdAt.toISOString(),
    })
  } catch (error) {
    console.error("创建发布失败:", error)
    return NextResponse.json({ error: "创建发布失败" }, { status: 500 })
  }
}
