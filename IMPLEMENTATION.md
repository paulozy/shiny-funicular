# Frontend Authentication Implementation

This frontend implements a complete authentication flow using Next.js 15 App Router with a Backend For Frontend (BFF) pattern. All authentication tokens are stored server-side in HttpOnly cookies.

## Quick Start

```bash
npm install
cp .env.example .env.local  # Update backend URL if needed
npm run dev  # Starts on http://localhost:3001
```

## Architecture

### BFF Pattern
- **Browser** talks only to `/api/auth/*` routes on the Next.js server
- **Next.js** acts as a proxy, calling the Go backend at `http://localhost:3000/api/v1`
- **Tokens** are stored in HttpOnly, SameSite=Lax cookies (never accessible to JavaScript)

### Token Storage
- `access_token`: HttpOnly cookie, TTL from backend `expires_in` (default 15 min)
- `refresh_token`: HttpOnly cookie, TTL from backend `refresh_expires_in` (default 7 days)
- `login_ticket`: HttpOnly cookie (multi-org flow only), TTL 5 minutes

### Auto-refresh
When the API receives a 401 response:
1. Client calls `POST /api/auth/refresh` (automatically reads refresh_token from cookie)
2. Backend returns new token pair
3. Client retries original request once
4. If 401 persists, redirects to `/login`

### Route Protection
- Middleware guards `/(app)/**` — checks for `access_token` cookie
- Protected pages validate token with `/api/auth/me` on render
- Invalid tokens trigger automatic refresh or redirect to login

## File Structure

```
src/
  app/
    (auth)/                    # Auth pages (login, register, select-org)
      login/page.tsx
      register/page.tsx
      select-organization/page.tsx
      layout.tsx             # Redirects authenticated users to /
    (app)/                     # Protected pages
      page.tsx               # Authenticated home
      layout.tsx             # Validates access token
    api/auth/                  # BFF Route Handlers
      login/route.ts
      register/route.ts
      select-organization/route.ts
      refresh/route.ts
      logout/route.ts
      me/route.ts
    auth/
      callback/[provider]/route.ts    # OAuth callback
      oauth/[provider]/route.ts       # OAuth initiator
  components/
    ui/                        # Design system
      Button.tsx
      Input.tsx
      Card.tsx
      Alert.tsx
      Tag.tsx
    auth/
      Logo.tsx
      AuthShell.tsx          # Centered auth layout
      OAuthButton.tsx
  lib/
    tokens.ts                 # Design tokens
    types/auth.ts            # TypeScript interfaces
    cookies.ts               # Cookie helpers (server-only)
    api/
      auth.ts               # Backend API calls (server-only)
      client.ts             # Browser fetch wrapper (client-only)
  middleware.ts              # Route protection

e2e/
  auth.spec.ts              # E2E tests with Playwright
```

## Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
API_BASE_URL=http://localhost:3000/api/v1
NODE_ENV=development
```

- `NEXT_PUBLIC_API_BASE_URL`: Exposed to browser (currently unused — all calls go through BFF)
- `API_BASE_URL`: Server-only, used by Route Handlers to call the backend
- Both must point to the same backend URL

## Backend Configuration

The backend OAuth providers must be configured to redirect back to the frontend:

```env
GITHUB_CALLBACK_URL=http://localhost:3001/auth/callback/github
GITLAB_CALLBACK_URL=http://localhost:3001/auth/callback/gitlab
```

## Key API Flows

### Login (single-org)
```
User submits email/password
  ↓
POST /api/auth/login (BFF Route Handler)
  ↓ Calls backend
POST /api/v1/auth/login (Go backend)
  ↓ Returns 200 with TokenResponse
setAuthCookies(response)  # Store access_token + refresh_token
  ↓
Return 200 with user data to browser
  ↓
Browser redirects to / (authenticated)
```

### Login (multi-org)
```
User submits email/password
  ↓
POST /api/auth/login (BFF)
  ↓ Backend returns 202 OrganizationSelectionResponse
setLoginTicketCookie(ticket)
  ↓
Return 202 with organizations array to browser
  ↓
Browser saves orgs to sessionStorage
Browser redirects to /selecionar-organizacao
  ↓
User selects organization, POST /api/auth/select-organization
  ↓
BFF calls backend with login_ticket + organization_id
  ↓
setAuthCookies(response) + deleteLoginTicketCookie()
  ↓
Browser redirects to /
```

### OAuth (GitHub/GitLab)
```
User clicks "Continuar com GitHub"
Browser prompts for organization name
  ↓
Browser: window.location = /auth/oauth/github?organization_name=MyOrg
  ↓
Next Route Handler: redirect to backend /auth/github?organization_name=MyOrg
  ↓
Go backend: redirect to GitHub authorize URL
  ↓
GitHub: user authorizes, redirect to http://localhost:3001/auth/callback/github?code=...&state=...
  ↓
Next Route Handler: extract code+state
  ↓
Calls backend GET /auth/github/callback?code=...&state=...
  ↓
