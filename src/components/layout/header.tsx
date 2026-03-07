"use client"

import { Bell, Plus, ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useBreadcrumb } from "./breadcrumb-provider"

export function Header() {
  const { breadcrumbs } = useBreadcrumb()

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{item.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Create */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-[#7c7cff] to-[#22d3ee] hover:from-[#6b6bef] hover:to-[#11c2dd]">
              <Plus className="w-4 h-4 mr-1" />
              创建
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
              新建需求
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              新建任务
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
              新建缺陷
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              新建项目
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              新建迭代
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="w-4 h-4" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500">
            3
          </Badge>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/user.png" alt="用户头像" />
                <AvatarFallback className="bg-gradient-to-br from-[#7c7cff] to-[#22d3ee] text-white text-xs">
                  张
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">张三</p>
                <p className="text-xs leading-none text-muted-foreground">
                  zhangsan@example.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">个人中心</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">我的工作项</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">我的关注</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              生成日报
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              生成周报
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600">
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
