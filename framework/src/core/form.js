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

export  function bindRadio([get, set], radioValue) {
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

export function handleForm(callback) {
  return {
    onsubmit: (e) => {
      e.preventDefault()
      const data = new FormData(e.target)
      callback(data)
    }
  }
}

export function required(value) {
  if (value.trim()){
    return null
  }
  return "error"
}

export function minLength(value, min) {
  if (value.trim().length < min) {
    return "value is too short"
  }
  return null
}

export function maxLength(value, max) {
  if (value.trim().length > max) {
    return "value is too long"
  }
  return null
}

export function email(value) {
  if (value.includes("@")) {
    if (value.indexOf('.') > value.indexOf("@")){
      return null
    }
    return "you need to have domain ending"
  }
  return "you need to have an @"
}


