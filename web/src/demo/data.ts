// Dummy catalogue for the showcase. EVERYTHING here is made up: the brands and products are fictional ("Contoh" = "example"),
// so the showcase never claims anything about a real company or product.
import type { Category } from '../api'
import categoriesJson from './categories.json'

// The real category tree (a snapshot taken from the API), so the showcase has the same categories as the real app.
export const CATEGORIES = categoriesJson as Category[]

// Origin statuses used by the dummy products.
type Status = 'verified_my' | 'likely_my' | 'my_brand_unknown_origin' | 'my_brand_overseas' | 'foreign' | 'unknown'

// One dummy product.
export interface DemoProduct {
  id: number
  barcode: string
  name: string
  brand: string
  // Subcategory slug, e.g. "food-snacks".
  category: string
  status: Status
  halal: boolean | null
  quantity: string | null
  manufacturer: string | null
  state: string | null
  country: string
  // How many times it was "scanned" (decides the "popular" sort order).
  scans: number
  // Barcodes of hand-picked alternatives (otherwise same-category Malaysian products are suggested).
  alternatives: string[]
}

// Add the EAN-13 check digit to a 12-digit body, so every dummy barcode is a *valid* barcode (the scan screen checks it).
const withCheck = (body12: string): string => {
  const sum = [...body12].reverse().reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 3 : 1), 0)
  return body12 + ((10 - (sum % 10)) % 10)
}

// Compact row: [name, brand letter, category, status, state, halal, pack size, barcode prefix].
type Row = [string, string, string, Status, string | null, boolean | null, string | null, string?]

const ROWS: Row[] = [
  ['Kerepek Pisang Pedas', 'A', 'food-snacks', 'verified_my', 'Perak', true, '150 g'],
  ['Kerepek Ubi Manis', 'B', 'food-snacks', 'verified_my', 'Kedah', true, '120 g'],
  ['Keropok Lekor Goreng', 'C', 'food-snacks', 'likely_my', 'Terengganu', true, '200 g'],
  ['Kacang Tanah Bersalut', 'D', 'food-snacks', 'verified_my', 'Selangor', true, '180 g'],
  ['Rempeyek Kacang', 'E', 'food-snacks', 'likely_my', 'Johor', null, '100 g'],
  ['Keropok Import Contoh', 'F', 'food-snacks', 'foreign', null, false, '90 g', '8850999'],
  ['Mi Segera Kari', 'A', 'food-instant-food', 'verified_my', 'Selangor', true, '75 g'],
  ['Bubur Segera Ayam', 'G', 'food-instant-food', 'likely_my', 'Pulau Pinang', true, '60 g'],
  ['Mi Segera Tanpa Maklumat', 'H', 'food-instant-food', 'unknown', null, null, '80 g', '9000999'],
  ['Roti Gula Melaka', 'I', 'food-bakery', 'likely_my', 'Melaka', null, '400 g'],
  ['Kek Lapis Sarawak', 'J', 'food-bakery', 'verified_my', 'Sarawak', true, '500 g'],
  ['Sambal Bilis Botol', 'B', 'food-sauces-condiments', 'likely_my', 'Johor', null, '250 g'],
  ['Kicap Manis Pekat', 'K', 'food-sauces-condiments', 'verified_my', 'Pulau Pinang', true, '600 ml'],
  ['Sos Cili Contoh', 'L', 'food-sauces-condiments', 'my_brand_unknown_origin', null, null, '340 ml'],
  ['Rempah Kari Daging', 'M', 'food-spices-paste', 'likely_my', 'Kelantan', true, '250 g'],
  ['Serunding Daging', 'N', 'food-spices-paste', 'verified_my', 'Kelantan', true, '200 g'],
  ['Pes Tom Yam', 'O', 'food-spices-paste', 'unknown', null, null, '120 g', '9000999'],
  ['Keropok Lekor Beku', 'C', 'food-frozen', 'verified_my', 'Terengganu', true, '500 g'],
  ['Sardin Dalam Tomato', 'P', 'food-canned', 'my_brand_overseas', null, true, '155 g'],
  ['Beras Wangi Contoh', 'Q', 'food-rice-noodles', 'likely_my', 'Kedah', true, '5 kg'],
  ['Bihun Sup Segera', 'R', 'food-rice-noodles', 'verified_my', 'Perak', true, '60 g'],
  ['Teh Tarik 3-dalam-1', 'S', 'beverages-malt3-in-1', 'verified_my', 'Selangor', true, '15 x 30 g'],
  ['Kopi Putih Contoh', 'T', 'beverages-coffee-tea', 'verified_my', 'Perak', true, '12 x 40 g'],
  ['Jus Mangga Contoh', 'U', 'beverages-juice', 'likely_my', 'Perlis', true, '1 L'],
  ['Air Mineral Contoh', 'V', 'beverages-bottled-water', 'verified_my', 'Selangor', true, '1.5 L'],
  ['Air Berkarbonat Import', 'W', 'beverages-carbonated', 'foreign', null, true, '330 ml', '8850999'],
  ['Susu Segar Contoh', 'X', 'dairy-eggs-milk', 'likely_my', 'Selangor', true, '1 L'],
  ['Yogurt Pisang', 'Y', 'dairy-eggs-yogurt', 'unknown', null, null, '135 g', '9000999'],
  ['Telur Ayam Kampung', 'Z', 'dairy-eggs-eggs', 'verified_my', 'Pahang', true, '10 biji'],
  ['Biskut Kelapa', 'A', 'confectionery-biscuits', 'verified_my', 'Johor', true, '250 g'],
  ['Coklat Hazelnut Import', 'F', 'confectionery-chocolate', 'foreign', null, null, '100 g', '8850999'],
  ['Gula-gula Halia', 'I', 'confectionery-candy', 'likely_my', 'Melaka', true, '150 g'],
  ['Syampu Herba', 'M', 'personal-care-haircare', 'likely_my', 'Kelantan', null, '300 ml'],
  ['Sabun Mandi Rempah', 'N', 'personal-care-body', 'verified_my', 'Selangor', null, '100 g'],
  ['Ubat Gigi Contoh', 'H', 'personal-care-oral-care', 'unknown', null, null, '150 g', '9000999'],
  ['Jamu Akar Kayu', 'O', 'health-herbal-jamu', 'verified_my', 'Selangor', true, '60 kapsul'],
  ['Suplemen Madu Contoh', 'G', 'health-supplements', 'unknown', null, null, '30 sachet', '9000999'],
  ['Pencuci Pinggan Limau', 'K', 'household-cleaning', 'likely_my', 'Johor', null, '900 ml'],
  ['Detergen Cecair Contoh', 'L', 'household-laundry', 'my_brand_unknown_origin', null, null, '2 L'],
  ['Lampin Bayi Contoh', 'H', 'baby-kids-diapers', 'unknown', null, null, '40 keping', '9000999'],
]

