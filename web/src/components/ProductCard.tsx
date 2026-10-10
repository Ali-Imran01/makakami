// Router link so tapping the card navigates without a page reload.
import { Link } from 'react-router-dom'
// Product type from the API layer.
import type { Product } from '../api'
// Shared origin badge.
import StatusBadge from './StatusBadge'

// Props: one product from the API.
interface Props {
  product: Product
}

// A single product row: image, name, "brand · state", and the origin badge.
export default function ProductCard({ product }: Props) {
  // Build the "Brand · State" line from whichever parts exist (data comes from the API, never hard-coded).
  const meta = [product.brand?.name, product.manufacturer?.state].filter(Boolean).join(' · ')

  return (
    // Whole row is a link to the product page. last: removes the divider under the final row.
    <Link
      // Result page route from DESIGN.md; fall back to the id when there is no barcode.
      to={`/p/${product.barcode ?? product.id}`}
      // Row layout: gap 12, padding 12, divider line under each row.
      className="flex items-center gap-3 border-b border-line p-3 text-ink last:border-b-0"
    >
      {/* Image box: shows the photo when we have one, otherwise a plain placeholder (never a broken image). */}
      {product.image_url ? (
        // Real product photo, cropped to fill the 52px square.
        <img src={product.image_url} alt="" className="size-[52px] shrink-0 rounded-sm bg-placeholder object-cover" />
      ) : (
        // Placeholder box used when image_url is missing.
        <span aria-hidden="true" className="size-[52px] shrink-0 rounded-sm bg-placeholder" />
      )}
      {/* Text block; min-w-0 lets long names truncate instead of pushing the badge out. */}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Product name. */}
        <span className="text-body font-bold">{product.name}</span>
        {/* Brand and state, only if there is something to show. */}
        {meta && <span className="text-caption font-normal text-muted">{meta}</span>}
      </span>
      {/* Origin badge, short form to fit beside the text. */}
      <StatusBadge status={product.origin_status} short />
    </Link>
  )
}
