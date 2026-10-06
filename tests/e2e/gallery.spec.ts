import { test, expect } from '@playwright/test'

test('home shows hero and mod cards', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Prompts that build')
  await expect(page.locator('[data-card]').first()).toBeVisible()
  expect(await page.locator('[data-card]').count()).toBeGreaterThanOrEqual(9)
})

test('surface filter updates URL and results', async ({ page }) => {
  await page.goto('/mods')
  const all = await page.locator('[data-card]').count()
  await page.getByRole('button', { name: 'Guard', exact: true }).click()
  await expect(page).toHaveURL(/surface=guard/)
  await expect.poll(() => page.locator('[data-card]').count()).toBeLessThan(all)
})

test('search finds a mod', async ({ page }) => {
  await page.goto('/mods')
  await page.getByPlaceholder(/search mods/i).fill('pomodoro')
  await expect(page).toHaveURL(/q=pomodoro/)
  await expect(page.locator('[data-card]')).toHaveCount(1)
  await expect(page.locator('[data-card]')).toContainText('Focus Timer')
})

test('mod page copies and downloads the prompt', async ({ page, request }) => {
  await page.goto('/mods/blast-shield')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blast Shield')
  await page.getByRole('button', { name: 'Copy prompt' }).first().click()
  await expect(page.getByText('Copied').first()).toBeVisible()
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  expect(clip).toContain('Build me a Claude Code mod called blast-shield')

  const res = await request.get('/mods/blast-shield/prompt.md')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-disposition']).toContain('blast-shield.md')
  expect(await res.text()).toContain('Where it shows:')
})

test('protected pages send you to login', async ({ page }) => {
  await page.goto('/submit')
  await expect(page).toHaveURL(/\/login\?next=%2Fsubmit/)
})

test('no horizontal scroll', async ({ page }) => {
  for (const path of ['/', '/mods', '/mods/ci-radar', '/guide']) {
    await page.goto(path)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})

test('unknown mod is a 404', async ({ page }) => {
  const res = await page.goto('/mods/does-not-exist')
  expect(res?.status()).toBe(404)
})
