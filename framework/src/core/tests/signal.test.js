/**
 * Tests for signal.js - reactive primitives
 * No DOM required - runs in pure Node.js
 */

import { describe, test, assert, exit } from '../test-runner.js'
import { signal, effect, computed } from '../signal.js'

await describe('signal - basic functionality', async () => {
  await test('creates a signal with initial value', () => {
    const [count, setCount] = signal(0)
    assert.equal(count(), 0)
  })

  await test('updates value with setter', () => {
    const [count, setCount] = signal(0)
    setCount(5)
    assert.equal(count(), 5)
  })

  await test('updates value with function', () => {
    const [count, setCount] = signal(0)
    setCount(5)
    setCount(n => n + 1)
    assert.equal(count(), 6)
  })

  await test('handles string values', () => {
    const [name, setName] = signal('Mari')
    assert.equal(name(), 'Mari')
    setName('Tiina')
    assert.equal(name(), 'Tiina')
  })

  await test('does not trigger update when value is the same', () => {
    const [count, setCount] = signal(5)
    let updateCount = 0
    effect(() => {
      count()
      updateCount++
    })
    // Effect runs once on creation
    assert.equal(updateCount, 1)

    setCount(5) // Same value
    assert.equal(updateCount, 1) // Should not have updated

    setCount(10) // Different value
    assert.equal(updateCount, 2) // Should have updated
  })
})

await describe('effect - reactive effects', async () => {
  await test('runs immediately on creation', () => {
    let ran = false
    effect(() => {
      ran = true
    })
    assert.ok(ran)
  })

  await test('runs when dependent signal changes', () => {
    const [count, setCount] = signal(0)
    let effectValue = null

    effect(() => {
      effectValue = count()
    })

    assert.equal(effectValue, 0)

    setCount(10)
    assert.equal(effectValue, 10)
  })

  await test('tracks multiple signals', () => {
    const [a, setA] = signal(1)
    const [b, setB] = signal(2)
    let sum = 0

    effect(() => {
      sum = a() + b()
    })

    assert.equal(sum, 3)

    setA(5)
    assert.equal(sum, 7)

    setB(10)
    assert.equal(sum, 15)
  })

  await test('multiple effects on same signal', () => {
    const [temp, setTemp] = signal(20)
    let effect1Value = null
    let effect2Value = null

    effect(() => {
      effect1Value = temp()
    })

    effect(() => {
      effect2Value = temp() < 15 ? 'cold' : 'warm'
    })

    assert.equal(effect1Value, 20)
    assert.equal(effect2Value, 'warm')

    setTemp(10)
    assert.equal(effect1Value, 10)
    assert.equal(effect2Value, 'cold')
  })
})

await describe('computed - derived values', async () => {
  await test('computes initial value', () => {
    const [a, setA] = signal(2)
    const [b, setB] = signal(3)
    const sum = computed(() => a() + b())

    assert.equal(sum(), 5)
  })

  await test('updates when dependencies change', () => {
    const [a, setA] = signal(2)
    const [b, setB] = signal(3)
    const sum = computed(() => a() + b())

    setA(10)
    assert.equal(sum(), 13)

    setB(20)
    assert.equal(sum(), 30)
  })

  await test('can depend on other computed values', () => {
    const [a, setA] = signal(2)
    const doubled = computed(() => a() * 2)
    const quadrupled = computed(() => doubled() * 2)

    assert.equal(doubled(), 4)
    assert.equal(quadrupled(), 8)

    setA(5)
    assert.equal(doubled(), 10)
    assert.equal(quadrupled(), 20)
  })

  await test('computed with complex expressions', () => {
    const [items, setItems] = signal([1, 2, 3])
    const total = computed(() => items().reduce((sum, n) => sum + n, 0))

    assert.equal(total(), 6)

    setItems([1, 2, 3, 4])
    assert.equal(total(), 10)
  })
})

exit()
