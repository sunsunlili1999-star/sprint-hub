// 服务端数据获取层 - 直接使用 Prisma
import { prisma } from "./prisma"

// ==================== 产品相关 ====================

export async function getProductDetail(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      status: true,
      starred: true,
      createdAt: true,
      owner: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true, avatar: true } },
      modules: {
        where: { parentId: null },
        include: {
          children: { orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      },
      _count: { select: { workItems: { where: { type: "REQUIREMENT" } } } },
    },
  })

  if (!product) return null

  return {
    id: product.id,
    name: product.name,
    code: product.code,
    description: product.description,
    status: product.status,
    owner: product.owner,
    creator: product.creator,
    requirementCount: product._count.workItems,
    starred: product.starred,
    createdAt: product.createdAt.toISOString().split("T")[0],
    modules: product.modules.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      order: m.order,
      children: m.children.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        order: c.order,
      })),
    })),
  }
}

export async function getProductModules(productId: string) {
  const modules = await prisma.module.findMany({
    where: { productId, parentId: null },
    include: {
      children: { orderBy: { order: "asc" } },
    },
    orderBy: { order: "asc" },
  })

  return modules.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    order: m.order,
    children: m.children.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      order: c.order,
    })),
  }))
}

export async function getProductRequirements(productId: string) {
  const requirements = await prisma.workItem.findMany({
    where: { productId, type: "REQUIREMENT" },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      devOwner: { select: { id: true, name: true, avatar: true } },
      project: { select: { id: true, name: true } },
      sprint: { select: { id: true, name: true } },
      module: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return requirements.map((item) => ({
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
  }))
}

export async function getProductDocuments(productId: string) {
  const documents = await prisma.document.findMany({
    where: { productId },
    include: {
      uploader: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    fileType: doc.fileType,
    type: doc.fileType.split("/").pop() || doc.fileName.split(".").pop() || "file",
    size: formatFileSize(doc.fileSize),
    uploadedBy: doc.uploader,
    uploadedAt: doc.createdAt.toISOString().split("T")[0],
  }))
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}
