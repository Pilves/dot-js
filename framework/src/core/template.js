import { effect } from "./signal.js";

/**
 * Safe URL protocols for href, src, and similar attributes
 */
const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']
const URL_ATTRS = ['href', 'src', 'action', 'formaction', 'xlink:href']
const BOOLEAN_ATTRS = ['checked', 'disabled', 'selected', 'readonly', 'required', 'multiple', 'autofocus', 'hidden', 'open']

/**
 * Sanitize URLs to prevent javascript: and data: protocol attacks
 * @param {string} url - The URL to sanitize
 * @returns {string} - Safe URL or 'about:blank' if unsafe
 */
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return url
  const trimmed = url.trim().toLowerCase()
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
    console.warn('Blocked potentially unsafe URL:', url)
    return 'about:blank'
  }
  return url
}

/**
 * Tagged template
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 * @returns {Node}
 */
export function html(strings, ...values) {
  // Generate unique marker ID to prevent spoofing
  const markerId = Math.random().toString(36).slice(2, 10)

  // build the string
  let htmlString = ""

  strings.forEach((str, i) => {
    htmlString += str
    if (i < values.length) {
      // Check if it's an attribute
      const isInAttribute = isInsideAttribute(htmlString)

      if (isInAttribute) {
        // Use string marker for attributes
        htmlString += `__dot_${markerId}_attr_${i}__`
      } else {
        // comment marker for content
        htmlString += `<!--dot-${markerId}-${i}-->`
      }
    }
  })

  // Create template element to parse HTML
  const template = document.createElement("template")
  template.innerHTML = htmlString.trim()

  // Return content
  const content = template.content.cloneNode(true)

  // Find and replace markers with combined TreeWalker
  processMarkersAndAttributes(content, values, markerId)

  // return one element or fragment
  if (content.childNodes.length === 1) {
    return content.firstChild
  }
  return content
}

function isInsideAttribute(html) {
  // Find last < and >
  const lastOpen = html.lastIndexOf('<');
  const lastClose = html.lastIndexOf('>');
  // Attribute if < came after >
  return lastOpen > lastClose
}

/**
 * Sanitize CSS values to prevent XSS attacks
 * @param {string} value - The CSS value to sanitize
 * @returns {string} - Sanitized CSS value
 */
function sanitizeCssValue(value) {
  if (!value || typeof value !== 'string') {
    return String(value || '')
  }

  const trimmed = value.trim().toLowerCase()

  // Block dangerous URL protocols in url() values
  if (trimmed.includes('url(')) {
    if (trimmed.includes('javascript:') ||
        trimmed.includes('data:') ||
        trimmed.includes('vbscript:')) {
      console.warn('Blocked potentially unsafe CSS url():', value)
      return ''
    }
  }

  // Block IE-specific XSS vectors
  if (trimmed.includes('expression(')) {
    console.warn('Blocked CSS expression():', value)
    return ''
  }

  // Block IE behavior property
  if (trimmed.startsWith('behavior:')) {
    console.warn('Blocked CSS behavior property:', value)
    return ''
  }

  return value
}

/**
 * convert style object to CSS string
 * @param {Object} styleObj  - { color: "red", fontSize: '14px'}
 * @returns {string} - "color: red; font-size: 14px;"
 */
function styleObjectToString(styleObj) {
  if (!styleObj || typeof styleObj !== 'object') {
    return String(styleObj || '')
  }
  return Object.entries(styleObj).map(([key, value]) => {
    // Convert camelCase to kebab-case: fontSize -> font-size
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()

    // Block behavior property at the key level (IE-specific)
    if (cssKey === 'behavior') {
      console.warn('Blocked CSS behavior property')
      return ''
    }

    // Sanitize the value
    const sanitizedValue = sanitizeCssValue(String(value))
    if (!sanitizedValue) {
      return '' // Skip this property if value was blocked
    }

    return `${cssKey}: ${sanitizedValue}`
  })
  .filter(prop => prop !== '') // Remove empty properties
  .join('; ')
}

/**
 * Apply a single attribute to an element with proper handling for special cases
 * @param {HTMLElement} element - The element to apply the attribute to
 * @param {string} name - Attribute name
 * @param {any} value - Attribute value
 */
