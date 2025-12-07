import { signal } from "./signal.js";

export function createRouter(routes) {
  const [path, setPath] = signal(window.location.hash.slice(1) ||  "/")
  
  window.addEventListener('hashchange', () => {
    setPath(window.location.hash.slice(1) || '/')
  })
 
  function navigate(to) {
    window.location.hash = to
  }

  function matchRoute(pattern, path) {
    const patternParts =  pattern.split('/')
    const pathParts =  path.split('/')

    if (patternParts.length !== pathParts.length) {
      return null
    }

    const params =  {}

    for  (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]
      const pathPart = pathParts[i]
  
      if (patternPart.startsWith(':')) {
        // if starts with : save the  key 
        const key = patternPart.slice(1)
        params[key] = pathPart
      } else if (patternPart !== pathPart)  {
        //doesnt match
        return  null 
      }
      // if equal, continue
    }
    return params
  }

  function current() {
    const currentPath = path()
    
    for (const pattern in routes) {
      const  params = matchRoute(pattern, currentPath)
      if (params !== null) {
        return {
          component: routes[pattern],
          params: params
        }
      }
    }
    return null
  }

  return  {
    current,
    navigate,
    matchRoute
  }
}



