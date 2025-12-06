# dot-js Framework Implementation Roadmap

## Current Status

### Completed
- [x] `signal(value)` - reactive state with getter/setter
- [x] `effect(fn)` - runs when dependencies change
- [x] `computed(fn)` - derived values that auto-update
- [x] `html` tagged template literal
- [x] Static values, nested elements, interpolation
- [x] Reactive text bindings with `${() => value()}`

### Remaining
- [ ] Event handling
- [ ] Attribute binding
- [ ] Style binding
- [ ] Component architecture
- [ ] Routing
- [ ] Form handling
- [ ] HTTP requests
- [ ] Performance optimizations
- [ ] Documentation
- [ ] Example application

---

## Phase 1: Core Template Enhancements

Build on existing `template.js` to handle events and attributes.

### 1.1 Event Handling
- Detect `onclick`, `onsubmit`, `oninput`, etc. in template attributes
- Bind handlers directly during template parsing
- Support event delegation for dynamic lists

```js
// Target API
const btn = html`<button onclick=${() => alert('clicked!')}>Click me</button>`
```

### 1.2 Attribute Binding
- Dynamic attributes: `class=${activeClass}`, `disabled=${isDisabled}`
- Reactive attributes with functions: `value=${() => name()}`
- Boolean attribute handling (add/remove based on truthy value)

```js
// Target API
html`<input type="text" value=${name} disabled=${isDisabled}>`
html`<div class=${() => isActive() ? 'active' : ''}></div>`
```

### 1.3 Style Binding
- Object syntax: `style=${{ color: 'red', fontSize: '14px' }}`
- Reactive styles: `style=${() => ({ opacity: visible() ? 1 : 0 })}`

```js
// Target API
html`<div style=${{ color: textColor, padding: '10px' }}>Styled</div>`
```

---

## Phase 2: Component System

Enable reusable, composable UI pieces.

### 2.1 Function Components
```js
// Target API
function Button({ label, onClick }) {
  return html`<button onclick=${onClick}>${label}</button>`
}

function Counter({ initial = 0 }) {
  const [count, setCount] = signal(initial)
  return html`
    <div>
      <span>${() => count()}</span>
      <button onclick=${() => setCount(c => c + 1)}>+</button>
    </div>
  `
}
```

### 2.2 Component Mounting
```js
// Target API
mount(App(), document.getElementById('root'))
```

### 2.3 Children/Slots
- Pass child elements into components
- `${children}` placeholder pattern

```js
// Target API
function Card({ title, children }) {
  return html`
    <div class="card">
      <h2>${title}</h2>
      <div class="card-body">${children}</div>
    </div>
  `
}
```

---

## Phase 3: Routing

URL-based navigation without page reloads.

### 3.1 Hash Router (simpler)
- Listen to `hashchange` event
- Map routes to components

```js
// Target API
const routes = {
  '/': HomePage,
  '/about': AboutPage,
  '/contact': ContactPage
}

const router = createRouter(routes)
```

### 3.2 History Router (advanced)
- Use `history.pushState` / `popstate`
- Cleaner URLs: `/about` instead of `#/about`

### 3.3 Router Features
- Route params: `/user/:id`
- Programmatic navigation: `navigate('/about')`
- Active link detection

```js
// Target API
const route = createRouter({
  '/': HomePage,
  '/user/:id': UserPage
})

// In component
navigate('/user/123')

// Access params
const userId = route.params.id
```

---

## Phase 4: Forms & Input

Handle user input elegantly.

### 4.1 Two-way Binding
```js
// Target API
const [text, setText] = signal('')

html`<input
  value=${() => text()}
  oninput=${e => setText(e.target.value)}
>`
```

### 4.2 Form Submission
- Prevent default, collect form data
- Validation helpers

```js
// Target API
function handleSubmit(e) {
  e.preventDefault()
  const data = new FormData(e.target)
  console.log(data.get('username'))
}

html`<form onsubmit=${handleSubmit}>
  <input name="username" type="text">
  <button type="submit">Submit</button>