Backend exchanges code for token, returns 200 TokenResponse
  ↓
setAuthCookies(response)
  ↓
Next Route Handler: redirect to /
```

### Protected Page Access
```
Browser: GET / (has access_token cookie)
  ↓
Middleware checks cookie presence → allow
  ↓
Page Server Component: calls getAccessTokenCookie()
  ↓
Calls backendGetMe(accessToken)
  ↓ Validates JWT on backend
Backend returns UserInfo
  ↓
Page renders user data
```

### Token Expiration
```
Browser: GET /api/protected (token expired, 401 response)
  ↓
Client wrapper: triggers POST /api/auth/refresh
  ↓
BFF Route Handler: reads refresh_token from cookie
  ↓
Calls backend POST /auth/refresh
  ↓
Backend rotates tokens, returns new pair
  ↓
setAuthCookies(newResponse)  # Cookies updated
  ↓
Client wrapper: retries original request
  ↓
Success (with new access_token)
```

## Testing

### Unit Tests
```bash
npm test -- --testPathPattern=types/auth
```
Tests error normalization, error message mapping.

### Component Tests
```bash
npm test -- --testPathPattern=components
```
Tests Button, Input, Alert, Logo, etc.

### Route Handler Tests
```bash
npm test -- --testPathPattern=api/auth
```
Tests login 200/202, select-org, refresh, logout flows.

### E2E Tests
```bash
npm run e2e
```
Tests complete user journeys: register, login, multi-org, logout.

## Design System

All components use inline styles with design tokens from `src/lib/tokens.ts`. No CSS framework.

**Colors:**
- Background: `#fafaf7`
- Surface: `#fff`
- Accent (action): `#d97757` (terracotta orange)
- AI/Secondary: `#7a4cc8` (purple)
- Success: `#2e7d3e` (green)
- Warning: `#c89a3a` (amber)
- Danger: `#b8413b` (red)

**Typography:**
- Font: Inter (UI), JetBrains Mono (code)
- Base size: 13px
- Headings: 22px (h1), 16px (h2)

**Spacing:**
- Card padding: 12-16px
- Container padding: 20-32px
- Gap: 8-14px

**Border radii:**
- Cards: 8px
- Buttons: 6px
- Inputs: 6px
- Tags: 10px

## Error Handling

Errors from the backend are normalized to a consistent shape:
```ts
interface NormalizedError {
  code: string  // machine-readable (e.g. "authentication_failed")
  message: string  // human-readable Portuguese message
}
```

The `normalizeAuthError()` function handles both:
- Handler errors: `{ error, error_description }`
- Middleware 401s: `{ error, message }`

Portuguese error messages are defined in `getErrorMessage()` for all common codes.

## Security Considerations

1. **HttpOnly Cookies**: Tokens cannot be accessed by JavaScript, preventing XSS token theft
2. **SameSite=Lax**: Protects against CSRF while allowing OAuth redirect chains
3. **Secure Flag**: Set in production (HTTPS only)
4. **No localStorage**: Tokens never stored in browser storage
5. **Single Refresh Attempt**: Auto-refresh tries once; subsequent 401 forces re-login
6. **Server-side Backend URL**: `API_BASE_URL` never exposed to browser; all calls go through BFF
7. **Middleware Check**: Route-level validation happens before page render

## Debugging

Enable debug logging by setting the `DEBUG` environment variable:
```bash
DEBUG=* npm run dev
```

### Common Issues

**"Session expirada, faça login novamente"**
- Access token expired and refresh failed
- Check backend is running on the correct port
- Verify `API_BASE_URL` is correct

**OAuth callback fails with "oauth_failed"**
- Check backend OAuth callback URLs are configured correctly
- Verify GitHub/GitLab app settings point to `http://localhost:3001/auth/callback/{provider}`

**Protected pages redirect to login**
- Check cookies are being set (check DevTools → Application → Cookies)
- Verify access token is valid (not expired)
- Check backend `users/me` endpoint works

## Deployment

For production deployment:

1. Update `API_BASE_URL` to point to production backend
2. Update GitHub/GitLab OAuth callback URLs to production frontend
3. Set `NODE_ENV=production`
4. Ensure `HTTPS` is enabled (cookie `Secure` flag requires HTTPS)
5. Run full test suite: `npm test && npm run e2e`
6. Build and deploy: `npm run build && npm run start`

## Frontend Libraries Used

- **Next.js 15**: App Router, Route Handlers, middleware
- **React 19**: Components, hooks
- **TypeScript 5.8**: Type safety
- **Jest 29**: Unit/integration testing
- **Playwright**: E2E testing
- **Testing Library**: Component testing

No external UI component libraries — all components built with inline styles.

## Related Documentation

- Backend API: See `../backend/internal/api/handlers/auth.go`
- Design System: See `../design/midfi-kit.jsx` and `flow-shell.jsx`
- Project Plan: See `../.claude/plans/luminous-beaming-grove.md`
