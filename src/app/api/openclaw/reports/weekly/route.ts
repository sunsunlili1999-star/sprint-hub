import { NextResponse } from "next/server"

/**
 * POST /api/openclaw/reports/weekly
 * 生成周报
 * 供 OpenClaw projex-report-skill 调用
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { projectId, format = "markdown" } = body

    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 4)

    const dateRange = `${weekStart.toLocaleDateString("zh-CN", { month: "long", day: "numeric" })} - ${weekEnd.toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}`

    // 生成周报内容
    const weeklyReport = {
      title: `项目周报 - ${dateRange}`,
      generatedAt: today.toISOString(),
      weekNumber: getWeekNumber(today),
      
      // 本周总结
      summary: {
        completedTasks: 15,
        newTasks: 8,
        closedBugs: 3,
        progress: "+12%", // 相比上周
        highlights: [
          "完成用户画像数据模型设计",
          "协同过滤算法初版上线",
          "标签分类功能联调完成",
        ],
      },
      
      // 里程碑进度
      milestones: [
        {
          name: "推荐算法 MVP",
          plannedDate: "2026-03-20",
          progress: 45,
          status: "at-risk",
          delta: -8, // 相比上周进度变化
        },
        {
          name: "标签平台 2.1 上线",
          plannedDate: "2026-03-30",
          progress: 86,
          status: "on-track",
          delta: +15,
        },
      ],
      
      // 迭代状态
      sprints: [
        {
          name: "Sprint 2 - 推荐算法",
          progress: 45,
          status: "at-risk",
          completedThisWeek: 5,
          totalItems: 12,
          riskNote: "进度滞后 15%，需重点关注",
        },
        {
          name: "Sprint 3 - 场景接入",
          progress: 68,
          status: "healthy",
          completedThisWeek: 3,
          totalItems: 8,
          riskNote: null,
        },
      ],
      
      // 团队工作量
      teamWorkload: [
        { name: "张三", completedTasks: 5, inProgress: 2, workload: 95 },
        { name: "李四", completedTasks: 4, inProgress: 3, workload: 110 },
        { name: "王五", completedTasks: 3, inProgress: 1, workload: 75 },
        { name: "赵六", completedTasks: 3, inProgress: 2, workload: 85 },
      ],
      
      // 风险项
      risks: [
        {
          title: "Sprint 2 进度滞后",
          level: "high",
          impact: "可能影响推荐系统 v1.0 发布时间",
          mitigation: "已重新评估优先级，部分非核心需求延后",
          owner: "张三",
        },
        {
          title: "测试资源紧张",
          level: "medium",
          impact: "可能影响测试覆盖率",
          mitigation: "协调额外测试资源，增加自动化测试",
          owner: "王五",
        },
      ],
      
      // 下周计划
      nextWeekPlan: [
        { title: "完成内容推荐算法开发", priority: "P0", assignee: "李四" },
        { title: "推荐接口性能优化", priority: "P1", assignee: "张三" },
        { title: "标签映射功能开发", priority: "P1", assignee: "赵六" },
        { title: "集成测试用例编写", priority: "P2", assignee: "王五" },
      ],
      
      // AI 建议
      aiRecommendations: [
        "建议：Sprint 2 进度滞后，建议本周增加每日站会，及时跟踪进度",
        "建议：李四工作量超载 (110%)，建议重新分配部分任务给其他成员",
        "建议：下周有 2 个 P0 任务，建议优先保障资源",
      ],
    }

    // 根据格式返回不同内容
    if (format === "markdown") {
      const markdown = generateWeeklyMarkdown(weeklyReport)
      return NextResponse.json({
        success: true,
        data: {
          ...weeklyReport,
          markdown,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: weeklyReport,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate weekly report" },
      { status: 500 }
    )
  }
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

function generateWeeklyMarkdown(report: any): string {
  return `# ${report.title}

## 📊 本周概览
- ✅ 完成任务: ${report.summary.completedTasks} 项
- 📝 新增任务: ${report.summary.newTasks} 项
- 🐛 关闭缺陷: ${report.summary.closedBugs} 项
- 📈 整体进度: ${report.summary.progress}

### 本周亮点
${report.summary.highlights.map((h: string) => `- ${h}`).join("\n")}

## 🎯 里程碑进度
| 里程碑 | 计划日期 | 进度 | 状态 | 本周变化 |
|--------|----------|------|------|----------|
${report.milestones.map((m: any) => `| ${m.name} | ${m.plannedDate} | ${m.progress}% | ${m.status === "on-track" ? "✅" : "⚠️"} | ${m.delta > 0 ? "+" : ""}${m.delta}% |`).join("\n")}

## 🚀 迭代状态
${report.sprints.map((s: any) => `
### ${s.name}
- 进度: ${s.progress}% (本周完成 ${s.completedThisWeek}/${s.totalItems})
- 状态: ${s.status === "healthy" ? "✅ 健康" : "⚠️ 风险"}
${s.riskNote ? `- ⚠️ ${s.riskNote}` : ""}`).join("\n")}

## 👥 团队工作量
| 成员 | 完成 | 进行中 | 工作量 |
|------|------|--------|--------|
${report.teamWorkload.map((t: any) => `| ${t.name} | ${t.completedTasks} | ${t.inProgress} | ${t.workload}% ${t.workload > 100 ? "🔴" : t.workload > 90 ? "🟡" : "🟢"} |`).join("\n")}

## ⚠️ 风险项
${report.risks.map((r: any) => `
### ${r.level === "high" ? "🔴" : "🟡"} ${r.title}
- 影响: ${r.impact}
- 应对: ${r.mitigation}
- 负责人: ${r.owner}`).join("\n")}

## 📋 下周计划
| 优先级 | 任务 | 负责人 |
|--------|------|--------|
${report.nextWeekPlan.map((t: any) => `| ${t.priority} | ${t.title} | ${t.assignee} |`).join("\n")}

## 💡 AI 建议
${report.aiRecommendations.map((r: string) => `- ${r}`).join("\n")}

---
*此报告由 Projex AI 助手小派自动生成 | 第 ${report.weekNumber} 周*
`
}
