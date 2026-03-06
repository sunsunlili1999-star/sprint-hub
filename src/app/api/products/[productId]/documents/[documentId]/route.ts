import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ productId: string; documentId: string }>
}

// GET /api/products/[productId]/documents/[documentId] - 获取文档详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { documentId } = await params

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: "文档不存在" }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("获取文档详情失败:", error)
    return NextResponse.json({ error: "获取文档详情失败" }, { status: 500 })
  }
}

// PUT /api/products/[productId]/documents/[documentId] - 更新文档
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { documentId } = await params
    const body = await request.json()
    const { name } = body

    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        ...(name && { name }),
      },
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("更新文档失败:", error)
    return NextResponse.json({ error: "更新文档失败" }, { status: 500 })
  }
}

// DELETE /api/products/[productId]/documents/[documentId] - 删除文档
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { documentId } = await params

    // TODO: 同时删除文件系统中的文件
    await prisma.document.delete({
      where: { id: documentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除文档失败:", error)
    return NextResponse.json({ error: "删除文档失败" }, { status: 500 })
  }
}
