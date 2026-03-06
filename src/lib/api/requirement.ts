// 需求相关 API

export interface RequirementDetail {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  requirementType: string | null
  currentPhase: string
  
  // 关联信息
  productId: string | null
  productName: string | null
  projectId: string | null
  projectName: string | null
  sprintId: string | null
  sprintName: string | null
  moduleId: string | null
  moduleName: string | null
  versionId: string | null
  versionName: string | null
  
  // 人员
  creator: { id: string; name: string; avatar: string | null }
  assignee: { id: string; name: string; avatar: string | null } | null
  testOwner: { id: string; name: string; avatar: string | null } | null
  verifyOwner: { id: string; name: string; avatar: string | null } | null
  
  // 时间
  plannedStartDate: string | null
  plannedEndDate: string | null
  actualStartDate: string | null
  actualEndDate: string | null
  
  // 工时
  estimatedHours: number | null
  actualHours: number | null
  
  // 进度
  progress: number
  childCount: number
  completedChildCount: number
  
  // 时间戳
  createdAt: string
  updatedAt: string
  
  // 子任务
  children: ChildWorkItem[]
  
  // 依赖
  dependencies: Dependency[]
  dependents: Dependency[]
  
  // 评论
  comments: Comment[]
  
  // 操作记录
  activityLogs: ActivityLog[]
}

export interface ChildWorkItem {
  id: string
  type: string
  title: string
  priority: string
  status: string
  assignee: { id: string; name: string; avatar: string | null } | null
}

export interface Dependency {
  id: string
  type: string
  workItem: { id: string; title: string; status: string }
}

export interface Comment {
  id: string
  content: string
  user: { id: string; name: string; avatar: string | null }
  createdAt: string
}

export interface ActivityLog {
  id: string
  action: string
  oldValue: string | null
  newValue: string | null
  user: { id: string; name: string; avatar: string | null }
  createdAt: string
}

export interface CreateRequirementData {
  title: string
  description?: string
  priority?: string
  requirementType?: string
  productId?: string
  projectId?: string
  sprintId?: string
  versionId?: string
  moduleId?: string
  devOwnerId?: string
  plannedStartDate?: string
  plannedEndDate?: string
  estimatedHours?: number
}

export interface UpdateRequirementData {
  title?: string
  description?: string
  priority?: string
  status?: string
  requirementType?: string
  productId?: string
  projectId?: string
  sprintId?: string
  versionId?: string
  moduleId?: string
  devOwnerId?: string
  plannedStartDate?: string
  plannedEndDate?: string
  estimatedHours?: number
}

export const requirementDetailApi = {
  // 获取需求详情
  async getDetail(id: string): Promise<RequirementDetail> {
    const res = await fetch(`/api/requirements/${id}`)
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "获取需求详情失败")
    }
    return res.json()
  },

  // 创建需求
  async create(data: CreateRequirementData): Promise<RequirementDetail> {
    const res = await fetch("/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "创建需求失败")
    }
    return res.json()
  },

  // 更新需求
  async update(id: string, data: UpdateRequirementData): Promise<RequirementDetail> {
    const res = await fetch(`/api/requirements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "更新需求失败")
    }
    return res.json()
  },

  // 删除需求
  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/requirements/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "删除需求失败")
    }
  },

  // 添加评论
  async addComment(requirementId: string, content: string): Promise<Comment> {
    const res = await fetch(`/api/requirements/${requirementId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "添加评论失败")
    }
    return res.json()
  },

  // 添加子工作项
  async addChild(
    requirementId: string,
    data: { title: string; type?: string; priority?: string; devOwnerId?: string }
  ): Promise<ChildWorkItem> {
    const res = await fetch(`/api/requirements/${requirementId}/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "添加子工作项失败")
    }
    return res.json()
  },

  // 添加依赖
  async addDependency(
    requirementId: string,
    dependsOnId: string
  ): Promise<Dependency> {
    const res = await fetch(`/api/requirements/${requirementId}/dependencies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependsOnId }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "添加依赖失败")
    }
    return res.json()
  },

  // 删除依赖
  async removeDependency(requirementId: string, dependencyId: string): Promise<void> {
    const res = await fetch(
      `/api/requirements/${requirementId}/dependencies?id=${dependencyId}`,
      { method: "DELETE" }
    )
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "删除依赖失败")
    }
  },
}

// 用户列表 API
export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
}

export const userApi = {
  async getList(search?: string): Promise<User[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : ""
    const res = await fetch(`/api/users${params}`)
    if (!res.ok) {
      throw new Error("获取用户列表失败")
    }
    return res.json()
  },
}

// 选项数据 API
export interface SelectOption {
  value: string
  label: string
}

export const optionsApi = {
  // 获取产品列表
  async getProducts(): Promise<SelectOption[]> {
    const res = await fetch("/api/products")
    if (!res.ok) {
      throw new Error("获取产品列表失败")
    }
    const products = await res.json()
    return products.map((p: { id: string; name: string }) => ({
      value: p.id,
      label: p.name,
    }))
  },

  // 获取项目列表
  async getProjects(): Promise<SelectOption[]> {
    const res = await fetch("/api/projects")
    if (!res.ok) {
      throw new Error("获取项目列表失败")
    }
    const projects = await res.json()
    return projects.map((p: { id: string; name: string }) => ({
      value: p.id,
      label: p.name,
    }))
  },

  // 获取产品下的模块列表
  async getModulesByProduct(productId: string): Promise<SelectOption[]> {
    const res = await fetch(`/api/products/${productId}/modules`)
    if (!res.ok) {
      throw new Error("获取模块列表失败")
    }
    const modules = await res.json()
    return modules.map((m: { id: string; name: string }) => ({
      value: m.id,
      label: m.name,
    }))
  },

  // 获取项目下的迭代列表
  async getSprintsByProject(projectId: string): Promise<SelectOption[]> {
    const res = await fetch(`/api/projects/${projectId}/sprints`)
    if (!res.ok) {
      throw new Error("获取迭代列表失败")
    }
    const sprints = await res.json()
    return sprints.map((s: { id: string; name: string }) => ({
      value: s.id,
      label: s.name,
    }))
  },
}
