import { signal, effect, computed } from "./signal.js";

console.log("TEST 1")
const [count, setCount] = signal(0)
console.log("count: ", count())

setCount(5)
console.log("after setcount: ", count())

setCount((n) => n + 1)
console.log("after n + 1: ", count())


