"use client"

import React from "react"
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
  return (
    <div className="fixed-table-container">
      <Table<T>
        {...rest}
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        scroll={{ x: scrollX }}
      />
    </div>
  )
}
