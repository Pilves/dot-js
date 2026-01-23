import { html } from '../framework/src/core/template.js'
import { mount } from '../framework/src/core/component.js'
import { Board } from './components/Board.js'

// Main App component
function App() {
  return html`
    <div class="app-container">
      <header class="app-header">
        <h1 class="app-title">Kanban Board</h1>
      </header>
      ${Board()}
    </div>
  `
}

// Mount app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  mount(App(), document.getElementById('app'))
})
