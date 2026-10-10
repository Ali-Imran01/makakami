// Runs code when the address changes.
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// A single-page app keeps the scroll position when you open another page; this sends a new page back to the top.
// It only reacts to the path, so changing filters or the page number (which are in the query string) is left alone.
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
