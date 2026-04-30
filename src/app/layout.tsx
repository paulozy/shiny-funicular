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
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
