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
