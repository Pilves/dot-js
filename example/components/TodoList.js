/**
 * TodoList component
 * Demonstrates: component composition, rendering arrays
 */
import { html } from '../../framework/src/core/template.js'
import { filteredTodos } from '../store.js'
import { TodoItem } from './TodoItem.js'

export function TodoList() {
  // Get the current filtered todos and map to TodoItem components
  const todoItems = filteredTodos().map(todo => TodoItem(todo))

  // Show empty state if no todos
  if (todoItems.length === 0) {
    return html`
      <div class="empty-state">
        <p>No todos to show</p>
      </div>
    `
  }

  return html`
    <ul class="todo-list">
      ${todoItems}
    </ul>
  `
}
