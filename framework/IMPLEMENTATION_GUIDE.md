# dot-js Implementation Guide

## Current Status Analysis

### What's Done
| Feature | Status | Location |
|---------|--------|----------|
| `signal(value)` | Complete | `signal.js:9-35` |
| `effect(fn)` | Complete | `signal.js:41-52` |
| `computed(fn)` | Complete | `signal.js:62-71` |
| `html` tagged template | Complete | `template.js:9-49` |
| Event handling (`onclick`, etc.) | Complete | `template.js:84-91` |
| Attribute binding (static + reactive) | Complete | `template.js:92-105` |
| Text interpolation (static + reactive) | Complete | `template.js:142-174` |
| Nested elements & arrays | Complete | `template.js:155-168` |

### What's Remaining
1. **Style binding** - object syntax for styles
2. **Component architecture** - function components, mount, children/slots
3. **Routing** - hash router, history router, route params
4. **Form handling** - already works via events, just needs documentation
5. **HTTP requests** - fetch wrapper, async state helper
6. **Performance** - keyed lists, virtual scrolling
7. **Documentation** - all docs
8. **Example app** - todo application

---

## Phase 1.3: Style Binding

### Goal
Support object syntax for inline styles:
```js
html`<div style=${{ color: 'red', fontSize: '14px' }}>Styled</div>`
html`<div style=${() => ({ opacity: visible() ? 1 : 0 })}>Reactive</div>`
```

### Implementation Steps

**File: `template.js`**

#### Step 1: Create style object converter

Add this helper function after the `isInsideAttribute` function:

```js
/**
 * Convert style object to CSS string
 * @param {Object} styleObj - { color: 'red', fontSize: '14px' }
 * @returns {string} - "color: red; font-size: 14px;"
 */
function styleObjectToString(styleObj) {
  if (!styleObj || typeof styleObj !== 'object') {
    return String(styleObj || '')
  }

  return Object.entries(styleObj)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case: fontSize -> font-size
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${cssKey}: ${value}`
    })
    .join('; ')
}
```

#### Step 2: Modify attribute processing

In the `processAttributes` function, add special handling for `style` attribute. Find this section (around line 92-105):

```js
} else {
  //regular attribute
  //remove placeholder
  element.removeAttribute(attr.name)
  if (typeof value === "function") {
    // update attribute when signal changes
    effect(() => {
      const result = value()
      element.setAttribute(attr.name, result)
    })
  } else {
    element.setAttribute(attr.name, value)
  }
}
```

Replace with:

```js
} else if (attr.name === 'style') {
  // Handle style attribute specially
  element.removeAttribute(attr.name)

  if (typeof value === 'function') {
    // Reactive style binding
    effect(() => {
      const result = value()
      const styleString = styleObjectToString(result)
      element.setAttribute('style', styleString)
    })
  } else if (typeof value === 'object') {
    // Static style object
    element.setAttribute('style', styleObjectToString(value))
  } else {
    // Plain string style
    element.setAttribute('style', String(value))
  }
} else {
  // Regular attribute (existing code)
  element.removeAttribute(attr.name)
  if (typeof value === "function") {
    effect(() => {
      const result = value()
      element.setAttribute(attr.name, result)
    })
  } else {
    element.setAttribute(attr.name, value)
  }
}
```

#### Step 3: Test

```js
// Test static style object
const box = html`<div style=${{ backgroundColor: 'blue', padding: '20px' }}>Box</div>`

// Test reactive style
const [visible, setVisible] = signal(true)
const fade = html`<div style=${() => ({
  opacity: visible() ? 1 : 0.5,
  transition: 'opacity 0.3s'
})}>Fading</div>`
```

---

## Phase 2: Component System

### 2.1 Function Components

Function components already work since `html` returns DOM nodes:

```js
function Button({ label, onClick }) {
  return html`<button onclick=${onClick}>${label}</button>`
}

// Usage
const myBtn = Button({ label: 'Click', onClick: () => alert('hi') })
document.body.appendChild(myBtn)
```

No additional implementation needed - this pattern works out of the box.

### 2.2 Mount Function

**Create file: `framework/src/core/component.js`**

```js
/**
 * Mount a component to a DOM element
 * @param {Node} component - The component to mount
 * @param {HTMLElement} container - Target container
 */
export function mount(component, container) {
  // Clear existing content
  container.innerHTML = ''

  // Append component
  if (component instanceof DocumentFragment) {
    container.appendChild(component)
  } else if (component instanceof Node) {
    container.appendChild(component)
  } else {
    throw new Error('mount() expects a DOM Node or DocumentFragment')
  }

  return component
}

