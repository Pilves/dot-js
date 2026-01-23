/**
 * mount(element, container)
 *
 * @param {Node} element  - element to mount from html ``
 * @param {HTMLElement} container - target container element
 *
 * Behavior:
 *  1. clear container
 *  2. append element to the container
 */
export function mount(element, container) {
  container.replaceChildren()
  container.appendChild(element)
}

/**
 * unmount(container)
 *
 * @param {HTMLElement} container - target container element
 *
 * Behavior:
 *  - clears the container
 */
export function unmount(container) {
  container.replaceChildren()
}
