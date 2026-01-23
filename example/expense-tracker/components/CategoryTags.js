/**
 * CategoryTags Component
 * Demonstrates: each() for list rendering
 */
import { html } from '../../../framework/src/core/template.js'
import { each } from '../../../framework/src/core/list.js'
import { categories } from '../data.js'
import { categoryFilter, setCategoryFilter } from '../store.js'

export function CategoryTags() {
  const handleClick = (categoryId) => {
    setCategoryFilter(current => current === categoryId ? 'all' : categoryId)
  }

  return html`
    <div class="category-tags">
      ${each(categories, (cat) => html`
        <button
          class="${() => `category-tag ${categoryFilter() === cat.id ? 'active' : ''}`}"
          style="color: ${cat.color}"
          onclick=${() => handleClick(cat.id)}
        >
          <span class="dot" style="background: ${cat.color}"></span>
          ${cat.label}
        </button>
      `)}
    </div>
  `
}
