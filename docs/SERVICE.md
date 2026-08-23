# SERVICE.md

## Overview

**IDP — Frontend** é uma Internal Developer Platform (IDP) construída com Next.js 15 que fornece uma interface web completa para gerenciamento de repositórios, pull requests, cobertura de testes, documentação gerada por IA e visualização de dependências entre repositórios.

O projeto segue o padrão **Backend For Frontend (BFF)**, onde todos os tokens de autenticação são armazenados em cookies HttpOnly e o navegador nunca se conecta diretamente ao backend Go. O frontend age como intermediário, com Route Handlers seguros que comunicam-se com a API do backend.

### Funcionalidades principais

- **Autenticação**: Login/registro com e-mail/senha, OAuth (GitHub, GitLab), multi-organização
- **Code Hub**: Grid de repositórios com métricas agregadas (PRs, issues, cobertura, linguagens)
- **Repositórios**: Overview com metadados, health checks, listagem de arquivos, configurações
- **Pull Requests**: Listagem e detalhe com visualização de diff
- **Cobertura via CI**: Geração de tokens revogáveis para upload de cobertura (Go, LCOV, Cobertura, JaCoCo)
- **Documentação**: Geração e edição de Markdown (ADR, arquitetura, service doc, guidelines)
- **Grafo de Repositórios**: Mapa visual das relações entre repos com CRUD
- **Tema**: Toggle claro/escuro persistente
- **Internacionalização**: UI em português (pt-BR)

---

## Prerequisites

- **Node.js**: 18+ (recomendado 20 LTS)
- **npm**: 10+
- **Git**: para clonar o repositório
- **Backend Go**: em execução em `http://localhost:3000/api/v1` (necessário para todas as funcionalidades)
  - Repositório: `../backend`
  - Responsável por autenticação, dados de repositórios, PRs, documentação, etc.

### Serviços opcionais (para testes E2E com Playwright)

- **Postgres**: para persistência de dados (fornecido via `make e2e-stack` no backend)
- **Redis**: para cache e sessões (fornecido via `make e2e-stack` no backend)
- **GitLab falso**: servindo payloads capturados (fornecido via `make e2e-stack` no backend)

---

## Environment Variables

### Arquivo `.env.local`

Copie o `.env.example` e ajuste conforme necessário:

```env
# URL base da API do backend — usado pelos Route Handlers (server-side, não exposto ao browser)
API_BASE_URL=http://localhost:3000/api/v1

# URL base da API — exposta ao cliente JavaScript no navegador
# (deprecada; Route Handlers agem como proxy)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# Ambiente de execução
NODE_ENV=development
```

### Variáveis de ambiente do backend (OAuth)

Para que GitHub/GitLab redirecionem de volta ao frontend após autenticação, configure no backend:

```env
GITHUB_CALLBACK_URL=http://localhost:3001/auth/callback/github
GITLAB_CALLBACK_URL=http://localhost:3001/auth/callback/gitlab
```

---

## How to Run Locally

### 1. Instalação de dependências

```bash
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
# Verifique se API_BASE_URL aponta para o backend (padrão: http://localhost:3000/api/v1)
```

### 3. Iniciar o backend

O frontend depende do backend Go em execução:

```bash
cd ../backend
go run ./cmd/server  # ou outro comando do seu backend
# Backend escuta em http://localhost:3000/api/v1
```

### 4. Iniciar o dev server

```bash
npm run dev
```

O servidor sobe em **http://localhost:3001**.

**Comportamento**:
- Middleware redireciona automaticamente para `/login` se não houver sessão
- Hot reload habilitado para arquivos `.tsx`, `.ts`, `.css`
- Erros de TypeScript aparecem no console e no navegador

### 5. Acessar a aplicação

Abra http://localhost:3001 no navegador e faça login.

---

## How to Run with Docker

### Build da imagem Docker

```bash
# Na raiz do projeto
docker build -t idp-frontend:latest .
```

Se o Dockerfile não estiver no repositório, crie um:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar dependências
COPY package*.json ./
RUN npm ci

# Copiar código-fonte
COPY . .

# Build otimizado
RUN npm run build

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["npm", "start"]
```

### Executar com Docker Compose

Crie um `docker-compose.yml` na raiz:

```yaml
version: '3.9'

