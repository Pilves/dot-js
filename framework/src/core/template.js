import { effect } from "./signal.js";

/**
 * Safe URL protocols for href, src, and similar attributes
 */
const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']
const URL_ATTRS = ['href', 'src', 'action', 'formaction', 'xlink:href']

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
      //check if its an attribute
      const isInAttribute = isInsideAttribute(htmlString)

      if (isInAttribute) {
        //use string marker for attributes
        htmlString += `__dot_${markerId}_attr_${i}__`
      } else {
        // comment marker for content
        htmlString += `<!--dot-${markerId}-${i}-->`
      }
    }
  })

  //create  template element to parse html
  const template = document.createElement("template")
  template.innerHTML = htmlString.trim()


  //return content
  const content = template.content.cloneNode(true)

  //find  and replace markers with combined TreeWalker
  processMarkersAndAttributes(content, values, markerId)

  // return one element or fragment
  if (content.childNodes.length === 1) {
    return content.firstChild
  }
  return content
}

function isInsideAttribute(html) {
  //find last < and >
  const lastOpen = html.lastIndexOf('<');
  const lastClose = html.lastIndexOf('>');
  // attribute if <came after >
  return lastOpen > lastClose
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
  return  Object.entries(styleObj).map(([key, value]) => {
    //convert camelCase to kebab-case: fontSize -> font-size
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    return `${cssKey}:  ${value}`
  })
  .join('; ')
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
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i]
        const match = attr.value.match(attrPattern)
        if (match) {
          attrsToProcess.push({ attr, index: parseInt(match[1]) })
        }
      }

      // Process collected attributes
      for (const { attr, index } of attrsToProcess) {
        const value = values[index]

        //check if its an event attribute
        if (attr.name.startsWith("on")) {
          // Type check: event handlers must be functions
          if (typeof value !== 'function') {
            console.warn(`Event handler for ${attr.name} must be a function, got ${typeof value}`)
            element.removeAttribute(attr.name)
            continue
          }
          // get  event name
          const eventName = attr.name.slice(2);
          //add the real event listener
          element.addEventListener(eventName, value)
          //remove placeholder
          element.removeAttribute(attr.name)
        } else if (attr.name === 'style') {
          element.removeAttribute(attr.name)
          //reactive  style binding
          if (typeof value === "function") {
            effect(() => {
              const result = value()
              element.setAttribute("style", styleObjectToString(result))
            })
          } else {
            //static style object
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
        } else {
          //regular attribute
          //remove placeholder
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
 * replace marker with   content
 */
function replaceMarker(markerNode,  value) {
  const parent  = markerNode.parentNode

  if (typeof value === "function") {
    // create text node && bind to effect
    const textNode = document.createTextNode("")
    parent.replaceChild(textNode, markerNode)

    //effect to update node when signal changes
    effect(() => {
      const result = value()
      textNode.textContent = result == null ? "" :  String(result)
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
