/**
 * ExpenseItem Component
 * Demonstrates: conditionalClass for styling
 */
import { html } from '../../../framework/src/core/template.js'
import { conditionalClass } from '../../../framework/src/core/utils.js'
import { categories } from '../data.js'
import { formatCurrency } from '../store.js'

export function ExpenseItem(expense) {
  const category = categories.find(c => c.id === expense.category) || categories[6]

  // conditionalClass for unpaid expenses
  const itemClass = conditionalClass(
    'expense-item',
    'unpaid',
    !expense.isPaid
  )

  return html`
    <li
      class="${itemClass}"
      data-id="${expense.id}"
    >
      <span
        class="expense-category-dot"
        style="background: ${category.color}"
      ></span>
      <div class="expense-info">
        <div class="expense-description">
          ${expense.description}
          ${expense.isRecurring ? html`<span class="badge badge-info">Recurring</span>` : ''}
        </div>
        <div class="expense-meta">
          ${category.label} · ${expense.date} · ${expense.paymentMethod}
        </div>
      </div>
      <div class="expense-amount">
        ${formatCurrency(expense.amount)}
      </div>
    </li>
  `
}
