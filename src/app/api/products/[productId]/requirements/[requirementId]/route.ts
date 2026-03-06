import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ productId: string; requirementId: string }>
}

// GET /api/products/[productId]/requirements/[requirementId] - 获取需求详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { requirementId } = await params

    const requirement = await prisma.workItem.findUnique({
      where: { id: requirementId },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        devOwner: {
          select: { id: true, name: true, avatar: true },
        },
        project: {
          select: { id: true, name: true },
        },
        sprint: {
          select: { id: true, name: true },
        },
        module: {
          select: { id: true, name: true },
        },
      },
    })

    if (!requirement) {
      return NextResponse.json({ error: "需求不存在" }, { status: 404 })
    }

    return NextResponse.json(requirement)
  } catch (error) {
    console.error("获取需求详情失败:", error)
    return NextResponse.json({ error: "获取需求详情失败" }, { status: 500 })
  }
}

// PUT /api/products/[productId]/requirements/[requirementId] - 更新需求
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { requirementId } = await params
    const body = await request.json()
    const { title, description, priority, status, moduleId, projectId, devOwnerId } = body

    const requirement = await prisma.workItem.update({
      where: { id: requirementId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(status && { devStatus: status }),
        ...(moduleId !== undefined && { moduleId }),
        ...(projectId !== undefined && { projectId }),
        ...(devOwnerId !== undefined && { devOwnerId }),
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        devOwner: {
          select: { id: true, name: true, avatar: true },
        },
        project: {
          select: { id: true, name: true },
        },
        module: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(requirement)
  } catch (error) {
    console.error("更新需求失败:", error)
    return NextResponse.json({ error: "更新需求失败" }, { status: 500 })
  }
}

// DELETE /api/products/[productId]/requirements/[requirementId] - 删除需求
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { requirementId } = await params

    await prisma.workItem.delete({
      where: { id: requirementId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除需求失败:", error)
    return NextResponse.json({ error: "删除需求失败" }, { status: 500 })
  }
}
