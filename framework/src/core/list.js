import { effect } from "./signal.js";

/**
 * Efficient keyed list rendering with DOM reconciliation
 *
 * @param {Function|Array} signalOrArray - A signal function returning an array, or a static array
 * @param {Function} keyFn - Function to extract unique key from each item: (item) => key
 * @param {Function} renderFn - Function to render each item: (item, index) => Node
 * @returns {DocumentFragment} - Fragment containing start/end markers and list items
 */
export function list(signalOrArray, keyFn, renderFn) {
  // Create boundary markers to track where the list lives in DOM
  const startMarker = document.createComment("list-start");
  const endMarker = document.createComment("list-end");

  // Map to track: key -> { node, item }
  let keyToNode = new Map();

  // Track if we've done initial render (to skip first effect run)
  let isFirstRun = true;

  /**
   * Reconcile the DOM based on new items
   * Uses key-based diffing to minimize DOM operations
   */
  function reconcile(items) {
    const parent = startMarker.parentNode;
    if (!parent) return false; // Not mounted yet

    const newKeys = items.map(keyFn);
    const newKeySet = new Set(newKeys);

    // Step 1: Remove nodes for keys that no longer exist
    for (const [key, entry] of keyToNode) {
      if (!newKeySet.has(key)) {
        entry.node.remove();
        keyToNode.delete(key);
      }
    }

    // Step 2: Create nodes for new keys, reuse existing
    const newKeyToNode = new Map();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const key = newKeys[i];

      if (keyToNode.has(key)) {
        // Reuse existing node
        const entry = keyToNode.get(key);
        newKeyToNode.set(key, entry);
        // Update item reference (in case item data changed but key is same)
        entry.item = item;
      } else {
        // Create new node
        const node = renderFn(item, i);
        newKeyToNode.set(key, { node, item });
      }
    }

    // Step 3: Reorder nodes to match new order
    // We iterate through new order and insert each node in correct position
    let currentNode = startMarker.nextSibling;

    for (let i = 0; i < newKeys.length; i++) {
      const key = newKeys[i];
      const entry = newKeyToNode.get(key);
      const targetNode = entry.node;

      if (currentNode !== targetNode) {
        // Node is not in correct position, move/insert it
        parent.insertBefore(targetNode, currentNode);
      } else {
        // Node is in correct position, move to next
        currentNode = currentNode.nextSibling;
      }
    }

    // Update our tracking state
    keyToNode = newKeyToNode;
    return true;
  }

  /**
   * Initial render - creates all nodes and populates keyToNode map
   */
  function initialRender(items) {
    const fragment = document.createDocumentFragment();

    items.forEach((item, index) => {
      const key = keyFn(item);
      const node = renderFn(item, index);
      keyToNode.set(key, { node, item });
      fragment.appendChild(node);
    });

    return fragment;
  }

  // Build the result fragment
  const result = document.createDocumentFragment();
  result.appendChild(startMarker);

  // Check if this is a reactive signal or static array
  if (typeof signalOrArray === "function") {
    // Get initial items and render them
    const initialItems = signalOrArray();
    const fragment = initialRender(initialItems);
    result.appendChild(fragment);
    result.appendChild(endMarker);

    // Set up effect for future updates
    // Effect runs immediately, so we use isFirstRun to skip the initial run
    effect(() => {
      // Read the signal to establish tracking/subscription
      const items = signalOrArray();

      // Skip the first run since we already rendered above
      if (isFirstRun) {
        isFirstRun = false;
        return;
      }

      // Reconcile on subsequent changes
      reconcile(items);
    });
  } else {
    // Static array: just render once
    const items = Array.isArray(signalOrArray) ? signalOrArray : [];
    const fragment = initialRender(items);
    result.appendChild(fragment);
    result.appendChild(endMarker);
  }

  return result;
}

/**
 * Helper to create a keyed list with simpler API
 * Automatically uses item.id as key if available
 *
 * @param {Function|Array} signalOrArray - Signal or array of items
 * @param {Function} renderFn - Render function for each item
 * @returns {DocumentFragment}
 */
export function each(signalOrArray, renderFn) {
  return list(
    signalOrArray,
    (item) => item.id ?? item,
    renderFn
  );
}