services:
  frontend:
    build: .
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      API_BASE_URL: http://backend:3000/api/v1
      NEXT_PUBLIC_API_BASE_URL: http://localhost:3000/api/v1
    depends_on:
      - backend
    networks:
      - idp

  backend:
    build: ../backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:pass@postgres:5432/idp
      REDIS_URL: redis://redis:6379
      GITHUB_CALLBACK_URL: http://localhost:3001/auth/callback/github
      GITLAB_CALLBACK_URL: http://localhost:3001/auth/callback/gitlab
    depends_on:
      - postgres
      - redis
    networks:
      - idp

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: idp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - idp

  redis:
    image: redis:7-alpine
    networks:
      - idp

networks:
  idp:

volumes:
  postgres_data:
```

### Iniciar stack completa

```bash
docker-compose up -d
```

A aplicação estará disponível em http://localhost:3001.

### Para testes E2E com Docker

```bash
# Subir stack com Playwright dependencies
docker-compose -f docker-compose.yml -f docker-compose.e2e.yml up -d
npm run e2e
```

---

## API Endpoints

O frontend expõe Route Handlers em `/api/*` que atuam como proxy BFF para o backend Go. Todos os tokens vivem em cookies HttpOnly.

### Autenticação

| Endpoint | Método | Descrição |
| --- | --- | --- |
| `/api/auth/login` | POST | Login com e-mail/senha |
| `/api/auth/register` | POST | Registro novo de usuário |
| `/api/auth/refresh` | POST | Refresh automático de token (401 → retry) |
| `/api/auth/logout` | POST | Logout e limpeza de cookies |
| `/api/auth/me` | GET | Dados da sessão atual |
| `/api/auth/select-organization` | POST | Seleção de organização (multi-org) |
| `/auth/oauth/github` | GET | Inicia fluxo OAuth GitHub |
| `/auth/oauth/gitlab` | GET | Inicia fluxo OAuth GitLab |
| `/auth/callback/github` | GET | Callback do GitHub (redirects, tokens via cookie) |
| `/auth/callback/gitlab` | GET | Callback do GitLab (redirects, tokens via cookie) |

### Repositórios

| Endpoint | Método | Descrição |
| --- | --- | --- |
| `/api/repositories` | GET | Lista repositórios da organização |
| `/api/repositories` | POST | Criar/importar repositório (GitHub, GitLab, Gitea) |
| `/api/repositories/:id` | GET | Overview do repositório |
| `/api/repositories/:id/files` | GET | Listagem de arquivos |
| `/api/repositories/:id/pull-requests` | GET | Lista PRs abertos |
| `/api/repositories/:id/pull-requests/:prNumber` | GET | Detalhe de PR com diff |
| `/api/repositories/:id/sync` | POST | Acionar sync inicial (se falhou) |
| `/api/repositories/:id/settings` | GET | Configurações do repositório |

### Cobertura

| Endpoint | Método | Descrição |
| --- | --- | --- |
| `/api/repositories/:id/coverage/tokens` | GET | Lista tokens de cobertura revogáveis |
| `/api/repositories/:id/coverage/tokens` | POST | Gerar novo token `cov_*` |
| `/api/repositories/:id/coverage/tokens/:tokenId` | DELETE | Revogar token |
| `/api/repositories/:id/coverage` | POST | Upload de cobertura (Go, LCOV, Cobertura, JaCoCo) |

### Documentação

| Endpoint | Método | Descrição |
| --- | --- | --- |
| `/api/repositories/:id/docs` | GET | Documentação do repositório |
| `/api/repositories/:id/docs` | POST | Gerar documentação (IA) |
| `/api/repositories/:id/docs` | PUT | Atualizar documentação (edição manual) |
| `/api/organization/docs` | GET | Documentação da organização |
| `/api/organization/docs` | POST | Gerar documentação da org (IA) |

### Organização

| Endpoint | Método | Descrição |
| --- | --- | --- |
| `/api/organization/config` | GET | Configurações da organização |
| `/api/organization/config` | PUT | Atualizar configurações |
| `/api/organization/teams` | GET | Lista times da organização |
| `/api/organization/teams` | POST | Criar time |
| `/api/organization/teams/:teamId` | PUT | Editar time (nome, membros, repos) |
| `/api/organization/teams/:teamId` | DELETE | Deletar time |

### Grafo de Repositórios

| Endpoint | Método | Descrição |
| --- | --- | --- |
| `/api/graph/repositories` | GET | Lista com relações de dependência |
| `/api/graph/relationships` | POST | Criar relacionamento entre repos |
| `/api/graph/relationships/:relationshipId` | DELETE | Deletar relacionamento |

---

## Running Tests

### Testes unitários e de componentes (Jest)

```bash
# Rodar toda a suite
npm test

# Modo watch (reexecuta ao salvar arquivo)
npm run test:watch

# Filtrar por padrão de caminho
npm test -- --testPathPattern=api/auth
npm test -- --testPathPattern=components
```

**Estrutura**:
- `lib/**/*.spec.ts` — testes unitários (autenticação, cookies, diff, etc.)
- `components/**/*.spec.tsx` — testes de componentes (React Testing Library)
- Middleware e Route Handlers testados em `middleware.test.ts`

**Cobertura**:
```bash
npm test -- --coverage
```

### Testes E2E (Playwright)

```bash
# Pré-requisito: backend em execução
cd ../backend && make e2e-stack  # deixa stack aberta em :3000

