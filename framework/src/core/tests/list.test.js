/**
 * Tests for list.js - efficient keyed list rendering
 * Requires DOM - uses happy-dom
 */

import { describe, test, assert, exit } from '../test-runner.js'

// Set up DOM environment with polyfills for happy-dom limitations
import './dom-setup.js'

// Import after DOM is set up
const { signal } = await import('../signal.js')
const { html } = await import('../template.js')
const { list, each } = await import('../list.js')

// Helper function to get element nodes from container
function getListItems(container) {
  const items = []
  let node = container.firstChild
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      items.push(node)
    }
    node = node.nextSibling
  }
  return items
}

// Helper to get text content of all list items
function getTextContent(container) {
  return getListItems(container).map(el => el.textContent)
}

await describe('list - initial render', async () => {
  await test('renders items from signal array', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 1, text: 'Buy milk' },
      { id: 2, text: 'Walk dog' },
      { id: 3, text: 'Write code' }
    ])

    container.appendChild(list(todos, item => item.id, item => html`<li>${item.text}</li>`))

    const items = getListItems(container)
    assert.equal(items.length, 3, 'Should render 3 items')
    assert.equal(items[0].textContent, 'Buy milk', 'First item text')
    assert.equal(items[1].textContent, 'Walk dog', 'Second item text')
    assert.equal(items[2].textContent, 'Write code', 'Third item text')
  })

  await test('renders items from static array', () => {
    const container = document.createElement('div')
    const staticItems = [
      { id: 1, text: 'Static 1' },
      { id: 2, text: 'Static 2' }
    ]

    container.appendChild(list(staticItems, item => item.id, item => html`<li>${item.text}</li>`))

    const items = getListItems(container)
    assert.equal(items.length, 2, 'Should render 2 static items')
    assert.equal(items[0].textContent, 'Static 1', 'First static item')
    assert.equal(items[1].textContent, 'Static 2', 'Second static item')
  })

  await test('handles empty array', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([])

    container.appendChild(list(todos, item => item.id, item => html`<li>${item.text}</li>`))

    const items = getListItems(container)
    assert.equal(items.length, 0, 'Should render empty list')
  })
})

await describe('list - adding items', async () => {
  await test('adds items to the end', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 1, text: 'Item 1' }
    ])

    container.appendChild(list(todos, item => item.id, item => html`<li data-id="${item.id}">${item.text}</li>`))

    // Store reference to original node
    const originalNode = container.querySelector('[data-id="1"]')

    // Add items
    setTodos([
      { id: 1, text: 'Item 1' },
      { id: 2, text: 'Item 2' },
      { id: 3, text: 'Item 3' }
    ])

    const items = getListItems(container)
    assert.equal(items.length, 3, 'Should have 3 items after adding')
    assert.equal(getTextContent(container).join(','), 'Item 1,Item 2,Item 3', 'Correct order')

    // Verify original node was reused
    const reusedNode = container.querySelector('[data-id="1"]')
    assert.ok(originalNode === reusedNode, 'Original node should be reused')
  })

  await test('adds items to the beginning', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 2, text: 'Item 2' }
    ])

    container.appendChild(list(todos, item => item.id, item => html`<li data-id="${item.id}">${item.text}</li>`))

    const originalNode = container.querySelector('[data-id="2"]')

    // Add item at beginning
    setTodos([
      { id: 1, text: 'Item 1' },
      { id: 2, text: 'Item 2' }
    ])

    const items = getListItems(container)
    assert.equal(items.length, 2, 'Should have 2 items')
    assert.equal(getTextContent(container).join(','), 'Item 1,Item 2', 'Correct order')

    // Verify original node was reused
    const reusedNode = container.querySelector('[data-id="2"]')
    assert.ok(originalNode === reusedNode, 'Original node should be reused')
  })

  await test('adds items to empty list', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([])

    container.appendChild(list(todos, item => item.id, item => html`<li>${item.text}</li>`))

    assert.equal(getListItems(container).length, 0, 'Initially empty')

    setTodos([{ id: 1, text: 'First item' }])

    const items = getListItems(container)
    assert.equal(items.length, 1, 'Should have 1 item after adding')
    assert.equal(items[0].textContent, 'First item', 'Correct text')
  })
})

