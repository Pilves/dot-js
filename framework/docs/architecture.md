# ARCHITECTURE

## THE CORE

dot-js is reactive. Not virtual DOM. Not diffing. Pure signal-based reactivity.

When state changes, only what depends on it updates. Nothing else. No waste.

---

## SIGNALS

The foundation. A signal holds a value. When that value changes, everything subscribed runs again.

```js
const [count, setCount] = signal(0)
```

`count` is a getter. Call it to read: `count()`

`setCount` is a setter. Call it to write: `setCount(1)` or `setCount(n => n + 1)`

Signals are not magic. They are closures. The getter returns current value. The setter updates it and notifies subscribers.

---

## EFFECTS

An effect is a function that runs when its dependencies change.

```js
effect(() => {
  console.log(count())
})
```

How does it know `count` is a dependency? When effect runs, it sets itself as the "current listener". When you call `count()`, the signal registers that listener. Now the signal knows who to notify.

This is automatic dependency tracking. No dependency arrays. No manual subscription.

---

## COMPUTED

A computed is a derived signal. It depends on other signals and updates when they do.

```js
const double = computed(() => count() * 2)
```

`double()` returns the computed value. It caches the result. Only recalculates when dependencies change.

---

## TEMPLATE

`html` is a tagged template literal. It parses HTML and makes it reactive.

```js
html`<div>${() => count()}</div>`
```

How it works:

1. Template strings get markers injected: `<!--dot-0-->` for content, `__dot_attr_0__` for attributes
2. HTML is parsed into real DOM nodes
3. Markers are found and replaced with actual values
4. Functions become effects that update the DOM when signals change

The DOM is real. No virtual layer. Changes go straight to the elements.

---

## REACTIVITY FLOW

```
signal changes
    |
    v
notify subscribers
    |
    v
effects run
    |
    v
DOM updates
```

One direction. No cycles. No batching complexity. Simple.

---

## KEYED LISTS

When rendering arrays, keys matter.

```js
list(
  () => items(),
  item => item.id,
  item => html`<li>${item.name}</li>`
)
```

The key function identifies each item. When the array changes:
- New keys get new DOM nodes
- Missing keys get removed
- Existing keys reuse their nodes

No unnecessary re-renders. Just surgical updates.

---

## VIRTUAL SCROLLING

For massive lists. Only visible items exist in DOM.

```js
createVirtualList({
  items: () => bigArray(),
  itemHeight: 40,
  containerHeight: 400,
  renderItem: item => html`<div>${item.name}</div>`
})
```

Scroll position determines which items render. Buffer zones prevent flicker. Throttled updates keep it smooth.

---

## FILE STRUCTURE

```
core/
  signal.js      - reactivity primitives
  template.js    - html tagged template
  component.js   - mount/unmount
  router.js      - hash routing
  form.js        - form bindings and validation
  http.js        - fetch wrapper and async state
  list.js        - keyed list rendering
  virtual-list.js - virtual scrolling
```

Each file does one thing. Import what you need. Leave what you do not.

---

## PHILOSOPHY

No build step required. No JSX. No compilation.

Write JavaScript. Get reactivity. Ship it.

Small. Fast. Direct.
