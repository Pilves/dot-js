import { signal, effect, computed } from "./signal.js"
import { html } from "./template.js"

console.log("TEST 1: Reactive")
const [count, setCount] =  signal(0)

const counter = html`
  <div class="card">
    <p>Count: ${() =>  count()}</p>
  </div>
`

document.body.appendChild(counter)

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

document.body.appendChild(profile)

//buttons to test  
const  controls = html`
  <div class="card">
    <button  id="btn-name">Change name</button>
    <button id="btn-age">Change age</button>
  </div>
`
document.body.appendChild(controls)

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

document.body.appendChild(math)

const mathControls = html`
  <div class="card">
    <button id="btn-a">A + 1</button>
    <button id="btn-b">B + 1</button>
  </div>
`

document.body.appendChild(mathControls)

document.getElementById("btn-a").onclick = () => setA((n) => n + 1)

document.getElementById("btn-b").onclick = () => setB((n) => n + 1)


console.log("TESTS LOADED")










