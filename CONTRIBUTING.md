# Contributing

Obrigado por querer contribuir com o **IDP — Frontend**! Este guia descreve o padrão de desenvolvimento do projeto.

## Convenções de Código

### TypeScript e Estilo

- **TypeScript 5.8** é obrigatório; sempre roda `npm run typecheck` antes de push.
- Sem `any`; use tipos genéricos ou `unknown` se necessário.
- Componentes React usam **inline styles** com tokens de `src/lib/tokens.ts` — nenhum CSS framework externo.
- Nomeação: camelCase para variáveis/funções, PascalCase para componentes e tipos, UPPER_SNAKE_CASE para constantes.
- Imports: agrupar em ordem: React → Next.js → bibliotecas externas → `src/` absoluto → relativos.

```typescript
import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from 'cmdk';
import { Button } from '@/components/ui/Button';
import { tokens } from '@/lib/tokens';
import { MyComponent } from './MyComponent';
```

### Componentes

- Componentes de página (em `app/**/page.tsx`) são **async** por padrão — dados vêm do servidor, não de `useEffect`.
- Componentes de UI (em `src/components/ui/`) são simples, reutilizáveis, sem lógica de negócio.
- Props bem-tipadas com interfaces ou tipos discriminados; evitar spreading `{ ...props }` sem documentação.
- Acessibilidade: sempre usar semântica HTML, `aria-*` onde apropriado, testar com `jest-axe` em componentes públicos.

### Server vs. Client

- Route Handlers em `src/app/api/**/route.ts` são **sempre server-side** — usam `API_BASE_URL` privada.
- `use strict` ou `'use client'` explícito em componentes interativos.
- Cookies: apenas server-side (middleware, Route Handlers); nunca `document.cookie` no browser.
- Padrão **BFF**: frontend nunca chama o backend Go direto; sempre passa pelos Route Handlers.

### Testes

- **Jest** para unit e componentes; **Playwright** para E2E.
- Nomes: `*.test.ts`, `*.spec.ts` ou `*.spec.tsx`.
- Coverage mínimo: componentes públicos e lógica crítica (auth, diff parser, métricas).
- Playwright specs moram em `e2e/` e precisam do backend em `../backend` rodando (`make e2e-stack`).

Exemplo de teste de componente:

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});
```

## Branches e Nomes

Use **Conventional Commits** para nomes de branch:

```
feat/nova-funcionalidade      # nova feature
fix/correcao-bug              # correção de bug
refactor/reorganizar-modulo   # refatoração sem mudança de comportamento
chore/update-deps             # dependências, CI, configuração
docs/melhorar-readme          # documentação
test/cobertura-componente     # testes
perf/otimizar-grid            # performance
```

Exemplo:

- `feat/docs-manual-and-clearer-generation` → documentação manual + UX melhorada
- `fix/ui-trim-the-review-drawer` → ajuste visual
- `refactor/simplify-diff-parser` → simplificar parser sem mudar API

## Commits

Siga o padrão **Conventional Commits**:

```
type(scope): descrição breve em minúsculas

corpo opcional (detalhes, motivação, breaking changes)

footer: referências (Closes #42, Refs #10)
```

**Types:**
- `feat` → nova funcionalidade
- `fix` → correção de bug
- `refactor` → reorganização sem mudança de comportamento
- `perf` → otimização
- `test` → testes (adição, fix, cobertura)
- `chore` → dependências, build, CI
- `docs` → documentação, README, comentários
- `style` → formatação, lint (sem lógica)

**Exemplos:**

```
feat(docs): offer a manual path and say what generating will produce

Adds a button to manually trigger doc generation and improves the UX
flow by showing what each doc type produces before generation starts.

Closes #41
```

```
fix(repositories): stop counting pull requests as open issues

The issue counter was including pull_requests from the API response.
Filter them out to match the design.
```

```
chore(deps): bump next from 15.3.5 to 16.2.12
```

## Pull Request

1. **Abra a PR contra `main`** com título em Conventional Commits.
2. **Descrição clara:**
   - O que muda e por quê.
   - Screenshots/videos se afeta UI.
   - Instruções de teste ou como reproduzir (se bug fix).
3. **Checklist antes de submeter:**
   - [ ] `npm run typecheck` passa.
   - [ ] `npm run lint` passa (sem warnings).
   - [ ] `npm test` passa (suites relevantes).
   - [ ] Testes E2E rodam (`npm run e2e`) se toca fluxos críticos (auth, onboarding, repositórios).
   - [ ] Nenhuma `console.log` de debug deixado.
   - [ ] Commits com mensagens descritivas (sem "fix typo", "oops" ou WIP).
4. **Aguarde review** — pelo menos um mantainer antes de merge.

### Review Checklist (Para Reviewers)

Ao revisar uma PR:

- [ ] **Código**: tipos corretos? Sem `any`? Segue style guide?
- [ ] **Segurança**: tokens em cookies? Nenhum `API_BASE_URL` exposto ao browser? `server-only` onde needed?
- [ ] **Testes**: cobertura adequada? Playwright atualizado para novos fluxos?
- [ ] **UI/UX**: design tokens usados? Acessibilidade preservada (semântica, aria-*)?
- [ ] **Docs**: README, comments, ou docs/ atualizados se mudança grande?
- [ ] **Performance**: nenhuma render desnecessária? useCallback/useMemo justificado?
- [ ] **Commits**: mensagens claras, um commit = uma mudança lógica?

## Testes

### Unit / Componentes

```bash
npm test                              # Roda Jest
npm test -- --testPathPattern=api/auth  # Filtra suíte específica
npm test:watch                        # Watch mode
```

Rodar localmente antes de push:

```bash
npm run typecheck
npm run lint
npm test
```

### E2E

Requer o backend em `../backend`:

```bash
cd ../backend && make e2e-stack   # (deixa aberto, Ctrl-C encerra)
cd ../frontend && npm run e2e
```

**Nota:** Se forms carregarem vazios ou 404s aparecerem, apague `.next/`:

```bash
rm -rf .next
npm run dev
```

## Dependências

- Evite adicionar bibliotecas de componentes (shadcn, MUI, etc.) — mantemos design system próprio.
- Sem CSS frameworks (Tailwind, Bootstrap).
- Para novos componentes: considere reutilizar tokens em `src/lib/tokens.ts` e `src/components/ui/`.
- Atualizações de deps menores: direto (Dependabot faz a maioria).
- Deps maiores: discuta no issue ou PR antes.

## Documentação

- **Leia `docs/` antes de mexer** em onboarding, autenticação ou grafo.
- **README**: mantenha atualizado (stack, quick start, arquitetura).
- **Código**: JSDoc para funções públicas e lógica não-óbvia.
- **Commit**: mensagem descritiva ajuda histórico; use `Closes #issue` para rastrear.

Exemplo de JSDoc:

```typescript
/**
 * Parseia um diff unificado e retorna arquivo + hunks com números de linha.
 * @param diff string raw com format unified diff
 * @returns array de arquivos com suas mudanças
 */
export function parseDiff(diff: string): FileDiff[] { ... }
```

## Dúvidas?

- Abra uma **issue** para propor features grandes ou breaking changes.
- Comente em PRs existentes se for complemento.
- Veja `docs/` para arquitetura, BFF, onboarding, etc.

Obrigado! 🚀