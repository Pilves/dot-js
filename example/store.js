/**
 * Shared state store using signals
 * Demonstrates: signal, computed
 */
import { signal, computed, createPersistedSignal } from '../framework/src/core/signal.js'

// Todo items signal - array of { id, text, completed }
// Uses persisted signal to save todos across browser sessions
const [todos, setTodos] = createPersistedSignal('dot-js-todos', [])

// Next ID for new todos - calculated from existing todos
const getNextId = () => {
  const currentTodos = todos()
  return currentTodos.length > 0
    ? Math.max(...currentTodos.map(t => t.id)) + 1
    : 1
}

// Current filter signal - 'all' | 'active' | 'completed'
const [filter, setFilter] = signal('all')

// Computed: filtered todos based on current filter
const filteredTodos = computed(() => {
  const currentFilter = filter()
  const allTodos = todos()

  switch (currentFilter) {
    case 'active':
      return allTodos.filter(todo => !todo.completed)
    case 'completed':
      return allTodos.filter(todo => todo.completed)
    default:
      return allTodos
  }
})

// Computed: count of active (incomplete) todos
const activeCount = computed(() => {
  return todos().filter(todo => !todo.completed).length
})

// Computed: count of completed todos
const completedCount = computed(() => {
  return todos().filter(todo => todo.completed).length
})

// Computed: total todos count
const totalCount = computed(() => {
  return todos().length
})

// Actions
function addTodo(text) {
  if (text.trim()) {
    setTodos(current => [...current, {
      id: getNextId(),
      text: text.trim(),
      completed: false
    }])
  }
}

function toggleTodo(id) {
  setTodos(current => current.map(todo =>
    todo.id === id
      ? { ...todo, completed: !todo.completed }
      : todo
  ))
}

function deleteTodo(id) {
  setTodos(current => current.filter(todo => todo.id !== id))
}

function clearCompleted() {
  setTodos(current => current.filter(todo => !todo.completed))
}

// Export store
export {
  todos,
  setTodos,
  filter,
  setFilter,
  filteredTodos,
  activeCount,
  completedCount,
  totalCount,
  addTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted
}
