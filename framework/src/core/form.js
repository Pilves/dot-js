import { signal } from './signal.js'

/**
 * two-way  binding for text inputs
 * @param  {Array} signalPair - [getter, setter]
 */ 
export function bind([get, set]) {
  return {
    value:  () => get(),
    oninput: (e) =>  set(e.target.value)
  }
}

export function bindCheckbox([get, set]) {
  return {
    checked: ()  => get(),
    onchange: (e) => set(e.target.checked)
  }
}

export function bindSelect([get, set]) {
  return {
    value: () => get(),
    onchange: (e) => set(e.target.value)
  }
}

export  function bindRadio([get, set]) {
  return {
    value: radioValue,
    checked: () =>  get() ===  radioValue,
    onchange: (e) => {
      if (e.target.checked) set(radioValue)
    }    
  }
}

export function bindNumber([get, set]) {
  return {
    value: () => get(),
    oninput: (e) => {
      const num = parseFloat(e.target.value)
      set(isNaN(num) ? 0 : num)
    }
  }
}
