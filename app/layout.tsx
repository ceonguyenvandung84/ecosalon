import { Be_Vietnam_Pro, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'
import { Providers } from '@/components/providers'
import Script from 'next/script'
import type { Metadata } from 'next'

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})
const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'SALON HAIR SYSTEM | Đào tạo - Mỹ phẩm - Cộng đồng',
  description:
    'Nền tảng học tập & kinh doanh dành riêng cho ngành làm đẹp – salon – mỹ phẩm. Khóa học chất lượng, sản phẩm chính hãng và cộng đồng kết nối.',
  keywords: ['salon', 'làm đẹp', 'khóa học tóc', 'mỹ phẩm', 'spa', 'đào tạo salon'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'SALON HAIR SYSTEM | Đào tạo - Mỹ phẩm - Cộng đồng',
    description:
      'Nền tảng học tập & kinh doanh dành riêng cho ngành làm đẹp – salon – mỹ phẩm.',
    images: ['/og-image.png'],
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <Script src="https://apps.abacus.ai/chatllm/appllm-lib.js" strategy="beforeInteractive" />
      </head>
      <body className={`${beVietnam.variable} ${playfair.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
          <Toaster />
          <ChunkLoadErrorHandler />
        </ThemeProvider>
      </body>
    </html>
  )
}
