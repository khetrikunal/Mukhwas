import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppFloat from '@/components/ui/WhatsAppFloat'
import CartHydrator from '@/components/common/CartHydrator'

export const metadata: Metadata = {
  title: {
    default: '1824 Vituraya Ventures Private Limited',
    template: '%s | 1824 Vituraya Ventures Private Limited',
  },
  description:
    'Premium mukhwas, mouth fresheners & digestive products. 42+ products crafted with the finest natural ingredients. Order online – pan India delivery. 1824 Vituraya Ventures Private Limited.',
  keywords: ['mukhwas', 'mouth freshener', 'digestive', 'paan', 'amla', 'Baramati', 'Maharashtra'],
  openGraph: {
    title: '1824 Vituraya Ventures Private Limited',
    description:
      'Premium mukhwas, mouth fresheners & digestive products. 42+ products crafted with the finest natural ingredients.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '1824 Vituraya Ventures Private Limited',
    description:
      'Premium mukhwas, mouth fresheners & digestive products. 42+ products crafted with the finest natural ingredients.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <CartHydrator />
        <main>{children}</main>
        <Footer />
        <WhatsAppFloat />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#c9a84c', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
