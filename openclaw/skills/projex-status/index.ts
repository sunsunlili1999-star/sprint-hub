/**
 * Projex Status Skill for OpenClaw
 * 
 * 获取 Projex 项目状态，包括迭代进度、发布状态和风险分析
 */

interface SkillConfig {
  projex_api_url: string
  projex_api_key?: string
}

interface SkillContext {
  config: SkillConfig
}

// API 请求封装
async function fetchProjexAPI(ctx: SkillContext, endpoint: string, method = "GET", body?: any) {
  const url = `${ctx.config.projex_api_url}${endpoint}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  
  if (ctx.config.projex_api_key) {
    headers["Authorization"] = `Bearer ${ctx.config.projex_api_key}`
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`Projex API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取迭代状态
 */
export async function get_sprint_status(
  ctx: SkillContext,
  params: { project_id?: string }
) {
  const result = await fetchProjexAPI(ctx, "/api/openclaw/sprints/status")
  
  if (!result.success) {
    throw new Error(result.error || "Failed to fetch sprint status")
  }

  const { sprints, summary } = result.data

  // 格式化输出
  let output = `## 📊 迭代状态报告\n\n`
  output += `**统计**: 共 ${summary.total} 个进行中迭代，${summary.healthy} 个健康，${summary.atRisk} 个存在风险\n\n`

  for (const sprint of sprints) {
    const statusEmoji = sprint.risk.type === "HEALTHY" ? "✅" : "⚠️"
    output += `### ${statusEmoji} ${sprint.name}\n`
    output += `- **项目**: ${sprint.projectName}\n`
    output += `- **进度**: ${sprint.progress}% (${sprint.completedItems}/${sprint.totalItems})\n`
    output += `- **剩余**: ${sprint.remainingDays} 天\n`
    output += `- **状态**: ${sprint.risk.type === "HEALTHY" ? "健康" : sprint.risk.type}\n`
    
    if (sprint.risk.details && sprint.risk.details.length > 0) {
      output += `- **详情**: ${sprint.risk.details.join("; ")}\n`
    }
    
    if (sprint.risk.recommendation) {
      output += `- **💡 建议**: ${sprint.risk.recommendation}\n`
    }
    output += "\n"
  }

  return {
    content: output,
    data: result.data,
  }
}

/**
 * 获取发布状态
 */
export async function get_release_status(
  ctx: SkillContext,
  params: { project_id?: string }
) {
  const result = await fetchProjexAPI(ctx, "/api/openclaw/releases/status")
  
  if (!result.success) {
    throw new Error(result.error || "Failed to fetch release status")
  }

  const { releases, summary } = result.data

  let output = `## 📦 发布状态报告\n\n`
  output += `**统计**: 共 ${summary.total} 个待发布版本，${summary.onTrack} 个正常，${summary.atRisk} 个存在风险\n\n`

  for (const release of releases) {
    const statusEmoji = release.status === "on-track" ? "✅" : release.status === "at-risk" ? "⚠️" : "🔴"
    output += `### ${statusEmoji} ${release.name} ${release.version}\n`
    output += `- **计划发布**: ${release.plannedDate}\n`
    output += `- **完成进度**: ${release.progress}% (${release.completedItems}/${release.totalItems})\n`
    output += `- **状态**: ${release.status === "on-track" ? "正常" : release.status === "at-risk" ? "存在风险" : "已延期"}\n`
    
    if (release.risk.details && release.risk.details.length > 0) {
      output += `- **详情**: ${release.risk.details.join("; ")}\n`
    }
    
    if (release.risk.recommendation) {
      output += `- **💡 建议**: ${release.risk.recommendation}\n`
    }
    output += "\n"
  }

  return {
    content: output,
    data: result.data,
  }
}

/**
 * 获取风险分析
 */
export async function get_risk_analysis(
  ctx: SkillContext,
  params: { threshold?: number }
) {
  const result = await fetchProjexAPI(ctx, "/api/openclaw/risks/analysis")
  
  if (!result.success) {
    throw new Error(result.error || "Failed to fetch risk analysis")
  }

  const data = result.data
  const threshold = params.threshold || 0

  // 过滤超过阈值的风险项
  const filteredRisks = data.highRiskItems.filter(
    (item: any) => item.riskScore >= threshold
  )

  let output = `## ⚠️ 风险分析报告\n\n`
  output += `**总体风险指数**: ${data.overallScore} (${data.overallLevel})\n\n`

  if (filteredRisks.length === 0) {
    output += `✅ 当前没有超过阈值 (${threshold}) 的风险项\n`
  } else {
    output += `### 高风险项 (阈值: ${threshold})\n\n`
    
    for (const risk of filteredRisks) {
      const emoji = risk.riskScore >= 70 ? "🔴" : "🟡"
      output += `#### ${emoji} ${risk.name}\n`
      output += `- **类型**: ${risk.type}\n`
      output += `- **风险指数**: ${risk.riskScore}\n`
      output += `- **负责人**: ${risk.owner}\n`
      output += `- **截止日期**: ${risk.dueDate}\n`
      output += `- **详情**: ${risk.details.join("; ")}\n`
      
      if (risk.recommendation) {
        output += `- **💡 建议**: ${risk.recommendation}\n`
      }
      output += "\n"
    }
  }

  // AI 综合建议
  if (data.aiRecommendations && data.aiRecommendations.length > 0) {
    output += `### 💡 AI 综合建议\n\n`
    for (const rec of data.aiRecommendations) {
      const priorityEmoji = rec.priority === "high" ? "🔴" : "🟡"
      output += `${priorityEmoji} **${rec.title}**\n`
      output += `${rec.description}\n`
      if (rec.actions && rec.actions.length > 0) {
        output += `行动项:\n`
        rec.actions.forEach((action: string) => {
          output += `  - ${action}\n`
        })
      }
      output += "\n"
    }
  }

  return {
    content: output,
    data: result.data,
    hasHighRisk: filteredRisks.length > 0,
  }
}

/**
 * 生成日报
 */
export async function generate_daily_report(
  ctx: SkillContext,
  params: { format?: "json" | "markdown" }
) {
  const format = params.format || "markdown"
  const result = await fetchProjexAPI(ctx, "/api/openclaw/reports/daily", "POST", { format })
  
  if (!result.success) {
    throw new Error(result.error || "Failed to generate daily report")
  }

  return {
    content: result.data.markdown || JSON.stringify(result.data, null, 2),
    data: result.data,
  }
}

/**
 * 生成周报
 */
export async function generate_weekly_report(
  ctx: SkillContext,
  params: { format?: "json" | "markdown" }
) {
  const format = params.format || "markdown"
  const result = await fetchProjexAPI(ctx, "/api/openclaw/reports/weekly", "POST", { format })
  
  if (!result.success) {
    throw new Error(result.error || "Failed to generate weekly report")
  }

  return {
    content: result.data.markdown || JSON.stringify(result.data, null, 2),
    data: result.data,
  }
}
