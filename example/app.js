/**
 * Main application entry point
 * Demonstrates: router setup, component composition, effect for re-rendering
 */
import { html } from '../framework/src/core/template.js'
import { mount } from '../framework/src/core/component.js'
import { createRouter } from '../framework/src/core/router.js'
import { effect } from '../framework/src/core/signal.js'
import { setFilter, todos } from './store.js'

// Components
import { Header } from './components/Header.js'
import { AddTodoForm } from './components/AddTodoForm.js'
import { TodoList } from './components/TodoList.js'
import { TodoFilter } from './components/TodoFilter.js'

// Create router with routes
// Each route sets the filter and returns null (we handle rendering separately)
const router = createRouter({
  '/': () => {
    setFilter('all')
    return null
  },
  '/active': () => {
    setFilter('active')
    return null
  },
  '/completed': () => {
    setFilter('completed')
    return null
  }
})

/**
 * Main App component
 * Composes all sub-components
 */
function App() {
  return html`
    <div class="app-container">
      ${Header()}
      ${AddTodoForm()}
      ${TodoList()}
      ${TodoFilter(router)}
    </div>
  `
}

/**
 * Render the application
 * Uses effect to re-render when todos or filter changes
 */
function render() {
  const container = document.getElementById('app')

  // Effect that handles routing (sets filter based on hash)
  effect(() => {
    const route = router.current()
    if (route && route.component) {
      route.component()
    }
  })

  // Mount the app once
  // Reactivity is now handled globally within components
  mount(App(), container)
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render)
} else {
  render()
}
