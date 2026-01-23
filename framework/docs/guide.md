# GUIDE

Build something real. Learn by doing.

---

## INSTALLATION

Get the framework into your project.

**Option 1: Copy the core folder**

```
your-project/
  framework/
    src/
      core/
        signal.js
        template.js
        component.js
        router.js
        http.js
        form.js
        list.js
        virtual-list.js
        utils.js
  app.js
  index.html
```

**Option 2: Clone the repo**

```bash
git clone https://github.com/user/dot-js.git
```

**Import structure:**

```js
// from your app.js
import { signal } from './framework/src/core/signal.js'
import { html } from './framework/src/core/template.js'
import { mount } from './framework/src/core/component.js'
```

Each module is a single file. Import what you need.

**Browser requirements:**

- ES modules support (all modern browsers)
- No build step. No bundler. Just `<script type="module">`.

---

## SETUP

Create an HTML file. Add a script tag. Done.

```html
<!DOCTYPE html>
<html>
<head>
  <title>dot-js</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

---

## COUNTER

The classic. State that counts.

```js
// app.js
import { signal } from './framework/src/core/signal.js'
import { html } from './framework/src/core/template.js'
import { mount } from './framework/src/core/component.js'

function Counter() {
  const [count, setCount] = signal(0)

  return html`
    <div>
      <h1>${() => count()}</h1>
      <button onclick=${() => setCount(c => c - 1)}>-</button>
      <button onclick=${() => setCount(c => c + 1)}>+</button>
    </div>
  `
}

mount(Counter(), document.getElementById('root'))
```

Run it. Click buttons. Watch numbers change.

Notice: `${() => count()}` wraps the signal in a function. This makes it reactive. Without the arrow function, it would only show the initial value.

---

## CONDITIONAL RENDERING

Show or hide things based on state.

**Pattern 1: Logical AND**

Render only if condition is truthy.

```js
const [loggedIn, setLoggedIn] = signal(false)

html`
  <div>
    ${() => loggedIn() && html`<p>welcome back</p>`}
  </div>
`
```

**Pattern 2: Ternary**

Choose between two options.

```js
const [loading, setLoading] = signal(true)

html`
  <div>
    ${() => loading()
      ? html`<p>loading...</p>`
      : html`<p>done</p>`
    }
  </div>
`
```

**Pattern 3: conditionalClass**

Toggle classes based on state.

```js
import { conditionalClass } from './framework/src/core/utils.js'

const [active, setActive] = signal(false)

html`
  <button
    class=${conditionalClass('btn', 'btn-active', active)}
    onclick=${() => setActive(a => !a)}
  >
    toggle
  </button>
`
```

Always `btn`. Adds `btn-active` when `active()` is true.

---

## TODO LIST

State management. Arrays. User input.

### Step 1: Store

Separate state from components. Keep it clean.

```js
// store.js
import { signal, computed } from './framework/src/core/signal.js'

export const [todos, setTodos] = signal([])
export const [filter, setFilter] = signal('all')

export const filteredTodos = computed(() => {
  const list = todos()
  const f = filter()

  if (f === 'active') return list.filter(t => !t.completed)
  if (f === 'completed') return list.filter(t => t.completed)
  return list
})

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
```

### Step 2: Components

Build the UI from pieces.

```js
// components/TodoForm.js
import { signal } from '../framework/src/core/signal.js'
import { html } from '../framework/src/core/template.js'
import { addTodo } from '../store.js'

export function TodoForm() {
  const [text, setText] = signal('')

  function handleSubmit(e) {
    e.preventDefault()
    const value = text().trim()
    if (!value) return
    addTodo(value)
    setText('')
  }

  return html`
    <form onsubmit=${handleSubmit}>
      <input
        type="text"
        placeholder="what needs to be done"
        value=${() => text()}
        oninput=${e => setText(e.target.value)}
      />
      <button type="submit">add</button>
    </form>
  `
}
```

```js
// components/TodoItem.js
import { html } from '../framework/src/core/template.js'
import { toggleTodo, deleteTodo } from '../store.js'

export function TodoItem(todo) {
  return html`
    <div class="todo-item">
      <input
        type="checkbox"
        checked=${todo.completed}
        onclick=${() => toggleTodo(todo.id)}
      />
      <span class=${todo.completed ? 'completed' : ''}>${todo.text}</span>
      <button onclick=${() => deleteTodo(todo.id)}>x</button>
    </div>
  `
}
```

```js
// components/TodoList.js
import { html } from '../framework/src/core/template.js'
import { filteredTodos } from '../store.js'
import { TodoItem } from './TodoItem.js'

