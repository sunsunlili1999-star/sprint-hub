import { NextResponse } from "next/server"

// 模拟迭代状态数据
const mockSprintStatuses = [
  {
    id: "sprint-recommend-002",
    name: "Sprint 2 - 推荐算法",
    projectName: "推荐系统",
    status: "IN_PROGRESS",
    progress: 45,
    startDate: "2026-02-20",
    endDate: "2026-03-20",
    remainingDays: 13,
    totalItems: 12,
    completedItems: 5,
    risk: {
      level: "high",
      type: "DELAYED",
      score: 65,
      details: ["实际进度落后计划 15%", "3 个高优先级任务未开始"],
      recommendation: "建议：① 重新评估任务优先级，优先完成核心功能；② 考虑将非核心需求移至下个迭代；③ 安排每日站会跟踪进度",
    },
  },
  {
    id: "sprint-recommend-003",
    name: "Sprint 3 - 场景接入",
    projectName: "推荐系统",
    status: "IN_PROGRESS",
    progress: 68,
    startDate: "2026-03-05",
    endDate: "2026-04-05",
    remainingDays: 29,
    totalItems: 8,
    completedItems: 5,
    risk: {
      level: "low",
      type: "HEALTHY",
      score: 0,
      details: ["进度符合预期", "资源分配合理", "无阻塞风险"],
      recommendation: null,
    },
  },
]

/**
 * GET /api/openclaw/sprints/status
 * 获取所有进行中迭代的状态
 * 供 OpenClaw projex-status-skill 调用
 */
export async function GET() {
  try {
    // 这里可以接入真实的数据库查询
    // const sprints = await prisma.sprint.findMany({
    //   where: { status: "IN_PROGRESS" },
    //   include: { project: true, workItems: true }
    // })

    return NextResponse.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        sprints: mockSprintStatuses,
        summary: {
          total: mockSprintStatuses.length,
          healthy: mockSprintStatuses.filter(s => s.risk.type === "HEALTHY").length,
          atRisk: mockSprintStatuses.filter(s => s.risk.type !== "HEALTHY").length,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch sprint status" },
      { status: 500 }
    )
  }
}
