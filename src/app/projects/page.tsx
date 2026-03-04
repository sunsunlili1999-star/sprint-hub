"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreVertical,
  Users,
  Calendar,
  FolderKanban,
  Archive,
  Star,
  StarOff,
} from "lucide-react"
import Link from "next/link"

// 模拟项目数据
const mockProjects = [
  {
    id: "1",
    name: "用户系统重构",
    code: "USR",
    description: "重构现有用户系统，提升性能和用户体验",
    status: "ACTIVE",
    progress: 65,
    currentSprint: "Sprint 3",
    memberCount: 8,
    workItemCount: 24,
    endDate: "2026-03-15",
    starred: true,
    members: [
      { name: "张三", avatar: "张" },
      { name: "李四", avatar: "李" },
      { name: "王五", avatar: "王" },
    ],
  },
  {
    id: "2",
    name: "支付模块优化",
    code: "PAY",
    description: "优化支付流程，接入新的支付渠道",
    status: "ACTIVE",
    progress: 40,
    currentSprint: "Sprint 2",
    memberCount: 5,
    workItemCount: 18,
    endDate: "2026-03-20",
    starred: false,
    members: [
      { name: "赵六", avatar: "赵" },
      { name: "钱七", avatar: "钱" },
    ],
  },
  {
    id: "3",
    name: "后台管理系统",
    code: "ADMIN",
    description: "内部管理系统，用于运营和数据分析",
    status: "ACTIVE",
    progress: 85,
    currentSprint: "Sprint 5",
    memberCount: 6,
    workItemCount: 32,
    endDate: "2026-03-10",
    starred: true,
    members: [
      { name: "张三", avatar: "张" },
      { name: "孙八", avatar: "孙" },
      { name: "周九", avatar: "周" },
    ],
  },
  {
    id: "4",
    name: "移动端APP",
    code: "APP",
    description: "iOS和Android移动应用开发",
    status: "ARCHIVED",
    progress: 100,
    currentSprint: "已完成",
    memberCount: 4,
    workItemCount: 45,
    endDate: "2026-02-28",
    starred: false,
    members: [
      { name: "李四", avatar: "李" },
      { name: "王五", avatar: "王" },
    ],
  },
]

export default function ProjectsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "archived" | "starred">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.code.toLowerCase().includes(searchQuery.toLowerCase())

    if (filter === "all") return matchesSearch
    if (filter === "active") return project.status === "ACTIVE" && matchesSearch
    if (filter === "archived") return project.status === "ARCHIVED" && matchesSearch
    if (filter === "starred") return project.starred && matchesSearch
    return matchesSearch
  })

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">项目列表</h1>
          <p className="text-muted-foreground">管理你参与的所有项目</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              新建项目
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新项目</DialogTitle>
              <DialogDescription>填写项目基本信息来创建一个新项目</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">项目名称</label>
                <Input placeholder="输入项目名称" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">项目编码</label>
                <Input placeholder="如: USR, PAY" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">项目描述</label>
                <Input placeholder="简要描述项目目标" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">取消</Button>
              <Button>创建项目</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选和搜索 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索项目名称或编码..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            全部
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            进行中
          </Button>
          <Button
            variant={filter === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("archived")}
          >
            已归档
          </Button>
          <Button
            variant={filter === "starred" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("starred")}
          >
            <Star className="w-4 h-4 mr-1" />
            已收藏
          </Button>
        </div>
      </div>

      {/* 项目卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className={`hover:shadow-lg transition-all cursor-pointer ${
              project.status === "ARCHIVED" ? "opacity-70" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <Link href={`/projects/${project.id}`}>
                      <CardTitle className="text-lg hover:text-blue-600 transition-colors">
                        {project.name}
                      </CardTitle>
                    </Link>
                    <Badge variant="outline" className="mt-1">
                      {project.code}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {project.starred ? (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>编辑项目</DropdownMenuItem>
                      <DropdownMenuItem>项目设置</DropdownMenuItem>
                      <DropdownMenuItem>成员管理</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Archive className="w-4 h-4 mr-2" />
                        归档项目
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardDescription className="mt-2 line-clamp-2">
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 进度条 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">项目进度</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              {/* 项目信息 */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {project.currentSprint}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {project.memberCount}
                  </span>
                </div>
                <Badge variant={project.status === "ACTIVE" ? "success" : "secondary"}>
                  {project.status === "ACTIVE" ? "进行中" : "已归档"}
                </Badge>
              </div>

              {/* 成员头像 */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {project.members.slice(0, 4).map((member, index) => (
                    <Avatar key={index} className="w-8 h-8 border-2 border-white">
                      <AvatarImage src={`/avatars/${member.name}.png`} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {project.memberCount > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-muted-foreground">
                      +{project.memberCount - 4}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  截止 {project.endDate}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">没有找到项目</h3>
          <p className="text-muted-foreground mb-4">尝试调整筛选条件或创建新项目</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            创建第一个项目
          </Button>
        </div>
      )}
    </div>
  )
}
