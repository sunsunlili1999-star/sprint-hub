// 任务相关 API

export interface TaskDetail {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  currentPhase: string
  
  // 父级需求
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
  
  // 进度
  progress: number
  childCount: number
  completedChildCount: number
  
  // 时间戳
  createdAt: string
  updatedAt: string
  
  // 子工作项
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

export interface CreateTaskData {
  title: string
  description?: string
  priority?: string
  parentId?: string  // 父级需求 ID
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

export interface UpdateTaskData {
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

export const taskDetailApi = {
  // 获取任务详情
  async getDetail(id: string): Promise<TaskDetail> {
    const res = await fetch(`/api/tasks/${id}`)
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "获取任务详情失败")
    }
    return res.json()
  },

  // 创建任务
  async create(data: CreateTaskData): Promise<TaskDetail> {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "创建任务失败")
    }
    return res.json()
  },

  // 更新任务
  async update(id: string, data: UpdateTaskData): Promise<TaskDetail> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "更新任务失败")
    }
    return res.json()
  },

  // 删除任务
  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "删除任务失败")
    }
  },

  // 添加评论
  async addComment(taskId: string, content: string): Promise<Comment> {
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
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
    taskId: string,
    data: { title: string; type?: string; priority?: string; devOwnerId?: string }
  ): Promise<ChildWorkItem> {
    const res = await fetch(`/api/tasks/${taskId}/children`, {
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
    taskId: string,
    dependsOnId: string
  ): Promise<Dependency> {
    const res = await fetch(`/api/tasks/${taskId}/dependencies`, {
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
  async removeDependency(taskId: string, dependencyId: string): Promise<void> {
    const res = await fetch(
      `/api/tasks/${taskId}/dependencies?id=${dependencyId}`,
      { method: "DELETE" }
    )
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "删除依赖失败")
    }
  },
}
