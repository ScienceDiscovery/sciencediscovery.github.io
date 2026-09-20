import { test, expect } from './helpers/e2e'

/**
 * E2E-META
 * Purpose: Find a Linux binary and read the complete bilingual user guides.
 * Environment: Built static website on its own preview port.
 * Credentials: none.
 * OtherExternal: none; download URLs are inspected without downloading binaries.
 * CostSideEffects: local browser reads and isolated screenshots only.
 */
test('find downloads, launch instructions, deployment, and bilingual documentation', async ({ page, journey }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  journey.scenario({ goal: '选择适合 CPU 的下载，并浏览完整的中英部署和使用文档。', preconditions: '站点已构建；浏览器访问独立的静态预览，无需产品账号。' })

  await journey.step('01 首页下载', '首屏展示两个 Linux 架构、bubblewrap 前置条件和可用的下载链接。', async () => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('scientific research')
    for (const arch of ['x86_64', 'aarch64']) {
      const download = page.locator('.download-button').filter({ hasText: `Linux ${arch}` })
      await expect(download).toBeInViewport()
      await expect(download).toHaveAttribute('href', `https://github.com/openJiuwen-ai/sciencediscovery/releases/download/0.2.0/ScienceDiscovery-0.2.0-linux-${arch}`)
    }
    await expect(page.getByText('Linux only · Requires bubblewrap', { exact: true })).toBeVisible()
    await expect(page.locator('.terminal code')).toHaveText('chmod +x ./ScienceDiscovery && ./ScienceDiscovery serve')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  await journey.step('02 校验文件', '展开 SHA256 后可以核对两种架构的真实 Release 校验值。', async () => {
    await page.getByText('Verify your download · SHA256', { exact: true }).click()
    await expect(page.getByText('348fbf2aeb2d38062ccbf4b2bdf0bfd99517eba0cc48370d9351b7482f758bb6', { exact: true })).toBeVisible()
    await expect(page.getByText('1b8b64335a9846721c9bf39448c07f4265d373ce4e4bc088b9149107b66576b3', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  await journey.step('03 完整部署', '从首页进入部署指南，能阅读二进制、Docker 和本地源码的完整命令。', async () => {
    await page.getByRole('link', { name: /02 Choose your deployment/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Deploy ScienceDiscovery')
    await expect(page.getByRole('heading', { name: 'Single-file binary deployment', exact: true })).toBeAttached()
    await expect(page.getByRole('heading', { name: 'Docker deployment', exact: true })).toBeAttached()
    await expect(page.getByRole('heading', { name: 'Local mode (host processes)', exact: true })).toBeAttached()
    await expect(page.locator('.vp-doc')).toContainText('docker compose up -d')
    await expect(page.locator('.vp-doc')).toContainText('./scripts/start-stack.sh --mode local')
    await expect(page.locator('.vp-doc')).toContainText('./scripts/package-binary-release.sh')
    const readme = page.locator('.vp-doc a').filter({ hasText: /^README$/ }).first()
    await expect(readme).toHaveAttribute('href', 'https://github.com/openJiuwen-ai/sciencediscovery/blob/main/README.md')
  })

  await journey.step('04 中文入口', '语言菜单打开中文首页，中文部署入口和四类用户文档都能访问。', async () => {
    if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'mobile navigation' }).click()
    else await page.getByRole('button', { name: 'Change language' }).hover()
    await page.getByRole('link', { name: '简体中文', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('面向科学研究')
    await page.getByRole('link', { name: /02 选择部署方式/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('部署')
    await expect(page.locator('.vp-doc')).toContainText('docker compose up -d')
    await page.goto('/zh/README.html')
    for (const name of ['Tutorial（教程）', 'How-to（操作指南）', 'Reference（参考）', 'Explanation（解释）']) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeAttached()
    }
    await page.locator('.vp-doc').getByRole('link', { name: 'English documentation', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ScienceDiscovery Documentation')
  })

  await journey.step('05 配图与正文', '从文档目录进入调研案例，全部用户指南截图加载成功。', async () => {
    await page.locator('.vp-doc').getByRole('link', { name: 'Literature research case guide', exact: true }).click()
    const images = page.locator('.vp-doc img')
    expect(await images.count()).toBeGreaterThan(10)
    for (const img of await images.all()) {
      await img.scrollIntoViewIfNeeded()
      await expect(img).toHaveJSProperty('complete', true)
      expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)
    }
    await page.getByRole('heading', { name: /2\. Model configuration/ }).scrollIntoViewIfNeeded()
    expect(errors).toEqual([])
  })
})

test('search documentation by a deployment term', async ({ page, journey }) => {
  journey.scenario({ goal: '通过站内搜索找到 Docker 部署说明。', preconditions: '静态搜索索引随站点一起构建，无外部搜索服务。' })
  await journey.step('01 搜索文档', '搜索 Docker 后出现部署结果，选中结果后进入部署页面。', async () => {
    await page.goto('/en/README.html')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await page.locator('#localsearch-input').fill('Docker deployment')
    const result = page.locator('.VPLocalSearchBox a').filter({ hasText: 'Deploy ScienceDiscovery' }).first()
    await expect(result).toBeVisible()
    await result.click()
    await expect(page).toHaveURL(/\/en\/how-to\/deployment\.html/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Deploy ScienceDiscovery')
  })
})
