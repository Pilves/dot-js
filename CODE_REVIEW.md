# Dot-JS Framework Code Review

This document provides a detailed analysis of the dot-js framework covering event handling, state management, routing, and component architecture with specific code references.

---

## Table of Contents

1. [Event Handling Mechanism](#1-event-handling-mechanism)
   - [Registering Listeners](#11-registering-listeners)
   - [Delegating to Parent Elements](#12-delegating-to-parent-elements)
   - [Preventing Default Actions](#13-preventing-default-actions)
   - [Improvements for Clarity and Usability](#14-improvements-for-clarity-and-usability)
2. [State Management Solution](#2-state-management-solution)
   - [Storing Application State](#21-storing-application-state)
   - [Updating Application State](#22-updating-application-state)
   - [Sharing State Across Components and Pages](#23-sharing-state-across-components-and-pages)
   - [Edge Cases That Might Disrupt Flow](#24-edge-cases-that-might-disrupt-flow)
3. [Routing Implementation](#3-routing-implementation)
   - [Reflecting Application State in URL](#31-reflecting-application-state-in-url)
   - [Enhancing User Experience](#32-enhancing-user-experience)
   - [Additional Features to Improve Functionality](#33-additional-features-to-improve-functionality)
4. [Component Architecture](#4-component-architecture)
   - [Document Structure](#41-document-structure)
   - [Reusability](#42-reusability)
   - [Ease of Nesting](#43-ease-of-nesting)
   - [Simplifying Component Creation](#44-simplifying-component-creation)

---

## 1. Event Handling Mechanism

### 1.1 Registering Listeners

#### How It Works

Event listeners are registered through the template system via `on*` attributes.

**Reference:** `framework/src/core/template.js:309-322`
```javascript
// Check if it's an event handler
if (attr.name.startsWith("on")) {
  // Type check: event handlers must be functions
  if (typeof value !== 'function') {
    console.warn(`Event handler for ${attr.name} must be a function, got ${typeof value}`)
    element.removeAttribute(attr.name)
    continue
  }
  // Get event name
  const eventName = attr.name.slice(2);
  // Add the real event listener
  element.addEventListener(eventName, value)
  // Remove placeholder
  element.removeAttribute(attr.name)
}
```

**Reference:** `framework/src/core/template.js:154-161` (also in `applyAttribute`)
```javascript
// Event handler
if (name.startsWith('on')) {
  if (typeof value === 'function') {
    const eventName = name.slice(2)
    element.addEventListener(eventName, value)
  }
  return
}
```

#### Usage Pattern
```javascript
html`<button onclick=${() => console.log('clicked')}>Click me</button>`
html`<input oninput=${(e) => setValue(e.target.value)} />`
```

#### Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Type validation | ✅ Good | Warns if handler is not a function |
| Any event type | ✅ Good | Works with any DOM event (onclick, onmouseover, etc.) |
| Listener removal | ⚠️ Missing | No mechanism to remove listeners on component unmount |

---

### 1.2 Delegating to Parent Elements

#### Implementation

**Reference:** `framework/src/core/events.js:18-30`
```javascript
/**
 * Event delegation for a single selector
 * @param {string} selector - CSS selector to match
 * @param {(e: Event, target: Element) => void} handler - Handler receives event and matched element
 * @returns {(e: Event) => void} - Event handler function
 */
export function delegate(selector, handler) {
  return function(e) {
    const target = e.target.closest(selector)
    if (target && e.currentTarget.contains(target)) {
      handler(e, target)
    }
  }
}
```

**Reference:** `framework/src/core/events.js:32-48`
```javascript
/**
 * Event delegation for multiple selectors
 * @param {Object.<string, (e: Event, target: Element) => void>} handlers - Map of selector to handler
 * @returns {(e: Event) => void} - Event handler function
 */
export function delegateAll(handlers) {
  return function(e) {
    for (const [selector, handler] of Object.entries(handlers)) {
      const target = e.target.closest(selector)
      if (target && e.currentTarget.contains(target)) {
        handler(e, target)
        return  // First match wins
      }
    }
  }
}
```

#### Usage Patterns

**Single delegation:**
```javascript
html`<ul onclick=${delegate('li', (e, target) => {
  console.log('Clicked item:', target.textContent)
})}>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>`
```

**Multiple handlers:**
```javascript
html`<div onclick=${delegateAll({
  '.edit-btn': (e, target) => editItem(target.dataset.id),
  '.delete-btn': (e, target) => deleteItem(target.dataset.id)
})}>
  ${items.map(item => html`
    <div>
      ${item.name}
      <button class="edit-btn" data-id="${item.id}">Edit</button>
      <button class="delete-btn" data-id="${item.id}">Delete</button>
    </div>
  `)}
</div>`
```

#### Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Selector matching | ✅ Good | Uses `closest()` for proper bubbling |
| Boundary checking | ✅ Good | `e.currentTarget.contains(target)` prevents external matches |
| Multiple handlers | ✅ Good | `delegateAll` efficiently handles multiple selectors |
| Handler ordering | ⚠️ Unclear | Relies on object property order in `delegateAll` |

---

### 1.3 Preventing Default Actions

#### Current Implementation

The framework provides `handleForm` which automatically prevents default on form submission.

**Reference:** `framework/src/core/form.js:75-83`
```javascript
/**
 * Form submission handler that prevents default and extracts FormData
 * @param {(data: FormData) => void} callback - Function to call with form data
 * @returns {{ onsubmit: (e: Event) => void }}
 */
export function handleForm(callback) {
  return {
    onsubmit: (e) => {
      e.preventDefault()
      const data = new FormData(e.target)
      callback(data)
    }
  }
}
```

#### What's Missing

**No built-in `preventDefault` in delegation utilities.** Developers must manually call it:

```javascript
// Current pattern - manual preventDefault
html`<a onclick=${delegate('a', (e, target) => {
  e.preventDefault()  // Must remember to add this
  navigate(target.href)
})}>...</a>`
```

#### Suggested Improvement

The `delegate` function could accept options:

```javascript
// Proposed enhancement
export function delegate(selector, handler, options = {}) {
  return function(e) {
    const target = e.target.closest(selector)
    if (target && e.currentTarget.contains(target)) {
      if (options.preventDefault) e.preventDefault()
      if (options.stopPropagation) e.stopPropagation()
      handler(e, target)
    }
  }
}

// Usage would be:
delegate('a', handler, { preventDefault: true })
```

---

### 1.4 Improvements for Clarity and Usability

#### Issue 1: No Event Listener Cleanup

**Problem:** Event listeners attached via `template.js` are never removed, potentially causing memory leaks.

**Reference:** `framework/src/core/template.js:320`
```javascript
element.addEventListener(eventName, value)
// No corresponding removeEventListener mechanism
```

**Recommendation:** Track listeners and provide cleanup:
```javascript
// Store listeners on element for later removal
element._listeners = element._listeners || []
element._listeners.push({ eventName, handler: value })
element.addEventListener(eventName, value)
```

#### Issue 2: No Keyboard Event Helpers

**Problem:** Common patterns like "submit on Enter" require boilerplate.

**Current pattern:**
```javascript
html`<input onkeydown=${(e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    submit()
  }
}} />`
```

**Recommendation:** Add `onEnter`, `onEscape` helpers.

#### Issue 3: Event Handler Type Safety

**Reference:** `framework/src/core/template.js:311-315`
```javascript
if (typeof value !== 'function') {
  console.warn(`Event handler for ${attr.name} must be a function, got ${typeof value}`)
  element.removeAttribute(attr.name)
  continue
}
```

**Assessment:** ✅ Good - Provides runtime warning for incorrect types.

#### Issue 4: Delegation Order Dependency

**Reference:** `framework/src/core/events.js:36`
```javascript
for (const [selector, handler] of Object.entries(handlers)) {
```

**Problem:** `Object.entries()` iteration order depends on property insertion order, which may not be obvious to developers.

**Recommendation:** Accept an array of tuples or Map for explicit ordering:
```javascript
delegateAll([
  ['.edit-btn', editHandler],    // First priority
  ['.delete-btn', deleteHandler] // Second priority
])
```

---

## 2. State Management Solution

### 2.1 Storing Application State

#### Core Signal Implementation

**Reference:** `framework/src/core/signal.js:12-50`
```javascript
/**
 * Creates a reactive signal with getter and setter
 * @param {T} initialValue - Initial value for the signal
 * @returns {[() => T, (v: T | ((prev: T) => T)) => void]} - [getter, setter] tuple
 */
export function signal(initialValue) {
  let value = initialValue
  const subscribers = new Set()

  function read() {
    // Track which effect is reading this signal
    const running = effectStack[effectStack.length - 1]
    if (running) {
      subscribers.add(running)
      running.dependencies.add(subscribers)
    }
    return value
  }

  function write(newValue) {
    // Support functional updates: setCount(c => c + 1)
    const nextValue =
      typeof newValue === "function" ? newValue(value) : newValue

    if (nextValue !== value) {
      value = nextValue
      // Notify all subscribers
      Array.from(subscribers).forEach((fn) => {
        if (!fn.running) {
          fn()
        }
      })
    }
  }

  return [read, write]
}
```

#### Persisted State (localStorage)

**Reference:** `framework/src/core/signal.js:122-148`
```javascript
/**
 * Creates a signal that persists to localStorage
 * @param {string} key - localStorage key
 * @param {T} defaultValue - Default value if not in storage
 * @returns {[() => T, (v: T | ((prev: T) => T)) => void]}
 */
export function createPersistedSignal(key, defaultValue) {
  // Try to load from localStorage
  let initial = defaultValue
  try {
    const stored = localStorage.getItem(key)
    if (stored !== null) {
      initial = JSON.parse(stored)
    }
  } catch (e) {
    // localStorage might be unavailable or JSON invalid
  }

  const [get, set] = signal(initial)

  // Wrap setter to also persist
  function persistedSet(newValue) {
    set(newValue)
    try {
      localStorage.setItem(key, JSON.stringify(get()))
    } catch (e) {
      // Ignore storage errors
    }
  }

  return [get, persistedSet]
}
```

#### Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Simple API | ✅ Good | `[getter, setter]` tuple is intuitive |
| Functional updates | ✅ Good | `set(prev => prev + 1)` supported |
| localStorage | ✅ Good | Graceful fallback on errors |
| Cross-tab sync | ⚠️ Missing | No `storage` event listener |

---

### 2.2 Updating Application State

#### Setter Mechanism

**Reference:** `framework/src/core/signal.js:28-45`
```javascript
function write(newValue) {
  // Support functional updates: setCount(c => c + 1)
  const nextValue =
    typeof newValue === "function" ? newValue(value) : newValue

  if (nextValue !== value) {
    value = nextValue
    // Notify all subscribers
    Array.from(subscribers).forEach((fn) => {
      if (!fn.running) {
        fn()
      }
    })
  }
}
```

#### Key Behaviors

1. **Functional updates** - Setter accepts `(prev) => next` functions
2. **Reference equality check** - Only triggers updates if `nextValue !== value`
3. **Infinite loop protection** - `fn.running` flag prevents recursive re-runs

**Reference:** `framework/src/core/signal.js:40-44`
```javascript
Array.from(subscribers).forEach((fn) => {
  if (!fn.running) {  // Prevents infinite loops
    fn()
  }
})
```

#### Computed Values (Derived State)

**Reference:** `framework/src/core/signal.js:107-120`
```javascript
/**
 * Creates a computed signal that derives from other signals
 * @param {() => T} fn - Function that computes the value
 * @returns {() => T} - Getter function (with dispose method attached)
 */
export function computed(fn) {
  const [get, set] = signal(fn())

  const dispose = effect(() => {
    set(fn())
  })

  // Attach dispose to getter for cleanup
  get.dispose = dispose

  return get
}
```

---

### 2.3 Sharing State Across Components and Pages

#### Pattern: Exported Signals

State is shared by exporting signals from a central store module.

**Reference:** `example/todo/store.js:1-30` (typical pattern)
```javascript
import { signal, createPersistedSignal } from '../../framework/src/index.js'

// Shared across all components
export const [todos, setTodos] = createPersistedSignal('todos', [])
export const [filter, setFilter] = signal('all')
export const [currentView, setCurrentView] = signal('list')
```

**Usage in components:**
```javascript
import { todos, setTodos, filter } from './store.js'

function TodoList() {
  return html`
    <ul>
      ${list(
        () => todos().filter(t => filter() === 'all' || ...),
        t => t.id,
        t => TodoItem(t)
      )}
    </ul>
  `
}
```

#### How Cross-Component Reactivity Works

**Reference:** `framework/src/core/signal.js:17-24`
```javascript
function read() {
  // Track which effect is reading this signal
  const running = effectStack[effectStack.length - 1]
  if (running) {
    subscribers.add(running)
    running.dependencies.add(subscribers)
  }
  return value
}
```

When a signal is read inside an `effect` (including template bindings):
1. The effect is added to the signal's `subscribers` Set
2. The signal's subscribers Set is added to the effect's `dependencies`
3. When the signal updates, all subscribed effects re-run

#### Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Cross-component sharing | ✅ Good | Signals can be imported anywhere |
| Automatic updates | ✅ Good | All consumers re-render on change |
| No prop drilling | ✅ Good | Direct import pattern |
| No context API | ⚠️ Limitation | Deep component trees still need imports |

---

### 2.4 Edge Cases That Might Disrupt Flow

#### Edge Case 1: Object/Array Mutation Without New Reference

**Reference:** `framework/src/core/signal.js:34`
```javascript
if (nextValue !== value) {  // Reference equality check
```

**Problem:** Mutating objects/arrays in place won't trigger updates:
```javascript
const [list, setList] = signal([1, 2, 3])

// ❌ Won't trigger updates - same reference
list().push(4)
setList(list())

// ✅ Correct pattern - new reference
setList([...list(), 4])
setList(prev => [...prev, 4])
```

**Recommendation:** Document this behavior clearly or add optional deep comparison mode.

#### Edge Case 2: Effect Cleanup Not Called on Component Unmount

**Reference:** `framework/src/core/signal.js:95-105`
```javascript
function execute() {
  // Cleanup old dependencies first
  cleanup(execute)

  effectStack.push(execute)
  execute.running = true
  try {
    fn()
  } finally {
    execute.running = false
    effectStack.pop()
  }
}
```

**Problem:** Effects return a dispose function, but it's not automatically called when components are removed:
```javascript
function Timer() {
  const [count, setCount] = signal(0)

  // This effect keeps running even after Timer is removed from DOM!
  effect(() => {
    const id = setInterval(() => setCount(c => c + 1), 1000)
    // No way to call cleanup
  })

  return html`<div>${count}</div>`
}
```

**Recommendation:** Implement component lifecycle hooks or automatic effect tracking per component.

#### Edge Case 3: No Batched Updates

**Problem:** Multiple signal updates trigger multiple effect runs:
```javascript
const [firstName, setFirstName] = signal('John')
const [lastName, setLastName] = signal('Doe')

// This triggers TWO effect runs
setFirstName('Jane')
setLastName('Smith')
```

**Recommendation:** Add a `batch()` utility:
```javascript
export function batch(fn) {
  // Queue updates, run effects once at end
}

batch(() => {
  setFirstName('Jane')
  setLastName('Smith')
})  // Single effect run
```

#### Edge Case 4: Stale Closure in Effects

**Reference:** `framework/src/core/signal.js:78-79`
```javascript
const dispose = effect(() => {
  set(fn())
})
```

**Problem:** If `fn` closes over local variables, those may become stale:
```javascript
function Counter(initialCount) {
  const [count, setCount] = signal(initialCount)

  // initialCount is captured at creation time
  effect(() => {
    console.log(`Count changed from ${initialCount} to ${count()}`)
  })
}
```

**Status:** This is expected JavaScript behavior, not a framework bug, but worth documenting.

#### Edge Case 5: localStorage Quota Exceeded

**Reference:** `framework/src/core/signal.js:142-145`
```javascript
try {
  localStorage.setItem(key, JSON.stringify(get()))
} catch (e) {
  // Ignore storage errors
}
```

**Assessment:** ✅ Handled - Errors are silently caught. However, data loss occurs without user notification.

**Recommendation:** Optional error callback:
```javascript
createPersistedSignal(key, defaultValue, {
  onError: (e) => console.error('Storage failed:', e)
})
```

#### Edge Case 6: Circular Dependencies in Computed

**Problem:** Computed values that depend on each other can cause infinite loops:
```javascript
const a = computed(() => b() + 1)
const b = computed(() => a() + 1)  // Circular!
```

**Reference:** `framework/src/core/signal.js:40-44`
```javascript
if (!fn.running) {  // Partial protection
  fn()
}
```

**Assessment:** The `running` flag provides some protection, but circular computeds may still cause issues.

---

## 3. Routing Implementation

### 3.1 Reflecting Application State in URL

#### Hash-Based Routing

**Reference:** `framework/src/core/router.js:25-51`
```javascript
export function createRouter(routes) {
  // Initialize with current hash or default to '/'
  const [path, setPath] = signal(normalizePath(window.location.hash.slice(1) || '/'))

  const handleHashChange = () => {
    setPath(normalizePath(window.location.hash.slice(1) || '/'))
  }

  // Listen for hash changes
  window.addEventListener('hashchange', handleHashChange)
  // ...
}
```

#### Path Signal Reflects URL State

**Reference:** `framework/src/core/router.js:30-32`
```javascript
const handleHashChange = () => {
  setPath(normalizePath(window.location.hash.slice(1) || '/'))
}
```

When URL changes → `hashchange` event → path signal updates → effects re-run → UI updates

#### Navigation Updates URL

**Reference:** `framework/src/core/router.js:93-109`
```javascript
function navigate(to, query = {}) {
  let url = to

  // Append query parameters if provided
  const queryString = Object.entries(query)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')

  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString
  }

  window.location.hash = url
}
```

#### Route Parameter Extraction

**Reference:** `framework/src/core/router.js:57-87`
```javascript
function matchRoute(pattern, path) {
  // Normalize the path
  const normalizedPath = normalizePath(path)

  const patternParts = pattern.split('/')
  const pathParts = normalizedPath.split('/')

  // Must have same number of segments (except wildcard)
  if (patternParts.length !== pathParts.length) {
    return null
  }

  const params = {}

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]

    if (patternPart.startsWith(':')) {
      // Dynamic segment - extract parameter
      const key = patternPart.slice(1)
      params[key] = decodeURIComponent(pathPart)
    } else if (patternPart !== pathPart) {
      // Static segment doesn't match
      return null
    }
  }

  return params
}
```

#### Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| URL reflects state | ✅ Good | Hash changes update path signal |
| Parameters in URL | ✅ Good | `:param` syntax with decoding |
| Query parameters | ✅ Good | `navigate(path, { key: value })` |
| Bookmarkable URLs | ✅ Good | Hash-based URLs are shareable |

---

### 3.2 Enhancing User Experience

#### Current UX Features

1. **Instant navigation** - No page reload
2. **Browser back/forward** - Hash changes are tracked in history
3. **Deep linking** - Users can bookmark and share URLs
4. **Wildcard routes** - Catch-all for 404 pages

**Reference:** `framework/src/core/router.js:70-72`
```javascript
// Wildcard catch-all route
if (pattern === '*') {
  return {}
}
```

#### UX Limitations

**Issue 1: Hash URLs are less clean**
```
Current:  https://example.com/#/users/123
Desired:  https://example.com/users/123
```

**Issue 2: No loading states**
The router doesn't provide hooks for showing loading indicators during navigation.

**Issue 3: No scroll restoration**
When using back/forward, scroll position isn't restored.

**Reference:** `framework/src/core/router.js:30-32`
```javascript
const handleHashChange = () => {
  setPath(normalizePath(window.location.hash.slice(1) || '/'))
  // No scroll position handling
}
```

---

### 3.3 Additional Features to Improve Functionality

#### Missing Feature 1: History API Mode

**Current implementation only supports hash mode:**

**Reference:** `framework/src/core/router.js:27`
```javascript
const [path, setPath] = signal(normalizePath(window.location.hash.slice(1) || '/'))
```

**Recommendation:** Add History API support:
```javascript
createRouter(routes, { mode: 'history' })  // Uses pushState
createRouter(routes, { mode: 'hash' })     // Current behavior
```

#### Missing Feature 2: Route Guards

**Problem:** No way to protect routes (authentication, authorization).

**Recommendation:**
```javascript
const router = createRouter({
  '/admin': {
    component: AdminPage,
    guard: () => isAuthenticated() ? true : '/login'
  }
})
```

#### Missing Feature 3: Nested Routes

**Problem:** Complex layouts require manual handling.

**Current pattern (verbose):**
```javascript
const router = createRouter({
  '/users': UsersPage,
  '/users/:id': UserDetailPage,
  '/users/:id/edit': UserEditPage
})
```

**Recommended pattern:**
```javascript
const router = createRouter({
  '/users': {
    component: UsersLayout,
    children: {
      '/': UsersList,
      '/:id': UserDetail,
      '/:id/edit': UserEdit
    }
  }
})
```

#### Missing Feature 4: Navigation Helpers

**Reference:** `framework/src/core/router.js:93-109` (only `navigate` exists)

**Missing:**
```javascript
router.back()           // window.history.back()
router.forward()        // window.history.forward()
router.replace(path)    // Replace without adding history entry
router.getQuery()       // Parse current query parameters
```

#### Missing Feature 5: Route Metadata

**Problem:** Can't attach data to routes (titles, permissions, breadcrumbs).

**Recommendation:**
```javascript
const router = createRouter({
  '/dashboard': {
    component: Dashboard,
    meta: { title: 'Dashboard', requiresAuth: true }
  }
})

// Access via
router.current().meta.title
```

#### Missing Feature 6: Before/After Navigation Hooks

**Recommendation:**
```javascript
router.beforeEach((to, from) => {
  // Return false to cancel navigation
  // Return string to redirect
})

router.afterEach((to, from) => {
  // Analytics, scroll to top, etc.
})
```

#### Cleanup Mechanism (Existing)

**Reference:** `framework/src/core/router.js:118-122`
```javascript
function destroy() {
  window.removeEventListener('hashchange', handleHashChange)
}
```

**Assessment:** ✅ Good - Proper cleanup is provided.

---

## 4. Component Architecture

### 4.1 Document Structure

#### Minimal Component Definition

**Reference:** `framework/src/core/component.js:1-27`
```javascript
/**
 * Mounts an element into a container
 * @param {Node} element - The element to mount
 * @param {Element} container - The container to mount into
 */
export function mount(element, container) {
  container.replaceChildren()
  container.appendChild(element)
}

/**
 * Unmounts content from a container
 * @param {Element} container - The container to clear
 */
export function unmount(container) {
  container.replaceChildren()
}
```

#### Component Pattern

Components are **plain JavaScript functions** returning DOM nodes:

**Reference:** `example/todo/app.js:54-66`
```javascript
function ListView() {
  return html`
    <div class="list-view">
      ${AddTodoForm()}
      ${TodoList()}
      ${TodoFilter(router)}
    </div>
  `
}
```

#### Template System Creates DOM

**Reference:** `framework/src/core/template.js:31-69`
```javascript
export function html(strings, ...values) {
  // Generate unique marker ID to prevent spoofing
  const markerId = Math.random().toString(36).slice(2, 10)

  // build the string
  let htmlString = ""

  strings.forEach((str, i) => {
    htmlString += str
    if (i < values.length) {
      const isInAttribute = isInsideAttribute(htmlString)
      if (isInAttribute) {
        htmlString += `__dot_${markerId}_attr_${i}__`
      } else {
        htmlString += `<!--dot-${markerId}-${i}-->`
      }
    }
  })

  // Create template element to parse HTML
  const template = document.createElement("template")
  template.innerHTML = htmlString.trim()

  const content = template.content.cloneNode(true)
  processMarkersAndAttributes(content, values, markerId)

  if (content.childNodes.length === 1) {
    return content.firstChild
  }
  return content
}
```

#### Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| No class boilerplate | ✅ Good | Just functions |
| No registration | ✅ Good | No `defineComponent`, `registerElement` |
| Returns real DOM | ✅ Good | Not virtual DOM, easier debugging |
| TypeScript friendly | ✅ Good | Function signatures are clear |

---

### 4.2 Reusability

#### Props as Function Arguments

Components receive data as regular function parameters:

```javascript
function TodoItem(todo, onToggle, onDelete) {
  return html`
    <li class=${() => todo.completed() ? 'completed' : ''}>
      <input type="checkbox"
             checked=${todo.completed}
             onchange=${() => onToggle(todo.id)} />
      <span>${todo.text}</span>
      <button onclick=${() => onDelete(todo.id)}>Delete</button>
    </li>
  `
}
```

#### Two-Way Binding Helpers

**Reference:** `framework/src/core/form.js:6-11`
```javascript
export function bind([get, set]) {
  return {
    value: () => get(),
    oninput: (e) => set(e.target.value)
  }
}
```

**Usage (highly reusable pattern):**
```javascript
const [name, setName] = signal('')
html`<input ${bind([name, setName])} placeholder="Enter name" />`
```

#### Object Spread in Templates

**Reference:** `framework/src/core/template.js:292-303`
```javascript
// Process object spreads first (e.g., ${bind([signal, setSignal])})
for (const { attr, index } of spreadAttrsToProcess) {
  const value = values[index]
  element.removeAttribute(attr.name)

  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Node)) {
    // Spread object properties as attributes
    for (const [propName, propValue] of Object.entries(value)) {
      applyAttribute(element, propName, propValue)
    }
  }
}
```

This enables patterns like `${bind(signal)}` which spreads `{ value, oninput }` onto the element.

#### Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Props as args | ✅ Good | Natural JavaScript |
| Object spread | ✅ Good | Enables binding helpers |
| No special syntax | ✅ Good | Just function calls |

---

### 4.3 Ease of Nesting

#### Natural Composition

Children are embedded via template interpolation:

**Reference:** `example/todo/app.js:54-66`
```javascript
function ListView() {
  return html`
    <div class="list-view">
      ${AddTodoForm()}      <!-- Child component -->
      ${TodoList()}         <!-- Child component -->
      ${TodoFilter(router)} <!-- Child with props -->
    </div>
  `
}
```

#### List Rendering with Keyed Children

**Reference:** `framework/src/core/list.js:23-80`
```javascript
export function list(signalOrArray, keyFn, renderFn) {
  const container = document.createDocumentFragment()

  // Boundary markers to track list position
  const startMarker = document.createComment('list-start')
  const endMarker = document.createComment('list-end')
  container.appendChild(startMarker)
  container.appendChild(endMarker)

  const nodeMap = new Map()  // key -> DOM node

  function update() {
    const items = typeof signalOrArray === 'function' ? signalOrArray() : signalOrArray
    const newKeys = items.map((item, i) => keyFn(item, i))
    const oldKeys = Array.from(nodeMap.keys())

    // Remove nodes for keys that no longer exist
    for (const key of oldKeys) {
      if (!newKeys.includes(key)) {
        const node = nodeMap.get(key)
        node.remove()
        nodeMap.delete(key)
      }
    }

    // Add/reorder nodes
    let currentNode = startMarker.nextSibling
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const key = newKeys[i]

      if (!nodeMap.has(key)) {
        // Create new node
        const newNode = renderFn(item, i)
        nodeMap.set(key, newNode)
      }

      const node = nodeMap.get(key)
      if (node !== currentNode) {
        endMarker.parentNode.insertBefore(node, currentNode)
      } else {
        currentNode = currentNode.nextSibling
      }
    }
  }

  // ... effect setup
}
```

**Usage:**
```javascript
function TodoList() {
  return html`
    <ul>
      ${list(
        filteredTodos,        // Signal or array
        todo => todo.id,      // Key function
        todo => TodoItem(todo) // Render function
      )}
    </ul>
  `
}
```

#### Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Inline children | ✅ Good | `${Child()}` syntax |
| List rendering | ✅ Good | Keyed diffing for efficiency |
| Fragments | ✅ Good | Multiple root elements supported |
| Deep nesting | ✅ Good | No depth limitations |

---

### 4.4 Simplifying Component Creation

#### Current Simplicity (Strengths)

1. **No imports needed for basic components:**
   ```javascript
   function Button(text, onClick) {
     return html`<button onclick=${onClick}>${text}</button>`
   }
   ```

2. **Local state is just signals:**
   ```javascript
   function Counter() {
     const [count, setCount] = signal(0)
     return html`
       <button onclick=${() => setCount(c => c + 1)}>
         Count: ${count}
       </button>
     `
   }
   ```

#### Missing Features That Would Simplify Development

##### Issue 1: No Lifecycle Hooks

**Problem:** Can't run code on mount/unmount.

**Reference:** `framework/src/core/component.js:7-11`
```javascript
export function mount(element, container) {
  container.replaceChildren()
  container.appendChild(element)
  // No lifecycle callback
}
```

**Recommendation:**
```javascript
function Timer() {
  onMount(() => {
    console.log('Timer mounted')
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)  // Cleanup on unmount
  })

  return html`<div>...</div>`
}
```

##### Issue 2: No Ref Mechanism

**Problem:** Accessing underlying DOM requires workarounds.

**Current workaround:**
```javascript
function FocusInput() {
  let inputElement

  setTimeout(() => {
    inputElement = document.querySelector('#my-input')
    inputElement.focus()
  }, 0)

  return html`<input id="my-input" />`
}
```

**Recommendation:**
```javascript
function FocusInput() {
  const [inputRef, setInputRef] = ref()

  onMount(() => inputRef().focus())

  return html`<input ref=${setInputRef} />`
}
```

##### Issue 3: No Slots/Children Pattern

**Problem:** Wrapper components are awkward.

**Current pattern:**
```javascript
function Card(title, content) {
  return html`
    <div class="card">
      <h2>${title}</h2>
      <div class="card-body">${content}</div>
    </div>
  `
}

// Usage - content must be passed as argument
Card('My Title', html`<p>Card content here</p>`)
```

**Recommended pattern:**
```javascript
function Card({ title, children }) {
  return html`
    <div class="card">
      <h2>${title}</h2>
      <div class="card-body">${children}</div>
    </div>
  `
}

// More natural usage
html`<${Card} title="My Title">
  <p>Card content here</p>
</${Card}>`
```

##### Issue 4: No Context API

**Problem:** Deep prop drilling required for shared state.

**Current pattern:**
```javascript
// Must pass theme through every level
function App() {
  const [theme, setTheme] = signal('light')
  return html`${Layout(theme, setTheme)}`
}

function Layout(theme, setTheme) {
  return html`${Sidebar(theme, setTheme)}`
}

function Sidebar(theme, setTheme) {
  return html`${ThemeToggle(theme, setTheme)}`
}
```

**Recommended pattern:**
```javascript
const ThemeContext = createContext('light')

function App() {
  const [theme, setTheme] = signal('light')
  return html`
    <${ThemeContext.Provider} value=${[theme, setTheme]}>
      ${Layout()}
    <//>
  `
}

function ThemeToggle() {
  const [theme, setTheme] = useContext(ThemeContext)
  return html`<button onclick=${() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
    Toggle (${theme})
  </button>`
}
```

##### Issue 5: No Error Boundaries

**Problem:** Component errors crash the entire app.

**Recommendation:**
```javascript
function ErrorBoundary(child, fallback) {
  try {
    return child()
  } catch (error) {
    return fallback(error)
  }
}

// Usage
html`${ErrorBoundary(
  () => RiskyComponent(),
  (err) => html`<div class="error">Something went wrong: ${err.message}</div>`
)}`
```

---

## Summary

### Strengths

| Area | What Works Well |
|------|-----------------|
| **Events** | Clean delegation API, type validation, security |
| **State** | Intuitive signal API, automatic tracking, functional updates |
| **Routing** | Simple hash routing, parameter extraction, query support |
| **Components** | Zero boilerplate, natural composition, real DOM |

### Areas for Improvement

| Area | Priority | Issue |
|------|----------|-------|
| **State** | High | No effect cleanup on component unmount |
| **State** | Medium | No batched updates |
| **State** | Low | Object mutation doesn't trigger updates (document this) |
| **Events** | Medium | No built-in `preventDefault` option |
| **Events** | Low | No listener cleanup mechanism |
| **Routing** | Medium | Hash-only, no History API |
| **Routing** | Medium | No route guards |
| **Routing** | Low | No navigation helpers (back, forward, replace) |
| **Components** | High | No lifecycle hooks |
| **Components** | Medium | No context API for avoiding prop drilling |
| **Components** | Low | No ref mechanism for DOM access |

### Code References Quick Index

| Feature | Primary File | Key Lines |
|---------|--------------|-----------|
| Signal creation | `signal.js` | 12-50 |
| Effect system | `signal.js` | 56-105 |
| Computed values | `signal.js` | 107-120 |
| Persisted signals | `signal.js` | 122-148 |
| Event delegation | `events.js` | 18-48 |
| Template rendering | `template.js` | 31-69 |
| Attribute binding | `template.js` | 153-241 |
| Router creation | `router.js` | 25-51 |
| Route matching | `router.js` | 57-87 |
| Navigation | `router.js` | 93-109 |
| Component mount | `component.js` | 7-11 |
| List rendering | `list.js` | 23-80 |
| Form binding | `form.js` | 6-68 |
