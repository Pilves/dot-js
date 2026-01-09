/**
 * TodoItem component
 * Demonstrates: event handling, style binding, conditional classes
 */
import { html } from '../../framework/src/core/template.js'
import { toggleTodo, deleteTodo } from '../store.js'

/**
 * Single todo item
 * @param {Object} todo - { id, text, completed }
 */
export function TodoItem(todo) {
  // Dynamic style for completed todos
  const itemStyle = () => ({
    textDecoration: todo.completed ? 'line-through' : 'none',
    opacity: todo.completed ? '0.6' : '1'
  })

  // Dynamic class based on completion state
  const itemClass = () => todo.completed ? 'todo-item completed' : 'todo-item'

  // Handle toggle click
  const handleToggle = () => {
    toggleTodo(todo.id)
  }

  // Handle delete click
  const handleDelete = () => {
    deleteTodo(todo.id)
  }

  return html`
    <li class="${itemClass}" style="${itemStyle}">
      <label class="todo-label">
        <input
          type="checkbox"
          class="todo-checkbox"
          checked="${todo.completed}"
          onclick="${handleToggle}"
        />
        <span class="todo-text">${todo.text}</span>
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
