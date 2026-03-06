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
  product: { id: string; name: string; code: string } | null
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
  create: (data: { name: string; code: string; description?: string; productId?: string; startDate?: string; endDate?: string; memberIds?: string[] }) => {
    return request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 更新项目
  update: (projectId: string, data: { name?: string; code?: string; description?: string; productId?: string; startDate?: string; endDate?: string; status?: string }) => {
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
}

export const projectRequirementApi = {
  // 获取项目需求列表
  getList: (projectId: string, params?: { search?: string; sprintId?: string; sorts?: SortCondition[] }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.sprintId) searchParams.set("sprintId", params.sprintId)
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

export const sprintApi = {
  // 获取迭代列表
  getList: (projectId: string) => {
    return request<Sprint[]>(`/projects/${projectId}/sprints`)
  },

  // 创建迭代
  create: (projectId: string, data: { name: string; goal?: string; startDate: string; endDate: string }) => {
    return request<Sprint>(`/projects/${projectId}/sprints`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 删除迭代
  delete: (projectId: string, sprintId: string) => {
    return request<{ success: boolean }>(`/projects/${projectId}/sprints/${sprintId}`, {
      method: "DELETE",
    })
  },
}
