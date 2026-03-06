"use client"

import { Skeleton, Space } from "antd"

// 详情页骨架屏
export function ProductDetailSkeleton() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minHeight: 0, padding: 24 }}>
      {/* 产品信息卡片骨架 */}
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Skeleton.Avatar active shape="square" size={48} style={{ borderRadius: 10 }} />
            <div>
              <Skeleton.Input active size="small" style={{ width: 150, marginBottom: 8 }} />
              <Skeleton.Input active size="small" style={{ width: 250 }} />
            </div>
          </div>
          <Skeleton.Button active size="default" style={{ width: 80 }} />
        </div>
        
        <div style={{ padding: "16px 24px", display: "flex", gap: 48 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Skeleton.Avatar active size={28} />
              <div>
                <Skeleton.Input active size="small" style={{ width: 50, height: 14, marginBottom: 4 }} />
                <Skeleton.Input active size="small" style={{ width: 70, height: 16 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 关联项目和发布骨架 */}
      <div style={{ flex: 1, display: "flex", gap: 16, minHeight: 0 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f9fc" }}>
              <Space size={8}>
                <Skeleton.Avatar active size={16} shape="square" />
                <Skeleton.Input active size="small" style={{ width: 80 }} />
              </Space>
              <Skeleton.Button active size="small" style={{ width: 50, height: 24 }} />
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map(j => (
                  <Skeleton key={j} active paragraph={{ rows: 1 }} title={false} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 需求页骨架屏 - 简洁版
export function ProductRequirementsSkeleton() {
  return (
    <div style={{ flex: 1, display: "flex", background: "#fff", border: "1px solid #e2e8f0", minHeight: 0 }}>
      {/* 侧边栏骨架 */}
      <div style={{ width: 220, display: "flex", flexDirection: "column", flexShrink: 0, borderRight: "1px solid #e2e8f0" }}>
        <div style={{ 
          padding: "10px 16px", 
          borderBottom: "1px solid #e2e8f0", 
          background: "linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%)", 
          height: 40 
        }}>
          <Skeleton.Input active size="small" style={{ width: 60, height: 18 }} />
        </div>
        <div style={{ flex: 1, padding: "12px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[100, 80, 70, 90].map((w, i) => (
              <Skeleton.Input key={i} active size="small" style={{ width: w, height: 18 }} />
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区骨架 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div style={{ 
          padding: "10px 16px", 
          borderBottom: "1px solid #e2e8f0", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          background: "linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%)", 
          height: 40 
        }}>
          <Skeleton.Input active size="small" style={{ width: 80, height: 18 }} />
          <Skeleton.Button active size="small" style={{ width: 60 }} />
        </div>

        {/* 工具栏 */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0" }}>
          <Space size={16}>
            <Skeleton.Input active size="small" style={{ width: 200, height: 32 }} />
            <Skeleton.Input active size="small" style={{ width: 60, height: 28 }} />
            <Skeleton.Input active size="small" style={{ width: 60, height: 28 }} />
          </Space>
        </div>

        {/* 表格骨架 - 简化 */}
        <div style={{ flex: 1, padding: "20px 16px", overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <Skeleton.Input active size="small" style={{ width: 60, height: 18 }} />
                <Skeleton.Input active size="small" style={{ width: 200, height: 18 }} />
                <Skeleton.Input active size="small" style={{ width: 80, height: 18 }} />
                <Skeleton.Avatar active size={28} />
                <Skeleton.Input active size="small" style={{ width: 60, height: 24 }} />
              </div>
            ))}
          </div>
        </div>

        {/* 分页骨架 */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton.Input active size="small" style={{ width: 80, height: 18 }} />
          <Skeleton.Input active size="small" style={{ width: 150, height: 28 }} />
        </div>
      </div>
    </div>
  )
}

// 文档页骨架屏 - 简洁版
export function ProductDocumentsSkeleton() {
  return (
    <div style={{ flex: 1, display: "flex", background: "#fff", border: "1px solid #e2e8f0", minHeight: 0 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div style={{ 
          padding: "10px 16px", 
          borderBottom: "1px solid #e2e8f0", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          background: "linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%)", 
          height: 40 
        }}>
          <Skeleton.Input active size="small" style={{ width: 80, height: 18 }} />
          <Skeleton.Button active size="small" style={{ width: 60 }} />
        </div>

        {/* 工具栏 */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0" }}>
          <Space size={16}>
            <Skeleton.Input active size="small" style={{ width: 200, height: 32 }} />
            <Skeleton.Input active size="small" style={{ width: 60, height: 28 }} />
            <Skeleton.Input active size="small" style={{ width: 60, height: 28 }} />
          </Space>
        </div>

        {/* 表格骨架 - 简化 */}
        <div style={{ flex: 1, padding: "20px 16px", overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <Skeleton.Avatar active size={24} shape="square" />
                <Skeleton.Input active size="small" style={{ width: 180, height: 18 }} />
                <Skeleton.Input active size="small" style={{ width: 60, height: 18 }} />
                <Skeleton.Avatar active size={28} />
                <Skeleton.Input active size="small" style={{ width: 80, height: 18 }} />
              </div>
            ))}
          </div>
        </div>

        {/* 分页骨架 */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton.Input active size="small" style={{ width: 80, height: 18 }} />
          <Skeleton.Input active size="small" style={{ width: 150, height: 28 }} />
        </div>
      </div>
    </div>
  )
}
