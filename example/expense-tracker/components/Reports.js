/**
 * Reports Component
 * Demonstrates: computed, list, effect
 */
import { html } from '../../../framework/src/core/template.js'
import { effect, computed } from '../../../framework/src/core/signal.js'
import { list } from '../../../framework/src/core/list.js'
import { categories } from '../data.js'
import {
  expenses,
  expensesByCategory,
  totalExpenses,
  monthlyTotal,
  averageExpense,
  recurringExpenses,
  formatCurrency
} from '../store.js'

export function Reports() {
  // Computed: category stats sorted by amount
  const categoryStats = computed(() => {
    const byCategory = expensesByCategory()
    const total = totalExpenses()

    return categories
      .map(cat => ({
        ...cat,
        amount: byCategory[cat.id] || 0,
        percentage: total > 0 ? ((byCategory[cat.id] || 0) / total) * 100 : 0
      }))
      .filter(cat => cat.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  })

  // Computed: monthly recurring cost
  const monthlyRecurringCost = computed(() => {
    return recurringExpenses().reduce((sum, exp) => sum + exp.amount, 0)
  })

  // Computed: expense count
  const expenseCount = computed(() => expenses().length)

  // Effect: log when reports are viewed (demo purposes)
  effect(() => {
    const total = totalExpenses()
    console.log(`[Reports] Total expenses: ${formatCurrency(total)}`)
  })

  return html`
    <div>
      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total All Time</div>
          <div class="stat-value">
            ${() => formatCurrency(totalExpenses())}
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">This Month</div>
          <div class="stat-value">
            ${() => formatCurrency(monthlyTotal())}
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Monthly Recurring</div>
          <div class="stat-value">
            ${() => formatCurrency(monthlyRecurringCost())}
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Total Expenses</div>
          <div class="stat-value">
            ${expenseCount}
          </div>
        </div>
      </div>

      <!-- Category Breakdown with list() -->
      <div class="card">
        <div class="card-title">Spending by Category</div>

        ${() => categoryStats().length === 0
          ? html`<div class="empty-state">No expenses to analyze</div>`
          : html`
            <div>
              ${list(
                categoryStats,
                (cat) => cat.id,
                (cat) => html`
                  <div class="report-row">
                    <div class="report-label">
                      <span
                        class="expense-category-dot"
                        style="background: ${cat.color}"
                      ></span>
                      ${cat.label}
                    </div>
                    <div class="report-bar">
                      <div
                        class="report-bar-fill"
                        style="width: ${cat.percentage}%; background: ${cat.color}"
                      ></div>
                    </div>
                    <div class="report-value">
                      ${formatCurrency(cat.amount)}
                    </div>
                  </div>
                `
              )}
            </div>
          `
        }
      </div>

      <!-- Recurring Expenses -->
      <div class="card">
        <div class="card-title">Recurring Expenses</div>

        ${() => recurringExpenses().length === 0
          ? html`<div class="empty-state">No recurring expenses</div>`
          : html`
            <ul class="expense-list">
              ${list(
                recurringExpenses,
                (exp) => exp.id,
                (exp) => {
                  const category = categories.find(c => c.id === exp.category) || categories[6]
                  return html`
                    <li class="expense-item">
                      <span
                        class="expense-category-dot"
                        style="background: ${category.color}"
                      ></span>
                      <div class="expense-info">
                        <div class="expense-description">${exp.description}</div>
                        <div class="expense-meta">${category.label}</div>
                      </div>
                      <div class="expense-amount">
                        ${formatCurrency(exp.amount)}/mo
                      </div>
                    </li>
                  `
                }
              )}
            </ul>

            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 600;">Monthly Total</span>
                <span style="font-weight: 700; color: var(--primary);">
                  ${() => formatCurrency(monthlyRecurringCost())}
                </span>
              </div>
            </div>
          `
        }
      </div>

      <!-- Average Stats -->
      <div class="card">
        <div class="card-title">Insights</div>
        <div class="detail-grid">
          <div class="detail-field">
            <div class="detail-field-label">Average Expense</div>
            <div class="detail-field-value">${() => formatCurrency(averageExpense())}</div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">Categories Used</div>
            <div class="detail-field-value">${() => categoryStats().length}</div>
          </div>
        </div>
      </div>
    </div>
  `
}
