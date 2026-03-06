"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { createPortal } from "react-dom"
import { FileTextFilled, ThunderboltFilled, CodeFilled } from "@ant-design/icons"

// 弹窗类型
export type ModalType = 'requirement' | 'task' | 'workitem'

// 弹窗项
export interface ModalItem {
  id: string
  type: ModalType
  itemId: string | null // null 表示新建模式
  title?: string
  props?: Record<string, any>
}

// Context 类型
interface ModalStackContextType {
  stack: ModalItem[]
  push: (type: ModalType, itemId: string | null, props?: Record<string, any>) => void
  pop: () => void
  popTo: (id: string) => void
  clear: () => void
  replace: (type: ModalType, itemId: string | null, props?: Record<string, any>) => void
  isOpen: boolean
  currentModal: ModalItem | null
}

const ModalStackContext = createContext<ModalStackContextType | null>(null)

// Hook
export function useModalStack() {
  const context = useContext(ModalStackContext)
  if (!context) {
    throw new Error("useModalStack must be used within a ModalStackProvider")
  }
  return context
}

// Provider Props
interface ModalStackProviderProps {
  children: ReactNode
  renderModal: (modal: ModalItem, index: number, total: number, onClose: () => void) => ReactNode
}

// 生成唯一 ID
let modalIdCounter = 0
const generateModalId = () => `modal-${++modalIdCounter}-${Date.now()}`

// Provider
export function ModalStackProvider({ children, renderModal }: ModalStackProviderProps) {
  const [stack, setStack] = useState<ModalItem[]>([])
  const [mounted, setMounted] = useState(false)

  // 确保在客户端挂载后才渲染 portal
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const push = useCallback((type: ModalType, itemId: string | null, props?: Record<string, any>) => {
    const newModal: ModalItem = {
      id: generateModalId(),
      type,
      itemId,
      props,
    }
    setStack(prev => [...prev, newModal])
  }, [])

  const pop = useCallback(() => {
    setStack(prev => prev.slice(0, -1))
  }, [])

  const popTo = useCallback((id: string) => {
    setStack(prev => {
      const index = prev.findIndex(m => m.id === id)
      if (index === -1) return prev
      return prev.slice(0, index + 1)
    })
  }, [])

  const clear = useCallback(() => {
    setStack([])
  }, [])

  const replace = useCallback((type: ModalType, itemId: string | null, props?: Record<string, any>) => {
    const newModal: ModalItem = {
      id: generateModalId(),
      type,
      itemId,
      props,
    }
    setStack(prev => [...prev.slice(0, -1), newModal])
  }, [])

  const isOpen = stack.length > 0
  const currentModal = stack.length > 0 ? stack[stack.length - 1] : null

  const value: ModalStackContextType = {
    stack,
    push,
    pop,
    popTo,
    clear,
    replace,
    isOpen,
    currentModal,
  }

  return (
    <ModalStackContext.Provider value={value}>
      {children}
      {mounted && typeof document !== 'undefined' && createPortal(
        <ModalStackRenderer stack={stack} renderModal={renderModal} onClose={pop} onPopTo={popTo} onClear={clear} />,
        document.body
      )}
    </ModalStackContext.Provider>
  )
}

// 获取类型配置
const getTypeConfig = (type: ModalType) => {
  switch (type) {
    case 'requirement':
      return { label: '需求', color: '#7c7cff', bgColor: '#f0f0ff', icon: FileTextFilled }
    case 'task':
      return { label: '任务', color: '#faad14', bgColor: '#fffbe6', icon: ThunderboltFilled }
    case 'workitem':
      return { label: '工作项', color: '#60a5fa', bgColor: '#eff6ff', icon: CodeFilled }
  }
}

// 弹窗渲染器
interface ModalStackRendererProps {
  stack: ModalItem[]
  renderModal: (modal: ModalItem, index: number, total: number, onClose: () => void) => ReactNode
  onClose: () => void
  onPopTo: (id: string) => void
  onClear: () => void
}

