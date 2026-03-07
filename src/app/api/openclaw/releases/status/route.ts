import { NextResponse } from "next/server"

// 模拟发布状态数据
const mockReleaseStatuses = [
  {
    id: "release-001",
    name: "推荐系统",
    version: "v1.0.0",
    plannedDate: "2026-04-15",
    status: "at-risk",
    progress: 53,
    completedItems: 8,
    totalItems: 15,
    risk: {
      level: "medium",
      type: "AT_RISK",
      score: 55,
      details: ["2 个 P0 需求未完成", "测试覆盖率不足"],
      recommendation: "建议：① 集中资源完成 P0 需求；② 增加自动化测试用例；③ 考虑分批发布，先上线核心功能",
    },
  },
  {
    id: "release-002",
    name: "标签平台",
    version: "v2.1.0",
    plannedDate: "2026-03-30",
    status: "on-track",
    progress: 86,
    completedItems: 12,
    totalItems: 14,
    risk: {
      level: "low",
      type: "ON_TRACK",
      score: 15,
      details: ["进度正常", "测试通过率 95%"],
      recommendation: null,
    },
  },
]

/**
 * GET /api/openclaw/releases/status
 * 获取所有待发布版本的状态
 * 供 OpenClaw projex-status-skill 调用
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        releases: mockReleaseStatuses,
        summary: {
          total: mockReleaseStatuses.length,
          onTrack: mockReleaseStatuses.filter(r => r.status === "on-track").length,
          atRisk: mockReleaseStatuses.filter(r => r.status === "at-risk").length,
          delayed: mockReleaseStatuses.filter(r => r.status === "delayed").length,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch release status" },
      { status: 500 }
    )
  }
}
