/**
 * VirtualListDemo component
 * Demonstrates: createVirtualList for efficient rendering of large lists
 */
import { html } from '../../../framework/src/core/template.js'
import { createVirtualList } from '../../../framework/src/core/virtual-list.js'

export function VirtualListDemo() {
  // Generate 1000 items
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item #${i + 1}`,
    description: `This is item number ${i + 1} in the virtual list`
  }))

  const virtualList = createVirtualList({
    items,
    itemHeight: 50,
    containerHeight: 300,
    buffer: 5,
    renderItem: (item) => html`
      <div class="virtual-item">
        <strong>${item.name}</strong>
        <p>${item.description}</p>
      </div>
    `
  })

  return html`
    <div class="virtual-list-demo">
      <h3>Virtual List Demo (1000 items)</h3>
      <p class="demo-info">Only visible items are rendered. Scroll to see more.</p>
      ${virtualList}
    </div>
  `
}
