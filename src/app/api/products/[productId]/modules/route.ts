import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ productId: string }>
}

// GET /api/products/[productId]/modules - 获取模块列表
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params

    const modules = await prisma.module.findMany({
      where: { productId, parentId: null },
      include: {
        children: {
          orderBy: { order: "asc" },
          include: {
            _count: {
              select: { workItems: true },
            },
          },
        },
        _count: {
          select: { workItems: true },
        },
      },
      orderBy: { order: "asc" },
    })

    const result = modules.map((mod) => ({
      id: mod.id,
      name: mod.name,
      description: mod.description,
      order: mod.order,
      requirementCount: mod._count.workItems,
      children: mod.children.map((child) => ({
        id: child.id,
        name: child.name,
        description: child.description,
        order: child.order,
        requirementCount: child._count.workItems,
      })),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取模块列表失败:", error)
    return NextResponse.json({ error: "获取模块列表失败" }, { status: 500 })
  }
}

// POST /api/products/[productId]/modules - 创建模块
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params
    const body = await request.json()
    const { name, description, parentId } = body

    if (!name) {
      return NextResponse.json({ error: "模块名称不能为空" }, { status: 400 })
    }

    // 获取同级模块的最大 order
    const maxOrderModule = await prisma.module.findFirst({
      where: { productId, parentId: parentId || null },
      orderBy: { order: "desc" },
    })

    const module = await prisma.module.create({
      data: {
        productId,
        parentId,
        name,
        description,
        order: (maxOrderModule?.order || 0) + 1,
      },
      include: {
        children: true,
      },
    })

    return NextResponse.json(module, { status: 201 })
  } catch (error) {
    console.error("创建模块失败:", error)
    return NextResponse.json({ error: "创建模块失败" }, { status: 500 })
  }
}
