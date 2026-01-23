/**
 * UserDetail component
 * Demonstrates: route params, individual user fetch, detailed view
 */
import { html } from '../../../framework/src/core/template.js'
import { fetchUser } from '../store.js'

/**
 * Loading indicator for detail view
 */
function DetailLoading() {
  return html`
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Loading user details...</p>
    </div>
  `
}

/**
 * Error display for detail view
 */
function DetailError(error, userId, refetch) {
  return html`
    <div class="error">
      <p class="error-message">Failed to load user</p>
      <p class="error-detail">${error.message || 'Unknown error'}</p>
      <div class="error-actions">
        <button class="retry-btn" onclick="${refetch}">
          Try Again
        </button>
        <a href="#/" class="back-link">Back to List</a>
      </div>
    </div>
  `
}

/**
 * User detail content
 */
function UserContent(user) {
  return html`
    <div class="user-detail">
      <div class="detail-header">
        <div class="detail-avatar">
          ${user.name.charAt(0).toUpperCase()}
        </div>
        <div class="detail-title">
          <h2>${user.name}</h2>
          <p class="username">@${user.username}</p>
        </div>
      </div>

      <div class="detail-sections">
        <section class="detail-section">
          <h3>Contact Information</h3>
          <dl class="info-list">
            <dt>Email</dt>
            <dd><a href="mailto:${user.email}">${user.email}</a></dd>
            <dt>Phone</dt>
            <dd>${user.phone}</dd>
            <dt>Website</dt>
            <dd><a href="https://${user.website}" target="_blank">${user.website}</a></dd>
          </dl>
        </section>

        <section class="detail-section">
          <h3>Company</h3>
          <dl class="info-list">
            <dt>Name</dt>
            <dd>${user.company.name}</dd>
            <dt>Catchphrase</dt>
            <dd>"${user.company.catchPhrase}"</dd>
            <dt>Business</dt>
            <dd>${user.company.bs}</dd>
          </dl>
        </section>

        <section class="detail-section">
          <h3>Address</h3>
          <dl class="info-list">
            <dt>Street</dt>
            <dd>${user.address.street}, ${user.address.suite}</dd>
            <dt>City</dt>
            <dd>${user.address.city}</dd>
            <dt>Zipcode</dt>
            <dd>${user.address.zipcode}</dd>
          </dl>
        </section>
      </div>

      <div class="detail-footer">
        <a href="#/" class="back-btn">Back to List</a>
      </div>
    </div>
  `
}

/**
 * UserDetail component
 * @param {string} userId - User ID from route params
 */
export function UserDetail(userId) {
  // Fetch user data for this specific ID
  const { data, loading, error, refetch } = fetchUser(userId)

  // Reactive visibility helpers
  const showLoading = () => loading() && !data()
  const showError = () => error() && !loading()
  const showContent = () => data() && !loading()

  return html`
    <div class="user-detail-container">
      <div class="loading-state" style="display: ${() => showLoading() ? 'block' : 'none'}">
        ${DetailLoading()}
      </div>

      <div class="error-state" style="display: ${() => showError() ? 'block' : 'none'}">
        ${() => {
          const err = error()
          return err ? DetailError(err, userId, refetch) : html`<span></span>`
        }}
      </div>

      <div class="content-state" style="display: ${() => showContent() ? 'block' : 'none'}">
        ${() => {
          const user = data()
          return user ? UserContent(user) : html`<span></span>`
        }}
      </div>
    </div>
  `
}
