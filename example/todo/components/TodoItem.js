/**
 * TodoItem component
 * Demonstrates: event handling, style binding, conditional classes, bindCheckbox, stopPropagation
 */
import { html } from '../../../framework/src/core/template.js'
import { signal } from '../../../framework/src/core/signal.js'
import { bindCheckbox } from '../../../framework/src/core/form.js'
import { conditionalClass } from '../../../framework/src/core/utils.js'
import { toggleTodo, deleteTodo } from '../store.js'

/**
 * Single todo item
 * @param {Object} todo - { id, text, completed }
 */
export function TodoItem(todo) {
  // Signal for checkbox state - synced with todo.completed
  const [isCompleted, setCompleted] = signal(todo.completed)

  // Checkbox binding using framework helper
  const checkboxBinding = bindCheckbox([isCompleted, (checked) => {
    setCompleted(checked)
    toggleTodo(todo.id)
  }])

  // Dynamic style for completed todos
  const itemStyle = () => ({
    textDecoration: isCompleted() ? 'line-through' : 'none',
    opacity: isCompleted() ? '0.6' : '1'
  })

  // Dynamic class using conditionalClass utility
  const itemClass = conditionalClass('todo-item', 'completed', isCompleted)

  // Handle delete click
  // stopPropagation prevents the click from bubbling to the parent label,
  // which would toggle the checkbox unintentionally
  const handleDelete = (e) => {
    e.stopPropagation()
    deleteTodo(todo.id)
  }

  return html`
    <li class="${itemClass}" style="${() => itemStyle()}">
      <label class="todo-label">
        <input
          type="checkbox"
          class="todo-checkbox"
          checked="${checkboxBinding.checked}"
          onchange="${checkboxBinding.onchange}"
        />
        <span class="todo-text">${todo.text}</span>
        <a href="#/todo/${todo.id}" class="todo-detail-link" title="View details">i</a>
      </label>
      <button
        class="delete-btn"
        onclick="${handleDelete}"
        title="Delete todo"
      >
        x
      </button>
    </li>
  `
}
