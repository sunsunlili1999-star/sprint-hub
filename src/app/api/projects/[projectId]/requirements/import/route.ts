import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { WorkItemType } from "@prisma/client"

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// POST /api/projects/[projectId]/requirements/import - 批量导入需求到项目
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { requirementIds } = body

    console.log("导入需求 - projectId:", projectId)
    console.log("导入需求 - requirementIds:", requirementIds)

    if (!requirementIds || !Array.isArray(requirementIds) || requirementIds.length === 0) {
      return NextResponse.json({ error: "请选择要导入的需求" }, { status: 400 })
    }

    // 验证项目存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    console.log("导入需求 - project:", project?.id)

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    // 先查询这些需求是否存在
    const existingItems = await prisma.workItem.findMany({
      where: {
        id: { in: requirementIds },
      },
      select: {
        id: true,
        type: true,
        projectId: true,
        title: true,
      },
    })

    console.log("导入需求 - 查询到的需求:", existingItems.length, existingItems)

    // 批量更新需求的 projectId，将需求关联到项目
    const result = await prisma.workItem.updateMany({
      where: {
        id: { in: requirementIds },
        type: WorkItemType.REQUIREMENT,
      },
      data: {
        projectId: projectId,
      },
    })

    console.log("导入需求 - 更新结果:", result)

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `成功导入 ${result.count} 条需求`,
    })
  } catch (error) {
    console.error("导入需求失败:", error)
    return NextResponse.json({ error: "导入需求失败" }, { status: 500 })
  }
}
