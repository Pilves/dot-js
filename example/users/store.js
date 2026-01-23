/**
 * User Directory Store
 * Demonstrates: useAsync for HTTP state management, signal for selected user
 */
import { signal, computed } from '../../framework/src/core/signal.js'
import { http, useAsync } from '../../framework/src/core/http.js'

const API_BASE = 'https://jsonplaceholder.typicode.com'

/**
 * Fetch all users with reactive loading/error/data states
 */
export const usersState = useAsync(() => http.get(`${API_BASE}/users`))

/**
 * Currently selected user ID (from route params)
 */
const [selectedUserId, setSelectedUserId] = signal(null)

/**
 * Fetch single user details
 * Returns a new useAsync instance for the given user ID
 */
export function fetchUser(userId) {
  return useAsync(() => http.get(`${API_BASE}/users/${userId}`))
}

/**
 * Computed: find selected user from cached users list
 * Falls back to null if not found (will trigger individual fetch)
 */
export const selectedUser = computed(() => {
  const userId = selectedUserId()
  const users = usersState.data()

  if (!userId || !users) return null
  return users.find(user => user.id === parseInt(userId, 10)) || null
})

export {
  selectedUserId,
  setSelectedUserId
}
