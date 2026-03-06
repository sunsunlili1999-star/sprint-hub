import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

// GET /api/products - 获取产品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const starred = searchParams.get("starred") === "true"

    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(starred && { starred: true }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { workItems: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // 转换数据格式
    const result = products.map((product) => ({
      id: product.id,
      name: product.name,
      code: product.code,
      description: product.description,
      status: product.status,
      owner: product.owner,
      creator: product.creator,
      requirementCount: product._count.workItems,
      starred: product.starred,
      createdAt: product.createdAt.toISOString().split("T")[0],
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取产品列表失败:", error)
    return NextResponse.json({ error: "获取产品列表失败" }, { status: 500 })
  }
}

// POST /api/products - 创建产品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, description, ownerId } = body

    // 验证必填字段
    if (!name || !code) {
      return NextResponse.json({ error: "产品名称和编码不能为空" }, { status: 400 })
    }

    // 检查编码是否已存在
    const existing = await prisma.product.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json({ error: "产品编码已存在" }, { status: 400 })
    }

    // 获取当前登录用户
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }
    
    // 如果没有提供 ownerId，使用当前用户
    const productOwnerId = ownerId || currentUserId

    const product = await prisma.product.create({
      data: {
        name,
        code,
        description,
        ownerId: productOwnerId,
        creatorId: currentUserId,
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("创建产品失败:", error)
    return NextResponse.json({ error: "创建产品失败" }, { status: 500 })
  }
}
