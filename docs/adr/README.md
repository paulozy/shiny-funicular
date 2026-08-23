# Architecture Decision Records

---

## ADR-001: Backend For Frontend (BFF) Pattern with HttpOnly Cookies

**Date:** 2024

**Status:** Accepted

### Context

The application requires secure token management for OAuth integrations with GitHub and GitLab, along with API communication to a Go backend. Direct browser-to-backend communication would expose authentication tokens to XSS vulnerabilities, and managing token refresh across distributed clients introduces consistency challenges.

### Decision

Implement a Backend For Frontend (BFF) pattern using Next.js Route Handlers as an intermediary layer between the React frontend and the Go backend. All authentication tokens (`access_token`, `refresh_token`, `login_ticket`) are stored exclusively in HttpOnly, SameSite=Lax cookies, never exposed to JavaScript. The browser communicates with the frontend's own API endpoints (`/api/auth/*`, `/api/repositories/*`, `/api/organization/*`), which in turn communicate with the backend using `API_BASE_URL` (server-only).

### Consequences

**Positive:**
- Tokens remain inaccessible to client-side XSS attacks
- Token refresh logic centralized in Route Handlers with automatic retry of original requests on 401
- Clear separation: `API_BASE_URL` is never exposed to the browser; only `NEXT_PUBLIC_API_BASE_URL` constants are public
- Multi-org flow (`login_ticket`) and session selection handled transparently

**Negative:**
- Additional network hop for all API calls
- Route Handlers add maintenance burden for auth middleware and token lifecycle management
- Requires careful cookie configuration to maintain security posture

---

## ADR-002: Design System via TypeScript Tokens Over CSS Framework

**Date:** 2024

**Status:** Accepted

### Context

The UI requires theming (light/dark mode), consistent spacing, typography, and component styling across the application. Choices included adopting a CSS framework (Tailwind, Bootstrap) or building a custom design system with centralized token management.

### Decision

Implement a design system centered on `src/lib/tokens.ts` containing color palettes, typography scales, spacing, and border radius as TypeScript constants. All components in `src/components/ui/` use inline styles derived from these tokens. CSS variables enable runtime theme switching (light/dark) without build-time complexity.

### Consequences

**Positive:**
- Full control over design vocabulary and evolution
- Tokens as single source of truth for colors, spacing, and typography
- Theme toggle requires only CSS variable swaps, no runtime style recalculation
- Smaller bundle size compared to CSS frameworks
- Type-safe token references in TypeScript

**Negative:**
- Higher initial investment to build component primitives (Button, Input, Card, Alert, Tag, Toggle)
- No ecosystem plugins or pre-built responsive utilities
- Requires discipline to prevent token sprawl and inconsistent styling
- Limited built-in accessibility patterns vs. mature frameworks

---

## ADR-003: Markdown + Remark GFM for Documentation and PR Diffs

**Date:** 2024

**Status:** Accepted

### Context

The application displays user-generated documentation (ADR, architecture, service docs, guidelines) and requires rendering GitHub/GitLab pull request diffs. Choices included using a rich text editor library, a markdown parser with plugins, or a bespoke solution.

### Decision

Use `react-markdown` with `remark-gfm` for rendering markdown content (documentation, onboarding) and syntax highlighting via `shiki`. Implement a custom unified diff parser (`src/lib/diff.ts`) for pull request diffs. In-app markdown editor (`@uiw/react-md-editor`) allows users to adjust AI-generated documentation before publishing.

### Consequences

**Positive:**
- GFM support (tables, strikethrough, autolinks) aligns with GitHub/GitLab markdown
- `shiki` provides accurate syntax highlighting matching VS Code themes
- Unified diff parser gives precise control over diff rendering and annotation
- Separation of generation (AI backend) from editing (in-app editor) simplifies versioning

**Negative:**
- Custom diff parser adds maintenance surface and potential edge cases vs. library solutions
- `react-markdown` + `remark-gfm` require careful XSS prevention (must sanitize user input)
- Editor dependency on `@uiw/react-md-editor` introduces additional maintenance burden
- No built-in versioning or collaborative editing

---

## ADR-004: Jest + Testing Library for Unit, Component, and Route Testing

**Date:** 2024

**Status:** Accepted

### Context

The project requires test coverage across multiple concerns: unit logic (`lib/`), React component rendering and interactions, Route Handler behavior, and page-level flows. Test tooling must support both Node.js (Route Handlers) and jsdom (React components).

### Decision

Use Jest as the primary test runner with four test projects configured in `jest.config.ts`: unit tests, component tests (via Testing Library), Route Handler tests, and page integration tests. Include `jest-axe` for accessibility assertions. E2E scenarios are reserved for Playwright against a deterministic backend stack.

### Consequences

**Positive:**
- Single test runner across all layers reduces tool fragmentation
- Jest projects allow different configurations (jsdom for components, node for handlers)
- Testing Library enforces user-centric testing patterns (querying by role, label, text)
- `jest-axe` catches accessibility regressions early
- Fast feedback loop for unit and component tests during development

**Negative:**
- Route Handler tests require stubbing `next/headers` and cookie manipulation
- Page-level tests via Jest + jsdom are brittle for complex flows; Playwright E2E is the source of truth
- Maintaining separate test suites risks divergence in test patterns and conventions
- Initial setup complexity with multiple Jest projects

---

## ADR-005: Next.js App Router with Middleware for Route Protection

**Date:** 2024

**Status:** Accepted

### Context

The application requires a clear separation between public routes (login, register, OAuth callbacks) and protected routes (Code Hub, repositories, documentation). Authentication state must be verified early, and expired sessions should redirect to login transparently.

### Decision

Use Next.js 15 App Router with file-based routing. Public routes live in `(auth)/` group; protected routes in `(app)/` group. A server-side `middleware.ts` validates the `access_token` cookie on every request to `/(app)/**`, refreshing silently on 401 or redirecting to `/login` on persistent failure. OAuth callbacks (`auth/callback/[provider]`) are handled via Route Handlers.

### Consequences

**Positive:**
- Middleware executes before route rendering, preventing flashes of unprotected content
- File-based routing is intuitive and scales naturally
- Route groups `(auth)` and `(app)` provide logical separation and shared layouts
- Easy to add new protected routes by placing them in `(app)/`

**Negative:**
- Middleware logic must be kept lightweight to avoid slowing every request
- Edge case handling (e.g., refresh token also expired, token race conditions) requires careful state management
- Middleware runs on every request, including static assets and API routes (performance cost)
- Debugging middleware behavior is less transparent than explicit route guards