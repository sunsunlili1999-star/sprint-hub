import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma, Priority } from "@prisma/client"
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
  value: string | string[]  // 支持单选或多选
}

// 排序条件类型
interface SortCondition {
  id: string
  field: string
  order: "asc" | "desc"
}

// 构建单个筛选条件的 Prisma where 子句
function buildFilterCondition(condition: FilterCondition): Prisma.WorkItemWhereInput | null {
  const { field, operator, value } = condition
  
  // 检查值是否为空
  if (Array.isArray(value)) {
    if (value.length === 0) return null
  } else {
    if (!value) return null
  }
  
  // 确保 value 是字符串（用于非多选运算符）
  const strValue = Array.isArray(value) ? value[0] : value
  // 确保 value 是数组（用于多选运算符）
  const arrValue = Array.isArray(value) ? value : [value]
  
  switch (field) {
    case "title":
      switch (operator) {
        case "contains": return { title: { contains: strValue, mode: "insensitive" } }
        case "equals": return { title: { equals: strValue, mode: "insensitive" } }
        case "notEquals": return { NOT: { title: { equals: strValue, mode: "insensitive" } } }
        case "startsWith": return { title: { startsWith: strValue, mode: "insensitive" } }
        case "endsWith": return { title: { endsWith: strValue, mode: "insensitive" } }
      }
      break
    case "description":
      switch (operator) {
        case "contains": return { description: { contains: strValue, mode: "insensitive" } }
        case "equals": return { description: { equals: strValue, mode: "insensitive" } }
        case "notEquals": return { NOT: { description: { equals: strValue, mode: "insensitive" } } }
        case "startsWith": return { description: { startsWith: strValue, mode: "insensitive" } }
        case "endsWith": return { description: { endsWith: strValue, mode: "insensitive" } }
      }
      break
    case "status":
      switch (operator) {
        case "in": return { devStatus: { in: arrValue } }
        case "notIn": return { devStatus: { notIn: arrValue } }
        case "equals": return { devStatus: strValue }
        case "notEquals": return { NOT: { devStatus: strValue } }
      }
      break
    case "priority":
      switch (operator) {
        case "in": return { priority: { in: arrValue as Priority[] } }
        case "notIn": return { priority: { notIn: arrValue as Priority[] } }
        case "equals": return { priority: strValue as Priority }
        case "notEquals": return { NOT: { priority: strValue as Priority } }
      }
      break
    case "creatorName":
      switch (operator) {
        case "contains": return { creator: { name: { contains: strValue, mode: "insensitive" } } }
        case "equals": return { creator: { name: { equals: strValue, mode: "insensitive" } } }
        case "notEquals": return { NOT: { creator: { name: { equals: strValue, mode: "insensitive" } } } }
        case "startsWith": return { creator: { name: { startsWith: strValue, mode: "insensitive" } } }
        case "endsWith": return { creator: { name: { endsWith: strValue, mode: "insensitive" } } }
      }
      break
    case "assigneeName":
      switch (operator) {
        case "contains": return { devOwner: { name: { contains: strValue, mode: "insensitive" } } }
        case "equals": return { devOwner: { name: { equals: strValue, mode: "insensitive" } } }
        case "notEquals": return { NOT: { devOwner: { name: { equals: strValue, mode: "insensitive" } } } }
        case "startsWith": return { devOwner: { name: { startsWith: strValue, mode: "insensitive" } } }
        case "endsWith": return { devOwner: { name: { endsWith: strValue, mode: "insensitive" } } }
      }
      break
  }
  return null
}

