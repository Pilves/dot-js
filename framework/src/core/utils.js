/**
 * Counter for generating unique IDs within same millisecond
 */
let idCounter = 0
let lastTimestamp = 0

/**
 * Generate a unique ID
 * Uses timestamp + counter + random to ensure uniqueness even in rapid succession
 * @returns {string} - Unique identifier
 */
export function generateId() {
  const timestamp = Date.now()

  // Reset counter if we're in a new millisecond
  if (timestamp !== lastTimestamp) {
    idCounter = 0
    lastTimestamp = timestamp
  }

  // Increment counter for same-millisecond calls
  idCounter++

  return timestamp.toString(36) + idCounter.toString(36) + Math.random().toString(36).slice(2, 7)
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
