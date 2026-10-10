// One labelled form field with its error message, used by the login and sign-up forms.
import type { InputHTMLAttributes } from 'react'

// Props: everything a normal <input> accepts, plus a label and an optional error text.
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  // Visible label text (already translated).
  label: string
  // Message shown under the field when something is wrong.
  error?: string
}

// Label + input + error. The error is linked to the input so screen readers read it out.
export default function TextField({ label, error, id, ...rest }: Props) {
  // Id of the error text, so aria-describedby can point at it.
  const errorId = id ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-2">
      {/* Label tied to the input by htmlFor/id. */}
      <label htmlFor={id} className="text-label text-muted">
        {label}
      </label>
      {/* The input: 48px tall, token border, red-free error styling (amber) when invalid. */}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-12 rounded-sm border bg-surface px-3.5 text-body text-ink ${error ? 'border-unknown' : 'border-line'}`}
        {...rest}
      />
      {/* Error text, announced when it appears. */}
      {error && (
        <p id={errorId} role="alert" className="text-caption text-unknown">
          {error}
        </p>
      )}
    </div>
  )
}
