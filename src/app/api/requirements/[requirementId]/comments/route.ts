import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

// GET /api/requirements/[requirementId]/comments - 获取评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requirementId: string }> }
) {
  try {
    const { requirementId } = await params

    const comments = await prisma.comment.findMany({
      where: { workItemId: requirementId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        user: comment.user,
        createdAt: comment.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("获取评论失败:", error)
    return NextResponse.json({ error: "获取评论失败" }, { status: 500 })
  }
}

// POST /api/requirements/[requirementId]/comments - 创建评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requirementId: string }> }
) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { requirementId } = await params
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        workItemId: requirementId,
        userId: currentUserId,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    // 记录操作
    await prisma.activityLog.create({
      data: {
        workItemId: requirementId,
        userId: currentUserId,
        action: "添加评论",
        newValue: content.trim().substring(0, 50),
      },
    })

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      user: comment.user,
      createdAt: comment.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error("创建评论失败:", error)
    return NextResponse.json({ error: "创建评论失败" }, { status: 500 })
  }
}
