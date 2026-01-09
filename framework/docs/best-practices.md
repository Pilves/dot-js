# BEST PRACTICES

Write clean code. Avoid pain. Ship fast.

---

## SIGNALS

### DO: Wrap signal reads in functions for reactivity

```js
// reactive - updates when count changes
html`<div>${() => count()}</div>`

// not reactive - only shows initial value
html`<div>${count()}</div>`
```

### DO: Use functional updates when new value depends on old

```js
// correct
setCount(c => c + 1)

// works but reads stale closure in some cases
setCount(count() + 1)
```

### DO NOT: Mutate objects inside signals

```js
// wrong - mutation does not trigger update
setTodos(list => {
  list.push(newTodo)
  return list
})

// correct - new array triggers update
setTodos(list => [...list, newTodo])
```

---

## COMPONENTS

### DO: Keep components small and focused

```js
// one component, one job
function TodoItem(todo) {
  return html`<li>${todo.text}</li>`
}

function TodoList() {
  return html`<ul>${() => todos().map(TodoItem)}</ul>`
}
```

### DO: Pass data down, actions up

```js
// parent owns state
function Parent() {
  const [items, setItems] = signal([])

  function addItem(text) {
    setItems(list => [...list, { id: Date.now(), text }])
  }

  return html`
    <div>
      ${AddForm({ onAdd: addItem })}
      ${ItemList({ items })}
    </div>
  `
}

// children receive data and callbacks
function AddForm({ onAdd }) {
  const [text, setText] = signal('')

  return html`
    <form onsubmit=${e => {
      e.preventDefault()
      onAdd(text())
      setText('')
    }}>
      <input value=${() => text()} oninput=${e => setText(e.target.value)} />
    </form>
  `
}
```

### DO NOT: Create signals inside render functions

```js
// wrong - new signal every render
function Bad() {
  return html`
    <div>
      ${() => {
        const [x, setX] = signal(0)  // bad
        return html`<span>${x()}</span>`
      }}
    </div>
  `
}

// correct - signal at component level
function Good() {
  const [x, setX] = signal(0)

  return html`<div><span>${() => x()}</span></div>`
}
```

---

## EFFECTS

### DO: Use computed for derived values

```js
// correct - computed caches result
const fullName = computed(() => `${firstName()} ${lastName()}`)

// wasteful - recalculates every access
function getFullName() {
  return `${firstName()} ${lastName()}`
}
```

### DO NOT: Put side effects in computed

```js
// wrong - computed should be pure
const bad = computed(() => {
  console.log('computing')  // side effect
  fetch('/api')             // side effect
  return count() * 2
})

// correct - use effect for side effects
effect(() => {
  console.log('count changed:', count())
})
```

### DO: Keep effects focused

```js
// one effect, one concern
effect(() => {
  document.title = `Count: ${count()}`
})

effect(() => {
  localStorage.setItem('count', count())
})

// not one giant effect doing everything
```

---

## STATE MANAGEMENT

### DO: Separate state from components

```js
// store.js - state lives here
export const [user, setUser] = signal(null)
export const [posts, setPosts] = signal([])

export function logout() {
  setUser(null)
  setPosts([])
}

// components import what they need
import { user, logout } from './store.js'
```

### DO: Colocate related state

```js
// form state stays together
const [username, setUsername] = signal('')
const [password, setPassword] = signal('')
const [errors, setErrors] = signal({})
const [submitting, setSubmitting] = signal(false)
```

### DO NOT: Duplicate state

```js
// wrong - derived data stored separately
const [todos, setTodos] = signal([])
const [completedCount, setCompletedCount] = signal(0)

// when todos change, must remember to update count
// easy to forget, state gets out of sync

// correct - derive it
const completedCount = computed(() =>
  todos().filter(t => t.completed).length
)
```

---

## LISTS

### DO: Use keyed lists for dynamic data

```js
import { list } from './core/list.js'

// keys let the framework track which items changed
list(
  () => items(),
  item => item.id,  // stable unique key
  item => html`<li>${item.name}</li>`
)
```

### DO NOT: Use array index as key for reorderable lists

```js
// wrong - index changes when list reorders
list(
  () => items(),
  (item, index) => index,  // bad key
  item => html`<li>${item.name}</li>`
)

// correct - use stable id
list(
  () => items(),
  item => item.id,  // good key
  item => html`<li>${item.name}</li>`
)
```

### DO: Use virtual scrolling for large lists

```js
// 1000+ items? virtualize
createVirtualList({
  items: () => bigList(),
  itemHeight: 40,
  containerHeight: 400,
  renderItem: item => html`<div>${item.name}</div>`
})
```

---

## FORMS

### DO: Validate on submit, not on every keystroke

```js
// validate when user submits
function handleSubmit(data) {
  const errors = validate(data)
  if (errors) {
    setErrors(errors)
    return
  }
  submit(data)
}

// not on every input change (unless you need it)
```

### DO: Use bind helpers for cleaner code

```js
// verbose
html`<input
  value=${() => name()}
  oninput=${e => setName(e.target.value)}
/>`

// clean
html`<input ...${bind([name, setName])} />`
```

---

## HTTP

### DO: Handle all states

```js
const { data, loading, error } = useAsync(() => get('/api/data'))

// always handle loading
if (loading()) return html`<p>loading...</p>`

// always handle errors
if (error()) return html`<p>error: ${error().message}</p>`

// always handle empty state
if (!data() || data().length === 0) return html`<p>no data</p>`

// then show data
return html`<ul>${data().map(item => html`<li>${item}</li>`)}</ul>`
```

### DO NOT: Ignore errors

```js
// wrong - silent failure
const data = await get('/api/data')

// correct - handle it
try {
  const data = await get('/api/data')
} catch (err) {
  showError(err.message)
}
```

---

## FILE STRUCTURE

### Small app

```
app.js
store.js
index.html
```

### Medium app

```
app.js
store.js
components/
  Header.js
  TodoList.js
  TodoItem.js
  Footer.js
index.html
```

### Large app

```
app.js
store/
  todos.js
  user.js
  ui.js
components/
  layout/
    Header.js
    Footer.js
    Sidebar.js
  todos/
    TodoList.js
    TodoItem.js
    TodoForm.js
  user/
    Profile.js
    Settings.js
pages/
  Home.js
  About.js
  NotFound.js
utils/
  validation.js
  formatting.js
index.html
```

---

## GENERAL

### DO: Keep it simple

Start with the simplest solution. Add complexity only when needed.

### DO: Read the source

The framework is small. You can understand all of it. Read it.

### DO NOT: Over-engineer

No need for:
- State management libraries
- Build tools (unless you want them)
- TypeScript (unless you want it)
- Complex folder structures for small apps

Write JavaScript. Make it work. Ship it.
