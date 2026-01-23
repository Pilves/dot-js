import { signal, computed, createPersistedSignal } from '../framework/src/core/signal.js'

/**
 * Generate a unique ID for cards and columns
 * @returns {string} - Unique identifier
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

/**
 * Default columns for the Kanban board
 */
const defaultColumns = [
  { id: 'todo', title: 'To Do', cardIds: [] },
  { id: 'in-progress', title: 'In Progress', cardIds: [] },
  { id: 'done', title: 'Done', cardIds: [] }
]

/**
 * Default cards (empty initially)
 */
const defaultCards = {}

/**
 * Columns signal - array of column objects
 * Each column has: { id, title, cardIds: [] }
 */
export const [columns, setColumns] = createPersistedSignal('kanban-columns', defaultColumns)

/**
 * Cards signal - object map of all cards
 * Format: { cardId: { id, title, description, columnId } }
 */
export const [cards, setCards] = createPersistedSignal('kanban-cards', defaultCards)

/**
 * Add a new card to a column
 * @param {string} columnId - The column to add the card to
 * @param {string} title - Card title
 * @param {string} description - Card description
 * @returns {string} - The new card's ID
 */
export function addCard(columnId, title, description = '') {
  const cardId = generateId()

  // Add card to cards map
  setCards(currentCards => ({
    ...currentCards,
    [cardId]: {
      id: cardId,
      title,
      description,
      columnId
    }
  }))

  // Add card ID to the column's cardIds array
  setColumns(currentColumns =>
    currentColumns.map(column =>
      column.id === columnId
        ? { ...column, cardIds: [...column.cardIds, cardId] }
        : column
    )
  )

  return cardId
}

/**
 * Move a card to a different column and/or position
 * Handles drag and drop functionality
 * @param {string} cardId - The card to move
 * @param {string} toColumnId - The destination column
 * @param {number} toIndex - The index position in the destination column
 */
export function moveCard(cardId, toColumnId, toIndex = 0) {
  const currentCards = cards()
  const card = currentCards[cardId]

  if (!card) {
    console.warn(`Card with ID "${cardId}" not found`)
    return
  }

  const fromColumnId = card.columnId

  // Update the card's columnId
  setCards(currentCards => ({
    ...currentCards,
    [cardId]: {
      ...currentCards[cardId],
      columnId: toColumnId
    }
  }))

  // Update columns - remove from source, add to destination
  setColumns(currentColumns => {
    return currentColumns.map(column => {
      if (column.id === fromColumnId && column.id === toColumnId) {
        // Moving within the same column
        const newCardIds = column.cardIds.filter(id => id !== cardId)
        newCardIds.splice(toIndex, 0, cardId)
        return { ...column, cardIds: newCardIds }
      } else if (column.id === fromColumnId) {
        // Remove from source column
        return { ...column, cardIds: column.cardIds.filter(id => id !== cardId) }
      } else if (column.id === toColumnId) {
        // Add to destination column at specified index
        const newCardIds = [...column.cardIds]
        newCardIds.splice(toIndex, 0, cardId)
        return { ...column, cardIds: newCardIds }
      }
      return column
    })
  })
}

/**
 * Delete a card
 * @param {string} cardId - The card to delete
 */
export function deleteCard(cardId) {
  const currentCards = cards()
  const card = currentCards[cardId]

  if (!card) {
    console.warn(`Card with ID "${cardId}" not found`)
    return
  }

  // Remove card from cards map
  setCards(currentCards => {
    const { [cardId]: removed, ...rest } = currentCards
    return rest
  })

  // Remove card ID from its column
  setColumns(currentColumns =>
    currentColumns.map(column =>
      column.id === card.columnId
        ? { ...column, cardIds: column.cardIds.filter(id => id !== cardId) }
        : column
    )
  )
}

/**
 * Update a card's properties
 * @param {string} cardId - The card to update
 * @param {object} updates - Object with properties to update (title, description)
 */
export function updateCard(cardId, updates) {
  const currentCards = cards()

  if (!currentCards[cardId]) {
    console.warn(`Card with ID "${cardId}" not found`)
    return
  }

  setCards(currentCards => ({
    ...currentCards,
    [cardId]: {
      ...currentCards[cardId],
      ...updates,
      id: cardId // Ensure ID cannot be changed
    }
  }))
}

/**
 * Add a new column to the board
 * @param {string} title - Column title
 * @returns {string} - The new column's ID
 */
export function addColumn(title) {
  const columnId = generateId()

  setColumns(currentColumns => [
    ...currentColumns,
    {
      id: columnId,
      title,
      cardIds: []
    }
  ])

  return columnId
}

/**
 * Delete a column and all its cards
 * @param {string} columnId - The column to delete
 */
export function deleteColumn(columnId) {
  const currentColumns = columns()
  const column = currentColumns.find(c => c.id === columnId)

  if (!column) {
    console.warn(`Column with ID "${columnId}" not found`)
    return
  }

  // Remove all cards in this column
  if (column.cardIds.length > 0) {
    setCards(currentCards => {
      const newCards = { ...currentCards }
      column.cardIds.forEach(cardId => {
        delete newCards[cardId]
      })
      return newCards
    })
  }

  // Remove the column
  setColumns(currentColumns =>
    currentColumns.filter(c => c.id !== columnId)
  )
}

/**
 * Get a computed signal that returns cards for a specific column
 * @param {string} columnId - The column to get cards for
 * @returns {() => Array} - Computed getter returning array of cards
 */
export function getCardsForColumn(columnId) {
  return computed(() => {
    const currentColumns = columns()
    const currentCards = cards()

    const column = currentColumns.find(c => c.id === columnId)
    if (!column) {
      return []
    }

    // Return cards in the order specified by cardIds
    return column.cardIds
      .map(cardId => currentCards[cardId])
      .filter(card => card !== undefined)
  })
}
