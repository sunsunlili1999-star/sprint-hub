/**
 * DingTalk Notify Skill for OpenClaw
 * 
 * 发送钉钉消息通知
 */

import crypto from "crypto"

interface SkillConfig {
  webhook_url: string
  secret?: string
  default_at_mobiles?: string[]
}

interface SkillContext {
  config: SkillConfig
}

// 生成钉钉签名
function generateSign(timestamp: number, secret: string): string {
  const stringToSign = `${timestamp}\n${secret}`
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(stringToSign)
  return hmac.digest("base64")
}

// 发送钉钉消息
async function sendDingTalkMessage(
  ctx: SkillContext,
  title: string,
  content: string,
  atMobiles?: string[],
  atAll?: boolean
) {
  let webhookUrl = ctx.config.webhook_url

  // 如果有签名密钥，计算签名
  if (ctx.config.secret) {
    const timestamp = Date.now()
    const sign = generateSign(timestamp, ctx.config.secret)
    webhookUrl = `${webhookUrl}&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`
  }

  const message = {
    msgtype: "markdown",
    markdown: {
      title,
      text: content,
    },
    at: {
      atMobiles: atMobiles || ctx.config.default_at_mobiles || [],
      isAtAll: atAll || false,
    },
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  })

  const result = await response.json()

  if (result.errcode !== 0) {
    throw new Error(`DingTalk API error: ${result.errmsg}`)
  }

  return result
}

/**
 * 发送消息
 */
export async function send_message(
  ctx: SkillContext,
  params: {
    title?: string
    content: string
    at_mobiles?: string[]
    at_all?: boolean
  }
) {
  const title = params.title || "Projex 通知"
  
  await sendDingTalkMessage(
    ctx,
    title,
    params.content,
    params.at_mobiles,
    params.at_all
  )

  return {
    content: `✅ 消息已发送到钉钉群`,
    success: true,
  }
}

/**
 * 发送每日状态播报
 */
export async function send_daily_status(
  ctx: SkillContext,
  params: {
    sprint_status?: string
    release_status?: string
  }
) {
  const today = new Date()
  const dateStr = today.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  let content = `## 📊 每日状态播报\n\n`
  content += `**日期**: ${dateStr}\n\n`
  content += `---\n\n`

  if (params.sprint_status) {
    content += params.sprint_status + "\n\n"
  }

  if (params.release_status) {
    content += `---\n\n`
    content += params.release_status + "\n\n"
  }

  content += `---\n*来自 Projex AI 助手小派*`

  await sendDingTalkMessage(ctx, "每日状态播报", content)

  return {
    content: `✅ 每日状态播报已发送`,
    success: true,
  }
}

/**
 * 发送风险告警
 */
export async function send_risk_alert(
  ctx: SkillContext,
  params: {
    risk_content: string
    level?: "high" | "medium" | "low"
  }
) {
  const level = params.level || "medium"
  const levelEmoji = level === "high" ? "🔴" : level === "medium" ? "🟡" : "🟢"
  const levelText = level === "high" ? "高" : level === "medium" ? "中" : "低"

  let content = `## ${levelEmoji} 风险告警\n\n`
  content += `**风险等级**: ${levelText}\n\n`
  content += `---\n\n`
  content += params.risk_content
  content += `\n\n---\n*来自 Projex AI 助手小派*`

  // 高风险时 @所有人
  const atAll = level === "high"

  await sendDingTalkMessage(ctx, "风险告警", content, undefined, atAll)

  return {
    content: `✅ 风险告警已发送 (等级: ${levelText})`,
    success: true,
  }
}
