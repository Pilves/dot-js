# API REFERENCE

---

## REACTIVITY

### signal(initialValue)

Create reactive state.

```js
import { signal } from './core/signal.js'

const [count, setCount] = signal(0)

count()              // read: 0
setCount(5)          // write: 5
setCount(n => n + 1) // update: 6
```

**Returns:** `[getter, setter]`

---

### effect(fn)

Run a function when its dependencies change.

```js
import { effect } from './core/signal.js'

effect(() => {
  console.log('count is', count())
})
```

The function runs immediately, then again whenever any signal it read changes.

**Returns:** `undefined`

---

### computed(fn)

Create a derived value that updates automatically.

```js
import { computed } from './core/signal.js'

const double = computed(() => count() * 2)

double() // always 2x count
```

**Returns:** `getter` function

---

### createPersistedSignal(key, defaultValue)

Create reactive state that persists to localStorage.

```js
import { createPersistedSignal } from './core/signal.js'

const [theme, setTheme] = createPersistedSignal('theme', 'light')

theme()              // read: 'light' (or saved value from localStorage)
setTheme('dark')     // write: 'dark' (also saves to localStorage)
setTheme(t => t === 'dark' ? 'light' : 'dark') // update with function
```

The value is automatically saved to localStorage whenever it changes, and restored when the page loads.

**Parameters:**
- `key` - string key used to store the value in localStorage
- `defaultValue` - initial value if no saved value exists

**Returns:** `[getter, setter]`

---

## TEMPLATE

### html\`...\`

Tagged template for reactive DOM.

```js
import { html } from './core/template.js'

// static
html`<div>hello</div>`

// reactive text
html`<div>${() => count()}</div>`

// events
html`<button onclick=${() => setCount(c => c + 1)}>click</button>`

// attributes
html`<input value=${() => name()} />`

// styles
html`<div style=${{ color: 'red', fontSize: '14px' }}>styled</div>`

// reactive styles
html`<div style=${() => ({ opacity: visible() ? 1 : 0 })}>fade</div>`

// arrays
html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`
```

**Returns:** `Node` or `DocumentFragment`

---

## COMPONENTS

### mount(component, container)

Mount a component to the DOM.

```js
import { mount } from './core/component.js'

mount(App(), document.getElementById('root'))
```

Clears the container first. Returns the mounted component.

---

### unmount(container)

Clear a container.

```js
import { unmount } from './core/component.js'

unmount(document.getElementById('root'))
```

---

## ROUTING

### createRouter(routes)

Create a hash-based router.

```js
import { createRouter } from './core/router.js'

const router = createRouter({
  '/': HomePage,
  '/user/:id': UserPage,
  '*': NotFound
})

router.navigate('/path') // navigate is on the router instance
```

**Returns:**
```js
{
  current(),   // function: returns { component, params } for current route
  navigate(path, query),  // function: navigate to path with optional query params
  matchRoute(pattern, path), // function: match a path against pattern
  destroy()    // function: remove hashchange listener
}
```

---

### router.navigate(path, query)

Navigate programmatically.

```js
router.navigate('/user/123')
router.navigate('/search', { q: 'test' }) // with query params
```

---

## FORMS

### bind([getter, setter])

Two-way binding for text inputs.

```js
import { bind } from './core/form.js'

const [name, setName] = signal('')

html`<input ...${bind([name, setName])} />`
```

**Returns:** `{ value, oninput }`

---

### bindCheckbox([getter, setter])

Two-way binding for checkboxes.

```js
const [checked, setChecked] = signal(false)

html`<input type="checkbox" ...${bindCheckbox([checked, setChecked])} />`
```

**Returns:** `{ checked, onchange }`

---

### bindSelect([getter, setter])

Two-way binding for select elements.

```js
const [option, setOption] = signal('a')

html`<select ...${bindSelect([option, setOption])}>
  <option value="a">A</option>
  <option value="b">B</option>
</select>`
```

**Returns:** `{ value, onchange }`

---

### bindRadio([getter, setter], radioValue)

Two-way binding for radio buttons.

```js
const [color, setColor] = signal('red')

html`
  <input type="radio" name="color" ...${bindRadio([color, setColor], 'red')} /> Red
  <input type="radio" name="color" ...${bindRadio([color, setColor], 'blue')} /> Blue
`
```

**Returns:** `{ value, checked, onchange }`

---

### bindNumber([getter, setter])

Two-way binding for number inputs.

```js
const [age, setAge] = signal(0)

html`<input type="number" ...${bindNumber([age, setAge])} />`
```

Automatically parses to number. Ignores invalid input (keeps previous value).

**Returns:** `{ value, oninput }`

---

### handleForm(callback)

Form submission handler.

```js
import { handleForm } from './core/form.js'

html`<form ...${handleForm(data => {
  console.log(data.get('username'))
})}>
  <input name="username" />
  <button type="submit">send</button>
</form>`
```

Prevents default. Passes FormData to callback.

**Returns:** `{ onsubmit }`

---

### required(value)

Validate non-empty string.

```js
import { required } from './core/form.js'

