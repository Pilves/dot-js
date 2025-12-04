import { signal, effect, computed } from "./signal.js";

console.log("TEST 1")
const [count, setCount] = signal(0)
console.log("count: ", count())

setCount(5)
console.log("after setcount: ", count())

setCount((n) => n + 1)
console.log("after n + 1: ", count())

console.log("TEST 2")
const [name, setName] = signal("Mari")

effect (() => {
  console.log("Name has changed: ", name())
})

setName("Tiina")
setName("Malle")

console.log("TEST 3 / Computed ")
const [a, setA] = signal(2)
const [b, setB] =  signal(3)

const  sum = computed(() => a() + b())

console.log("Summa: ", sum())

setA(10)
console.log("setA 10 ", sum())
setB(20)
console.log("setB 20 ", sum())

console.log("TEST 4")
const [temp, setTemp] = signal(20)

effect(() => {
  console.log("effect 1: ", temp())
  
})

effect(() => {
  console.log("effect 2: ",  temp() < 15 ? "jah"  : "ei" )
})

setTemp(10)
