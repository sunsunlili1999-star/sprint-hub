import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ productId: string }>
}

// GET /api/products/[productId]/versions - 获取产品版本列表
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params

    const versions = await prisma.productVersion.findMany({
      where: { productId },
      include: {
        _count: {
          select: { workItems: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const result = versions.map((version) => ({
      id: version.id,
      name: version.name,
      description: version.description,
      status: version.status,
      plannedDate: version.plannedDate?.toISOString().split("T")[0] || null,
      releaseDate: version.releaseDate?.toISOString().split("T")[0] || null,
      requirementCount: version._count.workItems,
      createdAt: version.createdAt.toISOString(),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取版本列表失败:", error)
    return NextResponse.json({ error: "获取版本列表失败" }, { status: 500 })
  }
}

// POST /api/products/[productId]/versions - 创建版本
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params
    const body = await request.json()
    const { name, description, plannedDate } = body

    const trimmedName = name?.trim()
    if (!trimmedName) {
      return NextResponse.json({ error: "版本名称不能为空" }, { status: 400 })
    }

    // 检查产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 })
    }

    const version = await prisma.productVersion.create({
      data: {
        productId,
        name: trimmedName,
        description: description || null,
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        status: "PLANNING",
      },
    })

    return NextResponse.json({
      id: version.id,
      name: version.name,
      description: version.description,
      status: version.status,
      plannedDate: version.plannedDate?.toISOString().split("T")[0] || null,
      releaseDate: null,
    }, { status: 201 })
  } catch (error) {
    console.error("创建版本失败:", error)
    return NextResponse.json({ error: "创建版本失败" }, { status: 500 })
  }
}
