import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// POST /api/projects/[projectId]/star - 切换收藏状态
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { starred: true },
    })

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { starred: !project.starred },
      select: { starred: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("切换收藏状态失败:", error)
    return NextResponse.json({ error: "切换收藏状态失败" }, { status: 500 })
  }
}
