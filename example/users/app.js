/**
 * User Directory App
 * Demonstrates: router with params, HTTP utilities, reactive async state
 */
import { html } from '../../framework/src/core/template.js'
import { mount } from '../../framework/src/core/component.js'
import { createRouter } from '../../framework/src/core/router.js'
import { effect } from '../../framework/src/core/signal.js'
import { setSelectedUserId } from './store.js'

// Components
import { UserList } from './components/UserList.js'
import { UserDetail } from './components/UserDetail.js'

/**
 * Create router with routes
 * - / shows user list
 * - /user/:id shows user details
 */
const router = createRouter({
  '/': (params) => {
    setSelectedUserId(null)
    return 'list'
  },
  '/user/:id': (params) => {
    setSelectedUserId(params.id)
    return 'detail'
  }
})

/**
 * Current view signal based on route
 */
const [currentView, setCurrentView] = (() => {
  let view = 'list'
  return [
    () => view,
    (newView) => { view = newView }
  ]
})()

/**
 * Header component with navigation
 */
function Header() {
  const handleHomeClick = (event) => {
    event.preventDefault()
    router.navigate('/')
  }

  return html`
    <header class="header">
      <h1>User Directory</h1>
      <p class="subtitle">HTTP Utilities Demo</p>
      <nav class="nav">
        <a href="#/" class="nav-link" onclick="${handleHomeClick}">Home</a>
      </nav>
    </header>
  `
}

/**
 * Main App component
 * Renders header and current view based on route
 */
function App() {
  return html`
    <div class="app-container">
      ${Header()}
      <main class="main-content" id="view-container">
        ${UserList()}
      </main>
    </div>
  `
}

/**
 * Render view based on current route
 */
function renderView(viewName, params = {}) {
  const container = document.getElementById('view-container')
  if (!container) return

  // Clear container
  container.innerHTML = ''

  // Render appropriate view
  if (viewName === 'detail' && params.id) {
    mount(UserDetail(params.id), container)
  } else {
    mount(UserList(), container)
  }
}

/**
 * Initialize and render the application
 */
function render() {
  const container = document.getElementById('app')

  // Mount the app shell once
  mount(App(), container)

  // Effect to handle route changes
  effect(() => {
    const route = router.current()
    if (route && route.component) {
      const viewName = route.component(route.params)
      renderView(viewName, route.params)
    }
  })
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render)
} else {
  render()
}