await describe('list - removing items', async () => {
  await test('removes items from the middle', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 1, text: 'Item 1' },
      { id: 2, text: 'Item 2' },
      { id: 3, text: 'Item 3' }
    ])

    container.appendChild(list(todos, item => item.id, item => html`<li data-id="${item.id}">${item.text}</li>`))

    // Store reference to node that will remain
    const node3 = container.querySelector('[data-id="3"]')

    // Remove middle item
    setTodos([
      { id: 1, text: 'Item 1' },
      { id: 3, text: 'Item 3' }
    ])

    const items = getListItems(container)
    assert.equal(items.length, 2, 'Should have 2 items after removing')
    assert.equal(getTextContent(container).join(','), 'Item 1,Item 3', 'Correct items remain')
    assert.ok(container.querySelector('[data-id="2"]') === null, 'Removed item not in DOM')
    assert.ok(container.querySelector('[data-id="3"]') === node3, 'Remaining node reused')
  })

  await test('removes all items', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 1, text: 'Item 1' },
      { id: 2, text: 'Item 2' }
    ])

    container.appendChild(list(todos, item => item.id, item => html`<li>${item.text}</li>`))

    assert.equal(getListItems(container).length, 2, 'Initially 2 items')

    setTodos([])

    assert.equal(getListItems(container).length, 0, 'Should be empty after clearing')
  })

  await test('removes items from the end', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 1, text: 'Item 1' },
      { id: 2, text: 'Item 2' },
      { id: 3, text: 'Item 3' }
    ])

    container.appendChild(list(todos, item => item.id, item => html`<li>${item.text}</li>`))

    setTodos([
      { id: 1, text: 'Item 1' }
    ])

    const items = getListItems(container)
    assert.equal(items.length, 1, 'Should have 1 item')
    assert.equal(items[0].textContent, 'Item 1', 'Correct item remains')
  })
})

await describe('list - reordering items', async () => {
  await test('reverses order', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 1, text: 'First' },
      { id: 2, text: 'Second' },
      { id: 3, text: 'Third' }
    ])

    container.appendChild(list(todos, item => item.id, item => html`<li data-id="${item.id}">${item.text}</li>`))

    // Store references to original nodes
    const origNode1 = container.querySelector('[data-id="1"]')
    const origNode2 = container.querySelector('[data-id="2"]')
    const origNode3 = container.querySelector('[data-id="3"]')

    // Reverse order
    setTodos([
      { id: 3, text: 'Third' },
      { id: 2, text: 'Second' },
      { id: 1, text: 'First' }
    ])

    const items = getListItems(container)
    assert.equal(items.length, 3, 'Still 3 items')
    assert.equal(getTextContent(container).join(','), 'Third,Second,First', 'Reversed order')

    // Check same DOM nodes were reused (just moved)
    assert.ok(container.querySelector('[data-id="1"]') === origNode1, 'Node 1 reused')
    assert.ok(container.querySelector('[data-id="2"]') === origNode2, 'Node 2 reused')
    assert.ok(container.querySelector('[data-id="3"]') === origNode3, 'Node 3 reused')

    // Verify DOM order
    assert.ok(items[0] === origNode3, 'First position has node 3')
    assert.ok(items[1] === origNode2, 'Second position has node 2')
    assert.ok(items[2] === origNode1, 'Third position has node 1')
  })

  await test('moves single item', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 1, text: 'A' },
      { id: 2, text: 'B' },
      { id: 3, text: 'C' }
    ])

    container.appendChild(list(todos, item => item.id, item => html`<li data-id="${item.id}">${item.text}</li>`))

    const origNodeA = container.querySelector('[data-id="1"]')

    // Move A to end
    setTodos([
      { id: 2, text: 'B' },
      { id: 3, text: 'C' },
      { id: 1, text: 'A' }
    ])

    assert.equal(getTextContent(container).join(','), 'B,C,A', 'A moved to end')
    assert.ok(container.querySelector('[data-id="1"]') === origNodeA, 'Same node instance')
  })
})

