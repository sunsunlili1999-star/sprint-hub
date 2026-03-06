"use client"

import { useEffect, useCallback, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { message } from "antd"
import { useBreadcrumb } from "@/components/layout/main-layout"
import { productApi, type Product } from "@/lib/api"

interface ProductListItem {
  id: string
  name: string
  code: string
}

interface ProductLayoutClientProps {
  productId: string
  children: React.ReactNode
}

export function ProductLayoutClient({ productId, children }: ProductLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { setBreadcrumbs, setHeaderTabs, clearHeaderTabs } = useBreadcrumb()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [allProducts, setAllProducts] = useState<ProductListItem[]>([])

  // 从路径获取当前 Tab
  const getActiveTab = useCallback(() => {
    if (pathname.endsWith("/requirements")) return "requirements"
    if (pathname.endsWith("/documents")) return "documents"
    return "detail"
  }, [pathname])

  // 加载所有产品列表
  const loadAllProducts = useCallback(async () => {
    try {
      const data = await productApi.getList()
      setAllProducts(data.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
      })))
    } catch (error) {
      console.error("加载产品列表失败", error)
    }
  }, [])

  // 加载产品基本信息
  const loadProduct = useCallback(async () => {
    try {
      const data = await productApi.getDetail(productId)
      setProduct(data)
    } catch (error) {
      console.error("加载产品失败", error)
    }
  }, [productId])



  // 设置面包屑
  useEffect(() => {
    if (product && allProducts.length > 0) {
      setBreadcrumbs([
        { title: "产品管理", href: "/products" },
        {
          title: product.name,
          dropdown: {
            options: allProducts.map(p => ({ key: p.id, label: p.name })),
            currentKey: productId,
            onSelect: (newProductId: string) => {
              const currentTab = getActiveTab()
              if (currentTab === "detail") {
                router.push(`/products/${newProductId}`)
              } else {
                router.push(`/products/${newProductId}/${currentTab}`)
              }
            },
          },
          star: {
            starred: product.starred,
            onToggle: () => {
              if (product) {
                productApi.toggleStar(productId).then(result => {
                  setProduct(prev => prev ? { ...prev, starred: result.starred } : null)
                  message.success(result.starred ? "已收藏" : "已取消收藏")
                }).catch(() => {
                  message.error("操作失败")
                })
              }
            },
          },
        },
      ])
    }
  }, [product, allProducts, productId, setBreadcrumbs, router, pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // 设置 Header Tabs
  useEffect(() => {
    const activeTab = getActiveTab()
    setHeaderTabs(
      [
        { key: "detail", label: "详情" },
        { key: "requirements", label: "需求" },
        { key: "documents", label: "文档" },
      ],
      activeTab,
      (key) => {
        if (key === "detail") {
          router.push(`/products/${productId}`)
        } else {
          router.push(`/products/${productId}/${key}`)
        }
      }
    )
    
    return () => {
      clearHeaderTabs()
    }
  }, [pathname, productId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadAllProducts()
    loadProduct()
  }, [loadAllProducts, loadProduct])

  return <>{children}</>
}
