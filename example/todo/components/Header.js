/**
 * Header component
 * Demonstrates: html template, computed values for display
 */
import { html } from '../../../framework/src/core/template.js'
import { activeCount, totalCount } from '../store.js'

export function Header() {
  return html`
    <header class="header">
      <h1>Todo App</h1>
      <p class="subtitle">
        ${() => {
          const active = activeCount()
          const total = totalCount()
          if (total === 0) return 'No todos yet'
          if (active === 0) return 'All done!'
          return `${active} of ${total} remaining`
        }}
      </p>
    </header>
  `
}
