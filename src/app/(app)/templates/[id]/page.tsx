import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetTemplate } from '@/lib/api/templates'
import { highlightCodeToHtml } from '@/components/templates/HighlightedCode'
import { TemplateDetailClient } from './TemplateDetailClient'

interface TemplatePageProps {
  params: Promise<{ id: string }>
}

export default async function TemplateDetailPage({ params }: TemplatePageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const user = await backendGetMe(accessToken).catch(() => null)
  if (!user) {
    redirect('/login')
  }

  const template = await backendGetTemplate(accessToken, id).catch(() => null)
  if (!template) {
    notFound()
  }

  // Pre-render each generated file as Shiki HTML on the server. This keeps the
  // client-side JS lean (Shiki is heavy) and pays the highlight cost once per
  // template view. For very large templates this could be lazified later by
  // moving the highlight to a per-file fetch endpoint.
  const htmlByPath: Record<string, string> = {}
  await Promise.all(
    (template.files ?? []).map(async (file) => {
      htmlByPath[file.path] = await highlightCodeToHtml(file.content, file.language)
    })
  )

  return <TemplateDetailClient user={user} template={template} htmlByPath={htmlByPath} />
}
