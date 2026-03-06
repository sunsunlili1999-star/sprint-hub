import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ projectId: string; sprintId: string }>
}

// GET /api/projects/[projectId]/sprints/[sprintId]/workitems - 获取迭代中的任务列表（树形结构：任务 -> 工作项）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const inSprint = searchParams.get("inSprint") // "true" | "false" | null (all)

    // 验证迭代存在
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId, projectId },
    })

    if (!sprint) {
      return NextResponse.json({ error: "迭代不存在" }, { status: 404 })
    }

    // 获取项目关联的产品
    const projectProducts = await (prisma as any).projectProduct.findMany({
      where: { projectId },
      select: { productId: true },
    })
    const productIds = projectProducts.map((pp: { productId: string }) => pp.productId)

    // 构建查询条件
    const whereClause: any = {
      AND: [
        // 只查询任务类型（任务是中间层，上面是需求，下面是工作项）
        { type: "TASK" },
        // 属于当前项目或关联产品
        {
          OR: [
            { projectId },
            { productId: { in: productIds } },
          ],
        },
      ],
    }

    // 根据 inSprint 参数筛选
    if (inSprint === "true") {
      // 只获取已在迭代中的
      whereClause.AND.push({ sprintId: sprintId })
    } else if (inSprint === "false") {
      // 只获取未分配迭代的
      whereClause.AND.push({ sprintId: null })
    } else {
      // 获取所有：未分配迭代或已分配到当前迭代
      whereClause.AND.push({
        OR: [
          { sprintId: null },
          { sprintId: sprintId },
        ],
      })
    }

    // 搜索条件
    if (search) {
      whereClause.AND.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { id: { contains: search, mode: "insensitive" } },
        ],
      })
    }

    // 查询任务及其子工作项
    const tasks = await prisma.workItem.findMany({
      where: whereClause,
      include: {
        product: {
          select: { id: true, name: true },
        },
        module: {
          select: { id: true, name: true },
        },
        devOwner: {
          select: { id: true, name: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        parent: {
          select: { id: true, title: true, type: true },
        },
        // 获取子工作项
        children: {
          include: {
            devOwner: {
              select: { id: true, name: true, avatar: true },
            },
            module: {
              select: { id: true, name: true },
            },
          },
          orderBy: [
            { priority: "asc" },
            { createdAt: "asc" },
          ],
        },
      },
      orderBy: [
        { priority: "asc" },
        { createdAt: "desc" },
      ],
    })

    // 格式化返回数据
    const result = tasks.map(task => ({
      id: task.id,
      title: task.title,
      type: task.type,
      priority: task.priority,
      status: task.devStatus,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      isInSprint: task.sprintId === sprintId,
      product: task.product,
      module: task.module,
      assignee: task.devOwner,
      creator: task.creator,
      parent: task.parent,
      createdAt: task.createdAt?.toISOString().split('T')[0],
      updatedAt: task.updatedAt?.toISOString().split('T')[0],
      childCount: task.children.length,
      completedChildCount: task.children.filter(c => c.devStatus === "COMPLETED").length,
      // 子工作项
      children: task.children.map(child => ({
        id: child.id,
        title: child.title,
        type: child.type,
        priority: child.priority,
        status: child.devStatus,
        estimatedHours: child.estimatedHours,
        actualHours: child.actualHours,
        module: child.module,
        assignee: child.devOwner,
      })),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取迭代工作项失败:", error)
    return NextResponse.json({ error: "获取迭代工作项失败" }, { status: 500 })
  }
}

// POST /api/projects/[projectId]/sprints/[sprintId]/workitems - 批量移入任务到迭代
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params
    const body = await request.json()
    const { workItemIds } = body

    if (!workItemIds || !Array.isArray(workItemIds) || workItemIds.length === 0) {
      return NextResponse.json({ error: "请选择要移入的任务" }, { status: 400 })
    }

    // 验证迭代存在
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId, projectId },
    })

    if (!sprint) {
      return NextResponse.json({ error: "迭代不存在" }, { status: 404 })
    }

    // 批量更新任务的迭代和项目
    const result = await prisma.workItem.updateMany({
      where: {
        id: { in: workItemIds },
      },
      data: {
        sprintId,
        projectId, // 同时关联到项目
      },
    })

    // 同时更新这些任务的子工作项
    await prisma.workItem.updateMany({
      where: {
        parentId: { in: workItemIds },
      },
      data: {
        sprintId,
        projectId,
      },
    })

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `已将 ${result.count} 个任务移入迭代`,
    })
  } catch (error) {
    console.error("移入任务失败:", error)
    return NextResponse.json({ error: "移入任务失败" }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId]/sprints/[sprintId]/workitems - 批量移出任务
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sprintId } = await params
    const { searchParams } = new URL(request.url)
    const workItemIds = searchParams.get("ids")?.split(",") || []

    if (workItemIds.length === 0) {
      return NextResponse.json({ error: "请选择要移出的任务" }, { status: 400 })
    }

    // 验证迭代存在
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId, projectId },
    })

    if (!sprint) {
      return NextResponse.json({ error: "迭代不存在" }, { status: 404 })
    }

    // 批量移出任务（设置 sprintId 为 null，但保留 projectId）
    const result = await prisma.workItem.updateMany({
      where: {
        id: { in: workItemIds },
        sprintId,
      },
      data: {
        sprintId: null,
      },
    })

    // 同时移出子工作项
    await prisma.workItem.updateMany({
      where: {
        parentId: { in: workItemIds },
        sprintId,
      },
      data: {
        sprintId: null,
      },
    })

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `已将 ${result.count} 个任务移出迭代`,
    })
  } catch (error) {
    console.error("移出任务失败:", error)
    return NextResponse.json({ error: "移出任务失败" }, { status: 500 })
  }
}