export function TodoList() {
  return html`
    <div class="todo-list">
      ${() => filteredTodos().map(todo => TodoItem(todo))}
    </div>
  `
}
```

```js
// components/Filter.js
import { html } from '../framework/src/core/template.js'
import { setFilter } from '../store.js'

export function Filter() {
  return html`
    <div class="filters">
      <button onclick=${() => setFilter('all')}>all</button>
      <button onclick=${() => setFilter('active')}>active</button>
      <button onclick=${() => setFilter('completed')}>completed</button>
    </div>
  `
}
```

### Step 3: App

Put it together.

```js
// app.js
import { html } from './framework/src/core/template.js'
import { mount } from './framework/src/core/component.js'
import { TodoForm } from './components/TodoForm.js'
import { TodoList } from './components/TodoList.js'
import { Filter } from './components/Filter.js'

function App() {
  return html`
    <div class="app">
      <h1>todos</h1>
      ${TodoForm()}
      ${Filter()}
      ${TodoList()}
    </div>
  `
}

mount(App(), document.getElementById('root'))
```

---

## ROUTING

Multiple pages. One app.

```js
import { signal } from './framework/src/core/signal.js'
import { html } from './framework/src/core/template.js'
import { mount } from './framework/src/core/component.js'
import { createRouter } from './framework/src/core/router.js'

function Home() {
  return html`<h1>home</h1>`
}

function About() {
  return html`<h1>about</h1>`
}

function User(params) {
  return html`<h1>user ${params.id}</h1>`
}

function NotFound() {
  return html`<h1>404</h1>`
}

const router = createRouter({
  '/': Home,
  '/about': About,
  '/user/:id': User,
  '*': NotFound
})

function App() {
  return html`
    <nav>
      <a href="#/">home</a>
      <a href="#/about">about</a>
      <a href="#/user/1">user 1</a>
    </nav>
    <main>
      ${() => {
        const route = router.current()
        return route ? route.component(route.params) : html`<div>404</div>`
      }}
    </main>
  `
}

mount(App(), document.getElementById('root'))
```

Hash-based routing. No server config needed. Works anywhere.

---

## FETCHING DATA

Async operations. Loading states. Error handling.

```js
import { html } from './framework/src/core/template.js'
import { mount } from './framework/src/core/component.js'
import { http, useAsync } from './framework/src/core/http.js'

function UserList() {
  const { data, loading, error } = useAsync(() => http.get('/api/users'))

  return html`
    <div>
      ${() => {
        if (loading()) return html`<p>loading...</p>`
        if (error()) return html`<p>error: ${error().message}</p>`
        if (!data()) return html`<p>no data</p>`

        return html`
          <ul>
            ${data().map(user => html`<li>${user.name}</li>`)}
          </ul>
        `
      }}
    </div>
  `
}

mount(UserList(), document.getElementById('root'))
```

---

## FORMS WITH VALIDATION

User input. Validation. Submission.

```js
import { signal } from './framework/src/core/signal.js'
import { html } from './framework/src/core/template.js'
import { mount } from './framework/src/core/component.js'
import { bind, handleForm, required, email, minLength } from './framework/src/core/form.js'

function SignupForm() {
  const [username, setUsername] = signal('')
  const [userEmail, setUserEmail] = signal('')
  const [password, setPassword] = signal('')
  const [errors, setErrors] = signal({})

  function validate() {
    const errs = {}

    const usernameErr = required(username()) || minLength(username(), 3)
    if (usernameErr) errs.username = usernameErr

    const emailErr = required(userEmail()) || email(userEmail())
    if (emailErr) errs.email = emailErr

    const passwordErr = required(password()) || minLength(password(), 8)
    if (passwordErr) errs.password = passwordErr

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function submit(data) {
    if (!validate()) return

    console.log('submitting:', {
      username: data.get('username'),
      email: data.get('email'),
      password: data.get('password')
    })
  }

  return html`
    <form ...${handleForm(submit)}>
      <div>
        <input name="username" placeholder="username" ...${bind([username, setUsername])} />
        <span class="error">${() => errors().username || ''}</span>
      </div>
      <div>
        <input name="email" placeholder="email" ...${bind([userEmail, setUserEmail])} />
        <span class="error">${() => errors().email || ''}</span>
      </div>
      <div>
        <input name="password" type="password" placeholder="password" ...${bind([password, setPassword])} />
        <span class="error">${() => errors().password || ''}</span>
      </div>
      <button type="submit">sign up</button>
    </form>
  `
}

mount(SignupForm(), document.getElementById('root'))
```

---

## LARGE LISTS

Performance matters. Virtual scrolling handles it.

```js
import { signal } from './framework/src/core/signal.js'
import { html } from './framework/src/core/template.js'
import { mount } from './framework/src/core/component.js'
import { createVirtualList } from './framework/src/core/virtual-list.js'

function BigList() {
  // 10000 items. no problem.
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `item ${i}`
  }))

  const virtualList = createVirtualList({
    items,
    itemHeight: 40,
    containerHeight: 400,
    renderItem: item => html`
      <div class="list-item">${item.name}</div>
    `
  })

  return html`
    <div>
      <h1>10000 items</h1>
      ${virtualList}
    </div>
  `
}

