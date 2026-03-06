import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/products/[productId]/star - 切换收藏状态
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    // 获取当前产品
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { starred: true },
    })

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 })
    }

    // 切换收藏状态
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { starred: !product.starred },
      select: { starred: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("切换收藏状态失败:", error)
    return NextResponse.json({ error: "操作失败" }, { status: 500 })
  }
}
