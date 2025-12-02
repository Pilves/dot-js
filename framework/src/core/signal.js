
let currentEffect = null

/** 
 * Create reactive system
 * @param {any} initialValue 
 * @returns {[() => any, (newValue: any) => void]} - {getter, setter}
*/
export function signal(initialValue) {
  let value = initialValue
  const subscribers = new Set()

  //getter
  function read() {
    //if an effect is running register as listener
    if (currentEffect) {
      subscribers.add(currentEffect)
    }
    return value
  }

  //setter 
  function write(newValue) {

    const nextValue = typeof newValue === "function" ? newValue(value) : newValue  
    //update if value change
    if (nextValue /= value) {
      subscribers.forEach((fn) => fn())
    }
  }

  return [read, write]
}





