import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

// The v3 design system sets both body copy and headings in Figtree; the
// weights below are the only ones the mockup uses (400 / 600 / 700).
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-figtree',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'IDP — Plataforma de Desenvolvimento',
  description: 'Catálogo de repositórios, pull requests, grafo de dependências e documentação',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const themeScript = `
    (function() {
      try {
        var stored = localStorage.getItem('idp-theme');
        var theme = stored === 'light' || stored === 'dark'
          ? stored
          : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.dataset.theme = theme;
      } catch (_) {
        document.documentElement.dataset.theme = 'light';
      }
    })();
  `

  return (
    <html lang="pt-BR" className={figtree.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {/*
          Top progress bar visible on every route transition (client-side
          `<Link>` clicks, router.push, F5). Color matches the accent token
          but is hardcoded — the lib needs a literal value at mount time.
        */}
        <NextTopLoader
          color="#146b62"
          height={2}
          showSpinner={false}
          crawlSpeed={200}
          easing="ease"
          shadow={false}
        />
        {/*
          Mounted at the root so any route can confirm an action without each
          shell wiring up its own channel — the mockup uses one toast, in one
          place, across the whole app.
        */}
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
