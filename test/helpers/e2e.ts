import { test as base, expect } from '@playwright/test'
import { createJourneyReporter, type JourneyReporter } from './journey-report'

export const test = base.extend<{ journey: JourneyReporter }>({
  journey: async ({ page }, use, testInfo) => {
    const journey = createJourneyReporter(page, testInfo)
    try { await use(journey) } finally { await journey.finalize() }
  }
})
export { expect }
