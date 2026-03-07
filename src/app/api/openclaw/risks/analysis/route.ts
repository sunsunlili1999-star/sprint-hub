import { NextResponse } from "next/server"

/**
 * GET /api/openclaw/risks/analysis
 * 获取风险分析报告
 * 供 OpenClaw projex-risk-skill 调用
 */
export async function GET() {
  try {
    const riskAnalysis = {
      timestamp: new Date().toISOString(),
      overallScore: 58, // 总体风险指数
      overallLevel: "medium", // low, medium, high, critical
      
      // 风险分类统计
      riskCategories: {
        schedule: {
          count: 2,
          level: "medium",
          items: [
            { name: "Sprint 2 进度滞后", score: 65, type: "DELAYED" },
          ],
        },
        resource: {
          count: 1,
          level: "low",
          items: [
            { name: "测试资源紧张", score: 40, type: "RESOURCE" },
          ],
        },
        scope: {
          count: 0,
          level: "low",
          items: [],
        },
        dependency: {
          count: 1,
          level: "medium",
          items: [
            { name: "外部接口依赖", score: 50, type: "DEPENDENCY" },
          ],
        },
      },
      
      // 高风险项目
      highRiskItems: [
        {
          type: "sprint",
          id: "sprint-recommend-002",
          name: "Sprint 2 - 推荐算法",
          riskScore: 65,
          riskType: "DELAYED",
          details: ["实际进度落后计划 15%", "3 个高优先级任务未开始"],
          recommendation: "建议：① 重新评估任务优先级，优先完成核心功能；② 考虑将非核心需求移至下个迭代；③ 安排每日站会跟踪进度",
          owner: "张三",
          dueDate: "2026-03-20",
        },
        {
          type: "release",
          id: "release-001",
          name: "推荐系统 v1.0.0",
          riskScore: 55,
          riskType: "AT_RISK",
          details: ["2 个 P0 需求未完成", "测试覆盖率不足"],
          recommendation: "建议：① 集中资源完成 P0 需求；② 增加自动化测试用例；③ 考虑分批发布",
          owner: "李四",
          dueDate: "2026-04-15",
        },
      ],
      
      // AI 综合建议
      aiRecommendations: [
        {
          priority: "high",
          title: "优先处理 Sprint 2 滞后问题",
          description: "Sprint 2 已滞后 15%，建议立即召开紧急会议，重新评估剩余任务优先级",
          actions: [
            "召开团队紧急会议",
            "识别可延期的非核心需求",
            "增加每日站会频率",
          ],
        },
        {
          priority: "medium",
          title: "提前准备发布风险应对",
          description: "推荐系统 v1.0.0 存在风险，建议制定应急预案",
          actions: [
            "梳理 P0 需求清单，确保优先完成",
            "增加测试资源或延长测试周期",
            "准备灰度发布方案",
          ],
        },
      ],
    }

    return NextResponse.json({
      success: true,
      data: riskAnalysis,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to analyze risks" },
      { status: 500 }
    )
  }
}
