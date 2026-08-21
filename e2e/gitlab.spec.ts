import { test, expect, Page } from '@playwright/test'

/**
 * Browser end-to-end run for the GitLab provider.
 *
 * It drives the product the way a person does — register, paste a token, add a
 * repository, wait for the catalog to fill in, read the merge requests — against
 * the deterministic stack from the backend repo:
 *
 *   cd backend && make e2e-stack     # postgres, redis, fake GitLab, real server
 *   cd frontend && npm run e2e
 *
 * The fake GitLab serves payloads captured from the real gitlab.com, so what
 * renders here is what renders against the real thing.
 */

const GITLAB_TOKEN = process.env.E2E_GITLAB_TOKEN ?? 'glpat-e2e-token'
const REPO_URL = 'https://gitlab.com/gitlab-org/nested-group/gitlab-runner'
const REPO_NAME = 'gitlab-org/nested-group/gitlab-runner'
// The open merge request the fixture serves, by iid — the number GitLab shows.
const MERGE_REQUEST_IID = 7222

// One organization per run: registration is what creates it, and the first user
// becomes its admin, which the settings page requires.
function uniqueOrg() {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`
  return {
    email: `e2e-${stamp}@example.test`,
    password: 'E2ePassw0rd!',
    fullName: 'E2E Browser',
    orgName: `E2E Browser ${stamp}`,
  }
}

async function register(page: Page) {
  const org = uniqueOrg()

  await page.goto('/register')
  await page.getByLabel('Nome completo').fill(org.fullName)
  await page.getByLabel('E-mail').fill(org.email)
  await page.getByLabel('Senha', { exact: false }).first().fill(org.password)
  await page.getByLabel('Nome da organização').fill(org.orgName)
  await page.getByRole('button', { name: /criar conta|registrar|cadastrar/i }).click()

  // Landing anywhere inside the app means the session cookie was set.
  await expect(page).not.toHaveURL(/\/register/, { timeout: 20_000 })
  return org
}

async function configureGitLabToken(page: Page) {
  await page.goto('/settings')
  await page.getByRole('button', { name: 'GitLab', exact: true }).click()

  await expect(page.getByText('Token pendente')).toBeVisible()
  // Scoped to the textbox: the help tooltip trigger shares the same label.
  await page.getByRole('textbox', { name: 'GitLab token' }).fill(GITLAB_TOKEN)
  await page.getByRole('button', { name: 'Salvar' }).click()

  // The badge flips only after the API confirms the write, so this asserts
  // persistence and not just local state.
  await expect(page.getByText('Token configurado')).toBeVisible({ timeout: 15_000 })
}

async function addRepository(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /novo repo|adicionar/i }).first().click()
  await page.getByLabel(/URL do Repositório/i).fill(REPO_URL)
  await page.getByRole('button', { name: /adicionar|criar|salvar/i }).last().click()

  await expect(page.getByRole('link', { name: REPO_NAME })).toBeVisible({ timeout: 20_000 })
}

test.describe.configure({ mode: 'serial' })

test.describe('GitLab repository through the UI', () => {
  test('a GitLab project can be onboarded, synced and browsed', async ({ page }) => {
    test.slow() // sync runs in the worker; this walks several full round trips

    await register(page)
    await configureGitLabToken(page)
    await addRepository(page)

    await test.step('the catalog fills in from the provider', async () => {
      // Sync is asynchronous, so the card is polled rather than awaited once.
      await expect(async () => {
        await page.reload()
        const card = page.locator('.repo-card', { hasText: REPO_NAME })
        await expect(card).toBeVisible()
        // The provider tag is rendered from the stored type, and it only reads
        // `gitlab` if the URL host decided the provider.
        await expect(card.getByText('gitlab', { exact: true })).toBeVisible()
        // The pending badge lists the failing checks in its tooltip. Asserting
        // on which ones fail beats asserting how many: ownership, description,
        // docs and coverage are legitimately pending in this run, while sync,
        // CI, tests and the webhook must have passed.
        const pending = card.getByText(/pendência/)
        await expect(pending).toBeVisible()
        const failing = (await pending.getAttribute('title')) ?? ''
        for (const mustPass of [
          'Sincronização saudável',
          'Tem CI configurado',
          'Tem testes automatizados',
          'Webhook registrado',
        ]) {
          expect(failing, `"${mustPass}" should not be pending`).not.toContain(mustPass)
        }
      }).toPass({ timeout: 60_000 })
    })

    await test.step('merge requests are listed for the repository', async () => {
      await page.getByRole('link', { name: REPO_NAME }).click()
      await expect(page).toHaveURL(/\/code\/repositories\/[0-9a-f-]+/)

      await page.getByRole('link', { name: /pull requests/i }).first().click()
      await expect(page.getByRole('heading', { name: new RegExp(`Pull Requests de`) })).toBeVisible({
        timeout: 20_000,
      })

      // The number shown is GitLab's iid. Rendering the internal id here would
      // produce a link that 404s.
      await expect(page.getByText(`#${MERGE_REQUEST_IID}`)).toBeVisible({ timeout: 20_000 })
      // The link, not the branch name below it, which shares the same words.
      await expect(page.getByRole('link', { name: /catched/i })).toBeVisible()
      // The merged fixture merge request must not show up in an open list.
      await expect(page.getByText('#7100')).toHaveCount(0)
    })

    await test.step('a merge request diff is readable', async () => {
      await page.getByRole('link', { name: /catched/i }).click()
      await expect(page).toHaveURL(new RegExp(`/pull-requests/${MERGE_REQUEST_IID}`))

      // Both changed files, and the diff body itself: GitLab supplies no line
      // counts, so these numbers are the ones counted from the patch.
      await expect(page.getByText('commands/multi.go')).toBeVisible({ timeout: 20_000 })
      await expect(page.getByText('docs/NEW.md')).toBeVisible()
      await expect(page.getByText('Alterações (2 arquivos)')).toBeVisible()
      // The added file's counters come from lines parsed out of the patch,
      // since GitLab reports none.
      await expect(page.getByText('+2', { exact: false }).first()).toBeVisible()
    })
  })

  test('a repository whose provider has no token reports it', async ({ page }) => {
    await register(page)

    // No token configured for this organization at all.
    await page.goto('/')
    await page.getByRole('button', { name: /novo repo|adicionar/i }).first().click()
    await page.getByLabel(/URL do Repositório/i).fill('https://gitlab.com/gitlab-org/huge-monorepo')
    await page.getByRole('button', { name: /adicionar|criar|salvar/i }).last().click()

    const card = page.locator('.repo-card', { hasText: 'huge-monorepo' })
    await expect(card).toBeVisible({ timeout: 20_000 })

    // The failed sync has to surface in the UI, not look like a repository
    // that merely has not been synced yet.
    await expect(async () => {
      await page.reload()
      const pending = page.locator('.repo-card', { hasText: 'huge-monorepo' }).getByText(/pendência/)
      await expect(pending).toBeVisible()
      const failing = (await pending.getAttribute('title')) ?? ''
      expect(failing).toContain('Sincronização saudável')
    }).toPass({ timeout: 60_000 })
  })
})
