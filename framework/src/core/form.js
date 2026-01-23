/**
 * Two-way binding for text inputs
 * @param {[() => string, (v: string) => void]} signalPair - [getter, setter] from signal()
 * @returns {{ value: () => string, oninput: (e: Event) => void }}
 */
export function bind([get, set]) {
  return {
    value: () => get(),
    oninput: (e) => set(e.target.value)
  }
}

/**
 * Two-way binding for checkbox inputs
 * @param {[() => boolean, (v: boolean) => void]} signalPair - [getter, setter] from signal()
 * @returns {{ checked: () => boolean, onchange: (e: Event) => void }}
 */
export function bindCheckbox([get, set]) {
  return {
    checked: () => get(),
    onchange: (e) => set(e.target.checked)
  }
}

/**
 * Two-way binding for select elements
 * @param {[() => string, (v: string) => void]} signalPair - [getter, setter] from signal()
 * @returns {{ value: () => string, onchange: (e: Event) => void }}
 */
export function bindSelect([get, set]) {
  return {
    value: () => get(),
    onchange: (e) => set(e.target.value)
  }
}

/**
 * Two-way binding for radio button groups
 * @param {[() => string, (v: string) => void]} signalPair - [getter, setter] from signal()
 * @param {string} radioValue - The value this radio button represents
 * @returns {{ value: string, checked: () => boolean, onchange: (e: Event) => void }}
 */
export function bindRadio([get, set], radioValue) {
  return {
    value: radioValue,
    checked: () => get() === radioValue,
    onchange: (e) => {
      if (e.target.checked) set(radioValue)
    }
  }
}

/**
 * Two-way binding for number inputs
 * @param {[() => number, (v: number) => void]} signalPair - [getter, setter] from signal()
 * @returns {{ value: () => number, oninput: (e: Event) => void }}
 */
export function bindNumber([get, set]) {
  return {
    value: () => get(),
    oninput: (e) => {
      const num = parseFloat(e.target.value)
      if (!isNaN(num)) {
        set(num)
      }
    }
  }
}

/**
 * Form submission handler that prevents default and extracts FormData
 * @param {(data: FormData) => void} callback - Function to call with form data
 * @returns {{ onsubmit: (e: Event) => void }}
 */
export function handleForm(callback) {
  return {
    onsubmit: (e) => {
      e.preventDefault()
      const data = new FormData(e.target)
      callback(data)
    }
  }
}

/**
 * Validation: checks if value is not empty
 * @param {string} value - Value to validate
 * @returns {string|null} - Error message or null if valid
 */
export function required(value) {
  if (value == null || !value.trim()) {
    return "This field is required"
  }
  return null
}

/**
 * Validation: checks if value meets minimum length
 * @param {string} value - Value to validate
 * @param {number} min - Minimum length required
 * @returns {string|null} - Error message or null if valid
 */
export function minLength(value, min) {
  if (value == null || value.trim().length < min) {
    return `Must be at least ${min} characters`
  }
  return null
}

/**
 * Validation: checks if value doesn't exceed maximum length
 * @param {string} value - Value to validate
 * @param {number} max - Maximum length allowed
 * @returns {string|null} - Error message or null if valid
 */
export function maxLength(value, max) {
  if (value == null || value.trim().length > max) {
    return `Must be at most ${max} characters`
  }
  return null
}

/**
 * Validation: checks if value is a valid email address
 * @param {string} value - Value to validate
 * @returns {string|null} - Error message or null if valid
 */
export function email(value) {
  if (value == null) {
    return "Please enter a valid email address"
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value.trim())) {
    return "Please enter a valid email address"
  }
  return null
}