function applyAttribute(element, name, value) {
  // Event handler
  if (name.startsWith('on')) {
    if (typeof value === 'function') {
      const eventName = name.slice(2)
      element.addEventListener(eventName, value)
    }
    return
  }

  // Style attribute
  if (name === 'style') {
    if (typeof value === 'function') {
      effect(() => {
        element.setAttribute('style', styleObjectToString(value()))
      })
    } else {
      element.setAttribute('style', styleObjectToString(value))
    }
    return
  }

  // URL attributes
  if (URL_ATTRS.includes(name)) {
    if (typeof value === 'function') {
      effect(() => {
        element.setAttribute(name, sanitizeUrl(value()))
      })
    } else {
      element.setAttribute(name, sanitizeUrl(value))
    }
    return
  }

  // Boolean attributes
  if (BOOLEAN_ATTRS.includes(name)) {
    if (typeof value === 'function') {
      effect(() => {
        if (value()) {
          element.setAttribute(name, '')
        } else {
          element.removeAttribute(name)
        }
      })
    } else {
      if (value) {
        element.setAttribute(name, '')
      }
    }
    return
  }

  // Form element value property
  if (name === 'value' && (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA')) {
    if (typeof value === 'function') {
      effect(() => {
        const newVal = value() ?? ''
        // Only update if different to preserve cursor position
        if (element.value !== String(newVal)) {
          element.value = newVal
        }
      })
    } else {
      element.value = value ?? ''
    }
    return
  }

  // Checkbox/radio checked property (must use property, not attribute for reactivity)
  if (name === 'checked' && element.tagName === 'INPUT') {
    if (typeof value === 'function') {
      effect(() => {
        element.checked = !!value()
      })
    } else {
      element.checked = !!value
    }
    return
  }

  // Regular attribute
  if (typeof value === 'function') {
    effect(() => {
      element.setAttribute(name, value())
    })
  } else {
    element.setAttribute(name, value)
  }
}

/**
 * Combined TreeWalker for processing both comment markers and attributes
 * @param {Node} root - Root node to traverse
 * @param {Array} values - Template values
 * @param {string} markerId - Unique marker ID for this template
 */
function processMarkersAndAttributes(root, values, markerId) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
    null
  )

  const commentNodesToProcess = []
  const attrPattern = new RegExp(`__dot_${markerId}_attr_(\\d+)__`)
  const commentPattern = new RegExp(`^dot-${markerId}-(\\d+)$`)

  // First pass: collect all nodes to process
  while (walker.nextNode()) {
    const node = walker.currentNode

    if (node.nodeType === Node.COMMENT_NODE) {
      // Process comment markers
      const match = node.textContent.match(commentPattern)
      if (match) {
        const index = parseInt(match[1])
        commentNodesToProcess.push({ node, index })
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Process attributes
      const element = node

      // Collect attributes to process (iterate backwards to safely remove)
      const attrsToProcess = []
      const spreadAttrsToProcess = []
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i]
        // Check if marker is in attribute VALUE (e.g., class="${...}")
        const valueMatch = attr.value.match(attrPattern)
        if (valueMatch) {
          attrsToProcess.push({ attr, index: parseInt(valueMatch[1]) })
        }
        // Check if marker is the attribute NAME (e.g., ${bind(...)}) - object spread
        const nameMatch = attr.name.match(attrPattern)
        if (nameMatch) {
          spreadAttrsToProcess.push({ attr, index: parseInt(nameMatch[1]) })
        }
      }

      // Process object spreads first (e.g., ${bind([signal, setSignal])})
      for (const { attr, index } of spreadAttrsToProcess) {
        const value = values[index]
        element.removeAttribute(attr.name)

        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Node)) {
          // Spread object properties as attributes
          for (const [propName, propValue] of Object.entries(value)) {
            applyAttribute(element, propName, propValue)
          }
        }
      }

      // Process collected attributes
      for (const { attr, index } of attrsToProcess) {
        const value = values[index]

        // Check if it's an event handler
        if (attr.name.startsWith("on")) {
          // Type check: event handlers must be functions
          if (typeof value !== 'function') {
            console.warn(`Event handler for ${attr.name} must be a function, got ${typeof value}`)
            element.removeAttribute(attr.name)
            continue
          }
          // Get event name
          const eventName = attr.name.slice(2);
          // Add the real event listener
          element.addEventListener(eventName, value)
          // Remove placeholder
          element.removeAttribute(attr.name)
        } else if (attr.name === 'style') {
          element.removeAttribute(attr.name)
          // Reactive style binding
          if (typeof value === "function") {
            effect(() => {
              const result = value()
              element.setAttribute("style", styleObjectToString(result))
            })
          } else {
            // Static style object
            element.setAttribute("style", styleObjectToString(value))
          }
        } else if (URL_ATTRS.includes(attr.name)) {
          // URL attribute - sanitize for security
          element.removeAttribute(attr.name)
          if (typeof value === "function") {
            effect(() => {
              const result = value()
              element.setAttribute(attr.name, sanitizeUrl(result))
            })
          } else {
            element.setAttribute(attr.name, sanitizeUrl(value))
          }
        } else if (attr.name === 'checked' && element.tagName === 'INPUT') {
          // Checkbox/radio checked - use property for reactivity
          element.removeAttribute(attr.name)
          if (typeof value === "function") {
            effect(() => {
              element.checked = !!value()
            })
          } else {
            element.checked = !!value
          }
        } else if (BOOLEAN_ATTRS.includes(attr.name)) {
          // Boolean attribute - presence means true, absence means false
          element.removeAttribute(attr.name)
          if (typeof value === "function") {
            effect(() => {
              const result = value()
              if (result) {
                element.setAttribute(attr.name, '')
              } else {
                element.removeAttribute(attr.name)
              }
            })
          } else {
            if (value) {
              element.setAttribute(attr.name, '')
            }
            // If falsy, attribute stays removed
          }
        } else if (attr.name === 'value' && (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA')) {
          // Form element value - use property, not attribute
          element.removeAttribute(attr.name)
          if (typeof value === "function") {
            effect(() => {
              const result = value() ?? ''
              // Only update if different to preserve cursor position
              if (element.value !== String(result)) {
                element.value = result
              }
            })
          } else {
            element.value = value ?? ''
          }
        } else {
          // Regular attribute
          // Remove placeholder
          element.removeAttribute(attr.name)
          if (typeof value === "function") {
            // update attribute when signal changes
            effect(() => {
              const result = value()
              element.setAttribute(attr.name, result)
            })
          } else {
            element.setAttribute(attr.name, value)
          }
        }
      }
    }
  }

  // Second pass: replace comment markers with content
  commentNodesToProcess.forEach(({ node, index }) => {
    const value = values[index]
    replaceMarker(node, value)
  })
}

