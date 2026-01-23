/**
 * AddCardForm component
 * A collapsible form for adding new cards to a Kanban column
 */
import { html } from '../../../framework/src/core/template.js'
import { signal } from '../../../framework/src/core/signal.js'
import { addCard } from '../store.js'

/**
 * AddCardForm - Collapsible form for adding cards to a column
 * @param {string} columnId - The ID of the column to add cards to
 * @returns {Node} - The form element
 */
export function AddCardForm(columnId) {
  // Signals for form state
  const [isExpanded, setIsExpanded] = signal(false)

  // Build the element
  const element = html`
    <div class="add-card-form">
      <button
        class="add-card-btn"
        onclick="${() => setIsExpanded(true)}"
        style="${() => ({ display: isExpanded() ? 'none' : 'block' })}"
      >
        + Add Card
      </button>

      <div
        class="add-card-expanded"
        style="${() => ({ display: isExpanded() ? 'block' : 'none' })}"
      >
        <form class="add-card-form-inner">
          <input
            type="text"
            class="form-input"
            placeholder="Card title"
            required
          />
          <textarea
            class="form-textarea"
            placeholder="Description (optional)"
          ></textarea>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Add</button>
            <button type="button" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `

  // Get references to form elements
  const form = element.querySelector('.add-card-form-inner')
  const titleInput = element.querySelector('.form-input')
  const descTextarea = element.querySelector('.form-textarea')
  const cancelBtn = element.querySelector('.btn-secondary')

  // Clear and collapse form
  const resetForm = () => {
    titleInput.value = ''
    descTextarea.value = ''
    setIsExpanded(false)
  }

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const cardTitle = titleInput.value.trim()
    const cardDescription = descTextarea.value.trim()

    if (!cardTitle) return

    addCard(columnId, cardTitle, cardDescription)
    resetForm()
  })

  // Handle cancel
  cancelBtn.addEventListener('click', resetForm)

  return element
}
