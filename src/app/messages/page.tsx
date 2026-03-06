"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Bell,
  CheckCheck,
  Hand,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  Settings,
  Trash2,
  MailOpen,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// 模拟消息数据
const mockMessages = [
  {
    id: "1",
    type: "POKE",
    title: "张三戳了你一下",
    content: "张三（前端）戳了你一下（前端联调登录接口）",
    targetType: "WORK_ITEM",
    targetId: "task-3",
    targetTitle: "前端联调登录接口",
    isRead: false,
    createdAt: "5分钟前",
    sender: { name: "张三", avatar: "张" },
  },
  {
    id: "2",
    type: "FOLLOW_CHANGE",
    title: "工作项状态变更",
    content: "【用户登录功能】预计结束时间已修改：03-15 → 03-18",
    targetType: "WORK_ITEM",
    targetId: "req-1",
    targetTitle: "用户登录功能",
    isRead: false,
    createdAt: "30分钟前",
    sender: { name: "系统", avatar: "S" },
  },
  {
    id: "3",
    type: "OVERDUE",
    title: "逾期警告",
    content: "【任务】前端登录页面开发 已逾期1天",
    targetType: "WORK_ITEM",
    targetId: "task-1",
    targetTitle: "前端登录页面开发",
    isRead: false,
    createdAt: "1小时前",
    sender: { name: "系统", avatar: "S" },
  },
  {
    id: "4",
    type: "ASSIGNMENT",
    title: "新任务指派",
    content: "你被指派为【用户注册功能】的开发负责人",
    targetType: "WORK_ITEM",
    targetId: "req-2",
    targetTitle: "用户注册功能",
    isRead: true,
    createdAt: "2小时前",
    sender: { name: "李四", avatar: "李" },
  },
  {
    id: "5",
    type: "COMMENT",
    title: "新评论",
    content: "王五 在【用户登录功能】中发表了评论：这个需求需要增加记住密码功能",
    targetType: "WORK_ITEM",
    targetId: "req-1",
    targetTitle: "用户登录功能",
    isRead: true,
    createdAt: "3小时前",
    sender: { name: "王五", avatar: "王" },
  },
  {
    id: "6",
    type: "POKE",
    title: "赵六戳了你一下",
    content: "赵六（后端）戳了你一下（后端登录接口开发）",
    targetType: "WORK_ITEM",
    targetId: "task-2",
    targetTitle: "后端登录接口开发",
    isRead: true,
    createdAt: "昨天",
    sender: { name: "赵六", avatar: "赵" },
  },
]

const getMessageIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    POKE: <Hand className="w-4 h-4 text-yellow-500" />,
    FOLLOW_CHANGE: <Bell className="w-4 h-4 text-blue-500" />,
    OVERDUE: <AlertTriangle className="w-4 h-4 text-red-500" />,
    ASSIGNMENT: <UserPlus className="w-4 h-4 text-green-500" />,
    COMMENT: <MessageSquare className="w-4 h-4 text-purple-500" />,
    SYSTEM: <Settings className="w-4 h-4 text-gray-500" />,
  }
  return icons[type] || icons.SYSTEM
}

const getMessageTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    POKE: "戳一戳",
    FOLLOW_CHANGE: "关注变更",
    OVERDUE: "逾期警告",
    ASSIGNMENT: "任务指派",
    COMMENT: "评论通知",
    SYSTEM: "系统通知",
  }
  return labels[type] || "通知"
}

export default function MessagesPage() {
  const [messages, setMessages] = useState(mockMessages)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const unreadCount = messages.filter((m) => !m.isRead).length
  const filteredMessages = filter === "all" ? messages : messages.filter((m) => !m.isRead)

  const markAsRead = (id: string) => {
    setMessages(
      messages.map((m) => (m.id === id ? { ...m, isRead: true } : m))
    )
  }

  const markAllAsRead = () => {
    setMessages(messages.map((m) => ({ ...m, isRead: true })))
  }

  const deleteMessage = (id: string) => {
    setMessages(messages.filter((m) => m.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            消息中心
          </h1>
          <p className="text-muted-foreground">
            共 {messages.length} 条消息，{unreadCount} 条未读
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            全部标为已读
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            通知设置
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { type: "POKE", label: "戳一戳", count: 2, color: "yellow" },
          { type: "OVERDUE", label: "逾期警告", count: 1, color: "red" },
          { type: "ASSIGNMENT", label: "任务指派", count: 1, color: "green" },
          { type: "COMMENT", label: "评论", count: 1, color: "purple" },
          { type: "FOLLOW_CHANGE", label: "关注变更", count: 1, color: "blue" },
        ].map((item) => (
          <Card key={item.type} className="cursor-pointer hover:shadow-md transition-all">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    item.color === "yellow" && "bg-yellow-100",
                    item.color === "red" && "bg-red-100",
                    item.color === "green" && "bg-green-100",
                    item.color === "purple" && "bg-purple-100",
                    item.color === "blue" && "bg-blue-100"
                  )}
                >
                  {getMessageIcon(item.type)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 消息列表 */}
      <Card>
        <CardHeader className="pb-0">
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setFilter("all")}>
                全部消息
              </TabsTrigger>
              <TabsTrigger value="unread" onClick={() => setFilter("unread")}>
                未读消息
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <MailOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {filter === "unread" ? "没有未读消息" : "暂无消息"}
                </p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border transition-all hover:shadow-sm cursor-pointer",
                    !message.isRead && "bg-blue-50 border-blue-100"
                  )}
                  onClick={() => markAsRead(message.id)}
                >
                  {/* 发送者头像 */}
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={`/avatars/${message.sender.name}.png`} />
                    <AvatarFallback
                      className={cn(
                        "text-white text-sm",
                        message.sender.name === "系统"
                          ? "bg-gray-500"
                          : "bg-gradient-to-br from-blue-500 to-purple-600"
                      )}
                    >
                      {message.sender.avatar}
                    </AvatarFallback>
                  </Avatar>

                  {/* 消息内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getMessageIcon(message.type)}
                      <Badge variant="outline" className="text-xs">
                        {getMessageTypeLabel(message.type)}
                      </Badge>
                      {!message.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="font-medium">{message.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {message.createdAt}
                      </span>
                      <Link
                        href={`/projects/1/work-items/${message.targetId}`}
                        className="text-xs hover:opacity-80"
                        style={{ 
                          color: "#7c7cff", 
                          borderBottom: "1px dashed #7c7cff",
                          paddingBottom: 1,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        查看详情 →
                      </Link>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    {!message.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(message.id)
                        }}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteMessage(message.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
