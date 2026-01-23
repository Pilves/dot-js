/**
 * Column component for Kanban board
 * Displays a column with title, cards, and add card form
 */
import { html } from '../../framework/src/core/template.js'
import { list } from '../../framework/src/core/list.js'
import { Card } from './Card.js'
import { AddCardForm } from './AddCardForm.js'
import { deleteColumn, moveCard } from '../store.js'

/**
 * Kanban column component
 * @param {Object} column - { id, title }
 * @param {Function} getCards - Computed getter returning array of card objects for this column
 * @param {number} columnIndex - Index of the column (used to prevent deletion of first 3 default columns)
 */
export function Column(column, getCards, columnIndex) {
  // Only allow deletion of non-default columns (index >= 3)
  const canDelete = columnIndex >= 3

  // Handle column deletion
  const handleDelete = () => {
    deleteColumn(column.id)
  }

  // Handle drag over - allow drop
  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // Handle drop - move card to this column
  const handleDrop = (e) => {
    e.preventDefault()
    const cardId = e.dataTransfer.getData('text/plain')
    if (cardId) {
      moveCard(cardId, column.id)
    }
  }

  // Render cards for this column using framework's reactive list
  const cardsList = list(getCards, card => card.id, Card)

  return html`
    <div class="column">
      <div class="column-header">
        <h3 class="column-title">${column.title}</h3>
        ${canDelete ? html`
          <button
            class="column-delete-btn"
            onclick="${handleDelete}"
            title="Delete column"
          >
            x
          </button>
        ` : ''}
      </div>
      <div
        class="column-cards drop-zone"
        ondragover="${handleDragOver}"
        ondrop="${handleDrop}"
      >
        ${cardsList}
      </div>
      ${AddCardForm(column.id)}
    </div>
  `
}
