import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ productId: string; moduleId: string }>
}

// GET /api/products/[productId]/modules/[moduleId] - 获取模块详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        children: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { workItems: true },
        },
      },
    })

    if (!module) {
      return NextResponse.json({ error: "模块不存在" }, { status: 404 })
    }

    return NextResponse.json(module)
  } catch (error) {
    console.error("获取模块详情失败:", error)
    return NextResponse.json({ error: "获取模块详情失败" }, { status: 500 })
  }
}

// PUT /api/products/[productId]/modules/[moduleId] - 更新模块
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params
    const body = await request.json()
    const { name, description, order, parentId } = body

    const module = await prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(parentId !== undefined && { parentId }),
      },
      include: {
        children: true,
      },
    })

    return NextResponse.json(module)
  } catch (error) {
    console.error("更新模块失败:", error)
    return NextResponse.json({ error: "更新模块失败" }, { status: 500 })
  }
}

// DELETE /api/products/[productId]/modules/[moduleId] - 删除模块
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params

    // 先将该模块下的需求的 moduleId 设为 null
    await prisma.workItem.updateMany({
      where: { moduleId },
      data: { moduleId: null },
    })

    // 将子模块移到顶级
    await prisma.module.updateMany({
      where: { parentId: moduleId },
      data: { parentId: null },
    })

    // 删除模块
    await prisma.module.delete({
      where: { id: moduleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除模块失败:", error)
    return NextResponse.json({ error: "删除模块失败" }, { status: 500 })
  }
}
