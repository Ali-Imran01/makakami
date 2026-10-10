// Router link.
import { Link } from 'react-router-dom'
// Product type from the API layer.
import type { Product } from '../api'
// Shared origin badge.
import StatusBadge from './StatusBadge'

// Props: one alternative product.
interface Props {
  product: Product
}

// Compact vertical card used in the 2-column "alternatives" grid on the result page.
export default function AlternativeCard({ product }: Props) {
  return (
    // Whole card links to that product's result page.
    <Link
      to={`/p/${product.barcode ?? product.id}`}
      className="flex flex-col gap-2 rounded-md border border-line bg-surface p-2.5 text-ink"
    >
      {/* Photo area: real image when we have one, otherwise a plain placeholder box. */}
      {product.image_url ? (
        // 96px tall photo, cropped to fill.
        <img src={product.image_url} alt="" className="h-24 w-full rounded-sm bg-placeholder object-cover" />
      ) : (
        // Placeholder box.
        <span aria-hidden="true" className="h-24 rounded-sm bg-placeholder" />
      )}
      {/* Product name. */}
      <span className="text-[14px] font-bold">{product.name}</span>
      {/* Badge, left-aligned instead of stretched. */}
      <span className="self-start">
        {/* Short form to fit the narrow card. */}
        <StatusBadge status={product.origin_status} short />
      </span>
    </Link>
  )
}
