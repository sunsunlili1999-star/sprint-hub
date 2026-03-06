// 工作项相关 API（最细粒度，无子项）

export interface WorkItemDetail {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  currentPhase: string
  
  // 父级任务
  parentId: string | null
  parentTitle: string | null
  
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
  
  // 时间戳
  createdAt: string
  updatedAt: string
  
  // 依赖
  dependencies: Dependency[]
  dependents: Dependency[]
  
  // 评论
  comments: Comment[]
  
  // 操作记录
  activityLogs: ActivityLog[]
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

export interface CreateWorkItemData {
  title: string
  description?: string
  priority?: string
  parentId?: string  // 父级任务 ID
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

export interface UpdateWorkItemData {
  title?: string
  description?: string
  priority?: string
  status?: string
  parentId?: string
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

export const workItemDetailApi = {
  // 获取工作项详情
  async getDetail(id: string): Promise<WorkItemDetail> {
    const res = await fetch(`/api/workitems/${id}`)
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "获取工作项详情失败")
    }
    return res.json()
  },

  // 创建工作项
  async create(data: CreateWorkItemData): Promise<WorkItemDetail> {
    const res = await fetch("/api/workitems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "创建工作项失败")
    }
    return res.json()
  },

  // 更新工作项
  async update(id: string, data: UpdateWorkItemData): Promise<WorkItemDetail> {
    const res = await fetch(`/api/workitems/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "更新工作项失败")
    }
    return res.json()
  },

  // 删除工作项
  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/workitems/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "删除工作项失败")
    }
  },

  // 添加评论
  async addComment(workItemId: string, content: string): Promise<Comment> {
    const res = await fetch(`/api/workitems/${workItemId}/comments`, {
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

  // 添加依赖
  async addDependency(
    workItemId: string,
    dependsOnId: string
  ): Promise<Dependency> {
    const res = await fetch(`/api/workitems/${workItemId}/dependencies`, {
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
  async removeDependency(workItemId: string, dependencyId: string): Promise<void> {
    const res = await fetch(
      `/api/workitems/${workItemId}/dependencies?id=${dependencyId}`,
      { method: "DELETE" }
    )
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "删除依赖失败")
    }
  },
}
