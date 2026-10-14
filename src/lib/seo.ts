import { useEffect } from 'react'

function setMeta(selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  apply(el)
}

export function useSeo(title: string, description?: string, path?: string) {
  useEffect(() => {
    document.title = title
    if (description) {
      setMeta(
        'meta[name="description"]',
        () => Object.assign(document.createElement('meta'), { name: 'description' }),
        (el) => el.setAttribute('content', description),
      )
      setMeta(
        'meta[property="og:description"]',
        () => Object.assign(document.createElement('meta'), { property: 'og:description' }),
        (el) => el.setAttribute('content', description),
      )
    }
    setMeta(
      'meta[property="og:title"]',
      () => Object.assign(document.createElement('meta'), { property: 'og:title' }),
      (el) => el.setAttribute('content', title),
    )
    if (path) {
      const url = `${window.location.origin}${path}`
      setMeta(
        'meta[property="og:url"]',
        () => Object.assign(document.createElement('meta'), { property: 'og:url' }),
        (el) => el.setAttribute('content', url),
      )
      setMeta(
        'link[rel="canonical"]',
        () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
        (el) => el.setAttribute('href', url),
      )
    }
  }, [title, description, path])
}