// 构建完整的筛选 where 子句（支持 AND/OR 混合逻辑）
function buildFiltersWhere(filters: FilterCondition[]): Prisma.WorkItemWhereInput {
  if (!filters || filters.length === 0) return {}
  
  // 将条件按逻辑分组
  // 思路：从左到右处理，遇到 OR 就分组
  const groups: FilterCondition[][] = []
  let currentGroup: FilterCondition[] = []
  
  filters.forEach((condition, index) => {
    if (index === 0 || condition.logic === "AND") {
      currentGroup.push(condition)
    } else {
      // OR 逻辑，开始新组
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }
      currentGroup = [condition]
    }
  })
  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }
  
  // 每个组内是 AND，组之间是 OR
  const orConditions: Prisma.WorkItemWhereInput[] = groups.map(group => {
    const andConditions = group
      .map(c => buildFilterCondition(c))
      .filter((c): c is Prisma.WorkItemWhereInput => c !== null)
    
    if (andConditions.length === 0) return {}
    if (andConditions.length === 1) return andConditions[0]
    return { AND: andConditions }
  }).filter(c => Object.keys(c).length > 0)
  
  if (orConditions.length === 0) return {}
  if (orConditions.length === 1) return orConditions[0]
  return { OR: orConditions }
}

// 字段名映射（前端字段名 -> 数据库字段名/路径）
const fieldMapping: Record<string, string | { relation: string; field: string }> = {
  title: "title",
  priority: "priority",
  status: "devStatus",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  moduleName: { relation: "module", field: "name" },
  projectName: { relation: "project", field: "name" },
  sprintName: { relation: "sprint", field: "name" },
  creatorName: { relation: "creator", field: "name" },
  assigneeName: { relation: "devOwner", field: "name" },
}

// 构建排序条件
function buildOrderBy(sorts: SortCondition[]): Prisma.WorkItemOrderByWithRelationInput[] {
  if (!sorts || sorts.length === 0) {
    return [{ createdAt: "desc" }] // 默认排序
  }

  return sorts.map(sort => {
    const mapping = fieldMapping[sort.field]
    if (!mapping) {
      return { createdAt: sort.order }
    }

    if (typeof mapping === "string") {
      return { [mapping]: sort.order }
    } else {
      // 关联字段排序
      return { [mapping.relation]: { [mapping.field]: sort.order } }
    }
  })
}

// GET /api/products/[productId]/requirements - 获取需求列表
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const moduleId = searchParams.get("moduleId") || ""
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
    const baseWhere: Prisma.WorkItemWhereInput = {
      productId,
      type: "REQUIREMENT",
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(moduleId && moduleId !== "all" && moduleId !== "unassigned" && { moduleId }),
      ...(moduleId === "unassigned" && { moduleId: null }),
    }
    
    // 构建高级筛选 where 条件
    const filtersWhere = buildFiltersWhere(filters)
    
    // 合并条件
    const finalWhere: Prisma.WorkItemWhereInput = Object.keys(filtersWhere).length > 0
      ? { AND: [baseWhere, filtersWhere] }
      : baseWhere

    // 构建排序条件
    const orderBy = buildOrderBy(sorts)

    const requirements = await prisma.workItem.findMany({
      where: finalWhere,
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
      orderBy,
    })

    const result = requirements.map((item) => ({
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

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取需求列表失败:", error)
    return NextResponse.json({ error: "获取需求列表失败" }, { status: 500 })
  }
}

// POST /api/products/[productId]/requirements - 创建需求
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params
    const body = await request.json()
    const { title, description, priority, moduleId, projectId } = body

    if (!title) {
      return NextResponse.json({ error: "需求标题不能为空" }, { status: 400 })
    }

    // 获取当前登录用户
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const requirement = await prisma.workItem.create({
      data: {
        productId,
        type: "REQUIREMENT",
        title,
        description,
        priority: priority || "P2",
        moduleId,
        projectId,
        creatorId: currentUserId,
        devStatus: "NOT_STARTED",
        testStatus: "NOT_STARTED",
        verifyStatus: "NOT_STARTED",
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        module: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(requirement, { status: 201 })
  } catch (error) {
    console.error("创建需求失败:", error)
    return NextResponse.json({ error: "创建需求失败" }, { status: 500 })
  }
}
