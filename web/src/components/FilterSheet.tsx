// React hooks and the type for children.
import { useEffect, useRef, type ReactNode } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'

// Props: open/closed state, a way to report closing, and the content.
interface Props {
  // Whether the sheet is showing.
  open: boolean
  // Called when the visitor closes it (Escape key, tapping the dark area, or the button).
  onClose: () => void
  // The filter controls.
  children: ReactNode
}

// Phone bottom sheet built on the native <dialog> element, which already provides the dark backdrop,
// keyboard focus trapping and Escape-to-close.
export default function FilterSheet({ open, onClose, children }: Props) {
  // Translate function.
  const { t } = useTranslation()
  // Direct handle on the <dialog> element.
  const ref = useRef<HTMLDialogElement>(null)

  // Open or close the dialog whenever `open` changes.
  useEffect(() => {
    // The element (should always exist after mount).
    const dialog = ref.current
    // Nothing to do without it.
    if (!dialog) return
    // Show as a modal when requested and not already open.
    if (open && !dialog.open) dialog.showModal()
    // Close when requested and currently open.
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    // The dialog fills the bottom of the screen: no margin, full width, rounded top corners, dimmed backdrop.
    <dialog
      ref={ref}
      // Fires for Escape and for dialog.close(); keeps our state in sync.
      onClose={onClose}
      // Tapping the dark area outside the sheet closes it (the click target is the dialog itself, not its content).
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-label={t('list.filter')}
      className="m-0 mt-auto max-h-[85vh] w-full max-w-none rounded-t-[24px] bg-surface p-0 text-ink backdrop:bg-ink/50"
    >
      {/* Scrolling content with the same side padding as the page. */}
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto px-4 pt-5 pb-8">
        {/* Decorative drag handle. */}
        <div className="h-1 w-10 self-center rounded-pill bg-line" />
        {/* The filter controls. */}
        {children}
        {/* Closing button: filters already apply instantly, so this just dismisses the sheet. */}
        <button type="button" onClick={onClose} className="h-12 rounded-pill bg-navy text-[15px] font-bold text-white">
          {t('list.showResults')}
        </button>
      </div>
    </dialog>
  )
}
