import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getCurrentUserId } from "@/lib/auth"

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// 排序条件类型
interface SortCondition {
  id: string
  field: string
  order: "asc" | "desc"
}

// 构建排序条件
function buildOrderBy(sorts: SortCondition[]): Prisma.WorkItemOrderByWithRelationInput[] {
  if (!sorts || sorts.length === 0) {
    return [{ createdAt: "desc" }]
  }

  const fieldMapping: Record<string, string> = {
    title: "title",
    priority: "priority",
    status: "devStatus",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  }

  return sorts.map(sort => {
    const dbField = fieldMapping[sort.field] || "createdAt"
    return { [dbField]: sort.order }
  })
}

// GET /api/projects/[projectId]/requirements - 获取项目需求列表
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const sprintId = searchParams.get("sprintId") || ""
    const sortsJson = searchParams.get("sorts") || ""

    // 解析排序条件
    let sorts: SortCondition[] = []
    if (sortsJson) {
      try {
        sorts = JSON.parse(sortsJson)
      } catch (e) {
        console.error("解析排序条件失败:", e)
      }
    }

    const orderBy = buildOrderBy(sorts)

    const requirements = await prisma.workItem.findMany({
      where: {
        projectId,
        type: "REQUIREMENT",
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(sprintId && sprintId !== "all" && sprintId !== "unassigned" && { sprintId }),
        ...(sprintId === "unassigned" && { sprintId: null }),
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        devOwner: {
          select: { id: true, name: true, avatar: true },
        },
        product: {
          select: { id: true, name: true },
        },
        sprint: {
          select: { id: true, name: true },
        },
        module: {
          select: { id: true, name: true },
        },
        version: {
          select: { id: true, name: true },
        },
        children: {
          select: { id: true, devStatus: true },
        },
      },
      orderBy,
    })

    const result = requirements.map((item) => {
      // 计算子任务进度
      const totalChildren = item.children.length
      const completedChildren = item.children.filter(c => c.devStatus === "COMPLETED").length
      const progress = totalChildren > 0 ? Math.round((completedChildren / totalChildren) * 100) : 0

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.devStatus,
        requirementType: item.requirementType,
        productId: item.productId,
        productName: item.product?.name || null,
        moduleId: item.moduleId,
        moduleName: item.module?.name || null,
        sprintId: item.sprintId,
        sprintName: item.sprint?.name || null,
        versionId: item.versionId,
        versionName: item.version?.name || null,
        creator: item.creator,
        assignee: item.devOwner,
        progress,
        childCount: totalChildren,
        createdAt: item.createdAt.toISOString().split("T")[0],
        updatedAt: item.updatedAt.toISOString().split("T")[0],
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取项目需求列表失败:", error)
    return NextResponse.json({ error: "获取项目需求列表失败" }, { status: 500 })
  }
}

// POST /api/projects/[projectId]/requirements - 创建项目需求
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const {
      title,
      description,
      priority,
      requirementType,
      productId,
      moduleId,
      sprintId,
      versionId,
      devOwnerId,
    } = body

    if (!title) {
      return NextResponse.json({ error: "需求标题不能为空" }, { status: 400 })
    }

    // 获取当前登录用户
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const requirement = await prisma.workItem.create({
      data: {
        projectId,
        productId,
        type: "REQUIREMENT",
        title,
        description,
        priority: priority || "P2",
        requirementType: requirementType || null,
        moduleId,
        sprintId,
        versionId,
        creatorId: currentUserId,
        devOwnerId,
        devStatus: "NOT_STARTED",
        testStatus: "NOT_STARTED",
        verifyStatus: "NOT_STARTED",
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        devOwner: {
          select: { id: true, name: true, avatar: true },
        },
        product: {
          select: { id: true, name: true },
        },
        sprint: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(requirement, { status: 201 })
  } catch (error) {
    console.error("创建项目需求失败:", error)
    return NextResponse.json({ error: "创建项目需求失败" }, { status: 500 })
  }
}