/**
 * Unmount/clear a container
 * @param {HTMLElement} container
 */
export function unmount(container) {
  container.innerHTML = ''
}
```

### 2.3 Children/Slots

Children are passed as a property. The `html` function already handles Node interpolation:

```js
function Card({ title, children }) {
  return html`
    <div class="card">
      <h2>${title}</h2>
      <div class="card-body">${children}</div>
    </div>
  `
}

// Usage
const content = html`<p>This is the card content</p>`
const card = Card({
  title: 'My Card',
  children: content
})
```

For multiple children, use arrays or fragments:

```js
const multipleChildren = [
  html`<p>First</p>`,
  html`<p>Second</p>`
]
const card = Card({ title: 'Multi', children: multipleChildren })
```

---

## Phase 3: Routing

**Create file: `framework/src/core/router.js`**

### 3.1 Hash Router

```js
import { signal, effect } from './signal.js'

/**
 * Create a hash-based router
 * @param {Object} routes - { '/': HomePage, '/about': AboutPage }
 * @returns {Object} - Router instance
 */
export function createHashRouter(routes) {
  const [currentPath, setCurrentPath] = signal(getHashPath())
  const [params, setParams] = signal({})

  // Get path from hash
  function getHashPath() {
    const hash = window.location.hash.slice(1) || '/'
    return hash.startsWith('/') ? hash : '/' + hash
  }

  // Parse route params: /user/:id -> { id: '123' }
  function matchRoute(path) {
    for (const [pattern, component] of Object.entries(routes)) {
      const paramNames = []
      const regexPattern = pattern.replace(/:(\w+)/g, (_, name) => {
        paramNames.push(name)
        return '([^/]+)'
      })

      const regex = new RegExp(`^${regexPattern}$`)
      const match = path.match(regex)

      if (match) {
        const extractedParams = {}
        paramNames.forEach((name, i) => {
          extractedParams[name] = match[i + 1]
        })
        return { component, params: extractedParams }
      }
    }
    return null
  }

  // Listen to hash changes
  window.addEventListener('hashchange', () => {
    const path = getHashPath()
    setCurrentPath(path)

    const matched = matchRoute(path)
    if (matched) {
      setParams(matched.params)
    }
  })

  // Navigate programmatically
  function navigate(path) {
    window.location.hash = path
  }

  // Get current component
  function getCurrentComponent() {
    const path = currentPath()
    const matched = matchRoute(path)

    if (matched) {
      const Component = matched.component
      return typeof Component === 'function' ? Component(matched.params) : Component
    }

    // 404 fallback
    return routes['*'] ? routes['*']() : null
  }

  return {
    path: currentPath,
    params,
    navigate,
    getCurrentComponent,
    // Reactive router outlet
    outlet: () => getCurrentComponent()
  }
}
```

### 3.2 History Router

```js
/**
 * Create a history-based router (cleaner URLs)
 * @param {Object} routes
 * @returns {Object}
 */
export function createHistoryRouter(routes) {
  const [currentPath, setCurrentPath] = signal(window.location.pathname)
  const [params, setParams] = signal({})

  function matchRoute(path) {
    for (const [pattern, component] of Object.entries(routes)) {
      const paramNames = []
      const regexPattern = pattern.replace(/:(\w+)/g, (_, name) => {
        paramNames.push(name)
        return '([^/]+)'
      })

      const regex = new RegExp(`^${regexPattern}$`)
      const match = path.match(regex)

      if (match) {
        const extractedParams = {}
        paramNames.forEach((name, i) => {
          extractedParams[name] = match[i + 1]
        })
        return { component, params: extractedParams }
      }
    }
    return null
  }

  // Handle back/forward buttons
  window.addEventListener('popstate', () => {
    setCurrentPath(window.location.pathname)
    const matched = matchRoute(window.location.pathname)
    if (matched) setParams(matched.params)
  })

  function navigate(path) {
    history.pushState(null, '', path)
    setCurrentPath(path)
    const matched = matchRoute(path)
    if (matched) setParams(matched.params)
  }

  function getCurrentComponent() {
    const path = currentPath()
    const matched = matchRoute(path)

    if (matched) {
      const Component = matched.component
      return typeof Component === 'function' ? Component(matched.params) : Component
    }

    return routes['*'] ? routes['*']() : null
  }

  return {
    path: currentPath,
    params,
    navigate,
    getCurrentComponent,
    outlet: () => getCurrentComponent()
  }
}
```

### 3.3 Link Component

```js
import { html } from './template.js'

