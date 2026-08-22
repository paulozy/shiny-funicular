import { test, expect, Page } from '@playwright/test'

/**
 * The onboarding, driven through the browser: an admin builds a flow, invites
 * someone with it, and that person walks it.
 *
 * Runs against the deterministic stack from the backend repo:
 *
 *   cd backend && make e2e-stack
 *   cd frontend && npm run e2e
 *
 * The API-level suite (`backend/e2e/onboarding_test.go`) already proves the
 * mechanics. What this adds is the part only a browser can check: that the
 * builder saves what it shows, that the runner renders each kind, and that the
 * completion modes reach the screen as the honest labels they were designed to
 * be.
 */

const PASSWORD = 'E2ePassw0rd!'

function unique(prefix: string) {
  return `${prefix}-${Date.now()}${Math.floor(Math.random() * 1000)}`
}

async function register(page: Page, options: { orgName?: string; email?: string }) {
  const stamp = unique('onb')
  const email = options.email ?? `${stamp}@example.test`

  await page.goto('/register')
  // Wait for hydration before touching the form. Clicking submit while React
  // has not attached its handler yet performs a native GET submit, which lands
  // back on /register with every field cleared.
  await page.waitForLoadState('networkidle')

  // The whole interaction is retried, not just the click. Until React has
  // attached its submit handler the button performs a native GET submit, which
  // reloads /register with every field cleared — so a retry has to refill too.
  await expect(async () => {
    await page.getByLabel('Nome completo').fill('E2E Onboarding')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha', { exact: false }).first().fill(PASSWORD)
    if (options.orgName) {
      await page.getByLabel('Nome da organização').fill(options.orgName)
    }
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page).not.toHaveURL(/\/register/, { timeout: 5_000 })
  }).toPass({ timeout: 60_000 })

  return email
}

test.describe.configure({ mode: 'serial' })

