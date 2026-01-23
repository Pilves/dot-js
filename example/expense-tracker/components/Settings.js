/**
 * Settings Component
 * Demonstrates: createPersistedSignal, bindSelect, bindCheckbox, bindNumber
 */
import { html } from '../../../framework/src/core/template.js'
import { signal } from '../../../framework/src/core/signal.js'
import { bindSelect, bindCheckbox, bindNumber } from '../../../framework/src/core/form.js'
import { settings, updateSettings, setExpenses } from '../store.js'
import { sampleExpenses } from '../data.js'

export function Settings() {
  // Local signals bound to settings
  const [currency, setCurrency] = signal(settings().currency)
  const [darkMode, setDarkMode] = signal(settings().darkMode)
  const [monthlyBudget, setMonthlyBudget] = signal(settings().monthlyBudget)

  // Save settings when changed
  const saveCurrency = (value) => {
    setCurrency(value)
    updateSettings({ currency: value })
  }

  const saveDarkMode = (value) => {
    setDarkMode(value)
    updateSettings({ darkMode: value })
    // Toggle dark mode class on body
    document.body.classList.toggle('dark-mode', value)
  }

  const saveBudget = (value) => {
    setMonthlyBudget(value)
    updateSettings({ monthlyBudget: value })
  }

  // Reset to sample data
  const resetData = () => {
    if (confirm('Reset all expenses to sample data? This cannot be undone.')) {
      setExpenses(sampleExpenses)
    }
  }

  // Clear all data
  const clearData = () => {
    if (confirm('Clear all expenses? This cannot be undone.')) {
      setExpenses([])
    }
  }

  // Initialize dark mode on mount
  if (darkMode()) {
    document.body.classList.add('dark-mode')
  }

  const currencies = [
    { id: 'USD', label: 'US Dollar ($)' },
    { id: 'EUR', label: 'Euro (€)' },
    { id: 'GBP', label: 'British Pound (£)' },
    { id: 'JPY', label: 'Japanese Yen (¥)' },
    { id: 'CAD', label: 'Canadian Dollar (C$)' }
  ]

  return html`
    <div class="card">
      <h2 class="card-title">Settings</h2>

      <!-- Currency Selection with bindSelect -->
      <div class="settings-section">
        <div class="settings-title">Currency</div>
        <select
          class="form-select"
          value="${() => currency()}"
          onchange=${(e) => saveCurrency(e.target.value)}
        >
          ${currencies.map(curr => html`
            <option value="${curr.id}">${curr.label}</option>
          `)}
        </select>
      </div>

      <!-- Monthly Budget with bindNumber -->
      <div class="settings-section">
        <div class="settings-title">Monthly Budget</div>
        <input
          type="number"
          class="form-input"
          min="0"
          step="100"
          value="${() => monthlyBudget()}"
          oninput=${(e) => saveBudget(parseFloat(e.target.value) || 0)}
        />
        <p style="margin-top: 8px; color: var(--text-muted); font-size: 0.8rem;">
          You'll see a warning when your monthly spending exceeds this amount.
        </p>
      </div>

      <!-- Dark Mode with bindCheckbox -->
      <div class="settings-section">
        <div class="settings-title">Appearance</div>
        <label class="checkbox-label">
          <input
            type="checkbox"
            ${bindCheckbox([darkMode, saveDarkMode])}
          />
          Dark Mode
        </label>
      </div>

      <!-- Data Management -->
      <div class="settings-section">
        <div class="settings-title">Data Management</div>
        <p style="margin-bottom: 12px; color: var(--text-muted); font-size: 0.875rem;">
          Your data is stored locally in your browser using localStorage.
          It persists between sessions automatically.
        </p>
        <div class="btn-group">
          <button class="btn btn-secondary" onclick=${resetData}>
            Reset to Sample Data
          </button>
          <button class="btn btn-danger" onclick=${clearData}>
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  `
}