/**
 * Create a router link
 * @param {Object} router - Router instance
 * @param {string} to - Target path
 * @param {Node} children - Link content
 */
export function Link(router, { to, children }) {
  return html`<a href=${to} onclick=${(e) => {
    e.preventDefault()
    router.navigate(to)
  }}>${children}</a>`
}
```

### Router Usage Example

```js
import { createHashRouter } from './router.js'
import { html } from './template.js'
import { mount } from './component.js'

function HomePage() {
  return html`<h1>Home</h1>`
}

function UserPage(params) {
  return html`<h1>User: ${params.id}</h1>`
}

const router = createHashRouter({
  '/': HomePage,
  '/user/:id': UserPage,
  '*': () => html`<h1>404 Not Found</h1>`
})

function App() {
  return html`
    <nav>
      <a href="#/">Home</a>
      <a href="#/user/123">User 123</a>
    </nav>
    <main>${() => router.outlet()}</main>
  `
}

mount(App(), document.getElementById('root'))
```

---

## Phase 4: Forms

Forms already work with the current implementation. Document the pattern:

### Two-way Binding Pattern

```js
import { signal } from './signal.js'
import { html } from './template.js'

function Form() {
  const [username, setUsername] = signal('')
  const [email, setEmail] = signal('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Submitted:', {
      username: username(),
      email: email()
    })
  }

  return html`
    <form onsubmit=${handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value=${() => username()}
        oninput=${(e) => setUsername(e.target.value)}
      >
      <input
        type="email"
        placeholder="Email"
        value=${() => email()}
        oninput=${(e) => setEmail(e.target.value)}
      >
      <button type="submit">Submit</button>
    </form>
  `
}
```

### Optional: bind() Helper

```js
/**
 * Create two-way binding helpers for a signal
 * @param {Array} signalPair - [getter, setter] from signal()
 * @returns {Object} - { value, onInput }
 */
export function bind([get, set]) {
  return {
    value: () => get(),
    onInput: (e) => set(e.target.value)
  }
}

// Usage
const [name, setName] = signal('')
const nameBinding = bind([name, setName])

html`<input value=${nameBinding.value} oninput=${nameBinding.onInput}>`
```

---

## Phase 5: HTTP Requests

**Create file: `framework/src/core/http.js`**

### 5.1 Fetch Wrapper

```js
/**
 * HTTP client with common methods
 */
export const http = {
  async get(url, options = {}) {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },

  async post(url, data, options = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
      ...options
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },

  async put(url, data, options = {}) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
      ...options
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },

  async delete(url, options = {}) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.ok
  }
}
```

### 5.2 Async State Helper

```js
import { signal, effect } from './signal.js'

/**
 * Reactive async data fetching
 * @param {() => Promise} asyncFn - Async function to execute
 * @param {Object} options - { immediate: true }
 * @returns {Object} - { data, loading, error, refetch }
 */
