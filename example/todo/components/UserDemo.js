/**
 * UserDemo component
 * Demonstrates: http client, useAsync for loading/error/data states
 */
import { html } from '../../../framework/src/core/template.js'
import { http, useAsync } from '../../../framework/src/core/http.js'

export function UserDemo() {
  // Fetch users from JSONPlaceholder (free fake API)
  const { data, loading, error, refetch } = useAsync(() =>
    http.get('https://jsonplaceholder.typicode.com/users?_limit=5')
  )

  return html`
    <div class="user-demo">
      <h3>HTTP Demo (useAsync)</h3>

      <button onclick=${refetch} class="refresh-btn">Refresh</button>

      ${() => {
        if (loading()) return html`<p class="loading">Loading users...</p>`
        if (error()) return html`<p class="error">Error: ${error().message}</p>`
        if (!data() || data().length === 0) return html`<p>No users found</p>`

        return html`
          <ul class="user-list">
            ${data().map(user => html`
              <li class="user-item">
                <strong>${user.name}</strong>
                <span>${user.email}</span>
              </li>
            `)}
          </ul>
        `
      }}
    </div>
  `
}
