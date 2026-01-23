import { signal } from "./signal.js";

/**
 * Normalize a path by removing query strings, hash fragments, and trailing slashes
 * @param {string} path - The path to normalize
 * @returns {string} The normalized path
 */
function normalizePath(path) {
  // Remove query string
  let normalized = path.split('?')[0]
  // Remove hash fragment (for hash-in-hash edge case)
  normalized = normalized.split('#')[0]
  // Remove trailing slash (except for root)
  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  return normalized || '/'
}

/**
 * Create a hash-based router
 * @param {Object.<string, Function>} routes - Route pattern to component mapping
 * @returns {Object} Router with current, navigate, matchRoute, and destroy functions
 */
export function createRouter(routes) {
  const [path, setPath] = signal(normalizePath(window.location.hash.slice(1) || '/'))

  /**
   * Handle hashchange events
   */
  const handleHashChange = () => {
    setPath(normalizePath(window.location.hash.slice(1) || '/'))
  }

  window.addEventListener('hashchange', handleHashChange)

  /**
   * Navigate to a new route
   * @param {string} to - The path to navigate to
   * @param {Object} [query={}] - Optional query parameters
   */
  function navigate(to, query = {}) {
    let hash = to
    const queryString = new URLSearchParams(query).toString()
    if (queryString) {
      hash += '?' + queryString
    }
    window.location.hash = hash
  }

  /**
   * Match a path against a route pattern
   * @param {string} pattern - Route pattern (e.g., '/user/:id')
   * @param {string} path - Actual path to match
   * @returns {Object|null} Params object if matched, null otherwise
   */
  function matchRoute(pattern, path) {
    const normalizedPath = normalizePath(path)
    const patternParts = pattern.split('/')
    const pathParts = normalizedPath.split('/')

    if (patternParts.length !== pathParts.length) {
      return null
    }

    const params = {}

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]
      const pathPart = pathParts[i]

      if (patternPart.startsWith(':')) {
        // Empty param = no match
        if (!pathPart) {
          return null
        }
        // Save the key with decoded value
        const key = patternPart.slice(1)
        params[key] = decodeURIComponent(pathPart)
      } else if (patternPart !== pathPart) {
        // Doesn't match
        return null
      }
      // If equal, continue
    }
    return params
  }

  /**
   * Get the current route's component and params
   * @returns {Object|null} Object with component and params, or null if no match
   */
  function current() {
    const currentPath = path()
    let wildcardRoute = null

    for (const pattern in routes) {
      // Handle wildcard pattern as catch-all (check it last)
      if (pattern === '*') {
        wildcardRoute = {
          component: routes[pattern],
          params: {}
        }
        continue
      }

      const params = matchRoute(pattern, currentPath)
      if (params !== null) {
        return {
          component: routes[pattern],
          params: params
        }
      }
    }

    // Return wildcard route if no other matches found
    return wildcardRoute
  }

  /**
   * Remove the hashchange listener and clean up
   */
  function destroy() {
    window.removeEventListener('hashchange', handleHashChange)
  }

  return {
    current,
    navigate,
    matchRoute,
    destroy
  }
}
