"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Empty } from "antd"
import { moduleApi, requirementApi } from "@/lib/api"
import { ProductRequirementsTab, ProductRequirementsSkeleton } from "../components"

export default function RequirementsPage() {
  const params = useParams()
  const productId = params.productId as string
  
  const [modules, setModules] = useState<any[]>([])
  const [requirements, setRequirements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [modulesData, requirementsData] = await Promise.all([
          moduleApi.getList(productId),
          requirementApi.getList(productId),
        ])
        setModules(modulesData)
        setRequirements(requirementsData)
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
        <ProductRequirementsSkeleton />
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
      <ProductRequirementsTab 
        productId={productId}
        modules={modules}
        requirements={requirements}
      />
    </div>
  )
}
