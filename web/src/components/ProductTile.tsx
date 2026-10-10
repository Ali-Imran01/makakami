// Router link.
import { Link } from 'react-router-dom'
// Product type from the API layer.
import type { Product } from '../api'
// Shared origin badge.
import StatusBadge from './StatusBadge'

// Props: one product.
interface Props {
  product: Product
}

// Vertical product card for grids (category pages and search): photo, name, "brand · state", badge.
export default function ProductTile({ product }: Props) {
  // "Brand · State", skipping whichever part is missing.
  const meta = [product.brand?.name, product.manufacturer?.state].filter(Boolean).join(' · ')

  return (
    // Whole card links to the result page; padding grows slightly on desktop (lg:).
    <Link
      to={`/p/${product.barcode ?? product.id}`}
      className="flex flex-col gap-1.5 rounded-md border border-line bg-surface p-2.5 text-ink lg:gap-2 lg:p-3"
    >
      {/* Photo: real image when we have one, otherwise a plain placeholder box (never a broken image). */}
      {product.image_url ? (
        // 120px tall on phones, 160px on desktop, cropped to fill.
        <img src={product.image_url} alt="" className="h-[120px] w-full rounded-sm bg-placeholder object-contain lg:h-40" />
      ) : (
        // Placeholder box with the same height.
        <span aria-hidden="true" className="h-[120px] rounded-sm bg-placeholder lg:h-40" />
      )}
      {/* Product name. */}
      <span className="text-[14px] leading-[18px] font-bold lg:text-[15px] lg:leading-5">{product.name}</span>
      {/* Brand and state, only if there is something to show. */}
      {meta && <span className="text-caption font-normal text-muted lg:text-label lg:font-normal">{meta}</span>}
      {/* Badge, left-aligned instead of stretched. */}
      <span className="self-start">
        {/* Short form to fit the narrow card. */}
        <StatusBadge status={product.origin_status} short />
      </span>
    </Link>
  )
}
