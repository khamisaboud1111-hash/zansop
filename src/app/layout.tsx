import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator'
import { Inter, Poppins } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { cookies } from 'next/headers'
import { getSiteOrigin } from '@/lib/site'
import { GlobalErrorBoundary } from '@/components/shared/GlobalErrorBoundary'
import GlobalErrorHandler from '@/components/shared/GlobalErrorHandler'
import { QueryProvider } from '@/lib/query/provider'
import { StoresProvider } from '@/store'
import { ClientInitializer } from '@/components/shared/ClientInitializer'
import PWAinitializer from '@/components/layout/PWAinitializer'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1da8ab' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  applicationName: 'Zanshop',
  authors: [{ name: 'Zanshop Team' }],
  creator: 'Zanshop',
  publisher: 'Zanshop',
  robots: {
    index: true,
    follow: true,
  },
  category: 'Shopping',
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Zanshop - Soko Kuu la Mtandaoni Zanzibar na Tanzania',
    template: '%s | Zanshop',
  },
  description: 'Nunua na uuze bidhaa za mtandaoni kama vifaa vya umeme, mitindo, vyakula, samani na bidhaa za urembo kote Zanzibar na Tanzania kwa malipo salama na usafirishaji wa haraka.',
  openGraph: {
    title: 'Zanshop - Soko Kuu la Mtandaoni Zanzibar na Tanzania',
    description: 'Buy electronics, fashion, groceries, furniture, beauty products and more across Zanzibar and Tanzania with secure payments and fast delivery.',
    url: getSiteOrigin(),
    siteName: 'Zanshop',
    locale: 'sw_TZ',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Zanshop Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zanshop - Zanzibar Marketplace',
    description: 'Soko la kuaminika Zanzibar na Tanzania.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Zanshop',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const langCookie = cookies().get('lang')?.value
  const ssrLang = langCookie === 'ar' || langCookie === 'en' || langCookie === 'fr' ? langCookie : 'sw'
  const ssrDir = ssrLang === 'ar' ? 'rtl' : 'ltr'

  // Read theme from cookie for SSR to avoid hydration mismatch
  const themeCookie = cookies().get('theme')?.value
  const ssrTheme = themeCookie === 'dark' ? 'dark' : 'light'
  const ssrThemeClass = ssrTheme === 'dark' ? 'dark' : ''

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Zanshop",
    "url": getSiteOrigin(),
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${getSiteOrigin()}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang={ssrLang} dir={ssrDir} className={ssrThemeClass}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable} min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}>
        {/* The boundary sits ABOVE every provider on purpose: any error thrown
            by the providers themselves must still be caught and displayed. */}
        <GlobalErrorBoundary>
          <StoresProvider>
            <ClientInitializer />
            <PWAinitializer />
            {/* Accessibility Skip Link */}
            <a 
              href="#main-content" 
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:font-semibold focus:rounded-lg focus:shadow-lg"
            >
              Rukia kwenye maudhui makuu (Skip to content)
            </a>

            <PullToRefreshIndicator />
            <GlobalErrorHandler />

            <main id="main-content">
              <QueryProvider>
                {children}
              </QueryProvider>
            </main>

            <Toaster 
              position="top-center"
              gutter={10}
              reverseOrder={false}
              toastOptions={{
                duration: 3500,
                success: {
                  duration: 2500,
                  style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #10b981' }
                },
                error: {
                  duration: 5000,
                  style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #ef4444' }
                },
                style: { 
                  borderRadius: '14px',
                  padding: '14px 18px',
                  fontWeight: 500,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                },
              }}
            />
          </StoresProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  )
}


