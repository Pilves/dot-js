// Barrel export file for the framework public API

// Reactive primitives
export { signal, effect, computed, createPersistedSignal } from './core/signal.js'

// Template system
export { html } from './core/template.js'

// Component mounting
export { mount, unmount } from './core/component.js'

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

// HTTP utilities
export { http, useAsync, HttpError } from './core/http.js'

// List rendering
export { list, each } from './core/list.js'

// Virtual list for efficient rendering of large lists
export { createVirtualList } from './core/virtual-list.js'

// Event delegation
export { delegate, delegateAll } from './core/events.js'

// Utilities
export { generateId, conditionalClass } from './core/utils.js'
