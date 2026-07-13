import { Suspense } from 'react'
import ProductsClient from './ProductsClient'

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="pt-[70px] min-h-screen bg-cream" />}>
      <ProductsClient />
    </Suspense>
  )
}
