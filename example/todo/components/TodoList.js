import { html } from '../../../framework/src/core/template.js'
import { filteredTodos } from '../store.js'
import { TodoItem } from './TodoItem.js'
import { list } from '../../../framework/src/core/list.js'

export function TodoList() {
  // Check if there are any todos to show
  const hasTodos = () => filteredTodos().length > 0

  return html`
    <div class="empty-state" style="display: ${() => hasTodos() ? 'none' : 'block'}">
      <p>No todos to show</p>
    </div>

    <ul class="todo-list" style="display: ${() => hasTodos() ? 'block' : 'none'}">
      ${list(filteredTodos, todo => todo.id, TodoItem)}
    </ul>
  `
}
