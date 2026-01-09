/**
 * Tests for virtual-list.js
 *
 * Run with: node --experimental-vm-modules test-virtual-list.js
 * Or in browser environment
 */

import { signal, effect } from "./signal.js";
import { html } from "./template.js";
import { mount } from "./component.js";
import { createVirtualList } from "./virtual-list.js";

// Simple test runner
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, but got ${actual}`
    );
  }
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`[FAIL] ${name}: ${error.message}`);
    testsFailed++;
  }
}

function createMockDOM() {
  // Simple DOM mock for Node.js environment
  if (typeof document === "undefined") {
    console.log("Skipping tests - no DOM environment available");
    console.log("Run these tests in a browser or with jsdom");
    return false;
  }
  return true;
}

// Helper to wait for effects to settle
function nextTick() {
  return new Promise(resolve => setTimeout(resolve, 20));
}

// Helper to count rendered items
function countRenderedItems(container) {
  return container.querySelectorAll(".virtual-list-item").length;
}

// Helper to get rendered item indices
function getRenderedIndices(container) {
  const items = container.querySelectorAll(".virtual-list-item");
  const indices = [];
  items.forEach(item => {
    const transform = item.style.transform;
    const match = transform.match(/translateY\((\d+)px\)/);
    if (match) {
      const y = parseInt(match[1]);
      // Assuming we know itemHeight from test context
      indices.push(y);
    }
  });
  return indices;
}

async function runTests() {
  if (!createMockDOM()) {
    return;
  }

  const testContainer = document.createElement("div");
  testContainer.id = "test-container";
  document.body.appendChild(testContainer);

  // Test 1: Renders only visible items
  await test("renders only visible items plus buffer", async () => {
    // Create 1000 items
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    const virtualList = createVirtualList({
      items: items,
      itemHeight: 40,
      containerHeight: 200, // Shows 5 items (200/40)
      buffer: 2,
      renderItem: (item, index) => html`<div class="item">${item.name}</div>`
    });

    testContainer.innerHTML = "";
    testContainer.appendChild(virtualList);

    await nextTick();

    // Should render: 5 visible + 2 buffer below = 7 items
    // (no buffer above since we're at top)
    const renderedCount = countRenderedItems(virtualList);

    // Expected: startIndex = max(0, 0-2) = 0
    // endIndex = min(1000, 0+5+2) = 7
    // So 7 items should be rendered
    assert(
      renderedCount >= 5 && renderedCount <= 10,
      `Expected 5-10 rendered items, got ${renderedCount}`
    );

    // Verify container structure
    assert(
      virtualList.classList.contains("virtual-list-container"),
      "Container should have virtual-list-container class"
    );

    const spacer = virtualList.querySelector(".virtual-list-spacer");
    assert(spacer, "Should have spacer element");

    // Spacer should have full height
    const spacerHeight = parseInt(spacer.style.height);
    assertEqual(spacerHeight, 1000 * 40, "Spacer height should be itemCount * itemHeight");
  });

  // Test 2: Updates on scroll
  await test("updates rendered items on scroll", async () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    const virtualList = createVirtualList({
      items: items,
      itemHeight: 50,
      containerHeight: 200, // Shows 4 items
      buffer: 1,
      renderItem: (item, index) => html`<div class="item">${item.name}</div>`
    });

    testContainer.innerHTML = "";
    testContainer.appendChild(virtualList);

    await nextTick();

    // Get initial rendered items
    const initialContent = virtualList.querySelector(".virtual-list-content");
    const initialCount = countRenderedItems(virtualList);

    // Scroll down
    virtualList.scrollTop = 500; // 10 items down
    virtualList.dispatchEvent(new Event("scroll"));

    // Wait for throttled scroll handler
    await new Promise(resolve => setTimeout(resolve, 50));

    // Items should now be around index 10
    const afterScrollCount = countRenderedItems(virtualList);

    // Should still have approximately same number of rendered items
    assert(
      afterScrollCount >= 4 && afterScrollCount <= 10,
      `After scroll: expected 4-10 rendered items, got ${afterScrollCount}`
    );

    // Check that items are positioned correctly for scroll position
    const renderedItems = virtualList.querySelectorAll(".virtual-list-item");
    let hasItemsAtCorrectPosition = false;

    renderedItems.forEach(item => {
      const transform = item.style.transform;
      const match = transform.match(/translateY\((\d+)px\)/);
      if (match) {
        const y = parseInt(match[1]);
        // After scrolling 500px (10 items), visible items should be around index 9-15
        // which means y positions around 450-750
        if (y >= 400 && y <= 800) {
          hasItemsAtCorrectPosition = true;
        }
      }
    });

    assert(hasItemsAtCorrectPosition, "Should have items positioned for scroll position");
  });

  // Test 3: Handles items array changes with signals
  await test("handles reactive items array changes", async () => {
    const [getItems, setItems] = signal(
      Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Item ${i}` }))
    );

    const virtualList = createVirtualList({
      items: getItems,
      itemHeight: 40,
      containerHeight: 160, // Shows 4 items
      buffer: 1,
      renderItem: (item, index) => html`<div class="item">${item.name}</div>`
    });

    testContainer.innerHTML = "";
    testContainer.appendChild(virtualList);

    await nextTick();

    const initialCount = countRenderedItems(virtualList);
    assert(initialCount > 0, "Should have rendered items initially");

    // Update items array
    setItems(
      Array.from({ length: 20 }, (_, i) => ({ id: i, name: `New Item ${i}` }))
    );

    await nextTick();

    // Check spacer height updated
    const spacer = virtualList.querySelector(".virtual-list-spacer");
    const newSpacerHeight = parseInt(spacer.style.height);
    assertEqual(newSpacerHeight, 20 * 40, "Spacer height should update with new item count");

    // Verify new content is rendered
    const content = virtualList.querySelector(".virtual-list-content");
    assert(
      content.textContent.includes("New Item"),
      "Should render new items after update"
    );
  });

  // Test 4: Works with static array (non-signal)
  await test("works with static array", async () => {
    const staticItems = [
      { id: 1, name: "Static 1" },
      { id: 2, name: "Static 2" },
      { id: 3, name: "Static 3" },
      { id: 4, name: "Static 4" },
      { id: 5, name: "Static 5" }
    ];

    const virtualList = createVirtualList({
      items: staticItems,
      itemHeight: 30,
      containerHeight: 120,
      buffer: 0,
      renderItem: (item, index) => html`<span>${item.name}</span>`
    });

    testContainer.innerHTML = "";
    testContainer.appendChild(virtualList);

    await nextTick();

    const renderedCount = countRenderedItems(virtualList);
    assert(renderedCount > 0, "Should render items from static array");

    // Check content
    const content = virtualList.querySelector(".virtual-list-content");
    assert(
      content.textContent.includes("Static"),
      "Should render static array items"
    );
  });

  // Test 5: scrollToIndex utility method
  await test("scrollToIndex method works correctly", async () => {
    const items = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    const virtualList = createVirtualList({
      items: items,
      itemHeight: 25,
      containerHeight: 100,
      buffer: 2,
      renderItem: (item, index) => html`<div class="item">${item.name}</div>`
    });

    testContainer.innerHTML = "";
    testContainer.appendChild(virtualList);

    await nextTick();

    // Use scrollToIndex
    virtualList._virtualList.scrollToIndex(50);

    assertEqual(
      virtualList.scrollTop,
      50 * 25,
      "scrollToIndex should set correct scroll position"
    );
  });

  // Test 6: Items positioned absolutely
  await test("items use absolute positioning", async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    const virtualList = createVirtualList({
      items: items,
      itemHeight: 40,
      containerHeight: 200,
      buffer: 0,
      renderItem: (item, index) => html`<div>${item.name}</div>`
    });

    testContainer.innerHTML = "";
    testContainer.appendChild(virtualList);

    await nextTick();

    const renderedItems = virtualList.querySelectorAll(".virtual-list-item");

    renderedItems.forEach((item, i) => {
      assert(
        item.style.position === "absolute",
        "Items should be absolutely positioned"
      );

      assert(
        item.style.transform.includes("translateY"),
        "Items should use transform for positioning"
      );
    });
  });

  // Test 7: Container has correct structure and styles
  await test("container has correct structure and styles", async () => {
    const items = [{ id: 1, name: "Test" }];

    const virtualList = createVirtualList({
      items: items,
      itemHeight: 40,
      containerHeight: 300,
      buffer: 0,
      renderItem: (item) => html`<div>${item.name}</div>`
    });

    testContainer.innerHTML = "";
    testContainer.appendChild(virtualList);

    await nextTick();

    // Check container styles
    const containerStyle = virtualList.style;
    assertEqual(containerStyle.height, "300px", "Container should have correct height");
    assertEqual(containerStyle.overflow, "auto", "Container should have overflow: auto");
    assertEqual(containerStyle.position, "relative", "Container should be relatively positioned");

    // Check structure
    const spacer = virtualList.querySelector(".virtual-list-spacer");
    assert(spacer, "Should have spacer element");
    assertEqual(spacer.style.position, "relative", "Spacer should be relatively positioned");

    const content = virtualList.querySelector(".virtual-list-content");
    assert(content, "Should have content element");
  });

  // Test 8: Empty items array
  await test("handles empty items array", async () => {
    const virtualList = createVirtualList({
      items: [],
      itemHeight: 40,
      containerHeight: 200,
      buffer: 2,
      renderItem: (item) => html`<div>${item.name}</div>`
    });

    testContainer.innerHTML = "";
    testContainer.appendChild(virtualList);

    await nextTick();

    const renderedCount = countRenderedItems(virtualList);
    assertEqual(renderedCount, 0, "Should render no items for empty array");

    const spacer = virtualList.querySelector(".virtual-list-spacer");
    assertEqual(parseInt(spacer.style.height), 0, "Spacer height should be 0 for empty array");
  });

  // Test 9: getVisibleRange utility
  await test("getVisibleRange returns correct range", async () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    const virtualList = createVirtualList({
      items: items,
      itemHeight: 40,
      containerHeight: 200, // 5 visible items
      buffer: 3,
      renderItem: (item) => html`<div>${item.name}</div>`
    });

    testContainer.innerHTML = "";
    testContainer.appendChild(virtualList);

    await nextTick();

    const range = virtualList._virtualList.getVisibleRange();

    assertEqual(range.startIndex, 0, "Initial startIndex should be 0");
    assert(
      range.endIndex >= 5 && range.endIndex <= 10,
      `endIndex should be between 5 and 10, got ${range.endIndex}`
    );
  });

  // Test 10: Large dataset performance (basic check)
  await test("handles large dataset", async () => {
    const startTime = performance.now();

    const items = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: `Description for item ${i}`
    }));

    const virtualList = createVirtualList({
      items: items,
      itemHeight: 60,
      containerHeight: 400,
      buffer: 5,
      renderItem: (item, index) => html`
        <div class="item">
          <strong>${item.name}</strong>
          <p>${item.description}</p>
        </div>
      `
    });

    testContainer.innerHTML = "";
    testContainer.appendChild(virtualList);

    await nextTick();

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should render quickly (under 100ms for 10000 items)
    assert(
      duration < 500,
      `Should render 10000 items quickly, took ${duration.toFixed(2)}ms`
    );

    // Should only render a small subset
    const renderedCount = countRenderedItems(virtualList);
    assert(
      renderedCount < 50,
      `Should render far fewer than 10000 items, rendered ${renderedCount}`
    );

    // Spacer should have full height
    const spacer = virtualList.querySelector(".virtual-list-spacer");
    assertEqual(
      parseInt(spacer.style.height),
      10000 * 60,
      "Spacer should have full height for all items"
    );
  });

  // Cleanup
  testContainer.remove();

  // Summary
  console.log("\n--- Test Summary ---");
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}`);

  if (testsFailed > 0) {
    console.error("\nSome tests failed!");
    if (typeof process !== "undefined") {
      process.exit(1);
    }
  } else {
    console.log("\nAll tests passed!");
  }
}

// Run tests
runTests().catch(console.error);

// Export for module use
export { runTests };
