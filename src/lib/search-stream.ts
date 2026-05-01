import {
  SearchSynthesisDone,
  SearchSynthesisError,
  SearchSynthesisUnavailable,
  SemanticSearchParams,
  SemanticSearchResponse,
} from '@/lib/types/search'
import { buildSemanticSearchQuery } from '@/lib/search'
import { normalizeAuthError } from '@/lib/types/auth'

export interface SemanticSearchStreamHandlers {
  onResults?: (results: SemanticSearchResponse) => void
  onTokenDelta?: (text: string) => void
  onSynthesis?: (text: string) => void
  onUnavailable?: (payload: SearchSynthesisUnavailable) => void
  onError?: (payload: SearchSynthesisError) => void
  onDone?: (payload: SearchSynthesisDone) => void
}

interface SseEvent {
  event: string
  payload: any
}

export async function streamSemanticSearch(
  repoId: string,
  params: SemanticSearchParams,
  handlers: SemanticSearchStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const query = buildSemanticSearchQuery({ ...params, synthesize: true })
  const response = await fetch(`/api/repositories/${repoId}/search?${query}`, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
    },
    signal,
  })

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/event-stream')) {
    const body = await response.json().catch(() => ({ error: `http_${response.status}` }))
    const normalized = normalizeAuthError(body)
    const err = new Error(normalized.message)
    ;(err as any).code = normalized.code
    ;(err as any).status = response.status
    throw err
  }

  if (!response.body) {
    throw new Error('stream_unavailable')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      let idx = buffer.indexOf('\n\n')
      while (idx !== -1) {
        const raw = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        handleEvent(parseSseBlock(raw), handlers)
        idx = buffer.indexOf('\n\n')
      }
    }

    if (buffer.trim()) {
      handleEvent(parseSseBlock(buffer), handlers)
    }
  } finally {
    reader.releaseLock()
  }
}

function parseSseBlock(block: string): SseEvent {
  let event = 'message'
  const data: string[] = []

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      data.push(line.slice(5).trim())
    }
  }

  const rawData = data.join('\n')
  return {
    event,
    payload: rawData ? JSON.parse(rawData) : {},
  }
}

function handleEvent({ event, payload }: SseEvent, handlers: SemanticSearchStreamHandlers) {
  switch (event) {
    case 'results':
      handlers.onResults?.(payload as SemanticSearchResponse)
      break
    case 'token_delta':
      handlers.onTokenDelta?.(String(payload.text || ''))
      break
    case 'synthesis':
      handlers.onSynthesis?.(String(payload.text || ''))
      break
    case 'synthesis_unavailable':
      handlers.onUnavailable?.(payload as SearchSynthesisUnavailable)
      break
    case 'error':
      handlers.onError?.(payload as SearchSynthesisError)
      break
    case 'done':
      handlers.onDone?.(payload as SearchSynthesisDone)
      break
  }
}
