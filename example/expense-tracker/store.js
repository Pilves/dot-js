/**
 * Expense Tracker Store
 * Demonstrates: signal, computed, createPersistedSignal, generateId
 */
import { signal, computed, createPersistedSignal } from '../../framework/src/core/signal.js'
import { generateId } from '../../framework/src/core/utils.js'
import { sampleExpenses, categories } from './data.js'

// Initialize expenses from localStorage, merge with sample data if empty
const [expenses, setExpenses] = createPersistedSignal('expense-tracker-expenses', [])

// Initialize with sample data if localStorage is empty
if (expenses().length === 0) {
  setExpenses(sampleExpenses)
}

// Settings with persistence
const [settings, setSettings] = createPersistedSignal('expense-tracker-settings', {
  currency: 'USD',
  darkMode: false,
  monthlyBudget: 1000
})

// Current filter for expense list
const [categoryFilter, setCategoryFilter] = signal('all')

// Search query
const [searchQuery, setSearchQuery] = signal('')

// Computed: filtered expenses
const filteredExpenses = computed(() => {
  let result = expenses()
  const category = categoryFilter()
  const query = searchQuery().toLowerCase()

  if (category !== 'all') {
    result = result.filter(exp => exp.category === category)
  }

  if (query) {
    result = result.filter(exp =>
      exp.description.toLowerCase().includes(query)
    )
  }

  return result
})

// Computed: total of all expenses
const totalExpenses = computed(() => {
  return expenses().reduce((sum, exp) => sum + exp.amount, 0)
})

// Computed: monthly total (current month)
const monthlyTotal = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return expenses()
    .filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
    })
    .reduce((sum, exp) => sum + exp.amount, 0)
})

// Computed: average expense
const averageExpense = computed(() => {
  const all = expenses()
  if (all.length === 0) return 0
  return totalExpenses() / all.length
})

// Computed: expenses by category
const expensesByCategory = computed(() => {
  const byCategory = {}
  categories.forEach(cat => {
    byCategory[cat.id] = expenses()
      .filter(exp => exp.category === cat.id)
      .reduce((sum, exp) => sum + exp.amount, 0)
  })
  return byCategory
})

// Computed: is over budget
const isOverBudget = computed(() => {
  return monthlyTotal() > settings().monthlyBudget
})

// Computed: recent expenses (last 5)
const recentExpenses = computed(() => {
  return [...expenses()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
})

// Computed: unpaid expenses
const unpaidExpenses = computed(() => {
  return expenses().filter(exp => !exp.isPaid)
})

// Computed: recurring expenses
const recurringExpenses = computed(() => {
  return expenses().filter(exp => exp.isRecurring)
})

// Actions
function addExpense(expense) {
  const newExpense = {
    id: generateId(),
    isPaid: false,
    isRecurring: false,
    receiptEmail: '',
    ...expense
  }
  setExpenses(current => [...current, newExpense])
  return newExpense.id
}

function getExpenseById(id) {
  return expenses().find(exp => exp.id === id)
}

function updateExpense(id, updates) {
  setExpenses(current => current.map(exp =>
    exp.id === id ? { ...exp, ...updates } : exp
  ))
}

function deleteExpense(id) {
  setExpenses(current => current.filter(exp => exp.id !== id))
}

function duplicateExpense(id) {
  const original = getExpenseById(id)
  if (!original) return null

  const duplicate = {
    ...original,
    id: generateId(),
    date: new Date().toISOString().split('T')[0],
    isPaid: false
  }
  setExpenses(current => [...current, duplicate])
  return duplicate.id
}

function markAsPaid(id) {
  updateExpense(id, { isPaid: true })
}

function updateSettings(updates) {
  setSettings(current => ({ ...current, ...updates }))
}

// Format currency
function formatCurrency(amount) {
  const curr = settings().currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr
  }).format(amount)
}

export {
  // Signals
  expenses,
  setExpenses,
  settings,
  setSettings,
  categoryFilter,
  setCategoryFilter,
  searchQuery,
  setSearchQuery,

  // Computed
  filteredExpenses,
  totalExpenses,
  monthlyTotal,
  averageExpense,
  expensesByCategory,
  isOverBudget,
  recentExpenses,
  unpaidExpenses,
  recurringExpenses,

  // Actions
  addExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  duplicateExpense,
  markAsPaid,
  updateSettings,
  formatCurrency
}
