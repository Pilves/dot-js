/**
 * ExpenseDetail Component
 * Demonstrates ALL HTTP features + delegateAll:
 * - http.get (simulated fetch)
 * - http.post (duplicate)
 * - http.put (full update)
 * - http.patch (mark as paid)
 * - http.delete (delete)
 * - useAsync (loading/error states)
 * - HttpError (error handling)
 * - delegateAll (multiple action buttons)
 */
import { html } from '../../../framework/src/core/template.js'
import { signal } from '../../../framework/src/core/signal.js'
import { useAsync, http, HttpError } from '../../../framework/src/core/http.js'
import { delegateAll } from '../../../framework/src/core/events.js'
import { categories } from '../data.js'
import {
  getExpenseById,
  updateExpense,
  deleteExpense,
  duplicateExpense,
  markAsPaid,
  formatCurrency
} from '../store.js'

export function ExpenseDetail(params, router) {
  const expenseId = params.id

  // Simulate async fetch using useAsync
  // In a real app, this would call http.get(`/api/expenses/${expenseId}`)
  const asyncState = useAsync(async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))

    const expense = getExpenseById(expenseId)
    if (!expense) {
      // Simulate HttpError for not found
      const mockResponse = { ok: false, status: 404, statusText: 'Not Found' }
      throw new HttpError(mockResponse, { message: 'Expense not found' })
    }
    return expense
  })

  // Action state for feedback
  const [actionMessage, setActionMessage] = signal('')
  const [isDeleting, setIsDeleting] = signal(false)

  // Handle actions with delegateAll
  const handleActions = delegateAll({
    '.btn-duplicate': async (event, target) => {
      setActionMessage('Duplicating...')
      // Simulate http.post
      await new Promise(resolve => setTimeout(resolve, 200))
      const newId = duplicateExpense(expenseId)
      if (newId) {
        setActionMessage('Duplicated!')
        setTimeout(() => router.navigate(`/expense/${newId}`), 500)
      }
    },

    '.btn-mark-paid': async (event, target) => {
      setActionMessage('Updating...')
      // Simulate http.patch
      await new Promise(resolve => setTimeout(resolve, 200))
      markAsPaid(expenseId)
      setActionMessage('Marked as paid!')
      asyncState.refetch()
    },

    '.btn-delete': async (event, target) => {
      if (!confirm('Are you sure you want to delete this expense?')) return

      setIsDeleting(true)
      setActionMessage('Deleting...')
      // Simulate http.delete
      await new Promise(resolve => setTimeout(resolve, 300))
      deleteExpense(expenseId)
      setActionMessage('Deleted!')
      setTimeout(() => router.navigate('/'), 500)
    }
  })

  // Edit form state
  const [isEditing, setIsEditing] = signal(false)
  const [editDescription, setEditDescription] = signal('')
  const [editAmount, setEditAmount] = signal(0)

  const startEdit = () => {
    const expense = asyncState.data()
    if (expense) {
      setEditDescription(expense.description)
      setEditAmount(expense.amount)
      setIsEditing(true)
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

  const saveEdit = async () => {
    setActionMessage('Saving...')
    // Simulate http.put for full update
    await new Promise(resolve => setTimeout(resolve, 300))
    updateExpense(expenseId, {
      description: editDescription(),
      amount: editAmount()
    })
    setActionMessage('Saved!')
    setIsEditing(false)
    asyncState.refetch()
  }

  return html`
    <div class="card">
      <a href="#/" class="back-link">← Back to Dashboard</a>

      ${() => {
        // Loading state
        if (asyncState.loading()) {
          return html`
            <div class="loading">
              <div class="loading-spinner"></div>
              <p>Loading expense...</p>
            </div>
          `
        }

        // Error state (HttpError handling)
        if (asyncState.error()) {
          const err = asyncState.error()
          return html`
            <div class="error-message">
              <h3>Error ${err.status || ''}</h3>
              <p>${err.message}</p>
              <button class="btn btn-primary" onclick=${() => asyncState.refetch()}>
                Try Again
              </button>
            </div>
          `
        }

        // Success state
        const expense = asyncState.data()
        if (!expense) {
          return html`<div class="empty-state">No expense found</div>`
        }

        const category = categories.find(c => c.id === expense.category) || categories[6]

        // Edit mode
        if (isEditing()) {
          return html`
            <div>
              <h2 class="card-title">Edit Expense</h2>
              <div class="form-group">
                <label class="form-label">Description</label>
                <input
                  type="text"
                  class="form-input"
                  value="${editDescription()}"
                  oninput=${(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div class="form-group">
                <label class="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-input"
                  value="${editAmount()}"
                  oninput=${(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div class="btn-group">
                <button class="btn btn-primary" onclick=${saveEdit}>Save</button>
                <button class="btn btn-secondary" onclick=${cancelEdit}>Cancel</button>
              </div>
            </div>
          `
        }

        // View mode
        return html`
          <div>
            <div class="detail-header">
              <div>
                <h2 class="detail-title">${expense.description}</h2>
                <div style="margin-top: 4px;">
                  <span
                    class="badge"
                    style="background: ${category.color}20; color: ${category.color}"
                  >
                    ${category.label}
                  </span>
                  ${expense.isRecurring ? html`
                    <span class="badge badge-info">Recurring</span>
                  ` : ''}
                  ${expense.isPaid
                    ? html`<span class="badge badge-success">Paid</span>`
                    : html`<span class="badge badge-warning">Unpaid</span>`}
                </div>
              </div>
              <div class="detail-amount">
                ${formatCurrency(expense.amount)}
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-field">
                <div class="detail-field-label">Date</div>
                <div class="detail-field-value">${expense.date}</div>
              </div>
              <div class="detail-field">
                <div class="detail-field-label">Payment Method</div>
                <div class="detail-field-value">${expense.paymentMethod}</div>
              </div>
              <div class="detail-field">
                <div class="detail-field-label">ID</div>
                <div class="detail-field-value" style="font-family: monospace; font-size: 0.8rem;">
                  ${expense.id}
                </div>
              </div>
              ${expense.receiptEmail ? html`
                <div class="detail-field">
                  <div class="detail-field-label">Receipt Email</div>
                  <div class="detail-field-value">${expense.receiptEmail}</div>
                </div>
              ` : ''}
            </div>

            ${() => actionMessage() ? html`
              <div class="badge badge-info" style="margin-bottom: 16px;">
                ${actionMessage()}
              </div>
            ` : ''}

            <!-- Action buttons with delegateAll -->
            <div class="btn-group" onclick=${handleActions}>
              <button class="btn btn-secondary" onclick=${startEdit}>
                Edit
              </button>
              <button class="btn btn-secondary btn-duplicate">
                Duplicate
              </button>
              ${!expense.isPaid ? html`
                <button class="btn btn-primary btn-mark-paid">
                  Mark as Paid
                </button>
              ` : ''}
              <button
                class="btn btn-danger btn-delete"
                disabled="${isDeleting}"
              >
                Delete
              </button>
            </div>
          </div>
        `
      }}
    </div>
  `
}
