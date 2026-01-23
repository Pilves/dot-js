/**
 * Virtual Scrolling Demo
 * Demonstrates efficient rendering of 10,000 items using createVirtualList
 */
import { html } from '../../framework/src/core/template.js'
import { mount } from '../../framework/src/core/component.js'
import { signal, effect } from '../../framework/src/core/signal.js'
import { createVirtualList } from '../../framework/src/core/virtual-list.js'

// Generate 10,000 items
const items = Array.from({ length: 10000 }, (_, index) => ({
  id: index,
  title: `Item ${index}`,
  description: `This is the description for item number ${index}`
}))

// Signal for tracking visible range (updated by effect)
const [visibleStart, setVisibleStart] = signal(0)
const [visibleEnd, setVisibleEnd] = signal(0)

// Signal for scroll-to input
const [scrollToIndex, setScrollToIndex] = signal('')

/**
 * Render a single list item
 */
function renderItem(item, index) {
  return html`
    <div class="item-content">
      <span class="item-index">#${index}</span>
      <div class="item-details">
        <span class="item-title">${item.title}</span>
        <span class="item-description">${item.description}</span>
      </div>
    </div>
  `
}

/**
 * Main App component
 */
function App() {
  // Create the virtual list
  const virtualList = createVirtualList({
    items,
    itemHeight: 60,
    containerHeight: 400,
    buffer: 5,
    renderItem
  })

  // Track visible range changes
  effect(() => {
    const range = virtualList._virtualList.getVisibleRange()
    setVisibleStart(range.startIndex)
    setVisibleEnd(range.endIndex)
  })

  // Set up scroll listener to update visible range display
  virtualList.addEventListener('scroll', () => {
    const range = virtualList._virtualList.getVisibleRange()
    setVisibleStart(range.startIndex)
    setVisibleEnd(range.endIndex)
  })

  // Handle scroll-to form submission
  function handleScrollTo(event) {
    event.preventDefault()
    const index = parseInt(scrollToIndex(), 10)
    if (!isNaN(index) && index >= 0 && index < items.length) {
      virtualList._virtualList.scrollToIndex(index)
    }
  }

  // Handle input change
  function handleInputChange(event) {
    setScrollToIndex(event.target.value)
  }

  return html`
    <div class="app-container">
      <header class="header">
        <h1>Virtual Scrolling Demo</h1>
        <p class="subtitle">Efficiently rendering 10,000 items</p>
      </header>

      <div class="controls">
        <div class="stats">
          <span class="stat">
            <strong>Total Items:</strong> ${items.length.toLocaleString()}
          </span>
          <span class="stat">
            <strong>Visible Range:</strong>
            <span class="range">${() => visibleStart()} - ${() => visibleEnd()}</span>
          </span>
          <span class="stat">
            <strong>Rendered:</strong>
            <span class="rendered-count">${() => visibleEnd() - visibleStart()}</span> items
          </span>
        </div>

        <form class="scroll-to-form" onsubmit="${handleScrollTo}">
          <label for="scroll-input">Jump to index:</label>
          <input
            id="scroll-input"
            type="number"
            min="0"
            max="${items.length - 1}"
            placeholder="0-9999"
            value="${scrollToIndex}"
            oninput="${handleInputChange}"
          />
          <button type="submit">Go</button>
        </form>
      </div>

      <div class="list-container">
        ${virtualList}
      </div>

      <footer class="footer">
        <p>Only ~${Math.ceil(400 / 60) + 10} DOM nodes are rendered at a time, not 10,000!</p>
      </footer>
    </div>
  `
}

// Mount the application
function render() {
  const container = document.getElementById('app')
  mount(App(), container)
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render)
} else {
  render()
}
