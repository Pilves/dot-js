/**
 * Event delegation utility
 * Allows handling events from child elements at a parent level
 */

/**
 * Create a delegated event handler
 * @param {string} selector - CSS selector to match target elements
 * @param {Function} handler - Event handler function
 * @returns {Function} - Delegated event handler
 *
 * @example
 * html`<ul onclick=${delegate('li', (e, target) => console.log(target.textContent))}>
 *   <li>Item 1</li>
 *   <li>Item 2</li>
 * </ul>`
 */
export function delegate(selector, handler) {
  return function(e) {
    const target = e.target.closest(selector)
    if (target && e.currentTarget.contains(target)) {
      handler(e, target)
    }
  }
}

/**
 * Create multiple delegated handlers for a single parent
 * @param {Object} handlers - Map of selector to handler
 * @returns {Function} - Combined delegated event handler
 *
 * @example
 * html`<div onclick=${delegateAll({
 *   '.edit-btn': (e, target) => edit(target.dataset.id),
 *   '.delete-btn': (e, target) => remove(target.dataset.id)
 * })}>...</div>`
 */
export function delegateAll(handlers) {
  return function(e) {
    for (const [selector, handler] of Object.entries(handlers)) {
      const target = e.target.closest(selector)
      if (target && e.currentTarget.contains(target)) {
        handler(e, target)
        return
      }
    }
  }
}
