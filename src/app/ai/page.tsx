"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Sparkles,
  FileText,
  AlertTriangle,
  Clock,
  Calendar,
  Bot,
  Send,
  Copy,
  Download,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Users,
} from "lucide-react"

export default function AIPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [dailyReport, setDailyReport] = useState<string | null>(null)

  const handleGenerateReport = () => {
    setIsGenerating(true)
    // 模拟生成过程
    setTimeout(() => {
      setDailyReport(`# 工作日报 - 2026-03-03

## 今日完成
- [任务] 后端登录接口开发 - 完成了接口联调和单元测试
- [缺陷] 登录按钮样式问题 - 已修复按钮在移动端的显示问题

## 今日进行
- [任务] 前端登录页面开发 - 完成页面布局和表单验证，进度 80%
- [任务] 联调后端登录接口 - 开始联调工作，遇到跨域问题待解决

## 明日计划
- 继续前端登录页面开发，完成最终测试
- 解决联调中的跨域问题
- 开始用户注册功能的前端页面开发

## 风险与阻塞
- 联调工作依赖后端接口稳定性，需要后端同事配合

---
*由 SprintHub AI 自动生成*`)
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          AI 助手
        </h1>
        <p className="text-muted-foreground">智能辅助你的项目管理工作</p>
      </div>

      {/* AI 功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all cursor-pointer border-purple-100 hover:border-purple-300">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-lg">智能拆分任务</CardTitle>
            <CardDescription>
              输入需求文档，AI自动生成任务列表
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer border-orange-100 hover:border-orange-300">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-lg">风险预警</CardTitle>
            <CardDescription>
              分析依赖链路，预测延期风险
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer border-green-100 hover:border-green-300">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-lg">工时估算</CardTitle>
            <CardDescription>
              基于历史数据，智能估算工时
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer border-blue-100 hover:border-blue-300">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-lg">智能排期</CardTitle>
            <CardDescription>
              考虑依赖和资源，自动排期
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* 主要功能区 */}
      <Tabs defaultValue="report" className="space-y-4">
        <TabsList>
          <TabsTrigger value="report">日报/周报生成</TabsTrigger>
          <TabsTrigger value="split">任务拆分</TabsTrigger>
          <TabsTrigger value="risk">风险分析</TabsTrigger>
          <TabsTrigger value="estimate">工时估算</TabsTrigger>
        </TabsList>

        {/* 日报生成 */}
        <TabsContent value="report" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：生成选项 */}
            <Card>
              <CardHeader>
                <CardTitle>生成工作报告</CardTitle>
                <CardDescription>
                  基于你的TodoList记录，自动生成日报或周报
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    className="h-24 flex flex-col gap-2 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                    <span>生成今日日报</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span>生成本周周报</span>
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 space-y-3">
                  <h4 className="font-medium">今日工作数据</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">3</div>
                      <div className="text-xs text-muted-foreground">已完成</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">2</div>
                      <div className="text-xs text-muted-foreground">进行中</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">1</div>
                      <div className="text-xs text-muted-foreground">待处理</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 右侧：生成结果 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>生成结果</CardTitle>
                  {dailyReport && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-1" />
                        复制
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        导出
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {dailyReport ? (
                  <div className="prose prose-sm max-w-none p-4 bg-slate-50 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{dailyReport}</pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>点击左侧按钮生成报告</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 任务拆分 */}
        <TabsContent value="split" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>智能拆分任务</CardTitle>
              <CardDescription>
                输入需求描述或粘贴需求文档，AI将自动拆分为具体的任务列表
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">需求描述</label>
                <textarea
                  className="w-full h-32 p-3 rounded-lg border resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入需求描述，例如：实现用户登录功能，支持邮箱和手机号登录，需要验证码功能..."
                />
              </div>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Sparkles className="w-4 h-4 mr-2" />
                AI 拆分任务
              </Button>

              {/* 拆分结果示例 */}
              <div className="mt-6 p-4 rounded-lg border bg-slate-50 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  拆分结果预览
                </h4>
                <div className="space-y-2">
                  {[
                    { title: "前端登录页面开发", hours: 16 },
                    { title: "后端登录接口开发", hours: 24 },
                    { title: "验证码功能开发", hours: 8 },
                    { title: "登录功能联调测试", hours: 8 },
                  ].map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">任务</Badge>
                        <span>{task.title}</span>
                      </div>
                      <Badge variant="outline">{task.hours}h</Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4">确认并创建任务</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 风险分析 */}
        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>风险预警分析</CardTitle>
              <CardDescription>
                分析当前迭代的风险因素，包括依赖链路、资源负载等
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                <AlertTriangle className="w-4 h-4 mr-2" />
                分析当前迭代风险
              </Button>

              {/* 风险分析结果 */}
              <div className="space-y-4 mt-6">
                <div className="p-4 rounded-lg border-l-4 border-red-500 bg-red-50">
                  <div className="flex items-center gap-2 font-medium text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    高风险
                  </div>
                  <p className="text-sm mt-1 text-red-600">
                    [任务] 后端登录接口开发 - 阻塞 5 个下游任务，当前进度落后 2 天
                  </p>
                </div>

                <div className="p-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50">
                  <div className="flex items-center gap-2 font-medium text-yellow-700">
                    <Users className="w-4 h-4" />
                    中风险
                  </div>
                  <p className="text-sm mt-1 text-yellow-600">
                    @张三 当前负载 180%，建议分配部分任务给其他成员
                  </p>
                </div>

                <div className="p-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50">
                  <div className="flex items-center gap-2 font-medium text-yellow-700">
                    <TrendingUp className="w-4 h-4" />
                    中风险
                  </div>
                  <p className="text-sm mt-1 text-yellow-600">
                    [需求] 支付功能 - 基于历史数据，延期概率 65%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 工时估算 */}
        <TabsContent value="estimate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>智能工时估算</CardTitle>
              <CardDescription>
                根据任务描述和历史数据，智能估算任务工时
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">任务标题</label>
                <Input placeholder="输入任务标题" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">任务描述</label>
                <textarea
                  className="w-full h-24 p-3 rounded-lg border resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="详细描述任务内容..."
                />
              </div>
              <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                <Clock className="w-4 h-4 mr-2" />
                AI 估算工时
              </Button>

              {/* 估算结果 */}
              <div className="mt-6 p-6 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 border border-green-200">
                <h4 className="font-medium text-center mb-4">AI 工时估算结果</h4>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">16</div>
                  <div className="text-sm text-muted-foreground">预估工时（小时）</div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Badge variant="success" className="bg-green-100 text-green-800">
                    置信度 85%
                  </Badge>
                </div>
                <p className="text-sm text-center text-muted-foreground mt-4">
                  参考依据：基于 3 个相似任务的历史数据
                </p>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" variant="outline">
                    忽略
                  </Button>
                  <Button className="flex-1">
                    采用此估算
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI 对话助手 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI 对话助手
          </CardTitle>
          <CardDescription>
            有任何项目管理问题，都可以问我
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="输入你的问题，例如：如何提高团队效率？"
              className="flex-1"
            />
            <Button>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {["如何估算任务工时？", "什么是关键路径？", "如何处理逾期任务？"].map(
              (suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
