// Outline icons for each category (Lucide, per DESIGN.md).
import { Baby, Candy, Coffee, CookingPot, House, Milk, Package, Pill, Plug, SprayCan, Shirt, Sparkles, Star, type LucideIcon } from 'lucide-react'

// Icon per category slug (the slugs come from the category seeder). Anything not listed gets the generic Package icon.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // 1 Food: pot with steam.
  food: CookingPot,
  // 2 Beverages: cup.
  beverages: Coffee,
  // 3 Dairy & eggs: milk carton.
  'dairy-eggs': Milk,
  // 4 Confectionery: candy.
  confectionery: Candy,
  // 5 Personal care: spray bottle.
  'personal-care': SprayCan,
  // 6 Cosmetics: sparkles.
  cosmetics: Sparkles,
  // 7 Health: pill.
  health: Pill,
  // 8 Household: house.
  household: House,
  // 9 Baby & kids: baby.
  'baby-kids': Baby,
  // 10 Fashion: shirt.
  fashion: Shirt,
  // 11 Electronics & automotive: plug.
  'electronics-automotive': Plug,
  // 12 Crafts & others: star.
  'crafts-others': Star,
}

// Fallback icon for unknown slugs.
export const FALLBACK_ICON: LucideIcon = Package
