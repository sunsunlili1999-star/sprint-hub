import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

// GET /api/requirements/[requirementId]/dependencies - 获取依赖关系
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requirementId: string }> }
) {
  try {
    const { requirementId } = await params

    // 获取前置依赖（当前需求依赖的）
    const dependencies = await prisma.workItemDependency.findMany({
      where: { workItemId: requirementId },
      include: {
        dependsOn: {
          select: { id: true, title: true, devStatus: true },
        },
      },
    })

    // 获取后置依赖（依赖当前需求的）
    const dependents = await prisma.workItemDependency.findMany({
      where: { dependsOnId: requirementId },
      include: {
        workItem: {
          select: { id: true, title: true, devStatus: true },
        },
      },
    })

    return NextResponse.json({
      dependencies: dependencies.map((dep) => ({
        id: dep.id,
        type: dep.dependencyType,
        workItem: {
          id: dep.dependsOn.id,
          title: dep.dependsOn.title,
          status: dep.dependsOn.devStatus,
        },
      })),
      dependents: dependents.map((dep) => ({
        id: dep.id,
        type: dep.dependencyType,
        workItem: {
          id: dep.workItem.id,
          title: dep.workItem.title,
          status: dep.workItem.devStatus,
        },
      })),
    })
  } catch (error) {
    console.error("获取依赖关系失败:", error)
    return NextResponse.json({ error: "获取依赖关系失败" }, { status: 500 })
  }
}

// POST /api/requirements/[requirementId]/dependencies - 添加依赖
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
    const { dependsOnId, dependencyType = "FF" } = body

    if (!dependsOnId) {
      return NextResponse.json({ error: "依赖项ID不能为空" }, { status: 400 })
    }

    if (dependsOnId === requirementId) {
      return NextResponse.json({ error: "不能依赖自己" }, { status: 400 })
    }

    // 检查是否已存在
    const existing = await prisma.workItemDependency.findUnique({
      where: {
        workItemId_dependsOnId: {
          workItemId: requirementId,
          dependsOnId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "依赖关系已存在" }, { status: 400 })
    }

    const dependency = await prisma.workItemDependency.create({
      data: {
        workItemId: requirementId,
        dependsOnId,
        dependencyType,
        createdById: currentUserId,
      },
      include: {
        dependsOn: {
          select: { id: true, title: true, devStatus: true },
        },
      },
    })

    // 记录操作
    await prisma.activityLog.create({
      data: {
        workItemId: requirementId,
        userId: currentUserId,
        action: "添加依赖",
        newValue: dependency.dependsOn.title,
      },
    })

    return NextResponse.json({
      id: dependency.id,
      type: dependency.dependencyType,
      workItem: {
        id: dependency.dependsOn.id,
        title: dependency.dependsOn.title,
        status: dependency.dependsOn.devStatus,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("添加依赖失败:", error)
    return NextResponse.json({ error: "添加依赖失败" }, { status: 500 })
  }
}

// DELETE /api/requirements/[requirementId]/dependencies?id=xxx - 删除依赖
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requirementId: string }> }
) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { requirementId } = await params
    const { searchParams } = new URL(request.url)
    const dependencyId = searchParams.get("id")

    if (!dependencyId) {
      return NextResponse.json({ error: "依赖ID不能为空" }, { status: 400 })
    }

    const dependency = await prisma.workItemDependency.findUnique({
      where: { id: dependencyId },
      include: { dependsOn: { select: { title: true } } },
    })

    if (!dependency) {
      return NextResponse.json({ error: "依赖关系不存在" }, { status: 404 })
    }

    await prisma.workItemDependency.delete({
      where: { id: dependencyId },
    })

    // 记录操作
    await prisma.activityLog.create({
      data: {
        workItemId: requirementId,
        userId: currentUserId,
        action: "移除依赖",
        oldValue: dependency.dependsOn.title,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除依赖失败:", error)
    return NextResponse.json({ error: "删除依赖失败" }, { status: 500 })
  }
}
