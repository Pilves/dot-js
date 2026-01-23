/**
 * Generate a unique ID
 * @returns {string} - Unique identifier
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11)
}

/**
 * Conditionally apply a CSS class
 * @param {string} base - Base class name
 * @param {string} active - Class to add when condition is true
 * @param {boolean|Function} condition - Boolean or getter function
 * @returns {Function} - Getter returning the class string
 */
export function conditionalClass(base, active, condition) {
  return () => {
    const isActive = typeof condition === 'function' ? condition() : condition
    return isActive ? `${base} ${active}` : base
  }
}