required('')        // "This field is required"
required('hello')   // null
required('   ')     // "This field is required" (whitespace only)
```

**Returns:** `null` if valid, error string if invalid

---

### minLength(value, min)

Validate minimum length.

```js
import { minLength } from './core/form.js'

minLength('ab', 3)   // "Must be at least 3 characters"
minLength('abc', 3)  // null
```

**Returns:** `null` if valid, error string if invalid

---

### maxLength(value, max)

Validate maximum length.

```js
import { maxLength } from './core/form.js'

maxLength('abcd', 3)  // "Must be at most 3 characters"
maxLength('abc', 3)   // null
```

**Returns:** `null` if valid, error string if invalid

---

### email(value)

Validate email format.

```js
import { email } from './core/form.js'

email('test')           // "Please enter a valid email address"
email('test@')          // "Please enter a valid email address"
email('test@mail.com')  // null
```

**Returns:** `null` if valid, error string if invalid

---

## HTTP

### http.get(url)

Fetch and parse JSON.

```js
import { http } from './core/http.js'

const users = await http.get('/api/users')
```

**Returns:** `Promise<any>`

---

### http.post(url, data)

POST JSON data.

```js
import { http } from './core/http.js'

const created = await http.post('/api/users', { name: 'John' })
```

**Returns:** `Promise<any>`

---

### http.put(url, data)

PUT JSON data.

```js
import { http } from './core/http.js'

const updated = await http.put('/api/users/1', { name: 'Jane' })
```

**Returns:** `Promise<any>`

---

### http.patch(url, data)

PATCH JSON data (partial update).

```js
import { http } from './core/http.js'

const updated = await http.patch('/api/users/1', { name: 'Jane' })
```

**Returns:** `Promise<any>`

---

### http.delete(url)

DELETE request.

```js
import { http } from './core/http.js'

await http.delete('/api/users/1')
```

**Returns:** `Promise<any>`

---

### HttpError

Custom error class thrown for non-2xx HTTP responses.

```js
import { HttpError } from './core/http.js'

try {
  await http.get('/api/users')
} catch (err) {
  if (err instanceof HttpError) {
    console.log(err.status)      // HTTP status code
    console.log(err.statusText)  // Status text
    console.log(err.body)        // Response body
  }
}
```

**Properties:**
- `status` - HTTP status code
- `statusText` - HTTP status text
- `response` - Original fetch Response object
- `body` - Parsed response body

---

### useAsync(asyncFn)

Reactive async state.

```js
import { useAsync } from './core/http.js'

const { data, loading, error, refetch } = useAsync(() => http.get('/api/users'))

// in template
if (loading()) return html`<p>loading...</p>`
if (error()) return html`<p>${error().message}</p>`
return html`<ul>${() => data().map(u => html`<li>${u.name}</li>`)}</ul>`

// refetch data manually
refetch()
```

**Returns:** `{ data, loading, error, refetch }`
- `data` - signal getter for response data
- `loading` - signal getter for loading state
- `error` - signal getter for error state
- `refetch` - function to re-run the async operation

---

## LISTS

### list(signalOrArray, keyFn, renderFn)

Keyed list rendering.

```js
import { list } from './core/list.js'

list(
  () => todos(),
  todo => todo.id,
  todo => html`<li>${todo.text}</li>`
)
```

**Parameters:**
- `signalOrArray` - signal getter or static array
- `keyFn` - extracts unique key from item
- `renderFn` - renders each item

**Returns:** `DocumentFragment`

---

### each(signalOrArray, renderFn)

Simplified keyed list. Uses `item.id` as key.

```js
import { each } from './core/list.js'

each(
  () => todos(),
  todo => html`<li>${todo.text}</li>`
)
```

**Returns:** `DocumentFragment`

---

## VIRTUAL SCROLLING

### createVirtualList(options)

Render only visible items.

```js
import { createVirtualList } from './core/virtual-list.js'

createVirtualList({
  items: () => bigList(),
  itemHeight: 40,
  containerHeight: 400,
  buffer: 5,
  renderItem: (item, index) => html`<div>${item.name}</div>`
})
```

**Options:**
- `items` - signal getter or array
- `itemHeight` - fixed height per item (px)
- `containerHeight` - viewport height (px)
- `buffer` - extra items above/below (default: 5)
- `renderItem` - render function

**Returns:** `Node` with `_virtualList` methods:
- `scrollToIndex(index)` - scroll to specific item
- `getVisibleRange()` - get `{ startIndex, endIndex }`
- `refresh()` - force re-render

---

## UTILITIES

### generateId()

Generate a unique identifier.

```js
import { generateId } from './core/utils.js'

const id = generateId() // "l8x9y2k4p5q"
```

Combines timestamp and random string for uniqueness.

**Returns:** `string` - unique identifier

---

### conditionalClass(base, active, condition)

Conditionally apply CSS classes.

```js
import { conditionalClass } from './core/utils.js'

const [isActive, setIsActive] = signal(false)

html`<div class=${conditionalClass('btn', 'btn-active', isActive)}>click</div>`
```

**Parameters:**
- `base` - base class name (always applied)
- `active` - class to add when condition is true
- `condition` - boolean or getter function

**Returns:** `() => string` - getter function returning class string
