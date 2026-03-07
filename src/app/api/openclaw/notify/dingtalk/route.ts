import { NextResponse } from "next/server"
import crypto from "crypto"

interface DingTalkMessage {
  msgtype: "text" | "markdown" | "actionCard"
  text?: {
    content: string
  }
  markdown?: {
    title: string
    text: string
  }
  actionCard?: {
    title: string
    text: string
    btnOrientation: "0" | "1"
    btns: { title: string; actionURL: string }[]
  }
  at?: {
    atMobiles?: string[]
    isAtAll?: boolean
  }
}

/**
 * POST /api/openclaw/notify/dingtalk
 * 发送钉钉消息
 * 供 OpenClaw dingtalk-notify-skill 调用
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { webhook, secret, message, atMobiles, isAtAll } = body

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: "Webhook URL is required" },
        { status: 400 }
      )
    }

    // 构建钉钉消息
    const dingMessage: DingTalkMessage = {
      msgtype: "markdown",
      markdown: {
        title: message.title || "Projex 通知",
        text: message.content,
      },
      at: {
        atMobiles: atMobiles || [],
        isAtAll: isAtAll || false,
      },
    }

    // 如果有签名密钥，计算签名
    let finalWebhook = webhook
    if (secret) {
      const timestamp = Date.now()
      const sign = generateSign(timestamp, secret)
      finalWebhook = `${webhook}&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`
    }

    // 发送请求到钉钉
    const response = await fetch(finalWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dingMessage),
    })

    const result = await response.json()

    if (result.errcode === 0) {
      return NextResponse.json({
        success: true,
        message: "Message sent successfully",
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.errmsg },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Failed to send DingTalk message:", error)
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    )
  }
}

// 生成钉钉签名
function generateSign(timestamp: number, secret: string): string {
  const stringToSign = `${timestamp}\n${secret}`
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(stringToSign)
  return hmac.digest("base64")
}

/**
 * GET /api/openclaw/notify/dingtalk/test
 * 测试钉钉连接
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const webhook = searchParams.get("webhook")
  const secret = searchParams.get("secret")

  if (!webhook) {
    return NextResponse.json(
      { success: false, error: "Webhook URL is required" },
      { status: 400 }
    )
  }

  // 发送测试消息
  const testMessage = {
    msgtype: "markdown",
    markdown: {
      title: "Projex 连接测试",
      text: `## ✅ 连接测试成功\n\n**Projex** AI 项目管理平台已成功连接到此钉钉群！\n\n> 测试时间: ${new Date().toLocaleString("zh-CN")}\n\n您将可以收到：\n- 📊 每日状态推送\n- ⚠️ 实时风险告警\n- 📝 智能周报\n\n---\n*来自 Projex AI 助手小派*`,
    },
  }

  try {
    let finalWebhook = webhook
    if (secret) {
      const timestamp = Date.now()
      const sign = generateSign(timestamp, secret)
      finalWebhook = `${webhook}&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`
    }

    const response = await fetch(finalWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testMessage),
    })

    const result = await response.json()

    if (result.errcode === 0) {
      return NextResponse.json({
        success: true,
        message: "Test message sent successfully",
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.errmsg },
        { status: 400 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to send test message" },
      { status: 500 }
    )
  }
}
