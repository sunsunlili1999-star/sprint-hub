import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ releaseId: string }>
}

// POST /api/releases/[releaseId]/confirm - 确认发布
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { releaseId } = await params
    const userId = session.user.id as string

    // 获取发布信息
    const release = await prisma.release.findUnique({
      where: { id: releaseId },
      include: {
        items: {
          include: {
            workItem: {
              select: {
                id: true,
                title: true,
                type: true,
                priority: true,
                devStatus: true,
                testStatus: true,
                verifyStatus: true,
                devOwner: { select: { id: true, name: true } },
                testOwner: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    })

    if (!release) {
      return NextResponse.json({ error: "发布不存在" }, { status: 404 })
    }

    if (release.status !== "PLANNING" && release.status !== "READY") {
      return NextResponse.json({ error: "当前状态不允许确认发布" }, { status: 400 })
    }

    // 生成发布快照
    const snapshot = {
      confirmedAt: new Date().toISOString(),
      plannedDate: release.plannedDate.toISOString(),
      totalItems: release.items.length,
      items: release.items.map((item) => ({
        id: item.workItem.id,
        title: item.workItem.title,
        type: item.workItem.type,
        priority: item.workItem.priority,
        devStatus: item.workItem.devStatus,
        testStatus: item.workItem.testStatus,
        verifyStatus: item.workItem.verifyStatus,
        devOwner: item.workItem.devOwner?.name || null,
        testOwner: item.workItem.testOwner?.name || null,
      })),
      stats: {
        completed: release.items.filter(
          (i) =>
            i.workItem.verifyStatus === "COMPLETED" ||
            (i.workItem.devStatus === "COMPLETED" && i.workItem.testStatus === "COMPLETED")
        ).length,
        inProgress: release.items.filter(
          (i) =>
            i.workItem.devStatus === "IN_PROGRESS" ||
            i.workItem.testStatus === "IN_PROGRESS"
        ).length,
        notStarted: release.items.filter(
          (i) => i.workItem.devStatus === "NOT_STARTED"
        ).length,
      },
    }

    // 更新发布状态
    await prisma.release.update({
      where: { id: releaseId },
      data: {
        status: "IN_PROGRESS",
      },
    })

    // 创建确认日志
    await prisma.releaseLog.create({
      data: {
        releaseId,
        action: "CONFIRMED",
        description: `确认发布，包含 ${release.items.length} 个需求，计划发布日期 ${release.plannedDate.toLocaleDateString("zh-CN")}`,
        snapshot,
        createdById: userId,
      },
    })

    return NextResponse.json({
      success: true,
      message: "发布已确认",
      snapshot,
    })
  } catch (error) {
    console.error("确认发布失败:", error)
    return NextResponse.json({ error: "确认发布失败" }, { status: 500 })
  }
}