# Em outro terminal, rodar E2E
cd ../frontend && npm run e2e
```

**Specs** em `e2e/`:
- Login (single-org e multi-org)
- OAuth (GitHub, GitLab)
- Onboarding
- Code Hub
- Repositórios
- Pull requests
- Documentação

**Filtrar suíte**:
```bash
npm run e2e -- --grep "login"
npm run e2e -- --grep "repositories"
```

**Debug**:
```bash
npm run e2e -- --debug
# Abre inspetor interativo do Playwright
```

### Lint e type checking

```bash
# ESLint (Next.js)
npm run lint

# TypeScript (sem emit)
npm run typecheck

# Ambos
npm run lint && npm run typecheck
```

---

## Key Dependencies

### Runtime

| Pacote | Versão | Uso |
| --- | --- | --- |
| `next` | 15.3.5 | Framework React com SSR, API Routes, middleware |
| `react` | 19.2.6 | UI library |
| `react-dom` | 19.2.6 | Renderização DOM |
| `typescript` | 5.8.3 | Linguagem de tipagem |
| `react-markdown` | 10.1.0 | Renderização de Markdown (documentação) |
| `remark-gfm` | 4.0.1 | Suporte a GitHub Flavored Markdown |
| `shiki` | 4.1.0 | Highlight de código com temas |
| `@uiw/react-md-editor` | 4.1.1 | Editor Markdown WYSIWYG |
| `@xyflow/react` | 12.10.2 | Renderização de grafo de repos |
| `@dagrejs/dagre` | 3.0.0 | Layout de grafo (DAG) |
| `cmdk` | 1.1.1 | Command palette (`Cmd+K`) |
| `zod` | 4.4.3 | Validação de schemas TypeScript |
| `pino` | 10.3.1 | Logger estruturado (server-side) |
| `server-only` | 0.0.1 | Previne vazamento de código server ao client |
| `nextjs-toploader` | 3.9.17 | Barra de progresso nas navegações |

### Dev Dependencies

| Pacote | Versão | Uso |
| --- | --- | --- |
| `jest` | 29.7.0 | Test runner unitário |
| `@testing-library/react` | 16.1.0 | Helpers para testar componentes React |
| `@testing-library/jest-dom` | 6.6.3 | Matchers customizados para DOM |
| `@playwright/test` | 1.60.0 | Testes E2E |
| `ts-jest` | 29.4.11 | Preset Jest para TypeScript |
| `jest-environment-jsdom` | 30.4.1 | Ambiente de teste para browser (JSDOM) |
| `jest-axe` | 10.0.0 | Testes de acessibilidade (a11y) |
| `eslint` | 9.39.4 | Linting JavaScript/TypeScript |
| `eslint-config-next` | 15.3.5 | Config ESLint do Next.js |
| `@types/react` | 19.2.15 | Tipagens do React |
| `@types/react-dom` | 19.2.3 | Tipagens do React DOM |
| `@types/node` | 25.9.1 | Tipagens do Node.js |
| `@types/jest` | 29.5.14 | Tipagens do Jest |
| `pino-pretty` | 13.1.3 | Formatação legível de logs Pino (dev) |
| `ts-node` | 10.9.2 | Execução de TypeScript direto |

---

## Known Issues

### 1. Dev server serve 404s após build de produção

**Sintoma**: Após rodar `npm run build`, o dev server (`npm run dev`) serve chunks JavaScript com erro 404 e a página não hidrata corretamente.

**Causa**: A pasta `.next` contém build de produção; o dev server tenta servir esses arquivos, mas o hot reload não funciona.

**Solução**:
```bash
rm -rf .next
npm run dev
```

### 2. Formulários recarregam vazios no Playwright

**Sintoma**: Durante testes E2E, ao submeter um formulário, a página recarrega vazia.

**Causa**: Mesma causa acima — `.next` obsoleto.

**Solução**: Limpe `.next` antes de rodar testes.

### 3. OAuth redireciona para URL errada

**Sintoma**: Após clicar "Login com GitHub/GitLab", redirecionamento para callback falha.

**Causa**: Variáveis `GITHUB_CALLBACK_URL` e `GITLAB_CALLBACK_URL` no backend não coincidem com a URL do frontend.

**Solução**: Configure no backend:
```env
GITHUB_CALLBACK_URL=http://localhost:3001/auth/callback/github
GITLAB_CALLBACK_URL=http://localhost:3001/auth/callback/gitlab
```

### 4. Backend não responde (timeout ou 502)

**Sintoma**: Todas as requisições retornam erro de conexão.

**Causa**: Backend Go não está em execução ou não escuta em `http://localhost:3000/api/v1`.

