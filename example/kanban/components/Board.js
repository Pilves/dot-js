/**
 * Board component for Kanban board
 * Displays all columns in a horizontal row with reactive updates
 */
import { html } from '../../../framework/src/core/template.js'
import { effect } from '../../../framework/src/core/signal.js'
import { columns, getCardsForColumn, addColumn } from '../store.js'
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

  // Track rendered columns for proper DOM management
  let renderedColumns = new Map()

  // Use effect to reactively update columns when column list changes
  // Note: Card updates are handled by list() within each Column component
  effect(() => {
    const currentColumns = columns()

    const currentIds = new Set(currentColumns.map(c => c.id))

    // Remove columns that no longer exist
    for (const [id, element] of renderedColumns) {
      if (!currentIds.has(id)) {
        element.remove()
        renderedColumns.delete(id)
      }
    }

    // Add/update columns
    currentColumns.forEach((column, index) => {
      if (!renderedColumns.has(column.id)) {
        // New column - pass the getter so Column can react to card changes
        const columnElement = Column(column, getCardsForColumn(column.id), index)
        columnsContainer.appendChild(columnElement)
        renderedColumns.set(column.id, columnElement)
      }
      // Existing columns: the Column component handles its own updates via list()
    })
  })

  return boardElement
}
