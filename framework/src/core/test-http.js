import { http, get, post, put, patch, delete as del, useAsync, HttpError } from './http.js'

// Mock fetch for testing
const originalFetch = globalThis.fetch

function mockFetch(mockResponses) {
  globalThis.fetch = async (url, options = {}) => {
    const method = options.method || 'GET'
    const key = `${method} ${url}`

    const mockData = mockResponses[key] || mockResponses[url]

    if (!mockData) {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ error: 'Not found' }),
        text: async () => 'Not found'
      }
    }

    return {
      ok: mockData.ok !== false,
      status: mockData.status || 200,
      statusText: mockData.statusText || 'OK',
      headers: new Map([['content-type', mockData.contentType || 'application/json']]),
      json: async () => mockData.data,
      text: async () => JSON.stringify(mockData.data)
    }
  }
}

function restoreFetch() {
  globalThis.fetch = originalFetch
}

// Helper for async tests
async function runTest(name, testFn) {
  try {
    await testFn()
    console.log(`PASS: ${name}`)
  } catch (err) {
    console.log(`FAIL: ${name}`)
    console.error(err)
  }
}

console.log('\n=== HTTP Client Tests ===\n')

// TEST 1: GET request
await runTest('GET request returns data', async () => {
  mockFetch({
    'GET /api/users': { data: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }] }
  })

  const users = await http.get('/api/users')
  console.log('  Response:', users)

  if (users.length !== 2) throw new Error('Expected 2 users')
  if (users[0].name !== 'John') throw new Error('Expected first user to be John')

  restoreFetch()
})

// TEST 2: POST request
await runTest('POST request sends body and returns data', async () => {
  mockFetch({
    'POST /api/users': { data: { id: 3, name: 'Bob', email: 'bob@test.com' } }
  })

  const newUser = await http.post('/api/users', { name: 'Bob', email: 'bob@test.com' })
  console.log('  Response:', newUser)

  if (newUser.id !== 3) throw new Error('Expected id to be 3')
  if (newUser.name !== 'Bob') throw new Error('Expected name to be Bob')

  restoreFetch()
})

// TEST 3: PUT request
await runTest('PUT request updates resource', async () => {
  mockFetch({
    'PUT /api/users/1': { data: { id: 1, name: 'John Updated' } }
  })

  const updated = await http.put('/api/users/1', { name: 'John Updated' })
  console.log('  Response:', updated)

  if (updated.name !== 'John Updated') throw new Error('Expected name to be updated')

  restoreFetch()
})

// TEST 4: PATCH request
await runTest('PATCH request partially updates resource', async () => {
  mockFetch({
    'PATCH /api/users/1': { data: { id: 1, name: 'John', email: 'newemail@test.com' } }
  })

  const patched = await http.patch('/api/users/1', { email: 'newemail@test.com' })
  console.log('  Response:', patched)

  if (patched.email !== 'newemail@test.com') throw new Error('Expected email to be updated')

  restoreFetch()
})

// TEST 5: DELETE request
await runTest('DELETE request removes resource', async () => {
  mockFetch({
    'DELETE /api/users/1': { data: { success: true } }
  })

  const result = await http.delete('/api/users/1')
  console.log('  Response:', result)

  if (!result.success) throw new Error('Expected success to be true')

  restoreFetch()
})

// TEST 6: Error handling for non-2xx responses
await runTest('Non-2xx response throws HttpError', async () => {
  mockFetch({
    'GET /api/unauthorized': {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      data: { message: 'Invalid token' }
    }
  })

  try {
    await http.get('/api/unauthorized')
    throw new Error('Should have thrown')
  } catch (err) {
    console.log('  Error caught:', err.message)
    console.log('  Error status:', err.status)
    console.log('  Error body:', err.body)

    if (!(err instanceof HttpError)) throw new Error('Expected HttpError')
    if (err.status !== 401) throw new Error('Expected status 401')
    if (err.body.message !== 'Invalid token') throw new Error('Expected error message')
  }

  restoreFetch()
})

