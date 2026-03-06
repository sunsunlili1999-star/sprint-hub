import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getCurrentUserId } from "@/lib/auth"

interface RouteParams {
  params: Promise<{ productId: string }>
}

// 筛选条件类型
interface FilterCondition {
  id: string
  logic: "AND" | "OR"
  field: string
  operator: string
  value: string | string[]
}

// 排序条件类型
interface SortCondition {
  id: string
  field: string
  order: "asc" | "desc"
}

// 构建单个筛选条件
function buildFilterCondition(condition: FilterCondition): Prisma.DocumentWhereInput | null {
  const { field, operator, value } = condition
  
  if (Array.isArray(value)) {
    if (value.length === 0) return null
  } else {
    if (!value) return null
  }
  
  const strValue = Array.isArray(value) ? value[0] : value
  const arrValue = Array.isArray(value) ? value : [value]
  
  switch (field) {
    case "name":
      switch (operator) {
        case "contains": return { name: { contains: strValue, mode: "insensitive" } }
        case "equals": return { name: { equals: strValue, mode: "insensitive" } }
        case "notEquals": return { NOT: { name: { equals: strValue, mode: "insensitive" } } }
        case "startsWith": return { name: { startsWith: strValue, mode: "insensitive" } }
        case "endsWith": return { name: { endsWith: strValue, mode: "insensitive" } }
      }
      break
    case "fileType":
      switch (operator) {
        case "in": return { fileType: { in: arrValue } }
        case "notIn": return { fileType: { notIn: arrValue } }
        case "equals": return { fileType: strValue }
        case "notEquals": return { NOT: { fileType: strValue } }
        case "contains": return { fileType: { contains: strValue, mode: "insensitive" } }
      }
      break
    case "uploaderName":
      switch (operator) {
        case "contains": return { uploader: { name: { contains: strValue, mode: "insensitive" } } }
        case "equals": return { uploader: { name: { equals: strValue, mode: "insensitive" } } }
        case "notEquals": return { NOT: { uploader: { name: { equals: strValue, mode: "insensitive" } } } }
      }
      break
  }
  return null
}

// 构建筛选 where 条件
function buildFiltersWhere(filters: FilterCondition[]): Prisma.DocumentWhereInput {
  if (!filters || filters.length === 0) return {}
  
  const groups: FilterCondition[][] = []
  let currentGroup: FilterCondition[] = []
  
  filters.forEach((condition, index) => {
    if (index === 0 || condition.logic === "AND") {
      currentGroup.push(condition)
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }
      currentGroup = [condition]
    }
  })
  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }
  
  const orConditions: Prisma.DocumentWhereInput[] = groups.map(group => {
    const andConditions = group
      .map(c => buildFilterCondition(c))
      .filter((c): c is Prisma.DocumentWhereInput => c !== null)
    
    if (andConditions.length === 0) return {}
    if (andConditions.length === 1) return andConditions[0]
    return { AND: andConditions }
  }).filter(c => Object.keys(c).length > 0)
  
  if (orConditions.length === 0) return {}
  if (orConditions.length === 1) return orConditions[0]
  return { OR: orConditions }
}

// 字段映射
const fieldMapping: Record<string, string | { relation: string; field: string }> = {
  name: "name",
  fileType: "fileType",
  fileSize: "fileSize",
  createdAt: "createdAt",
  uploaderName: { relation: "uploader", field: "name" },
}

// 构建排序条件
function buildOrderBy(sorts: SortCondition[]): Prisma.DocumentOrderByWithRelationInput[] {
  if (!sorts || sorts.length === 0) {
    return [{ createdAt: "desc" }]
  }

  return sorts.map(sort => {
    const mapping = fieldMapping[sort.field]
    if (!mapping) {
      return { createdAt: sort.order }
    }

    if (typeof mapping === "string") {
      return { [mapping]: sort.order }
    } else {
      return { [mapping.relation]: { [mapping.field]: sort.order } }
    }
  })
}

// GET /api/products/[productId]/documents - 获取文档列表
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const filtersJson = searchParams.get("filters") || ""
    const sortsJson = searchParams.get("sorts") || ""
    
    // 解析筛选条件
    let filters: FilterCondition[] = []
    if (filtersJson) {
      try {
        filters = JSON.parse(filtersJson)
      } catch (e) {
        console.error("解析筛选条件失败:", e)
      }
    }
    
    // 解析排序条件
    let sorts: SortCondition[] = []
    if (sortsJson) {
      try {
        sorts = JSON.parse(sortsJson)
      } catch (e) {
        console.error("解析排序条件失败:", e)
      }
    }
    
    // 构建基础 where 条件
    const baseWhere: Prisma.DocumentWhereInput = {
      productId,
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    }
    
    // 构建高级筛选 where 条件
    const filtersWhere = buildFiltersWhere(filters)
    
    // 合并条件
    const finalWhere: Prisma.DocumentWhereInput = Object.keys(filtersWhere).length > 0
      ? { AND: [baseWhere, filtersWhere] }
      : baseWhere
    
    // 构建排序条件
    const orderBy = buildOrderBy(sorts)

    const documents = await prisma.document.findMany({
      where: finalWhere,
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy,
    })

    const result = documents.map((doc) => ({
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

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取文档列表失败:", error)
    return NextResponse.json({ error: "获取文档列表失败" }, { status: 500 })
  }
}

// POST /api/products/[productId]/documents - 上传文档（元数据）
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params
    const body = await request.json()
    const { name, fileName, fileSize, fileType, filePath } = body

    if (!fileName) {
      return NextResponse.json({ error: "文件名不能为空" }, { status: 400 })
    }

    // 获取当前登录用户
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const document = await prisma.document.create({
      data: {
        productId,
        name: name || fileName,
        fileName,
        fileSize: fileSize || 0,
        fileType: fileType || "application/octet-stream",
        filePath: filePath || `/uploads/${fileName}`,
        uploaderId: currentUserId,
      },
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("创建文档记录失败:", error)
    return NextResponse.json({ error: "创建文档记录失败" }, { status: 500 })
  }
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}
