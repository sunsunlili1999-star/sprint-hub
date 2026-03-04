"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

// 模拟数据
const overdueItems = [
  { id: "1", title: "前端登录页面开发", type: "TASK", daysOverdue: 2, project: "用户系统" },
  { id: "2", title: "API接口文档更新", type: "TASK", daysOverdue: 1, project: "基础设施" },
  { id: "3", title: "登录按钮样式问题", type: "BUG", daysOverdue: 1, project: "用户系统" },
]

const myTodos = [
  { id: "1", title: "完成用户认证模块", priority: "P1", dueDate: "03-05", status: "IN_PROGRESS" },
  { id: "2", title: "联调后端登录接口", priority: "P1", dueDate: "03-06", status: "NOT_STARTED" },
  { id: "3", title: "编写单元测试", priority: "P2", dueDate: "03-08", status: "NOT_STARTED" },
  { id: "4", title: "代码审查", priority: "P2", dueDate: "03-10", status: "NOT_STARTED" },
]

const recentProjects = [
  { id: "1", name: "用户系统重构", progress: 65, sprint: "Sprint 3", endDate: "03-15" },
  { id: "2", name: "支付模块优化", progress: 40, sprint: "Sprint 2", endDate: "03-20" },
  { id: "3", name: "后台管理系统", progress: 85, sprint: "Sprint 5", endDate: "03-10" },
]

const teamActivities = [
  { id: "1", user: "李四", action: "完成了任务", target: "后端登录接口开发", time: "10分钟前", avatar: "李" },
  { id: "2", user: "王五", action: "创建了缺陷", target: "验证码显示异常", time: "30分钟前", avatar: "王" },
  { id: "3", user: "赵六", action: "评论了", target: "用户认证需求", time: "1小时前", avatar: "赵" },
  { id: "4", user: "张三", action: "修改了", target: "Sprint 3 截止日期", time: "2小时前", avatar: "张" },
]

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* 逾期警告横幅 */}
      {overdueItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <CardTitle className="text-red-700">
                  你有 {overdueItems.length} 个逾期工作项需要处理
                </CardTitle>
              </div>
              <Link href="/todos?filter=overdue">
                <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-100">
                  查看全部
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={item.type === "BUG" ? "destructive" : "secondary"} className="text-xs">
                      {item.type === "BUG" ? "缺陷" : "任务"}
                    </Badge>
                    <span className="font-medium">{item.title}</span>
                    <span className="text-sm text-muted-foreground">· {item.project}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 font-medium">逾期 {item.daysOverdue} 天</span>
                    <Button size="sm" variant="outline" className="h-7">
                      标记完成
                    </Button>
                    <Button size="sm" variant="outline" className="h-7">
                      修改截止日期
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">我的工作项</CardTitle>
            <ListTodo className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">3 已完成</span> · 9 进行中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">参与项目</CardTitle>
            <FolderKanban className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-blue-600">3 个活跃</span> · 2 个已归档
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">本周完成</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              比上周增加 20%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">即将到期</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground mt-1">
              未来 3 天内到期
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 今日待办 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  今日待办
                </CardTitle>
                <CardDescription>你今天需要关注的工作项</CardDescription>
              </div>
              <Link href="/todos">
                <Button variant="ghost" size="sm">
                  查看全部
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Badge
                      className={
                        todo.priority === "P0"
                          ? "bg-red-500"
                          : todo.priority === "P1"
                          ? "bg-orange-500"
                          : "bg-yellow-500"
                      }
                    >
                      {todo.priority}
                    </Badge>
                    <span className="font-medium">{todo.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{todo.dueDate}</span>
                    <Button
                      size="sm"
                      variant={todo.status === "IN_PROGRESS" ? "default" : "outline"}
                      className="h-7"
                    >
                      {todo.status === "IN_PROGRESS" ? "进行中" : "开始"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI 助手入口 */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI 助手
            </CardTitle>
            <CardDescription>智能辅助你的项目管理</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50">
              <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
              智能拆分任务
            </Button>
            <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
              风险预警分析
            </Button>
            <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50">
              <Clock className="w-4 h-4 mr-2 text-green-500" />
              智能工时估算
            </Button>
            <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50">
              <Calendar className="w-4 h-4 mr-2 text-orange-500" />
              智能排期建议
            </Button>
            <Link href="/ai" className="block mt-4">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                生成今日日报
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 下方内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近项目 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>最近项目</CardTitle>
                <CardDescription>你参与的项目进度</CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  查看全部
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.sprint} · 截止 {project.endDate}
                      </p>
                    </div>
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 团队动态 */}
        <Card>
          <CardHeader>
            <CardTitle>团队动态</CardTitle>
            <CardDescription>最近的团队活动</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={`/avatars/${activity.user}.png`} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {activity.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-muted-foreground">{activity.action}</span>{" "}
                      <span className="font-medium text-blue-600">{activity.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