**Solução**:
```bash
# Terminal 1: Backend
cd ../backend && go run ./cmd/server

# Terminal 2: Frontend
cd frontend && npm run dev
```

Verifique `API_BASE_URL` em `.env.local`.

### 5. Tokens de cobertura exibidos apenas uma vez

**Comportamento esperado**: Após gerar um token `cov_*`, ele é exibido uma única vez com botão de copiar. Se recarregar a página, o token não aparece novamente.

**Motivo**: Por design — um token nunca deve ser recuperado pelo servidor após criação (segurança). Se perder, gere um novo e revogue o antigo.

### 6. Passo de onboarding desaparecido ainda renderiza

**Comportamento esperado**: Se um repositório, time ou documentação referenciada por um passo de onboarding for deletado, o passo continua renderizando com `unavailable`.

**Motivo**: Design proposital — o fluxo não falha. Admin pode manter referências antigas enquanto os dados existem.

### 7. Middleware redireciona para login mesmo com sessão válida

**Sintoma**: Página redireciona para `/login` apesar de `access_token` válido.

**Causa**: Cookie não está sendo enviado (SameSite, https/http mismatch).

**Solução**:
- Verifique se cookie `access_token` existe (DevTools → Application → Cookies)
- Em localhost, cookies `HttpOnly` + `SameSite=Lax` funcionam normalmente
- Em produção, certifique-se de usar HTTPS

### 8. TypeScript errors não aparecem no dev server

**Sintoma**: Alterações de tipo causam erro no VSCode, mas o dev server segue compilando.

**Causa**: Next.js 15 compila incrementalmente e pode pular type-check em algumas situações.

**Solução**: Rode manualmente `npm run typecheck` ou configure pre-commit hook.

### 9. Playwright timeout nos testes

**Sintoma**: `error: Test timeout of 30000ms exceeded`

**Causa**: Backend não respondendo ou stack E2E não iniciada.

**Solução**:
```bash
# Verifique se backend stack está rodando
cd ../backend && make e2e-stack

# Ou aumente timeout
npm run e2e -- --timeout 60000
```

### 10. Diff de PR aparece vazio ou truncado

**Sintoma**: Visualização de mudanças em PR mostra arquivo mas sem linhas.

**Causa**: Parser de unified diff (`lib/diff.ts`) não conseguiu parsear formato do GitHub/GitLab.

**Solução**: Verifique formato da resposta em DevTools → Network. Abra issue com payload.

---

## Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)

Para dúvidas sobre a API do backend, consulte a documentação do repositório `../backend`.