/**
 * ExpenseForm Component
 * Demonstrates ALL 10 form features:
 * - bind (description)
 * - bindNumber (amount)
 * - bindSelect (category)
 * - bindRadio (payment method)
 * - bindCheckbox (recurring, send receipt)
 * - handleForm (submission)
 * - required (description)
 * - minLength (description min 3)
 * - maxLength (description max 100)
 * - email (receipt email)
 */
import { html } from '../../../framework/src/core/template.js'
import { signal } from '../../../framework/src/core/signal.js'
import {
  bind,
  bindNumber,
  bindSelect,
  bindRadio,
  bindCheckbox,
  handleForm,
  required,
  minLength,
  maxLength,
  email
} from '../../../framework/src/core/form.js'
import { categories, paymentMethods } from '../data.js'
import { addExpense } from '../store.js'

export function ExpenseForm(router) {
  // Form field signals
  const [description, setDescription] = signal('')
  const [amount, setAmount] = signal(0)
  const [category, setCategory] = signal('food')
  const [paymentMethod, setPaymentMethod] = signal('card')
  const [date, setDate] = signal(new Date().toISOString().split('T')[0])
  const [isRecurring, setIsRecurring] = signal(false)
  const [sendReceipt, setSendReceipt] = signal(false)
  const [receiptEmail, setReceiptEmail] = signal('')

  // Validation state
  const [errors, setErrors] = signal({})
  const [submitted, setSubmitted] = signal(false)

  // Validate all fields
  const validate = () => {
    const newErrors = {}

    // Required validation
    const requiredError = required(description())
    if (requiredError) {
      newErrors.description = requiredError
    }

    // MinLength validation
    if (!newErrors.description) {
      const minError = minLength(description(), 3)
      if (minError) {
        newErrors.description = minError
      }
    }

    // MaxLength validation
    if (!newErrors.description) {
      const maxError = maxLength(description(), 100)
      if (maxError) {
        newErrors.description = maxError
      }
    }

    // Amount validation
    if (amount() <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    // Email validation (only if send receipt is checked)
    if (sendReceipt()) {
      const emailError = email(receiptEmail())
      if (emailError) {
        newErrors.receiptEmail = emailError
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  const onSubmit = handleForm((formData) => {
    setSubmitted(true)

    if (!validate()) {
      return
    }

    // Add the expense
    const newId = addExpense({
      description: description(),
      amount: amount(),
      category: category(),
      paymentMethod: paymentMethod(),
      date: date(),
      isRecurring: isRecurring(),
      receiptEmail: sendReceipt() ? receiptEmail() : ''
    })

    // Reset form
    setDescription('')
    setAmount(0)
    setCategory('food')
    setPaymentMethod('card')
    setDate(new Date().toISOString().split('T')[0])
    setIsRecurring(false)
    setSendReceipt(false)
    setReceiptEmail('')
    setSubmitted(false)
    setErrors({})

    // Navigate to the new expense
    router.navigate(`/expense/${newId}`)
  })

  // Live validation on blur
  const onDescriptionBlur = () => {
    if (submitted()) validate()
  }

  return html`
    <div class="card">
      <h2 class="card-title">Add New Expense</h2>

      <form ${onSubmit}>
        <!-- Description with bind, required, minLength, maxLength -->
        <div class="form-group">
          <label class="form-label" for="description">Description *</label>
          <input
            id="description"
            type="text"
            class="${() => `form-input ${errors().description ? 'error' : ''}`}"
            placeholder="What did you spend on?"
            ${bind([description, setDescription])}
            onblur=${onDescriptionBlur}
          />
          ${() => errors().description
            ? html`<div class="form-error">${errors().description}</div>`
            : ''}
        </div>

        <div class="form-row">
          <!-- Amount with bindNumber -->
          <div class="form-group">
            <label class="form-label" for="amount">Amount *</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              class="${() => `form-input ${errors().amount ? 'error' : ''}`}"
              placeholder="0.00"
              ${bindNumber([amount, setAmount])}
            />
            ${() => errors().amount
              ? html`<div class="form-error">${errors().amount}</div>`
              : ''}
          </div>

          <!-- Date with bind -->
          <div class="form-group">
            <label class="form-label" for="date">Date</label>
            <input
              id="date"
              type="date"
              class="form-input"
              ${bind([date, setDate])}
            />
          </div>
        </div>

        <!-- Category with bindSelect -->
        <div class="form-group">
          <label class="form-label" for="category">Category</label>
          <select
            id="category"
            class="form-select"
            ${bindSelect([category, setCategory])}
          >
            ${categories.map(cat => html`
              <option value="${cat.id}">${cat.label}</option>
            `)}
          </select>
        </div>

        <!-- Payment Method with bindRadio -->
        <div class="form-group">
          <label class="form-label">Payment Method</label>
          <div class="radio-group">
            ${paymentMethods.map(method => html`
              <label class="radio-label">
                <input
                  type="radio"
                  name="paymentMethod"
                  ${bindRadio([paymentMethod, setPaymentMethod], method.id)}
                />
                ${method.label}
              </label>
            `)}
          </div>
        </div>

        <!-- Recurring with bindCheckbox -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              ${bindCheckbox([isRecurring, setIsRecurring])}
            />
            This is a recurring expense
          </label>
        </div>

        <!-- Send Receipt Checkbox with bindCheckbox -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              ${bindCheckbox([sendReceipt, setSendReceipt])}
            />
            Send receipt to email
          </label>
        </div>

        <!-- Receipt Email with bind and email validation -->
        ${() => sendReceipt() ? html`
          <div class="form-group">
            <label class="form-label" for="receiptEmail">Receipt Email *</label>
            <input
              id="receiptEmail"
              type="email"
              class="${() => `form-input ${errors().receiptEmail ? 'error' : ''}`}"
              placeholder="your@email.com"
              ${bind([receiptEmail, setReceiptEmail])}
            />
            ${() => errors().receiptEmail
              ? html`<div class="form-error">${errors().receiptEmail}</div>`
              : ''}
          </div>
        ` : ''}

        <!-- Submit with handleForm -->
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Add Expense</button>
          <a href="#/" class="btn btn-secondary">Cancel</a>
        </div>
      </form>
    </div>
  `
}
