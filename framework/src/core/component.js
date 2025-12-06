/**
 * mount(element, container)
 *
 * @param {Node} element  - element to  mount  from html ``
 * @param {HTMLElement} contaner - target container element
 *
 * Behavion:
 *  1. clear container
 *  2. append element to the container
 */
export function mount(element, container) {
  container.innerHTML =  ""
  container.appendChild(element)
  
}





