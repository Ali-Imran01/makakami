// React hook for running code when values change.
import { useEffect } from 'react'

// Sets the browser tab title for the current page (screen readers announce a changed title) and, for pages that must not
// appear in search engines (staff area, account pages), a "noindex" robots tag.
export function usePageMeta(title: string, noindex = false) {
  useEffect(() => {
    // "Page · MakaKami", or just "MakaKami" when the page has no title of its own.
    document.title = title ? `${title} · MakaKami` : 'MakaKami'

    // Add or remove the robots tag.
    let tag = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (noindex) {
      if (!tag) {
        tag = document.createElement('meta')
        tag.name = 'robots'
        document.head.appendChild(tag)
      }
      tag.content = 'noindex'
    } else {
      tag?.remove()
    }

    // Leaving the page: remove our tag so it doesn't stick to the next page.
    return () => {
      if (noindex) document.head.querySelector('meta[name="robots"]')?.remove()
    }
  }, [title, noindex])
}