// Hand-picked alternatives for the foreign / unknown examples (by name, resolved to barcodes below).
const ALT_BY_NAME: Record<string, string[]> = {
  'Keropok Import Contoh': ['Kerepek Pisang Pedas', 'Kerepek Ubi Manis'],
  'Kerepek Pisang Pedas': ['Kerepek Ubi Manis', 'Kacang Tanah Bersalut'],
  'Air Berkarbonat Import': ['Air Mineral Contoh', 'Jus Mangga Contoh'],
}

// Build the product list.
const base = ROWS.map(([name, letter, category, status, state, halal, quantity, prefix], i): DemoProduct => ({
  id: i + 1,
  barcode: withCheck(`${prefix ?? '9559990'}${String(i + 1).padStart(5, '0')}`),
  name,
  brand: `Jenama Contoh ${letter}`,
  category,
  status,
  halal,
  quantity,
  manufacturer: state ? `Jenama Contoh ${letter} Sdn Bhd` : null,
  state,
  country: status === 'foreign' ? 'TH' : 'MY',
  // A made-up but stable popularity number.
  scans: (i * 37) % 53,
  alternatives: [],
}))

// Resolve the alternatives (names -> barcodes).
export const PRODUCTS: DemoProduct[] = base.map((p) => ({
  ...p,
  alternatives: (ALT_BY_NAME[p.name] ?? []).map((n) => base.find((b) => b.name === n)?.barcode).filter((b): b is string => Boolean(b)),
}))

// Barcodes shown as quick buttons on the scan screen of the showcase: one of each kind of result.
export const SAMPLE_BARCODES = ['Kerepek Pisang Pedas', 'Sambal Bilis Botol', 'Sos Cili Contoh', 'Keropok Import Contoh', 'Mi Segera Tanpa Maklumat']
  .map((n) => PRODUCTS.find((p) => p.name === n))
  .filter((p): p is DemoProduct => Boolean(p))
  .map((p) => ({ barcode: p.barcode, name: p.name }))
