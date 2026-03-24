"use client"

import { useEffect, useState } from "react"

export function AppLoading() {
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // 模拟加载进度
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        // 快速到80%，然后慢慢到100%
        if (prev < 80) {
          return prev + Math.random() * 15
        }
        return prev + Math.random() * 5
      })
    }, 100)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (progress >= 100) {
      // 完成后延迟淡出
      const timeout = setTimeout(() => {
        setFadeOut(true)
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [progress])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.5s ease-out",
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      {/* 背景动画圆圈 - 缩小 */}
      <div
        style={{
          position: "absolute",
          width: 250,
          height: 250,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,124,255,0.15) 0%, transparent 70%)",
          animation: "pulse 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)",
          animation: "pulse 3s ease-in-out infinite 0.5s",
        }}
      />

      {/* Logo 容器 - 缩小 */}
      <div
        style={{
          position: "relative",
          marginBottom: 40,
          width: 120,
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 旋转光环 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#7c7cff",
            borderRightColor: "#22d3ee",
            animation: "spin 1.5s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            right: 10,
            bottom: 10,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderBottomColor: "#22d3ee",
            borderLeftColor: "#7c7cff",
            animation: "spin 2s linear infinite reverse",
          }}
        />

        {/* Logo 图标 - 圆角矩形 + P */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "linear-gradient(135deg, #7c7cff 0%, #22d3ee 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(124, 124, 255, 0.4)",
          }}
        >
          <span style={{ fontSize: 32, color: "#fff", fontWeight: 700 }}>P</span>
        </div>
      </div>

      {/* 品牌名称 */}
      <div
        style={{
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            background: "linear-gradient(135deg, #fff 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: 2,
          }}
        >
          Projex
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14,
            color: "#64748b",
            letterSpacing: 1,
          }}
        >
          AI 驱动的智能项目管理平台
        </p>
      </div>

      {/* 进度条 */}
      <div
        style={{
          width: 200,
          height: 4,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 2,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, #7c7cff 0%, #22d3ee 100%)",
            borderRadius: 2,
            transition: "width 0.3s ease-out",
            boxShadow: "0 0 10px rgba(124,124,255,0.5)",
          }}
        />
      </div>

      {/* 加载文字 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            color: "#64748b",
            fontSize: 13,
          }}
        >
          {progress < 100 ? "正在加载" : "加载完成"}
        </span>
        {progress < 100 && (
          <span
            style={{
              display: "flex",
              gap: 4,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#7c7cff",
                  animation: `dotBounce 1.4s ease-in-out infinite ${i * 0.16}s`,
                }}
              />
            ))}
          </span>
        )}
      </div>

      {/* CSS 动画 */}
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes dotBounce {
          0%,
          80%,
          100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