mount(BigList(), document.getElementById('root'))
```

Only renders what you see. Scroll through thousands. Stay smooth.

---

## EVENT DELEGATION

Handle events from many child elements with a single parent listener.

### Why delegate?

Without delegation, you attach listeners to every child. With delegation, one listener on the parent handles all children. This is faster and cleaner when you have many similar elements.

### Basic delegation

```js
import { signal } from './framework/src/core/signal.js'
import { html } from './framework/src/core/template.js'
import { mount } from './framework/src/core/component.js'
import { delegate } from './framework/src/core/events.js'

function TodoApp() {
  const [todos, setTodos] = signal([
    { id: 1, text: 'Learn dot.js', completed: false },
    { id: 2, text: 'Build app', completed: false },
    { id: 3, text: 'Ship it', completed: false }
  ])

  function toggleTodo(id) {
    setTodos(list => list.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ))
  }

  return html`
    <div>
      <h1>todos</h1>
      <ul onclick=${delegate('li', (e, target) => {
        const id = Number(target.dataset.id)
        toggleTodo(id)
      })}>
        ${() => todos().map(todo => html`
          <li
            data-id=${todo.id}
            class=${todo.completed ? 'completed' : ''}
          >
            ${todo.text}
          </li>
        `)}
      </ul>
    </div>
  `
}

mount(TodoApp(), document.getElementById('root'))
```

One `onclick` on the `<ul>`. Handles clicks on all `<li>` elements. Even ones added later.

### Multiple actions

Use `delegateAll` when you need different actions for different buttons.

```js
import { signal } from './framework/src/core/signal.js'
import { html } from './framework/src/core/template.js'
import { mount } from './framework/src/core/component.js'
import { delegateAll } from './framework/src/core/events.js'

function TaskManager() {
  const [tasks, setTasks] = signal([
    { id: 1, text: 'Design UI', editing: false },
    { id: 2, text: 'Write code', editing: false }
  ])

  function editTask(id) {
    setTasks(list => list.map(t =>
      t.id === id ? { ...t, editing: true } : t
    ))
  }

  function deleteTask(id) {
    setTasks(list => list.filter(t => t.id !== id))
  }

  function completeTask(id) {
    setTasks(list => list.map(t =>
      t.id === id ? { ...t, completed: true } : t
    ))
  }

  const handleActions = delegateAll({
    '.edit-btn': (e, target) => {
      const id = Number(target.closest('[data-id]').dataset.id)
      editTask(id)
    },
    '.delete-btn': (e, target) => {
      const id = Number(target.closest('[data-id]').dataset.id)
      deleteTask(id)
    },
    '.complete-btn': (e, target) => {
      const id = Number(target.closest('[data-id]').dataset.id)
      completeTask(id)
    }
  })

  return html`
    <div>
      <h1>task manager</h1>
      <div class="task-list" onclick=${handleActions}>
        ${() => tasks().map(task => html`
          <div class="task" data-id=${task.id}>
            <span>${task.text}</span>
            <button class="edit-btn">edit</button>
            <button class="complete-btn">done</button>
            <button class="delete-btn">delete</button>
          </div>
        `)}
      </div>
    </div>
  `
}

mount(TaskManager(), document.getElementById('root'))
```

One listener. Multiple selectors. Clean code.

### Tips

Use `target.dataset` to pass data from markup to handlers.

```js
html`<button class="action-btn" data-id=${item.id} data-action="approve">
  approve
</button>`

delegate('.action-btn', (e, target) => {
  const id = target.dataset.id
  const action = target.dataset.action
  handleAction(id, action)
})
```

Use `target.closest()` to find parent elements when you click nested content.

```js
html`<div class="card" data-id=${card.id}>
  <h3>${card.title}</h3>
  <p>${card.description}</p>
  <button>view</button>
</div>`

delegate('.card', (e, target) => {
  // works even if you click the h3, p, or button
  const id = target.dataset.id
  openCard(id)
})
```

---

## NEXT

Read the API reference for complete details.

Read best practices to write clean code.

Build something.
