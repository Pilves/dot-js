/**
 * Tests for router.js - hash-based routing
 * Requires window object - uses happy-dom
 */

import { Window } from 'happy-dom'
import { describe, test, assert, exit } from '../test-runner.js'

// Set up window environment
const window = new Window()
global.window = window

// Import after window is set up
const { createRouter } = await import('../router.js')

// Helper to reset location
function resetLocation() {
  window.location.hash = ''
}

await describe('router - route matching', async () => {
  beforeEach: resetLocation()

  await test('matches exact routes', () => {
    const HomePage = () => 'home'
    const AboutPage = () => 'about'

    const router = createRouter({
      '/': HomePage,
      '/about': AboutPage
    })

    // Default path is '/'
    const match = router.current()
    assert.ok(match !== null)
    assert.equal(match.component, HomePage)
  })

  await test('matchRoute returns empty params for exact match', () => {
    const router = createRouter({
      '/about': () => 'about'
    })

    const params = router.matchRoute('/about', '/about')
    assert.deepEqual(params, {})
  })

  await test('matchRoute extracts route parameters', () => {
    const router = createRouter({})

    const params = router.matchRoute('/user/:id', '/user/123')
    assert.deepEqual(params, { id: '123' })
  })

  await test('matchRoute extracts multiple parameters', () => {
    const router = createRouter({})

    const params = router.matchRoute('/user/:id/post/:postId', '/user/123/post/456')
    assert.deepEqual(params, { id: '123', postId: '456' })
  })

  await test('matchRoute returns null for non-matching routes', () => {
    const router = createRouter({})

    const params = router.matchRoute('/user/:id', '/about')
    assert.equal(params, null)
  })

  await test('matchRoute returns null for different segment counts', () => {
    const router = createRouter({})

    const params = router.matchRoute('/user/:id', '/user/123/extra')
    assert.equal(params, null)
  })
})

await describe('router - navigation', async () => {
  await test('navigate changes hash', () => {
    resetLocation()

    const router = createRouter({
      '/': () => 'home',
      '/about': () => 'about'
    })

    router.navigate('/about')
    assert.equal(window.location.hash, '#/about')
  })

  await test('navigate to parameterized route', () => {
    resetLocation()

    const router = createRouter({
      '/user/:id': () => 'user'
    })

    router.navigate('/user/234')
    assert.equal(window.location.hash, '#/user/234')
  })
})

await describe('router - current route', async () => {
  await test('current returns matched component and params', async () => {
    resetLocation()

    const UserPage = ({ id }) => `User ${id}`

    const router = createRouter({
      '/': () => 'home',
      '/user/:id': UserPage
    })

    router.navigate('/user/42')

    // Allow hashchange to propagate
    await new Promise(resolve => setTimeout(resolve, 10))

    const match = router.current()
    assert.ok(match !== null)
    assert.equal(match.component, UserPage)
    assert.deepEqual(match.params, { id: '42' })
  })

  await test('current returns null for unmatched routes', async () => {
    resetLocation()

    const router = createRouter({
      '/': () => 'home'
    })

    router.navigate('/nonexistent')

    await new Promise(resolve => setTimeout(resolve, 10))

    const match = router.current()
    assert.equal(match, null)
  })
})

exit()