export function useAsync(asyncFn, options = { immediate: true }) {
  const [data, setData] = signal(null)
  const [loading, setLoading] = signal(false)
  const [error, setError] = signal(null)

  async function execute() {
    setLoading(true)
    setError(null)

    try {
      const result = await asyncFn()
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  if (options.immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    refetch: execute
  }
}
```

### Usage Example

```js
function UserList() {
  const { data, loading, error, refetch } = useAsync(() =>
    http.get('/api/users')
  )

  return html`
    <div>
      ${() => {
        if (loading()) return html`<p>Loading...</p>`
        if (error()) return html`<p>Error: ${error().message}</p>`
        if (!data()) return html`<p>No data</p>`

        return html`
          <ul>
            ${data().map(user => html`<li>${user.name}</li>`)}
          </ul>
        `
      }}
      <button onclick=${refetch}>Refresh</button>
    </div>
  `
}
```

---

## Phase 6: Performance

### 6.1 Keyed Lists

**Modify `template.js`**

The current array handling doesn't track keys. Add key-based reconciliation:

```js
// Add this to track keyed elements
const keyedElements = new WeakMap()

/**
 * Create a keyed list that efficiently updates
 * @param {() => Array} itemsFn - Function returning array
 * @param {(item) => Node} renderFn - Render function for each item
 * @param {(item) => string|number} keyFn - Function to get unique key
 */
export function keyedList(itemsFn, renderFn, keyFn) {
  const container = document.createDocumentFragment()
  const startMarker = document.createComment('keyed-list-start')
  const endMarker = document.createComment('keyed-list-end')

  container.appendChild(startMarker)
  container.appendChild(endMarker)

  const elementsByKey = new Map()

  effect(() => {
    const items = itemsFn()
    const parent = startMarker.parentNode
    if (!parent) return

    const newKeys = new Set()
    const fragment = document.createDocumentFragment()

    items.forEach((item, index) => {
      const key = keyFn(item)
      newKeys.add(key)

      let element = elementsByKey.get(key)
      if (!element) {
        // Create new element
        element = renderFn(item, index)
        elementsByKey.set(key, element)
      }
      fragment.appendChild(element)
    })

    // Remove old elements
    for (const [key, element] of elementsByKey) {
      if (!newKeys.has(key)) {
        element.remove()
        elementsByKey.delete(key)
      }
    }

    // Clear existing and insert new
    let current = startMarker.nextSibling
    while (current && current !== endMarker) {
      const next = current.nextSibling
      current.remove()
      current = next
    }

    parent.insertBefore(fragment, endMarker)
  })

  return container
}
```

### Usage

```js
import { keyedList } from './template.js'

const [todos, setTodos] = signal([
  { id: 1, text: 'Learn dot-js' },
  { id: 2, text: 'Build app' }
])

const list = html`
  <ul>
    ${keyedList(
      () => todos(),
      (todo) => html`<li>${todo.text}</li>`,
      (todo) => todo.id
    )}
  </ul>
`
```

### 6.2 Virtual Scrolling

This is more complex. Create a separate component:

**Create file: `framework/src/core/virtual-list.js`**

```js
import { signal, effect } from './signal.js'
import { html } from './template.js'

/**
 * Virtual scrolling list - only renders visible items
 * @param {Object} options
 */
export function VirtualList({
  items,      // signal or array
  itemHeight, // fixed height per item
  containerHeight,
  renderItem  // (item, index) => Node
}) {
  const [scrollTop, setScrollTop] = signal(0)

  const container = html`
    <div
      class="virtual-scroll-container"
      style=${{ height: containerHeight + 'px', overflow: 'auto', position: 'relative' }}
      onscroll=${(e) => setScrollTop(e.target.scrollTop)}
    >
      <div class="virtual-scroll-content"></div>
    </div>
  `

  const content = container.querySelector('.virtual-scroll-content')

  effect(() => {
    const allItems = typeof items === 'function' ? items() : items
    const totalHeight = allItems.length * itemHeight
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 1
    const startIndex = Math.floor(scrollTop() / itemHeight)
    const endIndex = Math.min(startIndex + visibleCount, allItems.length)

    // Set total height for scroll
    content.style.height = totalHeight + 'px'

    // Clear and render visible items
    content.innerHTML = ''

    for (let i = startIndex; i < endIndex; i++) {
      const item = allItems[i]
      const element = renderItem(item, i)

      // Position absolutely
      if (element instanceof HTMLElement) {
        element.style.position = 'absolute'
        element.style.top = (i * itemHeight) + 'px'
        element.style.height = itemHeight + 'px'
        element.style.width = '100%'
      }

      content.appendChild(element)
    }
  })

  return container
}
```

---

## Phase 7: Index File

**Create file: `framework/src/index.js`**

```js
// Core reactivity
export { signal, effect, computed } from './core/signal.js'

// Template
export { html, keyedList } from './core/template.js'

// Components
export { mount, unmount } from './core/component.js'

// Routing
export { createHashRouter, createHistoryRouter, Link } from './core/router.js'

// HTTP
export { http, useAsync } from './core/http.js'

// Performance
export { VirtualList } from './core/virtual-list.js'
```

---

## Phase 8: Documentation Structure

Create these files in `framework/docs/`:

### README.md
- Installation (script tag or npm)
- Quick start example
- Links to other docs

### architecture.md
- Signal-based reactivity explanation
- How effects track dependencies
- Template parsing and marker system

### api-reference.md
- All exports with TypeScript-style signatures
- Examples for each function

### guide.md
- Building a counter
- Building a todo app
- Working with forms
- Adding routing

### best-practices.md
- When to use computed vs effect
- Component organization
- Performance tips

---

## Phase 9: Example Todo App

**Structure:**
```
example/
  index.html
  src/
    app.js
    components/
      TodoList.js
      TodoItem.js
      TodoForm.js
    store/
      todos.js
```

### example/index.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>Todo App - dot-js</title>
  <style>
    .completed { text-decoration: line-through; opacity: 0.6; }
    .todo-item { display: flex; gap: 10px; padding: 8px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/app.js"></script>
</body>
</html>
```

### example/src/store/todos.js

```js
import { signal, computed } from '../../../framework/src/index.js'

// Todo list state
export const [todos, setTodos] = signal([])

// Filters
export const [filter, setFilter] = signal('all') // all | active | completed

// Computed filtered list
export const filteredTodos = computed(() => {
  const list = todos()
  const f = filter()

  if (f === 'active') return list.filter(t => !t.completed)
  if (f === 'completed') return list.filter(t => t.completed)
  return list
})

// Actions
export function addTodo(text) {
  setTodos(list => [...list, {
    id: Date.now(),
    text,
    completed: false
  }])
}

export function toggleTodo(id) {
  setTodos(list => list.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  ))
}

export function deleteTodo(id) {
  setTodos(list => list.filter(t => t.id !== id))
}

// Persistence
export function loadTodos() {
  const saved = localStorage.getItem('todos')
  if (saved) setTodos(JSON.parse(saved))
}

export function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos()))
}
```

### example/src/components/TodoForm.js

```js
import { signal } from '../../../../framework/src/index.js'
import { html } from '../../../../framework/src/core/template.js'
import { addTodo, saveTodos } from '../store/todos.js'

export function TodoForm() {
  const [text, setText] = signal('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const value = text().trim()
    if (value) {
      addTodo(value)
      setText('')
      saveTodos()
    }
  }

  return html`
    <form onsubmit=${handleSubmit}>
      <input
        type="text"
        placeholder="What needs to be done?"
        value=${() => text()}
        oninput=${(e) => setText(e.target.value)}
      >
      <button type="submit">Add</button>
    </form>
  `
}
```

### example/src/components/TodoItem.js

```js
import { html } from '../../../../framework/src/core/template.js'
import { toggleTodo, deleteTodo, saveTodos } from '../store/todos.js'

export function TodoItem(todo) {
  const handleToggle = () => {
    toggleTodo(todo.id)
    saveTodos()
  }

  const handleDelete = () => {
    deleteTodo(todo.id)
    saveTodos()
  }

  return html`
    <div class="todo-item">
      <input
        type="checkbox"
        checked=${todo.completed}
        onclick=${handleToggle}
      >
      <span class=${todo.completed ? 'completed' : ''}>${todo.text}</span>
      <button onclick=${handleDelete}>Delete</button>
    </div>
  `
}
```

### example/src/components/TodoList.js

```js
import { html } from '../../../../framework/src/core/template.js'
import { filteredTodos, filter, setFilter } from '../store/todos.js'
import { TodoItem } from './TodoItem.js'

export function TodoList() {
  return html`
    <div>
      <div class="filters">
        <button onclick=${() => setFilter('all')}>All</button>
        <button onclick=${() => setFilter('active')}>Active</button>
        <button onclick=${() => setFilter('completed')}>Completed</button>
      </div>
      <div class="todo-list">
        ${() => filteredTodos().map(todo => TodoItem(todo))}
      </div>
    </div>
  `
}
```

### example/src/app.js

```js
import { html } from '../../../framework/src/core/template.js'
import { mount } from '../../../framework/src/core/component.js'
import { loadTodos } from './store/todos.js'
import { TodoForm } from './components/TodoForm.js'
import { TodoList } from './components/TodoList.js'

function App() {
  // Load saved todos on start
  loadTodos()

  return html`
    <div class="app">
      <h1>Todo App</h1>
      ${TodoForm()}
      ${TodoList()}
    </div>
  `
}

mount(App(), document.getElementById('root'))
```

---

## Implementation Priority

1. **Style binding** (30 min) - Small change to template.js
2. **Component mount** (15 min) - Simple utility
3. **HTTP/useAsync** (30 min) - Useful immediately
4. **Router** (1 hr) - Important for apps
5. **Keyed lists** (1 hr) - Performance critical
6. **Example app** (2 hr) - Demonstrates everything
7. **Documentation** (3 hr) - Essential for adoption
8. **Virtual scrolling** (2 hr) - Nice to have

---

## Testing Checklist

After implementing each feature, verify:

- [ ] Style binding: Object converts to CSS string
- [ ] Style binding: camelCase converts to kebab-case
- [ ] Style binding: Reactive styles update
- [ ] Mount: Clears container before mounting
- [ ] Router: Hash changes trigger updates
- [ ] Router: Route params extracted correctly
- [ ] Router: 404 fallback works
- [ ] HTTP: GET/POST/PUT/DELETE work
- [ ] useAsync: Loading state transitions correctly
- [ ] useAsync: Errors are caught
- [ ] Keyed list: Items with same key are reused
- [ ] Keyed list: Removed items are cleaned up
