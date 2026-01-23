import { html } from '../../framework/src/core/template.js'
import { deleteCard } from '../store.js'

/**
 * Card component for Kanban board
 * @param {Object} card - Card data object
 * @param {string|number} card.id - Unique card identifier
 * @param {string} card.title - Card title
 * @param {string} card.description - Card description
 * @returns {Node} - DOM node representing the card
 */
export function Card(card) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', card.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDelete = () => {
    deleteCard(card.id)
  }

  return html`
    <div class="card" draggable="true" data-card-id="${card.id}" ondragstart="${handleDragStart}">
      <div class="card-title">${card.title}</div>
      <div class="card-description">${card.description}</div>
      <button class="card-delete-btn" onclick="${handleDelete}">Delete</button>
    </div>
  `
}
