// A class component is the only way React lets us catch errors thrown while drawing the page.
import { Component, type ErrorInfo, type ReactNode } from 'react'

// Props: the part of the app to protect.
interface Props {
  children: ReactNode
}

// State: whether something went wrong.
interface State {
  failed: boolean
}

// Without this, one unexpected error would leave a blank white page. With it, people get a message and a reload button.
// The text is fixed (Malay and English together) because the translation system itself may be what failed.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  // React calls this when a child throws: switch to the fallback screen.
  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  // Keep a record in the browser console for debugging.
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MakaKami crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-16 text-center">
        <h1 className="text-title">Maaf, ada masalah / Sorry, something went wrong</h1>
        <p className="text-body font-normal text-muted">Sila muat semula halaman. / Please reload the page.</p>
        <button type="button" onClick={() => window.location.reload()} className="h-12 rounded-pill bg-navy text-[15px] font-bold text-white">
          Muat semula / Reload
        </button>
      </div>
    )
  }
}
