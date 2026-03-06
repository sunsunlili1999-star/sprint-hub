"use client"

import React, { useRef, useEffect, useState } from "react"
import { Table } from "antd"
import type { TableProps } from "antd"
import "./FixedTable.css"

interface FixedTableProps<T> extends Omit<TableProps<T>, 'scroll' | 'pagination'> {
  scrollX?: number | string
}

/**
 * 固定高度的表格组件
 * - 表头固定
 * - 内容区域滚动填满容器
 * - 滚动条贴底显示
 */
export function FixedTable<T extends object>({
  scrollX = "max-content",
  dataSource,
  columns,
  ...rest
}: FixedTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState<number | undefined>(undefined)

  useEffect(() => {
    const updateScrollY = () => {
      if (containerRef.current) {
        // 获取容器高度，减去表头高度（约 39px）
        const containerHeight = containerRef.current.clientHeight
        const headerHeight = 39
        const newScrollY = containerHeight - headerHeight
        if (newScrollY > 0) {
          setScrollY(newScrollY)
        }
      }
    }

    updateScrollY()
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateScrollY)
    
    // 使用 ResizeObserver 监听容器大小变化
    const resizeObserver = new ResizeObserver(updateScrollY)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateScrollY)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className="fixed-table-container">
      <Table<T>
        {...rest}
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        scroll={{ x: scrollX, y: scrollY }}
      />
    </div>
  )
}
