import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

// POST /api/requirements - 创建需求
export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      priority = "P2",
      requirementType,
      productId,
      projectId,
      sprintId,
      versionId,
      moduleId,
      devOwnerId,
      plannedStartDate,
      plannedEndDate,
      estimatedHours,
      tags,
    } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 })
    }

    const requirement = await prisma.workItem.create({
      data: {
        type: "REQUIREMENT",
        title: title.trim(),
        description,
        priority,
        requirementType,
        productId: productId || null,
        projectId: projectId || null,
        sprintId: sprintId || null,
        versionId: versionId || null,
        moduleId: moduleId || null,
        devOwnerId: devOwnerId || null,
        creatorId: currentUserId,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        devOwner: { select: { id: true, name: true, avatar: true } },
        product: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true } },
        version: { select: { id: true, name: true } },
        module: { select: { id: true, name: true } },
      },
    })

    // 如果需求同时关联了产品和项目，自动建立项目-产品关联
    if (productId && projectId) {
      // 检查项目是否已关联该产品
      const existingLink = await prisma.projectProduct.findUnique({
        where: {
          projectId_productId: {
            projectId,
            productId,
          },
        },
      })
      // 如果没有关联，则创建关联
      if (!existingLink) {
        await prisma.projectProduct.create({
          data: {
            projectId,
            productId,
          },
        })
      }
    }

    // 创建操作记录
    await prisma.activityLog.create({
      data: {
        workItemId: requirement.id,
        userId: currentUserId,
        action: "创建需求",
        newValue: title.trim(),
      },
    })

    return NextResponse.json(requirement, { status: 201 })
  } catch (error) {
    console.error("创建需求失败:", error)
    return NextResponse.json({ error: "创建需求失败" }, { status: 500 })
  }
}