function ModalStackRenderer({ stack, renderModal, onClose, onPopTo, onClear }: ModalStackRendererProps) {
  if (stack.length === 0) return null

  const total = stack.length
  const hasMultiple = total > 1

  return (
    <div className="modal-stack-container">
      {/* 遮罩层 */}
      <div 
        className="modal-stack-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: hasMultiple 
            ? 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.6) 100%)'
            : 'rgba(0, 0, 0, 0.45)',
          zIndex: 1000,
          transition: 'all 0.4s ease',
          backdropFilter: hasMultiple ? 'blur(4px)' : 'none',
        }}
      />
      
      {/* 左侧缩略卡片导航 */}
      {hasMultiple && (
        <div
          className="modal-stack-sidebar"
          style={{
            position: 'fixed',
            left: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {stack.slice(0, -1).map((modal, index) => {
            const config = getTypeConfig(modal.type)
            const IconComponent = config.icon
            
            return (
              <div
                key={modal.id}
                onClick={() => onPopTo(modal.id)}
                style={{
                  width: 200,
                  padding: '16px',
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: `2px solid ${config.color}20`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(8px) scale(1.02)'
                  e.currentTarget.style.boxShadow = `0 12px 40px ${config.color}30, 0 4px 12px rgba(0,0,0,0.1)`
                  e.currentTarget.style.borderColor = config.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)'
                  e.currentTarget.style.borderColor = `${config.color}20`
                }}
              >
                {/* 顶部装饰条 */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${config.color}, ${config.color}80)`,
                  }}
                />
                
                {/* 层级指示器 */}
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: config.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    color: config.color,
                  }}
                >
                  {index + 1}
                </div>
                
                {/* 图标和类型 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <IconComponent style={{ fontSize: 18, color: config.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: config.color }}>
                    {config.label}
                  </span>
                </div>
                
                {/* ID */}
                {modal.itemId && (
                  <div style={{ fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace' }}>
                    #{modal.itemId.slice(-8)}
                  </div>
                )}
                
                {/* 返回提示 */}
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    color: '#bfbfbf',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>←</span>
                  <span>点击返回</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* 当前弹窗 */}
      {stack.map((modal, index) => {
        const isTop = index === total - 1
        const config = getTypeConfig(modal.type)
        
        // 只渲染最顶层的弹窗
        if (!isTop) return null
        
        return (
          <div
            key={modal.id}
            className="modal-stack-item"
            style={{
              position: 'fixed',
              top: '50%',
              left: hasMultiple ? 'calc(50% + 100px)' : '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1001 + index,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {renderModal(modal, index, total, onClose)}
          </div>
        )
      })}
      
      {/* 顶部操作栏 */}
      {hasMultiple && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 24,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* 层级面包屑 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 24,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            {stack.map((modal, index) => {
              const config = getTypeConfig(modal.type)
              const IconComponent = config.icon
              const isLast = index === stack.length - 1
              
              return (
                <React.Fragment key={modal.id}>
                  {index > 0 && (
                    <span style={{ color: '#d9d9d9', fontSize: 12 }}>›</span>
                  )}
                  <div
                    onClick={() => !isLast && onPopTo(modal.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 12,
                      cursor: isLast ? 'default' : 'pointer',
                      background: isLast ? config.bgColor : 'transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLast) {
                        e.currentTarget.style.background = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLast) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <IconComponent style={{ fontSize: 14, color: config.color }} />
                    <span
                      style={{
                        fontSize: 13,
                        color: isLast ? config.color : '#666',
                        fontWeight: isLast ? 600 : 400,
                      }}
                    >
                      {config.label}
                    </span>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
          
          {/* 关闭所有按钮 */}
          <button
            onClick={onClear}
            style={{
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 13,
              color: '#666',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff1f0'
              e.currentTarget.style.color = '#ff4d4f'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
              e.currentTarget.style.color = '#666'
            }}
          >
            <span>✕</span>
            <span>关闭全部</span>
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) translateX(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) translateX(0) scale(1);
          }
        }
        
        .modal-stack-item {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.3);
        }
        
        .modal-stack-item .ant-modal {
          margin: 0 !important;
          padding: 0 !important;
          top: 0 !important;
          max-width: none !important;
        }
        
        .modal-stack-item .ant-modal-wrap {
          position: static !important;
        }
        
        .modal-stack-item .ant-modal-mask {
          display: none !important;
        }
        
        .modal-stack-item .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }

        .modal-stack-sidebar > div {
          animation: cardSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation-fill-mode: both;
        }
        
        .modal-stack-sidebar > div:nth-child(1) { animation-delay: 0.05s; }
        .modal-stack-sidebar > div:nth-child(2) { animation-delay: 0.1s; }
        .modal-stack-sidebar > div:nth-child(3) { animation-delay: 0.15s; }
        
        @keyframes cardSlideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

export { ModalStackContext }
