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
 * Internal request helper
 */
function _request(method, url, body = null, options = {}) {
  const merged = mergeOptions(options)
  const config = {
    method,
    ...merged
  }
  if (body !== null) {
    config.body = JSON.stringify(body)
  }
  return fetch(url, config).then(processResponse)
}

export function get(url, options = {}) {
  return _request('GET', url, null, options)
}

export function post(url, body, options = {}) {
  return _request('POST', url, body, options)
}

export function put(url, body, options = {}) {
  return _request('PUT', url, body, options)
}

export function patch(url, body, options = {}) {
  return _request('PATCH', url, body, options)
}

function del(url, options = {}) {
  return _request('DELETE', url, null, options)
}

// Export delete as 'del' since 'delete' is reserved keyword
export { del as delete }

/**
 * Reactive async state helper that integrates with the signal system
 * @param {(signal: AbortSignal) => Promise<any>} asyncFn - Async function to execute (receives AbortSignal)
 * @returns {Object} - { data, loading, error, refetch, abort }
 */
export function useAsync(asyncFn) {
  const [data, setData] = signal(null)
  const [loading, setLoading] = signal(true)
  const [error, setError] = signal(null)

  let abortController = null
  let isCancelled = false

  async function execute() {
    // Abort any pending request
    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()
    const currentController = abortController

    setLoading(true)
    setError(null)

    try {
      const result = await asyncFn(currentController.signal)
      // Only update state if this request wasn't aborted
      if (!currentController.signal.aborted && !isCancelled) {
        setData(result)
      }
    } catch (err) {
      // Ignore abort errors, they're expected
      if (err.name === 'AbortError') return
      if (!currentController.signal.aborted && !isCancelled) {
        setError(err)
      }
    } finally {
      if (!currentController.signal.aborted && !isCancelled) {
        setLoading(false)
      }
    }
  }

  function abort() {
    isCancelled = true
    if (abortController) {
      abortController.abort()
    }
  }

  // Run immediately on creation
  execute()

  return {
    data,
    loading,
    error,
    refetch: execute,
    abort
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
