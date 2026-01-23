import { signal, effect, computed } from "./signal.js";
import { html } from "./template.js";

/**
 * Create a virtual scrolling list for efficiently rendering large lists
 *
 * @param {Object} options - Configuration options
 * @param {Function|Array} options.items - Signal getter or array of items
 * @param {number} options.itemHeight - Fixed height per item in pixels
 * @param {number} options.containerHeight - Visible viewport height in pixels
 * @param {number} [options.buffer=5] - Extra items to render above/below viewport
 * @param {Function} options.renderItem - Function (item, index) => Node
 * @returns {Node} - Container DOM element ready to mount
 */
export function createVirtualList(options) {
  const {
    items,
    itemHeight,
    containerHeight,
    buffer = 5,
    renderItem
  } = options;

  // Normalize items to a getter function (handles both signals and static arrays)
  const getItems = typeof items === "function" ? items : () => items;

  // Track scroll position reactively
  const [scrollTop, setScrollTop] = signal(0);

  // Throttle scroll handler using requestAnimationFrame for smoother scrolling
  let rafId = null;

  function handleScroll(event) {
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;
      setScrollTop(event.target.scrollTop);
    });
  }

  // Compute total height of all items
  const totalHeight = computed(() => {
    const itemsArray = getItems();
    return itemsArray.length * itemHeight;
  });

  // Compute visible range of items
  const visibleRange = computed(() => {
    const itemsArray = getItems();
    const itemCount = itemsArray.length;
    const currentScrollTop = scrollTop();

    // Calculate first visible item index
    const firstVisible = Math.floor(currentScrollTop / itemHeight);

    // Calculate number of visible items
    const visibleCount = Math.ceil(containerHeight / itemHeight);

    // Apply buffer and clamp to valid range
    const startIndex = Math.max(0, firstVisible - buffer);
    const endIndex = Math.min(itemCount, firstVisible + visibleCount + buffer);

    return { startIndex, endIndex };
  });

  // Create the container element
  const container = html`<div
    class="virtual-list-container"
    style="${() => ({
      height: `${containerHeight}px`,
      overflow: 'auto',
      position: 'relative'
    })}"
  ></div>`;

  // Create the spacer element (maintains scroll height)
  const spacer = html`<div
    class="virtual-list-spacer"
    style="${() => ({
      height: `${totalHeight()}px`,
      position: 'relative'
    })}"
  ></div>`;

  // Create the content wrapper for positioned items
  const content = html`<div class="virtual-list-content"></div>`;

  // Assemble the structure
  spacer.appendChild(content);
  container.appendChild(spacer);

  // Attach scroll listener
  container.addEventListener("scroll", handleScroll, { passive: true });

  // Cache for rendered DOM nodes to enable reuse
  let renderedNodes = new Map(); // key: index, value: { node, item }

  // Effect to update rendered items when range or items change
  effect(() => {
    const itemsArray = getItems();
    const { startIndex, endIndex } = visibleRange();

    // Collect indices that are no longer visible
    const indicesToRemove = [];
    for (const [index] of renderedNodes) {
      if (index < startIndex || index >= endIndex) {
        indicesToRemove.push(index);
      }
    }

    // Remove nodes that are no longer visible
    for (const index of indicesToRemove) {
      const { node } = renderedNodes.get(index);
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
      renderedNodes.delete(index);
    }

    // Render items in visible range
    for (let i = startIndex; i < endIndex; i++) {
      const item = itemsArray[i];

      if (item === undefined) continue;

      // Check if this index already has a rendered node with same item
      const existing = renderedNodes.get(i);

      if (existing && existing.item === item) {
        // Item hasn't changed, just update position if needed
        existing.node.style.transform = `translateY(${i * itemHeight}px)`;
        continue;
      }

      // Need to render a new node
      const renderedContent = renderItem(item, i);

      // Wrap in positioned container
      const wrapper = document.createElement("div");
      wrapper.className = "virtual-list-item";
      wrapper.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: ${itemHeight}px;
        transform: translateY(${i * itemHeight}px);
        box-sizing: border-box;
      `;

      // Append rendered content
      if (renderedContent instanceof Node) {
        wrapper.appendChild(renderedContent);
      } else {
        wrapper.appendChild(document.createTextNode(String(renderedContent)));
      }

      // Remove old node if exists
      if (existing && existing.node.parentNode) {
        existing.node.parentNode.removeChild(existing.node);
      }

      // Add to DOM
      content.appendChild(wrapper);

      // Cache the node
      renderedNodes.set(i, { node: wrapper, item });
    }
  });

  // Expose some utility methods on the container
  container._virtualList = {
    scrollToIndex(index) {
      const targetScrollTop = index * itemHeight;
      container.scrollTop = targetScrollTop;
    },
    getVisibleRange() {
      return visibleRange();
    },
    refresh() {
      // Force re-render by triggering scroll update
      setScrollTop(container.scrollTop);
    },
    destroy() {
      // Remove scroll listener to prevent memory leaks
      container.removeEventListener("scroll", handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    }
  };

  return container;
}
