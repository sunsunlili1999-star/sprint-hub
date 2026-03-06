"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Empty } from "antd"
import { productApi } from "@/lib/api"
import { ProductDetailTab, ProductDetailSkeleton } from "./components"

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.productId as string
  
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true)
        const data = await productApi.getDetail(productId)
        setProduct(data)
      } catch (err) {
        console.error("加载产品详情失败:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [productId])

  if (loading) {
    return <ProductDetailSkeleton />
  }
  
  if (error || !product) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 64px)" }}>
        <Empty description="产品不存在或加载失败" />
      </div>
    )
  }

  return (
    <div style={{ padding: 24, height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <ProductDetailTab product={product} />
    </div>
  )
}
