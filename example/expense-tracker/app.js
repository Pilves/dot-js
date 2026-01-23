/**
 * Expense Tracker App
 * Demonstrates: createRouter, navigate, current, matchRoute, destroy, mount, unmount, effect
 */
import { html } from '../../framework/src/core/template.js'
import { mount, unmount } from '../../framework/src/core/component.js'
import { createRouter } from '../../framework/src/core/router.js'
import { signal, effect } from '../../framework/src/core/signal.js'

// Components
import { Dashboard } from './components/Dashboard.js'
import { ExpenseForm } from './components/ExpenseForm.js'
import { ExpenseList } from './components/ExpenseList.js'
import { ExpenseDetail } from './components/ExpenseDetail.js'
import { Settings } from './components/Settings.js'
import { Reports } from './components/Reports.js'

// Create router with 5 routes
const router = createRouter({
  '/': () => ({ view: 'dashboard', params: {} }),
  '/add': () => ({ view: 'add', params: {} }),
  '/expense/:id': (params) => ({ view: 'detail', params }),
  '/settings': () => ({ view: 'settings', params: {} }),
  '/reports': () => ({ view: 'reports', params: {} })
})

// Track current view
const [currentView, setCurrentView] = signal('dashboard')
const [viewParams, setViewParams] = signal({})

// Navigation helper
function navigate(path) {
  router.navigate(path)
}

// Navigate to expense detail
function goToExpense(id) {
  router.navigate(`/expense/${id}`)
}

/**
 * Navigation Component
 */
function Nav() {
  const isActive = (path) => {
    const route = router.current()
    if (!route) return false

    // Use matchRoute to check if current path matches
    return router.matchRoute(path, window.location.hash.slice(1) || '/') !== null
  }

  return html`
    <nav class="nav">
      <a
        href="#/"
        class="${() => `nav-link ${isActive('/') && currentView() === 'dashboard' ? 'active' : ''}`}"
      >
        Dashboard
      </a>
      <a
        href="#/add"
        class="${() => `nav-link ${currentView() === 'add' ? 'active' : ''}`}"
      >
        + Add
      </a>
      <a
        href="#/reports"
        class="${() => `nav-link ${currentView() === 'reports' ? 'active' : ''}`}"
      >
        Reports
      </a>
      <a
        href="#/settings"
        class="${() => `nav-link ${currentView() === 'settings' ? 'active' : ''}`}"
      >
        Settings
      </a>
    </nav>
  `
}

/**
 * Main App Component
 */
function App() {
  return html`
    <div class="app-container">
      ${Nav()}

      <main>
        ${() => {
          const view = currentView()
          const params = viewParams()

          switch (view) {
            case 'dashboard':
              return Dashboard(router)
            case 'add':
              return ExpenseForm(router)
            case 'detail':
              return ExpenseDetail(params, router)
            case 'settings':
              return Settings()
            case 'reports':
              return Reports()
            default:
              return html`<div class="card">Page not found</div>`
          }
        }}
      </main>
    </div>
  `
}

/**
 * Render the application
 */
function render() {
  const container = document.getElementById('app')

  // Effect to handle route changes
  effect(() => {
    const route = router.current()

    if (route && route.component) {
      const result = route.component(route.params)
      setCurrentView(result.view)
      setViewParams(result.params)
    } else {
      // No matching route, go to dashboard
      setCurrentView('dashboard')
      setViewParams({})
    }
  })

  // Mount the app
  mount(App(), container)

  // Cleanup on page unload (demonstrates destroy)
  window.addEventListener('beforeunload', () => {
    router.destroy()
    unmount(container)
  })
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render)
} else {
  render()
}

// Export for potential external use
export { router, navigate, goToExpense }
