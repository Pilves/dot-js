import { html } from "./template.js";

console.log("TEST 1: Static html")
const el1 = html`<div class="card">hallo world</div>`
console.log('element: ', el1)
console.log("tagname:  ", el1.tagName)
console.log('classname: ', el1.className)
console.log('textcontent: ', el1.textContent)

document.body.appendChild(el1)

console.log("\nTEST 2: Nested elements")
const el2 = html`
<div class="container">
  <h1>Title </h1>
  <p>sum text here</p>
</div>
`
console.log("Children: ", el2.children.length)
document.body.appendChild(el2)

console.log("\nTEST 3: interpolation")
const nimi = "Mari"
const vanus = 25

const el3 = html`
<div>
  <p>Nimi: ${nimi}</p>
  <p>Vanus: ${vanus}</p>
</div>
`
document.body.appendChild(el3)


console.log("\nTEST 4: null/undef")
const el4 = html`
<div>
  <p>Enne ${null} after</p>
  <p>before ${undefined} after</p>
</div>
`
document.body.appendChild(el4)


console.log("\nTEST 5: numbers and booleans")
const el5 = html`
<div>
  <p>number: ${42}</p>
  <p>boolean: ${true}</p>
  <p>calculation: ${3 + 3}</p>
</div>
`
document.body.appendChild(el5)

console.log("render done")



