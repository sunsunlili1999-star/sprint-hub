"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

// 模拟待办数据（按需求分组）
const mockTodos = [
  {
    id: "req-1",
    type: "REQUIREMENT",
    title: "用户登录功能",
    priority: "P1",
    startDate: "03-01",
    endDate: "03-15",
    project: "用户系统",
    expanded: true,
    children: [
      {
        id: "task-1",
        type: "TASK",
        title: "前端登录页面开发",
        priority: "P1",
        startDate: "03-01",
        endDate: "03-05",
        status: "IN_PROGRESS",
        isToday: true,
        completed: false,
      },
      {
        id: "task-2",
        type: "TASK",
        title: "后端登录接口开发",
        priority: "P1",
        startDate: "03-01",
        endDate: "03-03",
        status: "COMPLETED",
        isToday: false,
        completed: true,
      },
      {
        id: "task-3",
        type: "TASK",
        title: "联调后端登录接口",
        priority: "P1",
        startDate: "03-04",
        endDate: "03-06",
        status: "NOT_STARTED",
        isToday: true,
        completed: false,
        dependency: "后端登录接口开发",
      },
    ],
  },
  {
    id: "req-2",
    type: "REQUIREMENT",
    title: "用户注册功能",
    priority: "P2",
    startDate: "03-05",
    endDate: "03-20",
    project: "用户系统",
    expanded: true,
    children: [
      {
        id: "task-4",
        type: "TASK",
        title: "前端注册页面开发",
        priority: "P2",
        startDate: "03-05",
        endDate: "03-10",
        status: "NOT_STARTED",
        isToday: true,
        completed: false,
      },
      {
        id: "task-5",
        type: "TASK",
        title: "邮箱验证功能开发",
        priority: "P2",
        startDate: "03-08",
        endDate: "03-12",
        status: "NOT_STARTED",
        isToday: false,
        completed: false,
      },
    ],
  },
  {
    id: "bug-1",
    type: "BUG",
    title: "登录按钮样式问题",
    priority: "P3",
    startDate: "03-02",
    endDate: "03-03",
    project: "用户系统",
    status: "NOT_STARTED",
    isToday: true,
    completed: false,
    isOverdue: true,
  },
]

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    P0: "bg-red-500 text-white",
    P1: "bg-orange-500 text-white",
    P2: "bg-yellow-500 text-white",
    P3: "bg-blue-500 text-white",
    P4: "bg-gray-500 text-white",
  }
  return colors[priority] || colors.P2
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    REQUIREMENT: "bg-purple-100 text-purple-800",
    TASK: "bg-blue-100 text-blue-800",
    BUG: "bg-red-100 text-red-800",
  }
  return colors[type] || ""
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    REQUIREMENT: "需求",
    TASK: "任务",
    BUG: "缺陷",
  }
  return labels[type] || type
}

interface TodoItemProps {
  item: {
    id: string
    type: string
    title: string
    priority: string
    startDate: string
    endDate: string
    status?: string
    isToday?: boolean
    completed?: boolean
    isOverdue?: boolean
    dependency?: string
  }
  isChild?: boolean
}

function TodoItem({ item, isChild = false }: TodoItemProps) {
  const [completed, setCompleted] = useState(item.completed || false)
  const [inProgress, setInProgress] = useState(item.status === "IN_PROGRESS")

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border bg-white hover:shadow-sm transition-all",
        isChild && "ml-8",
        item.isOverdue && "border-red-200 bg-red-50",
        completed && "opacity-60"
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={completed}
          onCheckedChange={(checked) => setCompleted(checked as boolean)}
          className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
        />
        <Badge className={cn("text-xs", getTypeColor(item.type))}>
          {getTypeLabel(item.type)}
        </Badge>
        <Badge className={cn("text-xs", getPriorityColor(item.priority))}>
          {item.priority}
        </Badge>
        <span className={cn("font-medium", completed && "line-through text-muted-foreground")}>
          {item.title}
        </span>
        {item.isOverdue && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            逾期
          </Badge>
        )}
        {item.dependency && (
          <span className="text-xs text-muted-foreground">
            依赖: {item.dependency}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {item.startDate} ~ {item.endDate}
        </span>
        {!completed && (
          <Button
            size="sm"
            variant={inProgress ? "default" : "outline"}
            className={cn("h-7", inProgress && "bg-blue-500 hover:bg-blue-600")}
            onClick={() => setInProgress(!inProgress)}
          >
            {inProgress ? (
              <>
                <Clock className="w-3 h-3 mr-1" />
                进行中
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" />
                开始
              </>
            )}
          </Button>
        )}
        {completed && (
          <Badge variant="success" className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            已完成
          </Badge>
        )}
      </div>
    </div>
  )
}

