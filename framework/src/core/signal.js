
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
    if (nextValue !== value) {
      value = nextValue
      subscribers.forEach((fn) => fn())
    }
  }

  return [read, write]

 }

/**
 * create effect which runs when values change
 * @param {() => void} fn - function which changes
 */
export  function effect(fn) {
  const execute = () => {
    //activate
    currentEffect = execute
    //run 
    fn()
    //remove activate
    currentEffect = null
  }
  execute
  
}




  /**
   * create new updating value
   * @param {() => any} fn - function  which calculates the result
   9* @returns {()  =>  any} - getter funktsioon
   */
  export function computed(fn) {
    const [value, setValue] = signal(undefined)

    effect(() => {
      setValue(fn())
    })

    return getter
    
  }





