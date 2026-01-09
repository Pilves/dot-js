/**
 * Tests for template.js - tagged template literals for DOM creation
 * Requires DOM - uses happy-dom
 */

import { describe, test, assert, exit } from '../test-runner.js'

// Set up DOM environment with polyfills for happy-dom limitations
import './dom-setup.js'

// Import after DOM is set up
const { html } = await import('../template.js')

await describe('html - static templates', async () => {
  await test('creates a simple element', () => {
    const el = html`<div class="card">hello world</div>`
    assert.equal(el.tagName, 'DIV')
    assert.equal(el.className, 'card')
    assert.equal(el.textContent, 'hello world')
  })

  await test('creates nested elements', () => {
    const el = html`
      <div class="container">
        <h1>Title</h1>
        <p>some text here</p>
      </div>
    `
    assert.equal(el.tagName, 'DIV')
    assert.equal(el.children.length, 2)
    assert.equal(el.children[0].tagName, 'H1')
    assert.equal(el.children[1].tagName, 'P')
  })

  await test('preserves element attributes', () => {
    const el = html`<input type="text" name="email" placeholder="Enter email">`
    assert.equal(el.getAttribute('type'), 'text')
    assert.equal(el.getAttribute('name'), 'email')
    assert.equal(el.getAttribute('placeholder'), 'Enter email')
  })
})

await describe('html - interpolation', async () => {
  await test('interpolates string values', () => {
    const name = 'Mari'
    const el = html`<p>Hello ${name}!</p>`
    assert.equal(el.textContent, 'Hello Mari!')
  })

  await test('interpolates number values', () => {
    const age = 25
    const el = html`<p>Age: ${age}</p>`
    assert.equal(el.textContent, 'Age: 25')
  })

  await test('interpolates multiple values', () => {
    const name = 'Mari'
    const age = 25
    const el = html`
      <div>
        <p>Name: ${name}</p>
        <p>Age: ${age}</p>
      </div>
    `
    assert.ok(el.textContent.includes('Name: Mari'))
    assert.ok(el.textContent.includes('Age: 25'))
  })

  await test('handles null values', () => {
    const el = html`<p>Before ${null} after</p>`
    assert.equal(el.textContent, 'Before  after')
  })

  await test('handles undefined values', () => {
    const el = html`<p>Before ${undefined} after</p>`
    assert.equal(el.textContent, 'Before  after')
  })

  await test('handles boolean values', () => {
    const el = html`<p>Value: ${true}</p>`
    assert.equal(el.textContent, 'Value: true')
  })

  await test('handles expression calculations', () => {
    const el = html`<p>Result: ${3 + 3}</p>`
    assert.equal(el.textContent, 'Result: 6')
  })
})

await describe('html - nested elements', async () => {
  await test('nests DOM elements', () => {
    const inner = html`<span>inner</span>`
    const outer = html`<div class="wrapper">${inner}</div>`

    assert.equal(outer.children.length, 1)
    assert.equal(outer.children[0].tagName, 'SPAN')
    assert.equal(outer.children[0].textContent, 'inner')
  })

  await test('handles array of elements', () => {
    const items = [
      html`<li>Item 1</li>`,
      html`<li>Item 2</li>`,
      html`<li>Item 3</li>`
    ]
    const list = html`<ul>${items}</ul>`

    assert.equal(list.children.length, 3)
    assert.equal(list.children[0].textContent, 'Item 1')
    assert.equal(list.children[2].textContent, 'Item 3')
  })
})

await describe('html - attribute binding', async () => {
  await test('binds dynamic attribute values', () => {
    const className = 'active'
    const el = html`<div class=${className}>test</div>`
    assert.equal(el.className, 'active')
  })

  await test('binds style objects', () => {
    const el = html`<div style=${{ color: 'red', fontSize: '24px' }}>styled</div>`
    const style = el.getAttribute('style')
    assert.ok(style.includes('color'))
    assert.ok(style.includes('red'))
  })
})

await describe('html - event handling', async () => {
  await test('attaches event handlers', () => {
    let clicked = false
    const el = html`<button onclick=${() => { clicked = true }}>Click me</button>`

    // Simulate click
    el.click()
    assert.ok(clicked)
  })

  await test('event handlers receive event object', () => {
    let receivedEvent = null
    const el = html`<button onclick=${(e) => { receivedEvent = e }}>Click</button>`

    el.click()
    assert.ok(receivedEvent !== null)
  })
})

exit()
