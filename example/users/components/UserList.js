/**
 * UserList component
 * Demonstrates: useAsync for loading/error/data states, list rendering
 */
import { html } from '../../../framework/src/core/template.js'
import { list } from '../../../framework/src/core/list.js'
import { usersState } from '../store.js'
import { UserCard } from './UserCard.js'

/**
 * Loading indicator component
 */
function LoadingIndicator() {
  return html`
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Loading users...</p>
    </div>
  `
}

/**
 * Error display component
 */
function ErrorDisplay(error) {
  const handleRetry = () => {
    usersState.refetch()
  }

  return html`
    <div class="error">
      <p class="error-message">Failed to load users</p>
      <p class="error-detail">${error.message || 'Unknown error'}</p>
      <button class="retry-btn" onclick="${handleRetry}">
        Try Again
      </button>
    </div>
  `
}

/**
 * UserList component
 * Shows loading, error, or user list based on async state
 */
export function UserList() {
  const { data, loading, error } = usersState

  // Reactive visibility helpers
  const showLoading = () => loading() && !data()
  const showError = () => error() && !loading()
  const showUsers = () => data() && !loading()

  return html`
    <div class="user-list-container">
      <h2 class="section-title">All Users</h2>

      <div class="loading-state" style="display: ${() => showLoading() ? 'block' : 'none'}">
        ${LoadingIndicator()}
      </div>

      <div class="error-state" style="display: ${() => showError() ? 'block' : 'none'}">
        ${() => {
          const err = error()
          return err ? ErrorDisplay(err) : html`<span></span>`
        }}
      </div>

      <div class="users-grid" style="display: ${() => showUsers() ? 'grid' : 'none'}">
        ${list(
          () => data() || [],
          user => user.id,
          UserCard
        )}
      </div>
    </div>
  `
}
