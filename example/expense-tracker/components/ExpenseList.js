/**
 * ExpenseList Component
 * Demonstrates: createVirtualList, scrollToIndex, getVisibleRange, refresh, delegate
 */
import { html } from '../../../framework/src/core/template.js'
import { signal, effect } from '../../../framework/src/core/signal.js'
import { createVirtualList } from '../../../framework/src/core/virtual-list.js'
import { delegate } from '../../../framework/src/core/events.js'
import { filteredExpenses, formatCurrency } from '../store.js'
import { categories } from '../data.js'

export function ExpenseList(onSelectExpense) {
  // Track the virtual list instance
  let virtualList = null

  // Jump to index input
  const [jumpIndex, setJumpIndex] = signal(0)

  // Create the render function for each item
  const renderItem = (expense, index) => {
    const category = categories.find(c => c.id === expense.category) || categories[6]

    const item = document.createElement('div')
    item.className = `expense-item ${!expense.isPaid ? 'unpaid' : ''}`
    item.dataset.id = expense.id
    item.innerHTML = `
      <span class="expense-category-dot" style="background: ${category.color}"></span>
      <div class="expense-info">
        <div class="expense-description">
          ${expense.description}
          ${expense.isRecurring ? '<span class="badge badge-info">Recurring</span>' : ''}
        </div>
        <div class="expense-meta">
          ${category.label} · ${expense.date} · ${expense.paymentMethod}
        </div>
      </div>
      <div class="expense-amount">
        ${formatCurrency(expense.amount)}
      </div>
    `
    return item
  }

  // Create the virtual list
  virtualList = createVirtualList({
    items: filteredExpenses,
    itemHeight: 72,
    containerHeight: 400,
    buffer: 3,
    renderItem
  })

  // Delegate click events on the virtual list container
  virtualList.addEventListener('click', delegate('.expense-item', (event, target) => {
    const expenseId = target.dataset.id
    if (expenseId && onSelectExpense) {
      onSelectExpense(expenseId)
    }
  }))

  // Effect to refresh virtual list when filter changes
  effect(() => {
    // Read to track changes
    filteredExpenses()
    // Refresh the virtual list
    if (virtualList && virtualList._virtualList) {
      virtualList._virtualList.refresh()
    }
  })

  const handleJump = () => {
    const index = jumpIndex()
    if (virtualList && virtualList._virtualList) {
      virtualList._virtualList.scrollToIndex(index)
    }
  }

  // Get visible range for display
  const getRange = () => {
    if (virtualList && virtualList._virtualList) {
      const range = virtualList._virtualList.getVisibleRange()
      const total = filteredExpenses().length
      return `Showing ${range.startIndex + 1}-${Math.min(range.endIndex, total)} of ${total}`
    }
    return ''
  }

  return html`
    <div class="card">
      <div class="card-title">Expenses</div>

      <div class="virtual-list-info">
        ${getRange}
        <span style="margin-left: 16px;">
          Jump to:
          <input
            type="number"
            min="0"
            max="${() => filteredExpenses().length - 1}"
            value="${() => jumpIndex()}"
            oninput=${(e) => setJumpIndex(parseInt(e.target.value) || 0)}
            style="width: 60px; margin: 0 8px;"
          />
          <button class="btn btn-small btn-secondary" onclick=${handleJump}>Go</button>
        </span>
      </div>

      ${virtualList}
    </div>
  `
}
