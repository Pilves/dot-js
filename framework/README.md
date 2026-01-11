# dot-js

Reactive JavaScript framework. No virtual DOM. No build step. No complexity.

---

## WHAT IT IS

Signal-based reactivity. When state changes, the DOM updates. Nothing else.

```js
const [count, setCount] = signal(0)

html`<button onclick=${() => setCount(c => c + 1)}>
  clicked ${() => count()} times
</button>`
```

That is it. State. Template. Reactivity.

---

## INSTALL

No npm. No webpack. No rollup.

Copy the `src/core` folder. Import what you need.

```html
<script type="module" src="./app.js"></script>
```

---

## QUICK START

```js
import { signal } from './core/signal.js'
import { html } from './core/template.js'
import { mount } from './core/component.js'

function App() {
  const [name, setName] = signal('world')

  return html`
    <div>
      <h1>hello ${() => name()}</h1>
      <input
        value=${() => name()}
        oninput=${e => setName(e.target.value)}
      />
    </div>
  `
}

mount(App(), document.getElementById('root'))
```

---

## FEATURES

**Reactivity**
- `signal(value)` — reactive state
- `createPersistedSignal(key, value)` — reactive state with localStorage persistence
- `effect(fn)` — run on dependency change
- `computed(fn)` — derived values

**Templates**
- `html` — tagged template literal
- reactive text, attributes, styles
- event binding
- array rendering

**Components**
- function components
- `mount()` / `unmount()`

**Routing**
- hash-based router
- route params
- programmatic navigation

**Forms**
- two-way binding helpers
- validation (required, email, minLength, maxLength)
- form submission handling

**HTTP**
- `get()` `post()` `put()` `del()`
- `useAsync()` — reactive loading/error/data state

**Performance**
- keyed lists with DOM reconciliation
- virtual scrolling for massive lists

---

## SIZE

Small. The entire core is a few kilobytes.

No dependencies. No bloat.

---

## BROWSER SUPPORT

Modern browsers. ES modules. No polyfills.

---

## DOCS

- [Architecture](./docs/architecture.md) — how it works
- [API Reference](./docs/api-reference.md) — every function
- [Guide](./docs/guide.md) — build real things
- [Best Practices](./docs/best-practices.md) — write clean code

---

## EXAMPLE

See the `example/` folder for a complete todo app.

```
example/
  index.html
  app.js
  store.js
  components/
    AddTodoForm.js
    TodoList.js
    TodoItem.js
    TodoFilter.js
```

---

## WHY

React is heavy. Vue is magic. Svelte needs compilation.

Sometimes you just want to write JavaScript and have it work.

dot-js is JavaScript. Reactive. Direct. Done.

---

## PHILOSOPHY

No abstractions for abstraction sake.

No configuration.

No ceremony.

Write code. Ship it.
