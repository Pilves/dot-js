/**
 * Board component for Kanban board
 * Displays all columns in a horizontal row with reactive updates
 */
import { html } from '../../framework/src/core/template.js'
import { effect } from '../../framework/src/core/signal.js'
import { columns, cards, getCardsForColumn, addColumn } from '../store.js'
import { Column } from './Column.js'

/**
 * Kanban board component
 * Renders all columns and provides ability to add new columns
 * @returns {Node} - The board DOM element
 */
export function Board() {
  // Create the board container
  const boardElement = html`
    <div class="board">
      <div class="board-columns"></div>
      <button class="add-column-btn">+ Add Column</button>
    </div>
  `

  // Get references to the columns container and add button
  const columnsContainer = boardElement.querySelector('.board-columns')
  const addColumnBtn = boardElement.querySelector('.add-column-btn')

  // Handle add column button click
  addColumnBtn.addEventListener('click', () => {
    const title = prompt('Enter column title:')
    if (title && title.trim()) {
      addColumn(title.trim())
    }
  })

  // Use effect to reactively re-render columns when data changes
  effect(() => {
    // Read signals to establish dependencies
    const currentColumns = columns()
    // Also read cards to re-render when cards change
    cards()

    // Clear existing columns
    columnsContainer.innerHTML = ''

    // Render each column
    currentColumns.forEach((column, index) => {
      // Get cards for this column using computed signal
      const columnCards = getCardsForColumn(column.id)()

      // Create column component and append to container
      const columnElement = Column(column, columnCards, index)
      columnsContainer.appendChild(columnElement)
    })
  })

  return boardElement
}
