import { signal } from "./signal.js";
import {html} from "./template.js";
import {mount} from "./component.js";

//component with children
function Card({title, children}) {
  return html`
  <div class="card" style=${{border: '1px solid #ccc', padding: '16px', margin: '8px'}}>
   <h2>${title}</h2>
   <div class="card-body">${children}</div>
  </div>
  `
}

//button component
function Button({label, onClick}) {
  return html`<button onclick=${onClick}>${label}</button>`
}

//counter with internal state
function Counter({initial = 0}) {
  const [count, setCount] = signal(initial)
  return html`
    <div class="counter">
      <p>Count: ${() => count()}</p>
      <button onclick=${() => setCount(n => n + 1)}>+</button>
      <button onclick=${() => setCount(n => n - 1)}>-</button>
    </div>
  `
}

// Test components
console.log("TEST 1: Card component with children")
const cardContent = html`<p>This is card content</p>`
const card = Card({ title: "My Card", children: cardContent })
console.log("Card created:", card.tagName)
mount(card, document.body)

console.log("TEST 2: Button component with onClick")
const btn = Button({ label: "Click Me", onClick: () => console.log("Button clicked!") })
console.log("Button created:", btn.tagName)
mount(btn, document.body)

console.log("TEST 3: Counter component with state")
const counter = Counter({ initial: 5 })
console.log("Counter created:", counter.tagName)
mount(counter, document.body)

console.log("Component tests loaded")