</form>`
```

---

## Phase 5: HTTP Requests

Fetch remote data and integrate with reactivity.

### 5.1 Fetch Wrapper
```js
// Target API
const response = await http.get('/api/users')
const created = await http.post('/api/users', { name: 'John' })
```

### 5.2 Async State Helper
```js
// Target API
function UserList() {
  const { data, loading, error } = useAsync(() =>
    fetch('/api/users').then(r => r.json())
  )

  if (loading()) return html`<p>Loading...</p>`
  if (error()) return html`<p>Error: ${error().message}</p>`

  return html`<ul>${() => data().map(u => html`<li>${u.name}</li>`)}</ul>`
}
```

---

## Phase 6: Performance

Optimize rendering for large datasets.

### 6.1 Keyed Lists
- Track items by unique key for efficient updates
- Only re-render changed items

```js
// Target API
html`<ul>
  ${() => items().map(item =>
    html`<li key=${item.id}>${item.name}</li>`
  )}
</ul>`
```

### 6.2 Lazy Rendering / Virtual Scrolling
- Render only visible items in viewport
- Useful for lists with 1000+ items

```js
// Target API
html`<virtual-list items=${items} itemHeight=${40}>
  ${(item) => html`<div class="row">${item.name}</div>`}
</virtual-list>`
```

---

## Phase 7: Documentation

Create in `/framework/docs/` directory.

| File | Content |
|------|---------|
| `README.md` | Overview, installation, quick start |
| `architecture.md` | Design principles, how reactivity works |
| `api-reference.md` | All functions with signatures and examples |
| `guide.md` | Step-by-step tutorial building an app |
| `best-practices.md` | Recommended patterns and anti-patterns |

### Documentation Requirements
- Clear explanations of each feature
- Practical code examples
- Installation instructions
- Getting started guide
- Best practices and guidelines

---

## Phase 8: Example Application

Build in `/example/` directory to demonstrate all features.

### Suggested: Todo App

Features to implement:
- Create new tasks
- Mark tasks as complete
- Delete tasks
- Filter by status (all/active/completed)
- Edit task text
- Persist to localStorage
- (Optional) Sync with API

### Structure
```
example/
  index.html
  src/
    app.js
    components/
      TodoList.js
      TodoItem.js
      TodoForm.js
      FilterButtons.js
    store/
      todos.js
    styles/
      main.css
```

---

## Implementation Order

```
Phase 1: Template Enhancements
├── 1.1 Event handling
├── 1.2 Attribute binding
└── 1.3 Style binding

Phase 2: Component System
├── 2.1 Function components
├── 2.2 Mount function
└── 2.3 Children/slots

Phase 3: Routing
├── 3.1 Hash router
├── 3.2 History router (optional)
└── 3.3 Route params & navigation

Phase 4: Forms
├── 4.1 Two-way binding pattern
└── 4.2 Form submission

Phase 5: HTTP
├── 5.1 Fetch wrapper
└── 5.2 Async state helper

Phase 6: Performance
├── 6.1 Keyed lists
└── 6.2 Virtual scrolling

Phase 7: Documentation
└── Write all docs

Phase 8: Example App
└── Build todo app
```

---

## File Structure (Target)

```
framework/
  src/
    core/
      signal.js      ✅ Done
      template.js    🔄 Needs events/attributes
      component.js   ❌ Not started
      router.js      ❌ Not started
      http.js        ❌ Not started
    index.js         ❌ Export all modules
  docs/
    README.md        ❌ Not started
    architecture.md  ❌ Not started
    api-reference.md ❌ Not started
    guide.md         ❌ Not started
    best-practices.md ❌ Not started

example/
  index.html         ❌ Not started
  src/
    app.js           ❌ Not started
    components/      ❌ Not started
```
