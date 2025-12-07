import { signal, effect, computed } from "./signal.js"
import { html } from "./template.js"
import { mount } from "./component.js"
import  {createRouter} from "./router.js"


const app = html`<div>Hello from mount!</div>`
mount(app, document.body)

console.log("TEST 1: Reactive")
const [count, setCount] =  signal(0)

const counter = html`
  <div class="card">
    <p>Count: ${() =>  count()}</p>
  </div>
`

mount(counter, document.body)

//change  value every second
setInterval(() => {
  setCount((n) => n + 1)
  console.log("Count: ", count())
}, 1000);

console.log("TEST 2: multiple reactive values")
const [name, setName] = signal("Mari")
const [age, setAge]  = signal(25)

const profile = html`
  <div class="card">
    <p>Nimi: ${() => name()}</p>
    <p>Vanus: ${()  => age()}</p>
    <p>Tervitus: Tere, ${() =>  name()}!</p>
    </div>
`

mount(profile, document.body)

//buttons to test  
const  controls = html`
  <div class="card">
    <button  id="btn-name">Change name</button>
    <button id="btn-age">Change age</button>
  </div>
`
mount(controls, document.body)

document.getElementById("btn-name").onclick = () => {
  const names = ["kati", "malle", "triin",  "Toomans", "juri"]
  const random = names[Math.floor(Math.random() * names.length)]
  setName(random)
}
  
document.getElementById("btn-age").onclick  = () => { 
  setAge((v) => v + 1)
}

console.log("TEST 3: computed values")
const [a, setA] = signal(5)
const [b, setB] = signal(3)
const summa = computed(() => a() + b())

const math = html`
  <div class= "card">
    <p>${() => a()} + ${() => b()} = ${() => summa()} </p>
  </div>
`

mount(math, document.body)

const mathControls = html`
  <div class="card">
    <button id="btn-a">A + 1</button>
    <button id="btn-b">B + 1</button>
  </div>
`

mount(mathControls, document.body)

document.getElementById("btn-a").onclick = () => setA((n) => n + 1)

document.getElementById("btn-b").onclick = () => setB((n) => n + 1)

const btn = html`<button onclick=${() => console.log("clicked")}>test</button>`
mount(btn, document.body)


console.log("TEST 4: reactive attributes")
const [active, setActive] = signal(false)

const div = html`<div class=${() => active() ? 'active' : 'inactive'}>Reactive class</div>`
mount(div, document.body)

console.log("initial class: ", div.className)

setActive(true)
console.log("after true: ", div.className)
setActive(false)
console.log("after false: ", div.className)

console.log("\nTEST 5: style binding")

// Static style object
const styledDiv = html`<div style=${{ color: 'red', fontSize: '24px' }}>Red Styled Text</div>`
mount(styledDiv, document.body)
console.log("Style attribute:", styledDiv.getAttribute("style"))

// Reactive style
const [visible, setVisible] = signal(true)
const fadingDiv = html`<div style=${() => ({ opacity: visible() ? 1 : 0.2, padding: '10px', background: 'yellow' })}>Fading Box</div>`
mount(fadingDiv, document.body)

console.log("Initial opacity:", fadingDiv.style.opacity)
setVisible(false)
console.log("After setVisible(false):", fadingDiv.style.opacity)

function Card({ title, children }) {
  return html`
    <div class="card">
      <h2>${title}<h2>
      <div class="card-body">${children}</div>
    </div>
  `
}

const inner = html`<p>test</p>`
const outer = html`<div class="wrapper">${inner}</div>`
mount(outer, document.body)

const myCard = Card({
  title: "hi",
  children: html`<p>tsts</p>`
}) 
mount(myCard, document.body)
console.log("\nTESTS LOADED")

function HomePage() {
  return html`<h1>Home</h1>`
}

function AboutPage() {
  return html`<h1>about</h1>`
}

function UserPage({ id }) {
  return html`<h1>User ${id}</h1>`
}

const router = createRouter({
  '/': HomePage,
  '/about':  AboutPage,
  '/user/:id': UserPage
})


console.log(router.current())

router.navigate('/about')
console.log(router.current())

router.navigate('/user/234')

setTimeout(() => {
 const match  =  router.current() 
  console.log(match.component)
  console.log(match.params)

}, 0);




