// API 服务层

const API_BASE = "/api"

// 通用请求函数
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "请求失败" }))
    throw new Error(error.error || "请求失败")
  }

  return res.json()
}

// ==================== 产品 API ====================

export interface Product {
  id: string
  name: string
  code: string
  description: string | null
  status: string
  owner: { id: string; name: string; avatar: string | null }
  creator: { id: string; name: string; avatar: string | null }
  requirementCount: number
  starred: boolean
  createdAt: string
}

export interface ProductDetail extends Product {
  modules: Module[]
  documents: Document[]
  requirements: Requirement[]
}

export const productApi = {
  // 获取产品列表
  getList: (params?: { search?: string; starred?: boolean }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.starred) searchParams.set("starred", "true")
    const query = searchParams.toString()
    return request<Product[]>(`/products${query ? `?${query}` : ""}`)
  },

  // 获取产品详情
  getDetail: (productId: string) => {
    return request<ProductDetail>(`/products/${productId}`)
  },

  // 创建产品
  create: (data: { name: string; code: string; description?: string; ownerId?: string }) => {
    return request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 更新产品
  update: (productId: string, data: { name?: string; code?: string; description?: string; ownerId?: string }) => {
    return request<Product>(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // 删除产品
  delete: (productId: string) => {
    return request<{ success: boolean }>(`/products/${productId}`, {
      method: "DELETE",
    })
  },

  // 切换收藏状态
  toggleStar: (productId: string) => {
    return request<{ starred: boolean }>(`/products/${productId}/star`, {
      method: "POST",
    })
  },
}

// ==================== 产品版本 API ====================

export interface ProductVersion {
  id: string
  name: string
  description: string | null
  status: string
  plannedDate: string | null
  releaseDate: string | null
  requirementCount?: number
  createdAt?: string
}

export const versionApi = {
  // 获取版本列表
  getList: (productId: string) => {
    return request<ProductVersion[]>(`/products/${productId}/versions`)
  },

  // 创建版本
  create: (productId: string, data: { name: string; description?: string; plannedDate?: string }) => {
    return request<ProductVersion>(`/products/${productId}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}

// ==================== 模块 API ====================

export interface Module {
  id: string
  name: string
  description: string | null
  order: number
  requirementCount?: number
  children?: Module[]
}

export const moduleApi = {
  // 获取模块列表
  getList: (productId: string) => {
    return request<Module[]>(`/products/${productId}/modules`)
  },

  // 创建模块
  create: (productId: string, data: { name: string; description?: string; parentId?: string }) => {
    return request<Module>(`/products/${productId}/modules`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 更新模块
  update: (productId: string, moduleId: string, data: { name?: string; description?: string; order?: number; parentId?: string }) => {
    return request<Module>(`/products/${productId}/modules/${moduleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // 删除模块
  delete: (productId: string, moduleId: string) => {
    return request<{ success: boolean }>(`/products/${productId}/modules/${moduleId}`, {
      method: "DELETE",
    })
  },
}

// ==================== 需求 API ====================

// 子任务类型（简化版）
export interface RequirementTask {
  id: string
  title: string
  priority: string
  status: string
  moduleId: string | null
  moduleName: string | null
  assignee: { id: string; name: string; avatar: string | null } | null
  estimatedHours: number | null
}

export interface Requirement {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  moduleId: string | null
  moduleName: string | null
  projectId: string | null
  projectName: string | null
  sprintName: string | null
  creator: { id: string; name: string; avatar: string | null }
  assignee: { id: string; name: string; avatar: string | null } | null
  createdAt: string
  updatedAt: string
  // 子任务
  tasks?: RequirementTask[]
  taskCount?: number
}

// 树形表格行类型（需求或任务）
export interface WorkItemRow {
  id: string
  type: 'REQUIREMENT' | 'TASK'
  title: string
  priority: string
  status: string
  moduleId: string | null
  moduleName: string | null
  projectId: string | null
  projectName: string | null
  sprintName: string | null
  creator: { id: string; name: string; avatar: string | null } | null
  assignee: { id: string; name: string; avatar: string | null } | null
  createdAt: string
  updatedAt: string
  taskCount?: number
  children?: WorkItemRow[]
}

// 筛选条件类型
export interface FilterCondition {
  id: string
  logic: "AND" | "OR"
  field: string
  operator: string
  value: string | string[]  // 支持单选或多选
}

// 排序条件类型
export interface SortCondition {
  id: string
  field: string
  order: "asc" | "desc"
}

export const requirementApi = {
  // 获取需求列表
  getList: (productId: string, params?: { search?: string; moduleId?: string; filters?: FilterCondition[]; sorts?: SortCondition[] }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.moduleId) searchParams.set("moduleId", params.moduleId)
    // 将筛选条件序列化为 JSON 字符串传递
    if (params?.filters && params.filters.length > 0) {
      searchParams.set("filters", JSON.stringify(params.filters))
    }
    // 将排序条件序列化为 JSON 字符串传递
    if (params?.sorts && params.sorts.length > 0) {
      searchParams.set("sorts", JSON.stringify(params.sorts))
    }
    const query = searchParams.toString()
    return request<Requirement[]>(`/products/${productId}/requirements${query ? `?${query}` : ""}`)
  },

  // 创建需求
  create: (productId: string, data: { title: string; description?: string; priority?: string; moduleId?: string; projectId?: string }) => {
    return request<Requirement>(`/products/${productId}/requirements`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 更新需求
  update: (productId: string, requirementId: string, data: { title?: string; description?: string; priority?: string; status?: string; moduleId?: string; projectId?: string; devOwnerId?: string }) => {
    return request<Requirement>(`/products/${productId}/requirements/${requirementId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // 删除需求
  delete: (productId: string, requirementId: string) => {
    return request<{ success: boolean }>(`/products/${productId}/requirements/${requirementId}`, {
      method: "DELETE",
    })
  },
}

// ==================== 文档 API ====================

export interface Document {
  id: string
  name: string
  fileName: string
  fileSize: number
  fileType: string
  type: string
  size: string
  uploadedBy: { id: string; name: string; avatar: string | null }
  uploadedAt: string
}

export const documentApi = {
  // 获取文档列表
  getList: (productId: string, params?: { search?: string; filters?: FilterCondition[]; sorts?: SortCondition[] }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.filters && params.filters.length > 0) {
      searchParams.set("filters", JSON.stringify(params.filters))
    }
    if (params?.sorts && params.sorts.length > 0) {
      searchParams.set("sorts", JSON.stringify(params.sorts))
    }
    const query = searchParams.toString()
    return request<Document[]>(`/products/${productId}/documents${query ? `?${query}` : ""}`)
  },

  // 创建文档记录
  create: (productId: string, data: { name?: string; fileName: string; fileSize: number; fileType: string; filePath: string }) => {
    return request<Document>(`/products/${productId}/documents`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 删除文档
  delete: (productId: string, documentId: string) => {
    return request<{ success: boolean }>(`/products/${productId}/documents/${documentId}`, {
      method: "DELETE",
    })
  },
}

// ==================== 项目 API ====================

export interface Project {
  id: string
  name: string
  code: string
  description: string | null
  status: string
  starred: boolean
  startDate: string | null
  endDate: string | null
  products: { id: string; name: string; code: string }[]  // 多个产品
  creator: { id: string; name: string; avatar: string | null }
  members: { id: string; name: string; avatar: string | null }[]
  memberCount: number
  requirementCount: number
  sprintCount: number
  createdAt: string
}

export interface ProjectDetail extends Project {
  sprints: { id: string; name: string; status: string; startDate: string; endDate: string }[]
}

export const projectApi = {
  // 获取项目列表
  getList: (params?: { search?: string; starred?: boolean }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.starred) searchParams.set("starred", "true")
    const query = searchParams.toString()
    return request<Project[]>(`/projects${query ? `?${query}` : ""}`)
  },

  // 获取项目详情
  getDetail: (projectId: string) => {
    return request<ProjectDetail>(`/projects/${projectId}`)
  },

  // 创建项目
  create: (data: { name: string; code: string; description?: string; productIds?: string[]; startDate?: string; endDate?: string; memberIds?: string[] }) => {
    return request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 更新项目
  update: (projectId: string, data: { name?: string; code?: string; description?: string; productIds?: string[]; startDate?: string; endDate?: string; status?: string }) => {
    return request<Project>(`/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // 删除项目
  delete: (projectId: string) => {
    return request<{ success: boolean }>(`/projects/${projectId}`, {
      method: "DELETE",
    })
  },

  // 切换收藏状态
  toggleStar: (projectId: string) => {
    return request<{ starred: boolean }>(`/projects/${projectId}/star`, {
      method: "POST",
    })
  },
}

// ==================== 项目需求 API ====================

// 项目需求的子任务类型
export interface ProjectRequirementTask {
  id: string
  title: string
  priority: string
  status: string
  estimatedHours: number | null
  moduleId: string | null
  moduleName: string | null
  assignee: { id: string; name: string; avatar: string | null } | null
}

export interface ProjectRequirement {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  requirementType: string | null
  productId: string | null
  productName: string | null
  moduleId: string | null
  moduleName: string | null
  sprintId: string | null
  sprintName: string | null
  versionId: string | null
  versionName: string | null
  creator: { id: string; name: string; avatar: string | null }
  assignee: { id: string; name: string; avatar: string | null } | null
  progress: number
  childCount: number
  createdAt: string
  updatedAt: string
  // 子任务列表
  tasks?: ProjectRequirementTask[]
}

export const projectRequirementApi = {
  // 获取项目需求列表
  getList: (projectId: string, params?: { search?: string; sprintId?: string; productId?: string; moduleId?: string; filters?: FilterCondition[]; sorts?: SortCondition[] }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.sprintId) searchParams.set("sprintId", params.sprintId)
    if (params?.productId) searchParams.set("productId", params.productId)
    if (params?.moduleId) searchParams.set("moduleId", params.moduleId)
    if (params?.filters && params.filters.length > 0) {
      searchParams.set("filters", JSON.stringify(params.filters))
    }
    if (params?.sorts && params.sorts.length > 0) {
      searchParams.set("sorts", JSON.stringify(params.sorts))
    }
    const query = searchParams.toString()
    return request<ProjectRequirement[]>(`/projects/${projectId}/requirements${query ? `?${query}` : ""}`)
  },

  // 创建项目需求
  create: (projectId: string, data: {
    title: string
    description?: string
    priority?: string
    requirementType?: string
    productId?: string
    moduleId?: string
    sprintId?: string
    versionId?: string
    devOwnerId?: string
  }) => {
    return request<ProjectRequirement>(`/projects/${projectId}/requirements`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 批量导入产品需求到项目
  importFromProduct: (projectId: string, requirementIds: string[]) => {
    return request<{ success: boolean; count: number }>(`/projects/${projectId}/requirements/import`, {
      method: "POST",
      body: JSON.stringify({ requirementIds }),
    })
  },
}

// ==================== 迭代 API ====================

export interface Sprint {
  id: string
  name: string
  goal: string | null
  status: string
  startDate: string
  endDate: string
  requirementCount?: number
  createdAt?: string
}

export interface SprintStats {
  // 工作项总体统计
  totalWorkItems: number
  completedWorkItems: number
  inProgressWorkItems: number
  notStartedWorkItems: number
  progress: number
  // 按类型统计
  totalRequirements: number
  completedRequirements: number
  totalTasks: number
  completedTasks: number
  totalBugs: number
  completedBugs: number
  // 工时统计
  totalEstimatedHours: number
  totalActualHours: number
  completedEstimatedHours: number
}

export interface SprintMemberStats {
  user: { id: string; name: string; avatar: string | null }
  totalItems: number
  completedItems: number
  inProgressItems: number
  totalHours: number
  completedHours: number
  actualHours: number
}

export interface BurndownDataPoint {
  date: string
  ideal: number
  actual: number | null
}

export interface SprintRequirement {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  estimatedHours: number | null
  actualHours: number | null
  creator: { id: string; name: string; avatar: string | null }
  assignee: { id: string; name: string; avatar: string | null } | null
  childCount: number
  completedChildCount: number
}

export interface SprintDetail extends Sprint {
  project: { id: string; name: string }
  stats: SprintStats
  memberStats: SprintMemberStats[]
  burndownByHours: BurndownDataPoint[]
  burndownByItems: BurndownDataPoint[]
  requirements: SprintRequirement[]
}

export const sprintApi = {
  // 获取迭代列表
  getList: (projectId: string) => {
    return request<Sprint[]>(`/projects/${projectId}/sprints`)
  },

  // 获取迭代详情
  getDetail: (projectId: string, sprintId: string) => {
    return request<SprintDetail>(`/projects/${projectId}/sprints/${sprintId}`)
  },

  // 创建迭代
  create: (projectId: string, data: { name: string; goal?: string; startDate: string; endDate: string }) => {
    return request<Sprint>(`/projects/${projectId}/sprints`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 更新迭代
  update: (projectId: string, sprintId: string, data: { name?: string; goal?: string; startDate?: string; endDate?: string; status?: string }) => {
    return request<Sprint>(`/projects/${projectId}/sprints/${sprintId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // 删除迭代
  delete: (projectId: string, sprintId: string) => {
    return request<{ success: boolean }>(`/projects/${projectId}/sprints/${sprintId}`, {
      method: "DELETE",
    })
  },

  // 获取迭代任务列表（树形结构：任务 -> 工作项）
  getSprintTasks: (projectId: string, sprintId: string, params?: { search?: string; inSprint?: boolean }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.inSprint !== undefined) searchParams.set("inSprint", String(params.inSprint))
    const query = searchParams.toString()
    return request<SprintTaskItem[]>(`/projects/${projectId}/sprints/${sprintId}/workitems${query ? `?${query}` : ""}`)
  },

  // 批量移入工作项到迭代
  addWorkItems: (projectId: string, sprintId: string, workItemIds: string[]) => {
    return request<{ success: boolean; count: number; message: string }>(`/projects/${projectId}/sprints/${sprintId}/workitems`, {
      method: "POST",
      body: JSON.stringify({ workItemIds }),
    })
  },

  // 批量移出工作项
  removeWorkItems: (projectId: string, sprintId: string, workItemIds: string[]) => {
    return request<{ success: boolean; count: number; message: string }>(`/projects/${projectId}/sprints/${sprintId}/workitems?ids=${workItemIds.join(",")}`, {
      method: "DELETE",
    })
  },
}

// 迭代任务列表项类型（任务 -> 工作项树形结构）
export interface SprintTaskItem {
  id: string
  title: string
  type: string
  priority: string
  status: string
  estimatedHours: number | null
  actualHours: number | null
  isInSprint: boolean
  product: { id: string; name: string } | null
  module: { id: string; name: string } | null
  assignee: { id: string; name: string; avatar: string | null } | null
  creator: { id: string; name: string; avatar: string | null } | null
  parent: { id: string; title: string; type: string } | null
  createdAt: string | null
  updatedAt: string | null
  childCount: number
  completedChildCount: number
  children?: SprintTaskChild[]
}

// 迭代任务的子工作项类型
export interface SprintTaskChild {
  id: string
  title: string
  type: string
  priority: string
  status: string
  estimatedHours: number | null
  actualHours: number | null
  module: { id: string; name: string } | null
  assignee: { id: string; name: string; avatar: string | null } | null
}

// 旧类型别名（向后兼容）
export type SprintWorkItem = SprintTaskItem
