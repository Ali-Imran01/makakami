// Magnifier icon.
import { Search } from 'lucide-react'
// Lets us move to the search page when the form is submitted.
import { useNavigate } from 'react-router-dom'

// Props: the visible/hidden label, placeholder and a unique id to tie label and input together.
interface Props {
  // Unique id so <label for> works.
  id: string
  // Text of the label (already translated).
  label: string
  // Placeholder text (already translated).
  placeholder: string
  // Hide the label visually but keep it for screen readers (used in the top nav).
  hideLabel?: boolean
  // Extra classes for the outer box (height, background).
  className?: string
  // Text to start with (the search page shows the current query).
  defaultValue?: string
  // Category slug to keep the search inside, if any.
  scope?: string | null
}

// Search box. Submitting goes to /cari?q=... (the results page comes later).
export default function SearchInput({ id, label, placeholder, hideLabel = false, className = '', defaultValue, scope }: Props) {
  // Function to change route.
  const navigate = useNavigate()

  return (
    // A <form> so pressing Enter / the keyboard "search" key submits.
    <form
      // Stop the browser reloading the page, then navigate within the app.
      onSubmit={(e) => {
        // Prevent the default full-page form submit.
        e.preventDefault()
        // Read the typed text from the form data (input is uncontrolled).
        const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
        // Ignore empty searches.
        if (q) navigate(`/cari?q=${encodeURIComponent(q)}${scope ? `&kategori=${encodeURIComponent(scope)}` : ''}`)
      }}
      // Vertical stack: label above the box.
      className="flex flex-col gap-2"
    >
      {/* Label: visible by default, screen-reader-only when hideLabel is set. */}
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-label text-muted'}>
        {label}
      </label>
      {/* The bordered box holding the icon and the input. */}
      <div className={`flex items-center gap-2 rounded-sm border border-line px-3.5 ${className}`}>
        {/* Decorative magnifier. */}
        <Search size={20} strokeWidth={1.75} className="shrink-0 text-muted" aria-hidden="true" />
        {/* The actual input; type=search gives the mobile "search" keyboard key. */}
        <input
          id={id}
          name="q"
          defaultValue={defaultValue}
          type="search"
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent text-body text-ink outline-0 placeholder:text-muted"
        />
      </div>
    </form>
  )
}