interface RequirementGroupProps {
  requirement: {
    id: string
    type: string
    title: string
    priority: string
    startDate: string
    endDate: string
    project: string
    expanded: boolean
    children?: Array<{
      id: string
      type: string
      title: string
      priority: string
      startDate: string
      endDate: string
      status?: string
      isToday?: boolean
      completed?: boolean
      dependency?: string
    }>
  }
}

function RequirementGroup({ requirement }: RequirementGroupProps) {
  const [expanded, setExpanded] = useState(requirement.expanded)
  const completedCount = requirement.children?.filter((c) => c.completed).length || 0
  const totalCount = requirement.children?.length || 0

  return (
    <div className="space-y-2">
      {/* 需求标题行 */}
      <div
        className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 cursor-pointer hover:shadow-sm transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <Badge className={cn("text-xs", getTypeColor(requirement.type))}>
            {getTypeLabel(requirement.type)}
          </Badge>
          <Badge className={cn("text-xs", getPriorityColor(requirement.priority))}>
            {requirement.priority}
          </Badge>
          <span className="font-medium">{requirement.title}</span>
          <span className="text-sm text-muted-foreground">· {requirement.project}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {requirement.startDate} ~ {requirement.endDate}
          </span>
          <Badge variant="outline">
            {completedCount}/{totalCount} 完成
          </Badge>
        </div>
      </div>

      {/* 子任务列表 */}
      {expanded && requirement.children && (
        <div className="space-y-2 animate-fade-in">
          {requirement.children.map((child) => (
            <TodoItem key={child.id} item={child} isChild />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TodosPage() {
  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  // 计算统计数据
  const allTasks = mockTodos.flatMap((item) =>
    item.children ? item.children : [item]
  )
  const todayTasks = allTasks.filter((t) => t.isToday)
  const completedTasks = allTasks.filter((t) => t.completed)
  const overdueTasks = allTasks.filter((t) => "isOverdue" in t && t.isOverdue)

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            智能待办
          </h1>
          <p className="text-muted-foreground">
            今日 {today} · 共 {todayTasks.length} 项待办
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Sparkles className="w-4 h-4 mr-2" />
          生成今日日报
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <p className="text-sm text-muted-foreground">今日待办</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            <p className="text-sm text-muted-foreground">已完成</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {todayTasks.filter((t) => t.status === "IN_PROGRESS").length}
            </div>
            <p className="text-sm text-muted-foreground">进行中</p>
          </CardContent>
        </Card>
        <Card className={overdueTasks.length > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
            <p className="text-sm text-muted-foreground">已逾期</p>
          </CardContent>
        </Card>
      </div>

      {/* 待办列表 */}
      <Card>
        <CardHeader>
          <Tabs defaultValue="today" className="w-full">
            <TabsList>
              <TabsTrigger value="today">今天</TabsTrigger>
              <TabsTrigger value="week">本周</TabsTrigger>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="overdue" className="text-red-600">
                逾期 ({overdueTasks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-4 space-y-4">
              {/* 独立的缺陷 */}
              {mockTodos
                .filter((item) => item.type === "BUG" && !item.children)
                .map((item) => (
                  <TodoItem key={item.id} item={item as TodoItemProps["item"]} />
                ))}

              {/* 需求分组 */}
              {mockTodos
                .filter((item) => item.type === "REQUIREMENT" && item.children)
                .map((req) => (
                  <RequirementGroup key={req.id} requirement={req as RequirementGroupProps["requirement"]} />
                ))}
            </TabsContent>

            <TabsContent value="week" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                本周待办视图
              </div>
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                全部待办视图
              </div>
            </TabsContent>

            <TabsContent value="overdue" className="mt-4 space-y-4">
              {mockTodos
                .filter((item) => "isOverdue" in item && item.isOverdue)
                .map((item) => (
                  <TodoItem key={item.id} item={item as TodoItemProps["item"]} />
                ))}
              {overdueTasks.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">没有逾期的工作项</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* 进度记录提示 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">记录你的工作进度</p>
                <p className="text-sm text-muted-foreground">
                  点击「开始」标记今天进行了此任务，点击复选框标记完成
                </p>
              </div>
            </div>
            <Button variant="outline">
              查看进度记录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
