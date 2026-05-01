import { streamSemanticSearch } from './search-stream'

function sseResponse(body: string) {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body))
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } }
  )
}

describe('streamSemanticSearch', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('parses results, token deltas and done events', async () => {
    const onResults = jest.fn()
    const onTokenDelta = jest.fn()
    const onDone = jest.fn()
    global.fetch = jest.fn().mockResolvedValue(
      sseResponse(
        [
          'event: results',
          'data: {"query":"auth","total":0,"results":[]}',
          '',
          'event: token_delta',
          'data: {"text":"hello "}',
          '',
          'event: token_delta',
          'data: {"text":"world"}',
          '',
          'event: done',
          'data: {"cached":false,"tokens_used":10,"model":"claude"}',
          '',
        ].join('\n')
      )
    )

    await streamSemanticSearch('repo-1', { q: 'auth' }, { onResults, onTokenDelta, onDone })

    expect(global.fetch).toHaveBeenCalledWith('/api/repositories/repo-1/search?q=auth&synthesize=true', {
      method: 'GET',
      headers: { Accept: 'text/event-stream' },
      signal: undefined,
    })
    expect(onResults).toHaveBeenCalledWith({ query: 'auth', total: 0, results: [] })
    expect(onTokenDelta).toHaveBeenNthCalledWith(1, 'hello ')
    expect(onTokenDelta).toHaveBeenNthCalledWith(2, 'world')
    expect(onDone).toHaveBeenCalledWith({ cached: false, tokens_used: 10, model: 'claude' })
  })

  it('parses cache hit synthesis and unavailable events', async () => {
    const onSynthesis = jest.fn()
    const onUnavailable = jest.fn()
    global.fetch = jest.fn().mockResolvedValue(
      sseResponse(
        [
          'event: synthesis',
          'data: {"text":"cached synthesis"}',
          '',
          'event: synthesis_unavailable',
          'data: {"reason":"anthropic_not_configured"}',
          '',
        ].join('\n')
      )
    )

    await streamSemanticSearch('repo-1', { q: 'auth' }, { onSynthesis, onUnavailable })

    expect(onSynthesis).toHaveBeenCalledWith('cached synthesis')
    expect(onUnavailable).toHaveBeenCalledWith({ reason: 'anthropic_not_configured' })
  })

  it('throws normalized JSON errors when preflight fails', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      Response.json({ error: 'embeddings_unavailable', error_description: 'missing voyage' }, { status: 503 })
    )

    await expect(streamSemanticSearch('repo-1', { q: 'auth' }, {})).rejects.toMatchObject({
      message: 'missing voyage',
      code: 'embeddings_unavailable',
      status: 503,
    })
  })
})