await describe('list - complex operations', async () => {
  await test('add, remove, and reorder combined', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 1, text: 'A' },
      { id: 2, text: 'B' },
      { id: 3, text: 'C' },
      { id: 4, text: 'D' }
    ])

    container.appendChild(list(todos, item => item.id, item => html`<li data-id="${item.id}">${item.text}</li>`))

    const origA = container.querySelector('[data-id="1"]')
    const origC = container.querySelector('[data-id="3"]')

    // Complex change: remove B and D, add E, reorder
    setTodos([
      { id: 5, text: 'E' },  // new
      { id: 3, text: 'C' },  // moved
      { id: 1, text: 'A' }   // moved
    ])

    const items = getListItems(container)
    assert.equal(items.length, 3, 'Should have 3 items')
    assert.equal(getTextContent(container).join(','), 'E,C,A', 'Correct order')
    assert.ok(container.querySelector('[data-id="1"]') === origA, 'Node A reused')
    assert.ok(container.querySelector('[data-id="3"]') === origC, 'Node C reused')
    assert.ok(container.querySelector('[data-id="2"]') === null, 'Node B removed')
    assert.ok(container.querySelector('[data-id="4"]') === null, 'Node D removed')
    assert.ok(container.querySelector('[data-id="5"]') !== null, 'Node E added')
  })

  await test('handles duplicate updates', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 1, text: 'Item 1' }
    ])

    container.appendChild(list(todos, item => item.id, item => html`<li data-id="${item.id}">${item.text}</li>`))

    const origNode = container.querySelector('[data-id="1"]')

    // Update with same data multiple times
    setTodos([{ id: 1, text: 'Item 1' }])
    setTodos([{ id: 1, text: 'Item 1' }])
    setTodos([{ id: 1, text: 'Item 1' }])

    const items = getListItems(container)
    assert.equal(items.length, 1, 'Still 1 item')
    assert.ok(container.querySelector('[data-id="1"]') === origNode, 'Same node instance after updates')
  })
})

await describe('list - each() helper', async () => {
  await test('uses item.id as key automatically', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 'a', text: 'Item A' },
      { id: 'b', text: 'Item B' }
    ])

    container.appendChild(each(todos, item => html`<li data-id="${item.id}">${item.text}</li>`))

    const items = getListItems(container)
    assert.equal(items.length, 2, 'Should render 2 items')
    assert.equal(items[0].textContent, 'Item A', 'First item')
    assert.equal(items[1].textContent, 'Item B', 'Second item')
  })

  await test('updates correctly with each()', () => {
    const container = document.createElement('div')
    const [todos, setTodos] = signal([
      { id: 'a', text: 'Item A' },
      { id: 'b', text: 'Item B' }
    ])

    container.appendChild(each(todos, item => html`<li data-id="${item.id}">${item.text}</li>`))

    // Reorder and add
    setTodos([
      { id: 'b', text: 'Item B' },
      { id: 'a', text: 'Item A' },
      { id: 'c', text: 'Item C' }
    ])

    assert.equal(getTextContent(container).join(','), 'Item B,Item A,Item C', 'Correct order after update')
  })
})

await describe('list - nested templates', async () => {
  await test('renders complex nested templates', () => {
    const container = document.createElement('div')
    const [users, setUsers] = signal([
      { id: 1, name: 'Alice', role: 'Admin' },
      { id: 2, name: 'Bob', role: 'User' }
    ])

    container.appendChild(list(users, u => u.id, user => html`
      <div class="user-card" data-id="${user.id}">
        <h3>${user.name}</h3>
        <span class="role">${user.role}</span>
      </div>
    `))

    const cards = container.querySelectorAll('.user-card')
    assert.equal(cards.length, 2, 'Should render 2 user cards')
    assert.equal(cards[0].querySelector('h3').textContent, 'Alice', 'First card name')
    assert.equal(cards[0].querySelector('.role').textContent, 'Admin', 'First card role')
    assert.equal(cards[1].querySelector('h3').textContent, 'Bob', 'Second card name')
  })
})

await describe('list - edge cases', async () => {
  await test('handles string keys', () => {
    const container = document.createElement('div')
    const [items, setItems] = signal([
      { key: 'foo', text: 'Foo' },
      { key: 'bar', text: 'Bar' }
    ])

    container.appendChild(list(items, item => item.key, item => html`<li>${item.text}</li>`))

    assert.equal(getListItems(container).length, 2, 'Renders with string keys')
  })

  await test('handles numeric keys', () => {
    const container = document.createElement('div')
    const [items, setItems] = signal([
      { num: 100, text: 'Hundred' },
      { num: 200, text: 'Two hundred' }
    ])

    container.appendChild(list(items, item => item.num, item => html`<li>${item.text}</li>`))

    assert.equal(getListItems(container).length, 2, 'Renders with numeric keys')
  })

  await test('handles rapid successive updates', () => {
    const container = document.createElement('div')
    const [items, setItems] = signal([])

    container.appendChild(list(items, item => item.id, item => html`<li>${item.text}</li>`))

    // Rapid updates
    setItems([{ id: 1, text: 'One' }])
    setItems([{ id: 1, text: 'One' }, { id: 2, text: 'Two' }])
    setItems([{ id: 2, text: 'Two' }])
    setItems([{ id: 2, text: 'Two' }, { id: 3, text: 'Three' }])

    const finalItems = getListItems(container)
    assert.equal(finalItems.length, 2, 'Final count correct')
    assert.equal(getTextContent(container).join(','), 'Two,Three', 'Final order correct')
  })
})

exit()
