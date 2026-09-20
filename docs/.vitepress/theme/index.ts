import DefaultTheme from 'vitepress/theme'
import Landing from './Landing.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    app.component('Landing', Landing)
    if (import.meta.env.SSR) return

    // The initial page module hydrates the existing HTML. A quick link click
    // must not replace that module before the root has finished mounting.
    let firstNavigation = true
    let markHydrated: () => void
    const hydrated = new Promise<void>(resolve => { markHydrated = resolve })
    app.mixin({ mounted() { if (this === this.$root) markHydrated() } })
    router.onBeforeRouteChange = async () => {
      if (firstNavigation) firstNavigation = false
      else await hydrated
    }
  }
}