// TEST 7: Custom headers
await runTest('Custom headers are merged with defaults', async () => {
  let capturedOptions = null

  globalThis.fetch = async (url, options) => {
    capturedOptions = options
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({}),
      text: async () => '{}'
    }
  }

  await http.get('/api/test', {
    headers: {
      'Authorization': 'Bearer token123',
      'X-Custom': 'value'
    }
  })

  console.log('  Headers sent:', capturedOptions.headers)

  if (capturedOptions.headers['Content-Type'] !== 'application/json') {
    throw new Error('Expected Content-Type header')
  }
  if (capturedOptions.headers['Authorization'] !== 'Bearer token123') {
    throw new Error('Expected Authorization header')
  }

  restoreFetch()
})

// TEST 8: useAsync hook - success case
await runTest('useAsync hook returns reactive state on success', async () => {
  mockFetch({
    'GET /api/data': { data: { message: 'Hello World' } }
  })

  const { data, loading, error, refetch } = useAsync(() => http.get('/api/data'))

  // Initially loading should be true
  console.log('  Initial loading:', loading())

  // Wait for async operation to complete
  await new Promise(resolve => setTimeout(resolve, 10))

  console.log('  Final loading:', loading())
  console.log('  Data:', data())
  console.log('  Error:', error())

  if (loading() !== false) throw new Error('Expected loading to be false')
  if (data().message !== 'Hello World') throw new Error('Expected data message')
  if (error() !== null) throw new Error('Expected no error')

  restoreFetch()
})

// TEST 9: useAsync hook - error case
await runTest('useAsync hook handles errors correctly', async () => {
  mockFetch({
    'GET /api/fail': {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      data: { error: 'Server error' }
    }
  })

  const { data, loading, error } = useAsync(() => http.get('/api/fail'))

  await new Promise(resolve => setTimeout(resolve, 10))

  console.log('  Loading:', loading())
  console.log('  Data:', data())
  console.log('  Error:', error()?.message)

  if (loading() !== false) throw new Error('Expected loading to be false')
  if (data() !== null) throw new Error('Expected data to be null')
  if (!(error() instanceof HttpError)) throw new Error('Expected HttpError')

  restoreFetch()
})

// TEST 10: useAsync refetch
await runTest('useAsync refetch re-runs the async function', async () => {
  let callCount = 0

  mockFetch({
    'GET /api/counter': { data: { count: 1 } }
  })

  globalThis.fetch = async (url) => {
    callCount++
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ count: callCount }),
      text: async () => JSON.stringify({ count: callCount })
    }
  }

  const { data, refetch } = useAsync(() => http.get('/api/counter'))

  await new Promise(resolve => setTimeout(resolve, 10))
  console.log('  First call data:', data())
  if (data().count !== 1) throw new Error('Expected count to be 1')

  await refetch()
  await new Promise(resolve => setTimeout(resolve, 10))
  console.log('  After refetch data:', data())
  if (data().count !== 2) throw new Error('Expected count to be 2 after refetch')

  restoreFetch()
})

// TEST 11: Named exports work
await runTest('Named exports work correctly', async () => {
  mockFetch({
    'GET /api/test': { data: { ok: true } },
    'POST /api/test': { data: { ok: true } },
    'PUT /api/test': { data: { ok: true } },
    'PATCH /api/test': { data: { ok: true } },
    'DELETE /api/test': { data: { ok: true } }
  })

  const results = await Promise.all([
    get('/api/test'),
    post('/api/test', {}),
    put('/api/test', {}),
    patch('/api/test', {}),
    del('/api/test')
  ])

  console.log('  All methods responded:', results.every(r => r.ok))

  if (!results.every(r => r.ok)) throw new Error('Expected all methods to work')

  restoreFetch()
})

console.log('\n=== All HTTP Client Tests Completed ===\n')
