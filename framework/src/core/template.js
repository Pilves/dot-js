import { effect } from "./signal.js";

/**
 * Tagged template
 * @param {TemplateStringsArray} strings 
 * @param {...any} values 
 * @returns {Node}
 */
export function html(strings, ...values) {
  //create markers for each value
  const markers = values.map((_, i) => `<!--dot-${i}-->`)
  
  // build the string 
  let htmlString = ""

  strings.forEach((str, i) => {
    htmlString += str 
    if (i < values.length) {
      htmlString  += markers[i]
    }
  })

  //create  template element to parse html
  const template = document.createElement("template")
  template.innerHTML = htmlString.trim()


  //return content
  const content = template.content.cloneNode(true)

  //find  and replace markers
  processMarkers(content, values)
  
  // return one element or fragment
  if (content.childNodes.length === 1) {
    return content.firstChild
  }
  return content
}

//process DOM and replace markers with content 
function processMarkers(root, values) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_COMMENT,
    null
  )

  const nodesToProcess = []

  //find all comments
  while (walker.nextNode()) {
    const node = walker.currentNode 
    const match = node.textContent.match(/^dot-(\d+)$/)

    if (match) {
      const index = parseInt(match[1])
      nodesToProcess.push({node, index})
    }
  }

  // process every marker 
  nodesToProcess.forEach(({ node, index }) => {
    const value = values[index]
    replaceMarker(node,  value)
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




