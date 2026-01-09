/**
 * DOM setup for tests using happy-dom
 * Includes polyfills for happy-dom limitations
 */

import { Window } from 'happy-dom'

const window = new Window()

// Set up global DOM environment
global.document = window.document
global.Node = window.Node
global.NodeFilter = window.NodeFilter
global.DocumentFragment = window.DocumentFragment
global.window = window

// Polyfill TreeWalker for comment node support
// happy-dom's TreeWalker has issues with SHOW_COMMENT filter
const originalCreateTreeWalker = document.createTreeWalker.bind(document)

document.createTreeWalker = function(root, whatToShow, filter) {
  // If requesting comments, use a custom implementation
  if (whatToShow === NodeFilter.SHOW_COMMENT) {
    return createCommentWalker(root)
  }
  return originalCreateTreeWalker(root, whatToShow, filter)
}

/**
 * Custom comment walker that works with happy-dom
 */
function createCommentWalker(root) {
  const comments = []

  // Recursively collect all comment nodes
  function collectComments(node) {
    for (const child of node.childNodes) {
      if (child.nodeType === 8) { // COMMENT_NODE
        comments.push(child)
      }
      if (child.childNodes && child.childNodes.length > 0) {
        collectComments(child)
      }
    }
  }

  collectComments(root)

  let index = -1

  return {
    currentNode: null,
    nextNode() {
      index++
      if (index < comments.length) {
        this.currentNode = comments[index]
        return this.currentNode
      }
      return null
    }
  }
}

export { window }
