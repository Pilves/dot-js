import { signal } from './signal.js'

/**
 * HTTP Error class for non-2xx responses
 */
export class HttpError extends Error {
  constructor(response, body) {
    super(`HTTP Error: ${response.status} ${response.statusText}`)
    this.name = 'HttpError'
    this.status = response.status
    this.statusText = response.statusText
    this.response = response
    this.body = body
  }
}

/**
 * Default options for all requests
 */
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
}

/**
 * Merge headers with defaults
 * @param {Object} options - User provided options
 * @returns {Object} - Merged options
 */
function mergeOptions(options = {}) {
  return {
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  }
}

/**
 * Process response - parse JSON and handle errors
 * @param {Response} response - Fetch response
 * @returns {Promise<any>} - Parsed response data
 */
async function processResponse(response) {
  let body = null

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      body = await response.json()
    } catch (e) {
      body = null
    }
  } else {
    try {
      body = await response.text()
    } catch (e) {
      body = null
    }
  }

  if (!response.ok) {
    throw new HttpError(response, body)
  }

  return body
}

/**
 * HTTP GET request
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export function get(url, options = {}) {
  const merged = mergeOptions(options)
  return fetch(url, {
    method: 'GET',
    ...merged
  }).then(processResponse)
}

/**
 * HTTP POST request
 * @param {string} url - Request URL
 * @param {any} body - Request body (will be JSON stringified)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export function post(url, body, options = {}) {
  const merged = mergeOptions(options)
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    ...merged
  }).then(processResponse)
}

/**
 * HTTP PUT request
 * @param {string} url - Request URL
 * @param {any} body - Request body (will be JSON stringified)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export function put(url, body, options = {}) {
  const merged = mergeOptions(options)
  return fetch(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...merged
  }).then(processResponse)
}

/**
 * HTTP PATCH request
 * @param {string} url - Request URL
 * @param {any} body - Request body (will be JSON stringified)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export function patch(url, body, options = {}) {
  const merged = mergeOptions(options)
  return fetch(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...merged
  }).then(processResponse)
}

/**
 * HTTP DELETE request
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
function del(url, options = {}) {
  const merged = mergeOptions(options)
  return fetch(url, {
    method: 'DELETE',
    ...merged
  }).then(processResponse)
}

// Export delete as 'del' since 'delete' is reserved keyword
export { del as delete }

/**
 * Reactive async state helper that integrates with the signal system
 * @param {() => Promise<any>} asyncFn - Async function to execute
 * @returns {Object} - { data, loading, error, refetch }
 */
export function useAsync(asyncFn) {
  const [data, setData] = signal(null)
  const [loading, setLoading] = signal(true)
  const [error, setError] = signal(null)

  async function execute() {
    setLoading(true)
    setError(null)

    try {
      const result = await asyncFn()
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  // Run immediately on creation
  execute()

  return {
    data,
    loading,
    error,
    refetch: execute
  }
}

/**
 * HTTP client object with all methods
 */
export const http = {
  get,
  post,
  put,
  patch,
  delete: del
}
