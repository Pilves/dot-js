/**
 * TodoDetail component
 * Demonstrates: route params, single item view
 */
import { html } from '../../../framework/src/core/template.js'
import { signal } from '../../../framework/src/core/signal.js'
import { bindCheckbox } from '../../../framework/src/core/form.js'
import { conditionalClass } from '../../../framework/src/core/utils.js'
import { getTodoById, toggleTodo, deleteTodo } from '../store.js'

/**
 * Detail view for a single todo
 * @param {Object} params - Route params { id }
 */
export function TodoDetail(params) {
  const todo = getTodoById(params.id)

  // Handle not found
  if (!todo) {
    return html`
      <div class="todo-detail not-found">
        <h2>Todo Not Found</h2>
        <p>The todo you're looking for doesn't exist.</p>
        <a href="#/" class="back-link">Back to list</a>
      </div>
    `
  }

  // Signal for checkbox state
  const [isCompleted, setCompleted] = signal(todo.completed)

  // Checkbox binding
  const checkboxBinding = bindCheckbox([isCompleted, (checked) => {
    setCompleted(checked)
    toggleTodo(todo.id)
  }])

  // Dynamic class for status
  const statusClass = conditionalClass('status', 'completed', isCompleted)

  // Handle delete and navigate back
  const handleDelete = () => {
    deleteTodo(todo.id)
    window.location.hash = '/'
  }

  return html`
    <div class="todo-detail">
      <a href="#/" class="back-link">Back to list</a>

      <div class="detail-card">
        <h2>Todo Details</h2>

        <div class="detail-row">
          <span class="label">ID:</span>
          <span class="value">${todo.id}</span>
        </div>

        <div class="detail-row">
          <span class="label">Text:</span>
          <span class="value">${todo.text}</span>
        </div>

        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="${statusClass}">
            ${() => isCompleted() ? 'Completed' : 'Active'}
          </span>
        </div>

        <div class="detail-actions">
          <label class="toggle-label">
            <input
              type="checkbox"
              checked="${checkboxBinding.checked}"
              onchange="${checkboxBinding.onchange}"
            />
            Mark as ${() => isCompleted() ? 'active' : 'completed'}
          </label>

          <button class="delete-btn" onclick="${handleDelete}">
            Delete Todo
          </button>
        </div>
      </div>
    </div>
  `
}
