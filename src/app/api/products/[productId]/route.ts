import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ productId: string }>
}

// GET /api/products/[productId] - 获取产品详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params

    const product = await (prisma as any).product.findUnique({
      where: { id: productId },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        modules: {
          include: {
            children: {
              orderBy: { order: "asc" },
            },
            _count: {
              select: { workItems: true },
            },
          },
          where: { parentId: null },
          orderBy: { order: "asc" },
        },
        documents: {
          include: {
            uploader: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        workItems: {
          where: { type: "REQUIREMENT" },
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
          orderBy: { createdAt: "desc" },
        },
        // 关联的项目（通过 projectProducts 中间表）
        projectProducts: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
        _count: {
          select: { workItems: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 })
    }

    // 转换数据格式
    const result = {
      id: product.id,
      name: product.name,
      code: product.code,
      description: product.description,
      status: product.status,
      starred: product.starred,
      owner: product.owner,
      creator: product.creator,
      createdAt: product.createdAt.toISOString().split("T")[0],
      modules: product.modules.map((mod: any) => ({
        id: mod.id,
        name: mod.name,
        description: mod.description,
        order: mod.order,
        requirementCount: mod._count.workItems,
        children: mod.children.map((child: any) => ({
          id: child.id,
          name: child.name,
          description: child.description,
          order: child.order,
        })),
      })),
      documents: product.documents.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        uploadedBy: doc.uploader,
        uploadedAt: doc.createdAt.toISOString().split("T")[0],
      })),
      requirements: product.workItems.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.devStatus,
        moduleId: item.moduleId,
        moduleName: item.module?.name || null,
        projectId: item.projectId,
        projectName: item.project?.name || null,
        sprintName: item.sprint?.name || null,
        creator: item.creator,
        assignee: item.devOwner,
        createdAt: item.createdAt.toISOString().split("T")[0],
        updatedAt: item.updatedAt.toISOString().split("T")[0],
      })),
      // 关联的项目
      projects: product.projectProducts.map((pp: any) => ({
        id: pp.project.id,
        name: pp.project.name,
        code: pp.project.code,
        status: pp.project.status,
        startDate: pp.project.startDate?.toISOString().split("T")[0] || null,
        endDate: pp.project.endDate?.toISOString().split("T")[0] || null,
      })),
      requirementCount: product._count.workItems,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取产品详情失败:", error)
    return NextResponse.json({ error: "获取产品详情失败" }, { status: 500 })
  }
}

// PUT /api/products/[productId] - 更新产品
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params
    const body = await request.json()
    const { name, code, description, ownerId } = body

    // 检查产品是否存在
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existing) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 })
    }

    // 如果修改了编码，检查是否已存在
    if (code && code !== existing.code) {
      const codeExists = await prisma.product.findUnique({
        where: { code },
      })
      if (codeExists) {
        return NextResponse.json({ error: "产品编码已存在" }, { status: 400 })
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(description !== undefined && { description }),
        ...(ownerId && { ownerId }),
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

    return NextResponse.json(product)
  } catch (error) {
    console.error("更新产品失败:", error)
    return NextResponse.json({ error: "更新产品失败" }, { status: 500 })
  }
}

// DELETE /api/products/[productId] - 删除产品（归档）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params

    // 软删除：将状态改为 ARCHIVED
    await prisma.product.update({
      where: { id: productId },
      data: { status: "ARCHIVED" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除产品失败:", error)
    return NextResponse.json({ error: "删除产品失败" }, { status: 500 })
  }
}
