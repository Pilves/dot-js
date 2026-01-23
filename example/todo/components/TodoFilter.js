/**
 * TodoFilter component
 * Demonstrates: router navigation, conditional styling
 */
import { html } from '../../../framework/src/core/template.js'
import { filter, activeCount, completedCount, clearCompleted } from '../store.js'

/**
 * Filter navigation
 * @param {Object} router - router instance with navigate function
 */
export function TodoFilter(router) {
  // Handle filter click
  const handleAll = (e) => {
    e.preventDefault()
    router.navigate('/')
  }

  const handleActive = (e) => {
    e.preventDefault()
    router.navigate('/active')
  }

  const handleCompleted = (e) => {
    e.preventDefault()
    router.navigate('/completed')
  }

  const handleClearCompleted = () => {
    clearCompleted()
  }

  // Dynamic class for active filter link
  const allClass = () => filter() === 'all' ? 'filter-link active' : 'filter-link'
  const activeClass = () => filter() === 'active' ? 'filter-link active' : 'filter-link'
  const completedClass = () => filter() === 'completed' ? 'filter-link active' : 'filter-link'

  // Show/hide clear completed button
  const clearBtnStyle = () => ({
    display: completedCount() > 0 ? 'inline-block' : 'none'
  })

  return html`
    <footer class="todo-footer">
      <span class="todo-count">
        ${() => activeCount()} item${() => activeCount() === 1 ? '' : 's'} left
      </span>

      <nav class="filters">
        <a
          href="#/"
          class="${allClass}"
          onclick="${handleAll}"
        >All</a>
        <a
          href="#/active"
          class="${activeClass}"
          onclick="${handleActive}"
        >Active</a>
        <a
          href="#/completed"
          class="${completedClass}"
          onclick="${handleCompleted}"
        >Completed</a>
      </nav>

      <button
        class="clear-completed"
        style="${clearBtnStyle}"
        onclick="${handleClearCompleted}"
      >
        Clear completed
      </button>
    </footer>
  `
}
