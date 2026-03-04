import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getDaysUntil(date: Date | string): number {
  const target = new Date(date)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(date: Date | string): boolean {
  return getDaysUntil(date) < 0
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    P0: 'bg-red-500 text-white',
    P1: 'bg-orange-500 text-white',
    P2: 'bg-yellow-500 text-white',
    P3: 'bg-blue-500 text-white',
    P4: 'bg-gray-500 text-white',
  }
  return colors[priority] || colors.P2
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NOT_STARTED: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-200 text-gray-600',
    SUSPENDED: 'bg-yellow-100 text-yellow-800',
    RELEASED: 'bg-purple-100 text-purple-800',
  }
  return colors[status] || colors.NOT_STARTED
}

export function getWorkItemTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    REQUIREMENT: '需求',
    TASK: '任务',
    BUG: '缺陷',
  }
  return labels[type] || type
}

export function getWorkItemTypeColor(type: string): string {
  const colors: Record<string, string> = {
    REQUIREMENT: 'bg-purple-100 text-purple-800 border-purple-200',
    TASK: 'bg-blue-100 text-blue-800 border-blue-200',
    BUG: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[type] || ''
}

export function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    DEVELOPMENT: '开发',
    TESTING: '测试',
    VERIFICATION: '验收',
  }
  return labels[phase] || phase
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NOT_STARTED: '未开始',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CLOSED: '关闭',
    SUSPENDED: '挂起',
    RELEASED: '已发布',
  }
  return labels[status] || status
}