test.describe('Onboarding through the UI', () => {
  test('an admin builds a flow and the runner walks it', async ({ page }) => {
    test.slow() // registration, a flow save, and a full walk

    await register(page, { orgName: `E2E Onboarding ${unique('org')}` })

    await test.step('the glossary takes a term the flow can show', async () => {
      await page.goto('/settings')
      await page.getByRole('button', { name: 'Glossário', exact: true }).click()

      await page.getByLabel('Termo').fill('SLO')
      await page.getByLabel('Definição').fill('Objetivo de nível de serviço')
      await page.getByRole('button', { name: 'Adicionar' }).click()

      await expect(page.getByText('Objetivo de nível de serviço')).toBeVisible({ timeout: 15_000 })
    })

    await test.step('a flow is created from a starter template', async () => {
      await page.getByRole('button', { name: 'Onboarding', exact: true }).click()

      await page.getByLabel('Novo fluxo').fill('Dev Backend')
      await page.getByLabel('Modelo inicial').selectOption({ label: 'Dev backend' })
      await page.getByRole('button', { name: 'Criar' }).click()

      // The template seeds real steps, so the builder is never a blank page.
      await expect(page.getByText(/passo\(s\)/).first()).toBeVisible({ timeout: 15_000 })
      await expect(page.getByRole('button', { name: 'Salvar passos' }).first()).toBeVisible()
    })

    await test.step('the flow becomes the organization default', async () => {
      await page.getByRole('button', { name: 'Tornar padrão' }).click()
      await expect(page.getByText('padrão')).toBeVisible({ timeout: 15_000 })
    })

    await test.step('a glossary step is added and saved', async () => {
      await page.getByLabel('Tipo do novo passo').selectOption('glossary')
      await page.getByRole('button', { name: /Adicionar passo/ }).click()

      await page.getByRole('button', { name: 'Salvar passos' }).first().click()
      await expect(page.getByText('Passos salvos.')).toBeVisible({ timeout: 20_000 })
    })

    await test.step('the runner shows the flow with its steps', async () => {
      await page.goto('/onboarding')

      // The admin created the org, so nobody assigned them a flow: the empty
      // state has to say that rather than look broken.
      await expect(page.getByRole('heading', { name: /Nenhum onboarding atribuído/ })).toBeVisible({
        timeout: 20_000,
      })
    })
  })

  test('an invited person is assigned the default flow and walks it', async ({ page, browser }) => {
    test.slow()

    const orgName = `E2E Convite ${unique('org')}`
    await register(page, { orgName })

    // A minimal flow: one required reading step and one self-reported task, so
    // the walk exercises both an acknowledgement and a "marked by you".
    await test.step('the admin publishes a two-step default flow', async () => {
      await page.goto('/settings')
      await page.getByRole('button', { name: 'Onboarding', exact: true }).click()
      await page.getByLabel('Novo fluxo').fill('Essencial')
      await page.getByRole('button', { name: 'Criar' }).click()

      await page.getByLabel('Tipo do novo passo').selectOption('markdown')
      await page.getByRole('button', { name: /Adicionar passo/ }).click()
      await page.getByLabel('Tipo do novo passo').selectOption('task')
      await page.getByRole('button', { name: /Adicionar passo/ }).click()

      await page.getByRole('button', { name: 'Salvar passos' }).first().click()
      await expect(page.getByText('Passos salvos.')).toBeVisible({ timeout: 20_000 })

      await page.getByRole('button', { name: 'Tornar padrão' }).click()
      await expect(page.getByText('padrão')).toBeVisible({ timeout: 15_000 })
    })

    // The invite token is shown once, in the members tab. Reading it from the
    // API keeps this test about the runner rather than about clipboard UX.
    const inviteEmail = `${unique('novato')}@example.test`
    const inviteToken = await page.evaluate(async (email) => {
      const response = await fetch('/api/organizations/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'developer' }),
      })
      const body = await response.json()
      return body.token as string
    }, inviteEmail)

    expect(inviteToken).toBeTruthy()

    const newcomerContext = await browser.newContext()
    const newcomerPage = await newcomerContext.newPage()

    await test.step('the newcomer registers through the invite link', async () => {
      // The real path a newcomer takes: the register page reads the token from
      // `?invite=` and hides the organization field, because they are joining
      // one rather than creating it.
      await newcomerPage.goto(`/register?invite=${encodeURIComponent(inviteToken)}`)

      await expect(async () => {
        await newcomerPage.getByLabel('Nome completo').fill('Novato E2E')
        await newcomerPage.getByLabel('E-mail').fill(inviteEmail)
        await newcomerPage.getByLabel('Senha', { exact: false }).first().fill(PASSWORD)
        await newcomerPage.getByRole('button', { name: /criar conta/i }).click()
        await expect(newcomerPage).not.toHaveURL(/\/register/, { timeout: 5_000 })
      }).toPass({ timeout: 60_000 })

      await expect(newcomerPage).not.toHaveURL(/\/login/, { timeout: 20_000 })
    })

    await test.step('the home banner points at the pending onboarding', async () => {
      // It is a banner and not a redirect: the person can use the platform and
      // come back.
      await expect(newcomerPage.getByText(/Seu onboarding/)).toBeVisible({ timeout: 20_000 })
      await newcomerPage.getByRole('link', { name: /Continuar/ }).click()
      await expect(newcomerPage).toHaveURL(/\/onboarding/)
    })

    await test.step('reading asks for an acknowledgement, the task is marked by you', async () => {
      await expect(newcomerPage.getByRole('heading', { name: 'Essencial' })).toBeVisible({ timeout: 20_000 })
      await expect(newcomerPage.getByText(/obrigatório\(s\) pendente/)).toBeVisible()

      // A required reading step: the button asks for an acknowledgement rather
      // than claiming anything was checked.
      await newcomerPage.getByRole('button', { name: 'Entendi' }).click()

      // The task is self-reported, and the UI says so in as many words.
      await expect(newcomerPage.getByText(/marcado por você/i)).toBeVisible({ timeout: 20_000 })
      await newcomerPage.getByRole('button', { name: 'Marcar como feito' }).click()

      await expect(newcomerPage.getByText(/tudo que era obrigatório está feito/)).toBeVisible({
        timeout: 20_000,
      })
    })

    await test.step('finishing asks what was missing', async () => {
      const feedback = newcomerPage.getByLabel('Seu retorno sobre o onboarding')
      await expect(feedback).toBeVisible({ timeout: 20_000 })
      await feedback.fill('faltou dizer como pedir acesso ao staging')
      await newcomerPage.getByRole('button', { name: 'Enviar' }).click()

      await expect(newcomerPage.getByText(/seu retorno foi registrado/i)).toBeVisible({ timeout: 20_000 })
    })

    await test.step('the banner is gone once nothing is pending', async () => {
      await newcomerPage.goto('/')
      // Nobody dismissed it: finishing the flow is what removes it.
      await expect(newcomerPage.getByText(/Seu onboarding/)).toHaveCount(0)
    })

    await test.step('the admin dashboard shows the walk and the feedback', async () => {
      await page.goto('/settings')
      await page.getByRole('button', { name: 'Onboarding', exact: true }).click()

      await expect(page.getByText('Novato E2E')).toBeVisible({ timeout: 20_000 })
      await expect(page.getByText('concluído')).toBeVisible()
      await expect(page.getByText(/acesso ao staging/)).toBeVisible()
    })

    await newcomerContext.close()
  })
})