/**
 * Replace marker with content
 */
function replaceMarker(markerNode, value) {
  const parent = markerNode.parentNode

  if (typeof value === "function") {
    // Create a placeholder for reactive content
    let currentNode = document.createTextNode("")
    parent.replaceChild(currentNode, markerNode)

    // Effect to update node when signal changes
    effect(() => {
      const result = value()
      let newNode

      if (result instanceof Node) {
        // Result is a DOM node - use it directly
        newNode = result
      } else if (Array.isArray(result)) {
        // Result is an array - create fragment
        newNode = document.createDocumentFragment()
        result.forEach((item) => {
          if (item instanceof Node) {
            newNode.appendChild(item)
          } else {
            newNode.appendChild(document.createTextNode(String(item ?? '')))
          }
        })
        // Fragment needs a wrapper to be replaceable
        const wrapper = document.createElement('span')
        wrapper.appendChild(newNode)
        newNode = wrapper
      } else {
        // Result is text - create text node
        newNode = document.createTextNode(result == null ? "" : String(result))
      }

      // Replace current node with new content (use currentNode.parentNode to get actual parent)
      const actualParent = currentNode.parentNode
      if (actualParent) {
        actualParent.replaceChild(newNode, currentNode)
        currentNode = newNode
      }
    })
  } else if (value instanceof Node) {
    // if DOM node - add
    parent.replaceChild(value, markerNode)
  } else if (Array.isArray(value)) {
    // array add all elements
    const fragment = document.createDocumentFragment()
    value.forEach((item) => {
      if (item instanceof Node ) {
        fragment.appendChild(item)
      } else  {
        fragment.appendChild(document.createTextNode(String(item)))
      }
    })
    parent.replaceChild(fragment, markerNode)
  } else {
    // static value - text node
    const textNode = document.createTextNode(value == null ? "" : String(value))
    parent.replaceChild(textNode, markerNode)
  }

}
