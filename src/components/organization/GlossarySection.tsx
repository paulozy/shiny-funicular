'use client'

import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GlossaryTerm, GlossaryTermListResponse } from '@/lib/types/onboarding'

/**
 * The organization's vocabulary. It lives here rather than inside an onboarding
 * flow because acronyms outlive any single flow, and two flows referencing the
 * same term should not need two copies of it.
 */
export function GlossarySection({ canEdit }: { canEdit: boolean }) {
  const [terms, setTerms] = useState<GlossaryTerm[] | null>(null)
  const [term, setTerm] = useState('')
  const [definition, setDefinition] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await apiFetch<GlossaryTermListResponse>('/api/glossary')
      setTerms(response.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar o glossário.')
      setTerms([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const create = async () => {
    if (!term.trim() || !definition.trim()) return
    setBusy(true)
    setError(null)
    try {
      await apiFetch('/api/glossary', {
        method: 'POST',
        body: JSON.stringify({ term: term.trim(), definition: definition.trim() }),
      })
      setTerm('')
      setDefinition('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o termo.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      await apiFetch(`/api/glossary/${id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover o termo.')
    } finally {
      setBusy(false)
    }
  }

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 0',
    borderBottom: `1px solid ${T.border}`,
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: T.ink3, margin: '0 0 14px', maxWidth: 620 }}>
        As siglas e termos internos que ninguém novo tem como adivinhar. Um passo de onboarding do tipo
        glossário mostra esta lista — ou uma seleção dela.
      </p>

      {error && (
        <div style={{ marginBottom: 12 }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      {canEdit && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 8 }}>
          <div style={{ width: 160 }}>
            <Input label="Termo" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="SLO" />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label="Definição"
              value={definition}
              onChange={(event) => setDefinition(event.target.value)}
              placeholder="Objetivo de nível de serviço acordado com o time de produto"
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <Button variant="primary" size="md" loading={busy} disabled={!term.trim() || !definition.trim()} onClick={() => void create()}>
              Adicionar
            </Button>
          </div>
        </div>
      )}

      {terms === null ? (
        <div style={{ fontSize: 13, color: T.faint }}>Carregando…</div>
      ) : terms.length === 0 ? (
        <div style={{ fontSize: 13, color: T.faint }}>Nenhum termo cadastrado ainda.</div>
      ) : (
        <div>
          {terms.map((entry) => (
            <div key={entry.id} style={rowStyle}>
              <div style={{ width: 160, fontWeight: 600, fontSize: 13 }}>{entry.term}</div>
              <div style={{ flex: 1, fontSize: 13, color: T.ink3 }}>{entry.definition}</div>
              {canEdit && (
                <Button variant="default" size="sm" disabled={busy} onClick={() => void remove(entry.id)}>
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
