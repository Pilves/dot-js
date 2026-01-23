/**
 * UserCard component
 * Displays a user summary in the list view
 */
import { html } from '../../../framework/src/core/template.js'

/**
 * UserCard component
 * @param {Object} user - User object from API
 */
export function UserCard(user) {
  return html`
    <article class="user-card">
      <div class="user-avatar">
        ${user.name.charAt(0).toUpperCase()}
      </div>
      <div class="user-info">
        <h3 class="user-name">${user.name}</h3>
        <p class="user-email">${user.email}</p>
        <p class="user-company">${user.company.name}</p>
      </div>
      <a href="#/user/${user.id}" class="view-btn">
        View Details
      </a>
    </article>
  `
}
