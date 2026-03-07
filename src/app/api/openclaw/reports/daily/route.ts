import { NextResponse } from "next/server"

/**
 * POST /api/openclaw/reports/daily
 * 生成日报
 * 供 OpenClaw projex-report-skill 调用
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { projectId, format = "markdown" } = body

    const today = new Date()
    const dateStr = today.toLocaleDateString("zh-CN", { 
      year: "numeric", 
      month: "long", 
      day: "numeric",
      weekday: "long",
    })

    // 生成日报内容
    const dailyReport = {
      title: `项目日报 - ${dateStr}`,
      generatedAt: today.toISOString(),
      
      // 今日完成
      completed: [
        { id: "task-001", title: "完成用户画像数据模型设计", assignee: "李四", project: "推荐系统" },
        { id: "task-002", title: "主体分类接口联调", assignee: "张三", project: "标签平台" },
        { id: "task-003", title: "修复数据同步延迟问题", assignee: "王五", project: "推荐系统" },
      ],
      
      // 进行中
      inProgress: [
        { id: "task-004", title: "协同过滤算法实现", assignee: "张三", progress: 60, project: "推荐系统" },
        { id: "task-005", title: "查询列表页面开发", assignee: "张三", progress: 45, project: "标签平台" },
      ],
      
      // 明日计划
      plannedForTomorrow: [
        { id: "task-006", title: "内容推荐算法开发", assignee: "李四", project: "推荐系统" },
        { id: "task-007", title: "查询列表接口开发", assignee: "李四", project: "标签平台" },
      ],
      
      // 风险与阻塞
      risks: [
        {
          type: "delay",
          title: "Sprint 2 进度滞后",
          description: "实际进度落后计划 15%，需要重点关注",
          impact: "high",
          mitigation: "已安排紧急会议，重新评估任务优先级",
        },
      ],
      
      // 迭代状态
      sprintStatus: [
        { name: "Sprint 2 - 推荐算法", progress: 45, status: "at-risk", remainingDays: 13 },
        { name: "Sprint 3 - 场景接入", progress: 68, status: "healthy", remainingDays: 29 },
      ],
      
      // 统计
      statistics: {
        completedToday: 3,
        inProgress: 2,
        blocked: 0,
        teamUtilization: 85,
      },
    }

    // 根据格式返回不同内容
    if (format === "markdown") {
      const markdown = generateMarkdownReport(dailyReport)
      return NextResponse.json({
        success: true,
        data: {
          ...dailyReport,
          markdown,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: dailyReport,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate daily report" },
      { status: 500 }
    )
  }
}

function generateMarkdownReport(report: any): string {
  return `# ${report.title}

## 📊 今日概览
- ✅ 完成任务: ${report.statistics.completedToday} 项
- 🔄 进行中: ${report.statistics.inProgress} 项
- 🚫 阻塞: ${report.statistics.blocked} 项
- 👥 团队利用率: ${report.statistics.teamUtilization}%

## ✅ 今日完成
${report.completed.map((t: any) => `- [${t.project}] ${t.title} (@${t.assignee})`).join("\n")}

## 🔄 进行中
${report.inProgress.map((t: any) => `- [${t.project}] ${t.title} (@${t.assignee}) - ${t.progress}%`).join("\n")}

## 📋 明日计划
${report.plannedForTomorrow.map((t: any) => `- [${t.project}] ${t.title} (@${t.assignee})`).join("\n")}

## ⚠️ 风险与阻塞
${report.risks.length > 0 
  ? report.risks.map((r: any) => `### ${r.title}\n- 影响程度: ${r.impact}\n- 描述: ${r.description}\n- 应对措施: ${r.mitigation}`).join("\n\n")
  : "暂无风险或阻塞项 ✨"}

## 🚀 迭代状态
| 迭代 | 进度 | 状态 | 剩余天数 |
|------|------|------|----------|
${report.sprintStatus.map((s: any) => `| ${s.name} | ${s.progress}% | ${s.status === "healthy" ? "✅ 健康" : "⚠️ 风险"} | ${s.remainingDays}天 |`).join("\n")}

---
*此报告由 Projex AI 助手小派自动生成*
`
}
