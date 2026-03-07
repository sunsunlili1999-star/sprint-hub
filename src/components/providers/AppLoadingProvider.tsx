"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { AppLoading } from "@/components/loading/AppLoading"

interface AppLoadingContextType {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const AppLoadingContext = createContext<AppLoadingContextType | undefined>(undefined)

export function useAppLoading() {
  const context = useContext(AppLoadingContext)
  if (!context) {
    throw new Error("useAppLoading must be used within AppLoadingProvider")
  }
  return context
}

interface AppLoadingProviderProps {
  children: ReactNode
}

export function AppLoadingProvider({ children }: AppLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    // 检测页面是否已加载完成
    const handleLoad = () => {
      // 给一点延迟确保所有样式都已应用
      setTimeout(() => {
        setIsLoading(false)
      }, 800)
    }

    // 如果页面已经加载完成
    if (document.readyState === "complete") {
      handleLoad()
    } else {
      window.addEventListener("load", handleLoad)
      return () => window.removeEventListener("load", handleLoad)
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      // 等待淡出动画完成后再移除组件
      const timeout = setTimeout(() => {
        setShowLoading(false)
      }, 600)
      return () => clearTimeout(timeout)
    }
  }, [isLoading])

  return (
    <AppLoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {showLoading && <AppLoading />}
      <div
        style={{
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.3s ease-in",
        }}
      >
        {children}
      </div>
    </AppLoadingContext.Provider>
  )
}
