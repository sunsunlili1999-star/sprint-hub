import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ releaseId: string }>
}

// POST /api/releases/[releaseId]/items - 添加需求到发布
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { releaseId } = await params
    const body = await request.json()
    const { workItemIds } = body

    if (!workItemIds || !Array.isArray(workItemIds) || workItemIds.length === 0) {
      return NextResponse.json({ error: "请选择要添加的需求" }, { status: 400 })
    }

    // 验证发布存在
    const release = await prisma.release.findUnique({
      where: { id: releaseId },
      select: { name: true },
    })
    if (!release) {
      return NextResponse.json({ error: "发布不存在" }, { status: 404 })
    }

    // 获取已存在的关联
    const existing = await prisma.releaseItem.findMany({
      where: {
        releaseId,
        workItemId: { in: workItemIds },
      },
      select: { workItemId: true },
    })
    const existingIds = new Set(existing.map((e) => e.workItemId))

    // 过滤出新增的
    const newIds = workItemIds.filter((id: string) => !existingIds.has(id))

    if (newIds.length === 0) {
      return NextResponse.json({ success: true, addedCount: 0, message: "所有需求已在发布中" })
    }

    const userId = session.user.id as string

    // 批量创建关联
    await prisma.releaseItem.createMany({
      data: newIds.map((workItemId: string) => ({
        releaseId,
        workItemId,
      })),
    })

    // 获取添加的需求信息用于日志
    const addedItems = await prisma.workItem.findMany({
      where: { id: { in: newIds } },
      select: { id: true, title: true },
    })

    // 记录日志
    await prisma.releaseLog.create({
      data: {
        releaseId,
        action: "ITEMS_ADDED",
        description: `添加 ${newIds.length} 个需求到发布`,
        snapshot: {
          addedItems: addedItems.map((i) => ({ id: i.id, title: i.title })),
        },
        createdById: userId,
      },
    })

    return NextResponse.json({
      success: true,
      addedCount: newIds.length,
      message: `成功添加 ${newIds.length} 个需求`,
    })
  } catch (error) {
    console.error("添加需求到发布失败:", error)
    return NextResponse.json({ error: "添加需求失败" }, { status: 500 })
  }
}

// DELETE /api/releases/[releaseId]/items - 从发布移除需求
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { releaseId } = await params
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get("ids")

    if (!idsParam) {
      return NextResponse.json({ error: "请指定要移除的需求" }, { status: 400 })
    }

    const workItemIds = idsParam.split(",")
    const userId = session.user.id as string

    // 获取要移除的需求信息用于日志
    const removedItems = await prisma.workItem.findMany({
      where: { id: { in: workItemIds } },
      select: { id: true, title: true },
    })

    // 批量删除关联
    const result = await prisma.releaseItem.deleteMany({
      where: {
        releaseId,
        workItemId: { in: workItemIds },
      },
    })

    // 记录日志
    if (result.count > 0) {
      await prisma.releaseLog.create({
        data: {
          releaseId,
          action: "ITEMS_REMOVED",
          description: `从发布移除 ${result.count} 个需求`,
          snapshot: {
            removedItems: removedItems.map((i) => ({ id: i.id, title: i.title })),
          },
          createdById: userId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      removedCount: result.count,
      message: `成功移除 ${result.count} 个需求`,
    })
  } catch (error) {
    console.error("从发布移除需求失败:", error)
    return NextResponse.json({ error: "移除需求失败" }, { status: 500 })
  }
}
