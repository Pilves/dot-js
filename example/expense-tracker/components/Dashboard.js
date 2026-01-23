/**
 * Dashboard Component
 * Demonstrates: computed, list, delegate, conditionalClass
 */
import { html } from '../../../framework/src/core/template.js'
import { list } from '../../../framework/src/core/list.js'
import { delegate } from '../../../framework/src/core/events.js'
import { conditionalClass } from '../../../framework/src/core/utils.js'
import { CategoryTags } from './CategoryTags.js'
import { ExpenseItem } from './ExpenseItem.js'
import { ExpenseList } from './ExpenseList.js'
import {
  expenses,
  monthlyTotal,
  averageExpense,
  isOverBudget,
  recentExpenses,
  unpaidExpenses,
  settings,
  formatCurrency
} from '../store.js'

export function Dashboard(router) {
  // Conditional class for over-budget styling
  const budgetClass = conditionalClass(
    'stat-value',
    'over-budget',
    isOverBudget
  )

  // Handle click on expense item (for recent list)
  const handleExpenseClick = delegate('.expense-item', (event, target) => {
    const expenseId = target.dataset.id
    if (expenseId) {
      router.navigate(`/expense/${expenseId}`)
    }
  })

  // Handler for virtual list selection
  const onSelectExpense = (expenseId) => {
    router.navigate(`/expense/${expenseId}`)
  }

  return html`
    <div>
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Monthly Spending</div>
          <div class="${budgetClass}">
            ${() => formatCurrency(monthlyTotal())}
          </div>
          <div class="stat-label" style="margin-top: 4px;">
            Budget: ${() => formatCurrency(settings().monthlyBudget)}
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Average Expense</div>
          <div class="stat-value">
            ${() => formatCurrency(averageExpense())}
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Unpaid</div>
          <div class="stat-value" style="color: var(--warning)">
            ${() => unpaidExpenses().length}
          </div>
        </div>
      </div>

      <!-- Category Filter Tags -->
      <div class="card">
        <div class="card-title">Filter by Category</div>
        ${CategoryTags()}
      </div>

      <!-- Recent Expenses with list() -->
      <div class="card">
        <div class="card-title">Recent Expenses</div>

        ${() => recentExpenses().length === 0
          ? html`<div class="empty-state">No expenses yet. Add your first expense!</div>`
          : html`
            <ul class="expense-list" onclick=${handleExpenseClick}>
              ${list(
                recentExpenses,
                (expense) => expense.id,
                (expense) => ExpenseItem(expense)
              )}
            </ul>
          `
        }

        <div style="margin-top: 16px; text-align: center;">
          <a href="#/add" class="btn btn-primary">+ Add Expense</a>
        </div>
      </div>

      <!-- All Expenses with Virtual List (for large datasets) -->
      ${() => expenses().length > 5 ? ExpenseList(onSelectExpense) : ''}
    </div>
  `
}
