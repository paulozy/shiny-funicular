import type { Metadata } from 'next'
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
      <body>{children}</body>
    </html>
  )
}
