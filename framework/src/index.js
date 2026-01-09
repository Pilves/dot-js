// Barrel export file for the framework public API

// Reactive primitives
export { signal, effect, computed } from './core/signal.js'

// Template system
export { html } from './core/template.js'

// Component mounting
export { mount } from './core/component.js'

// Router
export { createRouter } from './core/router.js'

// Form utilities
export {
  bind,
  bindCheckbox,
  bindSelect,
  bindRadio,
  bindNumber,
  handleForm,
  required,
  minLength,
  maxLength,
  email
} from './core/form.js'

// Virtual list for efficient rendering of large lists
export { createVirtualList } from './core/virtual-list.js'
