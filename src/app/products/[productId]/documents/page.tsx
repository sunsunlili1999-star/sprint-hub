"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Empty } from "antd"
import { documentApi } from "@/lib/api"
import { ProductDocumentsTab, ProductDocumentsSkeleton } from "../components"

export default function DocumentsPage() {
  const params = useParams()
  const productId = params.productId as string
  
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const data = await documentApi.getList(productId)
        setDocuments(data)
      } catch (err) {
        console.error("加载数据失败:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [productId])

  if (loading) {
    return (
      <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column" }}>
        <ProductDocumentsSkeleton />
      </div>
    )
  }
  
  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 64px)" }}>
        <Empty description="加载失败" />
      </div>
    )
  }

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <ProductDocumentsTab 
        productId={productId}
        documents={documents}
      />
    </div>
  )
}
