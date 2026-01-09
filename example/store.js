/**
 * Shared state store using signals
 * Demonstrates: signal, computed
 */
import { signal, computed } from '../framework/src/core/signal.js'

// Todo items signal - array of { id, text, completed }
const [todos, setTodos] = signal([
  { id: 1, text: 'Learn the framework', completed: true },
  { id: 2, text: 'Build a todo app', completed: false },
  { id: 3, text: 'Master reactivity', completed: false }
])

// Next ID for new todos
let nextId = 4

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
      id: nextId++,
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
