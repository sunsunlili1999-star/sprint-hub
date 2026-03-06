import { ProductLayoutClient } from "./components/ProductLayoutClient"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ productId: string }>
}

export default async function ProductDetailLayout({ children, params }: LayoutProps) {
  const { productId } = await params
  
  return (
    <ProductLayoutClient productId={productId}>
      {children}
    </ProductLayoutClient>
  )
}
