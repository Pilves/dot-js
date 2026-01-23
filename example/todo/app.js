/**
 * Main application entry point
 * Demonstrates: router setup, component composition, effect for re-rendering
 */
import { html } from '../../framework/src/core/template.js'
import { mount } from '../../framework/src/core/component.js'
import { createRouter } from '../../framework/src/core/router.js'
import { signal, effect } from '../../framework/src/core/signal.js'
import { setFilter, todos } from './store.js'

// Components
import { Header } from './components/Header.js'
import { AddTodoForm } from './components/AddTodoForm.js'
import { TodoList } from './components/TodoList.js'
import { TodoFilter } from './components/TodoFilter.js'
import { TodoDetail } from './components/TodoDetail.js'
import { UserDemo } from './components/UserDemo.js'
import { VirtualListDemo } from './components/VirtualListDemo.js'

// Signal to track current view: 'list' or 'detail'
const [currentView, setCurrentView] = signal('list')
const [detailParams, setDetailParams] = signal(null)

// Create router with routes
// List routes set filter and view to 'list'
// Detail route sets view to 'detail' with params
const router = createRouter({
  '/': () => {
    setFilter('all')
    setCurrentView('list')
    return null
  },
  '/active': () => {
    setFilter('active')
    setCurrentView('list')
    return null
  },
  '/completed': () => {
    setFilter('completed')
    setCurrentView('list')
    return null
  },
  '/todo/:id': (params) => {
    setCurrentView('detail')
    setDetailParams(params)
    return null
  }
})

/**
 * List view component
 * Shows the main todo list with form and filters
 */
function ListView() {
  return html`
    <div class="list-view">
      ${AddTodoForm()}
      ${TodoList()}
      ${TodoFilter(router)}
      <div class="demo-section">
        ${UserDemo()}
        ${VirtualListDemo()}
      </div>
    </div>
  `
}

/**
 * Detail view component
 * Shows a single todo's details
 */
function DetailView() {
  const params = detailParams()
  if (!params) return html`<div>Loading...</div>`
  return TodoDetail(params)
}

/**
 * Main App component
 * Composes all sub-components, switches view based on route
 */
function App() {
  return html`
    <div class="app-container">
      ${Header()}
      <div class="view-container">
        <div style="display: ${() => currentView() === 'list' ? 'block' : 'none'}">
          ${ListView()}
        </div>
        <div style="display: ${() => currentView() === 'detail' ? 'block' : 'none'}">
          ${() => currentView() === 'detail' ? DetailView() : ''}
        </div>
      </div>
    </div>
  `
}

/**
 * Render the application
 * Uses effect to re-render when todos or filter changes
 */
function render() {
  const container = document.getElementById('app')

  // Effect that handles routing (sets filter/view based on hash)
  effect(() => {
    const route = router.current()
    if (route && route.component) {
      // Pass params to the route handler
      route.component(route.params)
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
