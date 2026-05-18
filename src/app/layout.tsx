import type { Metadata } from 'next'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'

export const metadata: Metadata = {
  title: 'idp.ai — Plataforma de Desenvolvimento',
  description: 'Plataforma integrada para observabilidade, análise e co-pensador IA',
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
    <html lang="pt-BR" suppressHydrationWarning>
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
          color="#d97757"
          height={2}
          showSpinner={false}
          crawlSpeed={200}
          easing="ease"
          shadow={false}
        />
        {children}
      </body>
    </html>
  )
}
