/**
 * Effect stack for nested effect support
 * Using a stack instead of single variable allows effects to nest properly
 */
const effectStack = []

/**
 * Create a reactive signal
 * @param {any} initialValue - Initial value for the signal
 * @returns {[() => any, (newValue: any) => void]} - [getter, setter]
 */
export function signal(initialValue) {
  let value = initialValue
  const subscribers = new Set()

  /**
   * Read the current value
   * If called inside an effect, registers that effect as a subscriber
   */
  function read() {
    const running = effectStack[effectStack.length - 1]
    if (running) {
      subscribers.add(running)
      // Track this subscriber set so effect can clean up later
      running.dependencies.add(subscribers)
    }
    return value
  }

  /**
   * Write a new value
   * Accepts either a value or an updater function
   */
  function write(newValue) {
    const nextValue = typeof newValue === "function" ? newValue(value) : newValue
    if (nextValue !== value) {
      value = nextValue
      // Copy subscribers to avoid mutation during iteration
      // (an effect might add/remove subscribers while running)
      Array.from(subscribers).forEach(fn => {
        // Infinite loop protection: skip if effect is already running
        if (!fn.running) {
          fn()
        }
      })
    }
  }

  return [read, write]
}

/**
 * Remove an effect from all signals it subscribed to
 * Called before re-running (to clear stale deps) and on dispose
 * @param {Function} effect - The effect function to clean up
 */
function cleanup(effect) {
  for (const deps of effect.dependencies) {
    deps.delete(effect)
  }
  effect.dependencies.clear()
}

/**
 * Create a reactive effect that re-runs when dependencies change
 * @param {() => void} fn - Function to run reactively
 * @returns {() => void} - Dispose function to stop the effect
 */
export function effect(fn) {
  const execute = () => {
    // Infinite loop protection: skip if already running
    if (execute.running) {
      console.warn("Effect tried to run recursively, skipping")
      return
    }

    // Clear old dependencies before re-running
    // This fixes stale deps from conditional reads
    cleanup(execute)

    execute.running = true
    effectStack.push(execute)
    try {
      fn()
    } finally {
      // Always clean up stack even if effect throws
      effectStack.pop()
      execute.running = false
    }
  }

  // Track which signal subscriber Sets this effect is in
  execute.dependencies = new Set()
  execute.running = false

  // Run immediately to establish initial dependencies
  execute()

  // Return dispose function
  return () => cleanup(execute)
}

/**
 * Create a computed value that updates when dependencies change
 * @param {() => any} fn - Function that calculates the result
 * @returns {() => any} - Getter function for the computed value
 */
export function computed(fn) {
  const [value, setValue] = signal(undefined)

  // The effect automatically tracks dependencies in fn()
  const dispose = effect(() => {
    setValue(fn())
  })

  // Attach dispose to the getter for optional cleanup
  value.dispose = dispose

  return value
}

/**
 * Check if localStorage is available
 * Handles cases where localStorage is disabled, in private browsing, or unavailable
 * @returns {boolean} - Whether localStorage is available
 */
function isLocalStorageAvailable() {
  try {
    const testKey = "__dot_js_storage_test__"
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Create a reactive signal that persists to localStorage
 * @param {string} key - The localStorage key to use for persistence
 * @param {any} defaultValue - Default value if no stored value exists
 * @returns {[() => any, (newValue: any) => void]} - [getter, setter]
 */
export function createPersistedSignal(key, defaultValue) {
  const storageAvailable = isLocalStorageAvailable()

  /**
   * Load initial value from localStorage
   * Falls back to defaultValue if not found or on error
   */
  function loadInitialValue() {
    if (!storageAvailable) {
      return defaultValue
    }

    try {
      const stored = window.localStorage.getItem(key)
      if (stored === null) {
        return defaultValue
      }
      return JSON.parse(stored)
    } catch (e) {
      // JSON parse error or other issue, use default
      console.warn(`Failed to load persisted signal "${key}":`, e)
      return defaultValue
    }
  }

  /**
   * Save value to localStorage
   * Silently fails if localStorage is unavailable
   */
  function saveToStorage(value) {
    if (!storageAvailable) {
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      // Quota exceeded or other storage error
      console.warn(`Failed to persist signal "${key}":`, e)
    }
  }

  // Create the underlying signal with loaded value
  const [read, write] = signal(loadInitialValue())

  /**
   * Wrapped setter that also persists to localStorage
   * Accepts either a value or an updater function
   */
  function persistedWrite(newValue) {
    // Get the current value for updater functions
    const currentValue = read()
    const nextValue = typeof newValue === "function" ? newValue(currentValue) : newValue

    // Save to storage before updating signal
    saveToStorage(nextValue)

    // Update the underlying signal
    write(nextValue)
  }

  return [read, persistedWrite]
}
