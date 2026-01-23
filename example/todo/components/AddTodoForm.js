/**
 * AddTodoForm component
 * Demonstrates: form binding, validation, handleForm
 */
import { html } from '../../../framework/src/core/template.js'
import { signal } from '../../../framework/src/core/signal.js'
import { bind, handleForm, required, minLength, maxLength } from '../../../framework/src/core/form.js'
import { addTodo } from '../store.js'

export function AddTodoForm() {
  // Signal for input value - two-way binding
  const [inputValue, setInputValue] = signal('')

  // Signal for validation error message
  const [error, setError] = signal('')

  // Create binding for the input
  const inputBinding = bind([inputValue, setInputValue])

  // Validate input
  function validate(value) {
    // Check required
    const requiredError = required(value)
    if (requiredError) {
      return 'Todo text is required'
    }

    // Check minimum length
    const minLengthError = minLength(value, 3)
    if (minLengthError) {
      return 'Todo must be at least 3 characters'
    }

    // Check maximum length
    const maxLengthError = maxLength(value, 100)
    if (maxLengthError) {
      return 'Todo must be at most 100 characters'
    }

    return null
  }

  // Handle form submission
  const formHandler = handleForm((formData) => {
    const text = inputValue()

    // Validate
    const validationError = validate(text)
    if (validationError) {
      setError(validationError)
      return
    }

    // Add todo and clear form
    addTodo(text)
    setInputValue('')
    setError('')
  })

  // Clear error on input
  const handleInput = (e) => {
    inputBinding.oninput(e)
    if (error()) {
      setError('')
    }
  }

  // Dynamic class for input based on error state
  const inputClass = () => error() ? 'todo-input error' : 'todo-input'

  return html`
    <form class="add-todo-form" onsubmit="${formHandler.onsubmit}">
      <div class="input-group">
        <input
          type="text"
          name="todoText"
          class="${inputClass}"
          placeholder="What needs to be done?"
          value="${inputBinding.value}"
          oninput="${handleInput}"
        />
        <button type="submit" class="add-btn">Add</button>
      </div>
      <div class="error-message">
        ${() => error()}
      </div>
    </form>
  `
}
