/**
 * Minimal test runner for the dot-js framework
 * Supports ES modules and provides simple test/assert utilities
 */

// Track test results
const results = {
  passed: 0,
  failed: 0,
  suites: []
}

let currentSuite = null

/**
 * Define a test suite
 * @param {string} name - Suite name
 * @param {() => void | Promise<void>} fn - Suite function containing tests
 */
export async function describe(name, fn) {
  currentSuite = {
    name,
    tests: [],
    passed: 0,
    failed: 0
  }
  results.suites.push(currentSuite)

  console.log(`\n  ${name}`)

  await fn()

  currentSuite = null
}

/**
 * Define a test
 * @param {string} name - Test name
 * @param {() => void | Promise<void>} fn - Test function
 */
export async function test(name, fn) {
  try {
    await fn()
    results.passed++
    if (currentSuite) currentSuite.passed++
    console.log(`    \x1b[32m✓\x1b[0m ${name}`)
  } catch (error) {
    results.failed++
    if (currentSuite) currentSuite.failed++
    console.log(`    \x1b[31m✗\x1b[0m ${name}`)
    console.log(`      \x1b[31m${error.message}\x1b[0m`)
    if (error.expected !== undefined && error.actual !== undefined) {
      console.log(`      Expected: ${JSON.stringify(error.expected)}`)
      console.log(`      Actual:   ${JSON.stringify(error.actual)}`)
    }
  }
}

// Alias for test
export const it = test

/**
 * Assertion utilities
 */
export const assert = {
  /**
   * Assert that a value is truthy
   */
  ok(value, message = 'Expected value to be truthy') {
    if (!value) {
      const error = new Error(message)
      error.actual = value
      error.expected = 'truthy value'
      throw error
    }
  },

  /**
   * Assert strict equality
   */
  equal(actual, expected, message) {
    if (actual !== expected) {
      const error = new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
      error.actual = actual
      error.expected = expected
      throw error
    }
  },

  /**
   * Assert deep equality for objects and arrays
   */
  deepEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual)
    const expectedStr = JSON.stringify(expected)
    if (actualStr !== expectedStr) {
      const error = new Error(message || `Expected deep equality`)
      error.actual = actual
      error.expected = expected
      throw error
    }
  },

  /**
   * Assert that a value is of a certain type
   */
  type(value, expectedType, message) {
    const actualType = typeof value
    if (actualType !== expectedType) {
      const error = new Error(message || `Expected type ${expectedType}, got ${actualType}`)
      error.actual = actualType
      error.expected = expectedType
      throw error
    }
  },

  /**
   * Assert that a function throws
   */
  throws(fn, message = 'Expected function to throw') {
    try {
      fn()
      throw new Error(message)
    } catch (error) {
      if (error.message === message) {
        throw error
      }
      // Function threw as expected
    }
  },

  /**
   * Assert that a value is an instance of a class
   */
  instance(value, constructor, message) {
    if (!(value instanceof constructor)) {
      const error = new Error(message || `Expected instance of ${constructor.name}`)
      error.actual = value?.constructor?.name || typeof value
      error.expected = constructor.name
      throw error
    }
  },

  /**
   * Assert that an array contains a value
   */
  contains(array, value, message) {
    if (!array.includes(value)) {
      const error = new Error(message || `Expected array to contain ${JSON.stringify(value)}`)
      error.actual = array
      error.expected = `to contain ${JSON.stringify(value)}`
      throw error
    }
  }
}

/**
 * Print final test results summary
 */
export function summary() {
  console.log('\n' + '─'.repeat(50))

  const total = results.passed + results.failed
  const status = results.failed === 0 ? '\x1b[32m' : '\x1b[31m'

  console.log(`${status}Tests: ${results.passed} passed, ${results.failed} failed, ${total} total\x1b[0m`)
  console.log('─'.repeat(50))

  // Return exit code
  return results.failed === 0 ? 0 : 1
}

/**
 * Run and exit with appropriate code
 */
export function exit() {
  const code = summary()
  process.exit(code)
}

/**
 * Reset results (useful for running multiple test files)
 */
export function reset() {
  results.passed = 0
  results.failed = 0
  results.suites = []
}
