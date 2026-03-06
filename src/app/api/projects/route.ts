import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

// GET /api/projects - 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const starred = searchParams.get("starred") === "true"

    const projects = await prisma.project.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(starred && { starred: true }),
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        projectProducts: {
          include: {
            product: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          take: 5,
        },
        _count: {
          select: { 
            workItems: { where: { type: "REQUIREMENT" } },
            sprints: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const result = projects.map((project) => ({
      id: project.id,
      name: project.name,
      code: project.code,
      description: project.description,
      status: project.status,
      starred: project.starred,
      startDate: project.startDate?.toISOString().split("T")[0] || null,
      endDate: project.endDate?.toISOString().split("T")[0] || null,
      products: project.projectProducts.map(pp => pp.product),  // 多个产品
      creator: project.creator,
      members: project.members.map(m => m.user),
      memberCount: project.members.length,
      requirementCount: project._count.workItems,
      sprintCount: project._count.sprints,
      createdAt: project.createdAt.toISOString().split("T")[0],
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取项目列表失败:", error)
    return NextResponse.json({ error: "获取项目列表失败" }, { status: 500 })
  }
}

// POST /api/projects - 创建项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, description, productIds, startDate, endDate, memberIds } = body

    // 验证必填字段（trim 后检查）
    const trimmedName = name?.trim()
    const trimmedCode = code?.trim()
    
    if (!trimmedName || !trimmedCode) {
      return NextResponse.json({ error: "项目名称和编码不能为空" }, { status: 400 })
    }

    // 检查编码是否已存在
    const existing = await prisma.project.findUnique({ where: { code: trimmedCode } })
    if (existing) {
      return NextResponse.json({ error: "项目编码已存在" }, { status: 400 })
    }

    // 获取当前登录用户
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const project = await prisma.project.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        creatorId: currentUserId,
        members: {
          create: [
            { userId: currentUserId, role: "MANAGER" },
            ...(memberIds || [])
              .filter((id: string) => id !== currentUserId)
              .map((userId: string) => ({ userId, role: "DEVELOPER" as const })),
          ],
        },
        // 关联多个产品
        projectProducts: {
          create: (productIds || []).map((productId: string) => ({
            productId,
          })),
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        projectProducts: {
          include: {
            product: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      ...project,
      products: project.projectProducts.map(pp => pp.product),
    }, { status: 201 })
  } catch (error: unknown) {
    console.error("创建项目失败:", error)
    const errorMessage = error instanceof Error ? error.message : "创建项目失败"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
