<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers;

// Models used to read categories and products from the database.
use App\Models\Category;
use App\Models\Product;
// The incoming HTTP request (query parameters).
use Illuminate\Http\Request;
// Looks products up in Open Food Facts.
use App\Services\OffService;
// Exceptions thrown by Laravel's HTTP client when OFF can't be reached or answers with an error.
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;

// Handles HTTP requests about products.
class ProductController extends Controller
{
    // Columns the small product cards need (used for recent products and alternatives).
    private const CARD_COLUMNS = ['products.id', 'products.barcode', 'products.name', 'products.brand_id', 'products.manufacturer_id', 'products.origin_status', 'products.image_url'];

    // Filter groups the website uses, mapped to the real origin_status values behind each one.
    private const STATUS_GROUPS = [
        'verified' => ['verified_my'],
        'likely' => ['likely_my'],
        'unknown' => ['unknown', 'my_brand_unknown_origin'],
        'foreign' => ['foreign', 'my_brand_overseas', 'foreign_made_my'],
    ];

    // GET /api/products: one list endpoint for the catalogue, category pages and search.
    // Query parameters (all optional): q, category, sub, status, state, halal, sort, per_page, page.
    public function index(Request $request)
    {
        // Check every parameter; Laravel answers 422 with the reasons if something is invalid.
        $v = $request->validate([
            // Search words (or a barcode).
            'q' => ['nullable', 'string', 'max:100'],
            // Category slug (top-level or sub).
            'category' => ['nullable', 'string', 'max:100'],
            // Comma-separated subcategory slugs (only meaningful together with a top-level category).
            'sub' => ['nullable', 'string', 'max:300'],
            // Comma-separated status groups: verified,likely,unknown,foreign. Missing = no status filter.
            'status' => ['nullable', 'string', 'max:100'],
            // Manufacturer state, e.g. "Perak".
            'state' => ['nullable', 'string', 'max:50'],
            // 1 = halal products only.
            'halal' => ['nullable', 'boolean'],
            // Sort order.
            'sort' => ['nullable', 'in:popular,newest,az'],
            // Page size (capped so nobody can request the whole table).
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ]);

        // Start with the columns the cards need, plus brand name and manufacturer state.
        $query = Product::query()->select(self::CARD_COLUMNS)->with(['brand:id,name', 'manufacturer:id,state']);

        // ---- category / subcategory ----
        if (! empty($v['category'])) {
            // The category named in the URL (404 if the slug is wrong).
            $category = Category::where('slug', $v['category'])->firstOrFail();
            // A top-level category includes all its subcategories; a subcategory is just itself.
            $ids = $category->parent_id === null
                ? $category->children()->pluck('id')->push($category->id)
                : collect([$category->id]);

            // Narrow to chosen subcategories (only those that really belong to this category).
            if (! empty($v['sub'])) {
                $subIds = Category::whereIn('slug', explode(',', $v['sub']))->where('parent_id', $category->id)->pluck('id');
                // If none of the slugs were valid, keep the full set rather than returning nothing.
                $ids = $subIds->isNotEmpty() ? $subIds : $ids;
            }

            // Apply the category filter.
            $query->whereIn('products.category_id', $ids);
        }

        // ---- origin status groups ----
        if (! empty($v['status'])) {
            // Expand each requested group into its real statuses; unknown group names are ignored.
            $statuses = collect(explode(',', $v['status']))->flatMap(fn ($g) => self::STATUS_GROUPS[trim($g)] ?? [])->all();
            // Only filter when at least one valid group was given.
            if ($statuses !== []) {
                $query->whereIn('products.origin_status', $statuses);
            }
        }

        // ---- manufacturer state ----
        if (! empty($v['state'])) {
            $query->whereHas('manufacturer', fn ($m) => $m->where('state', $v['state']));
        }

        // ---- halal only ----
        if ($request->boolean('halal')) {
            $query->where('products.halal', true);
        }

        // ---- search ----
        if (isset($v['q']) && trim($v['q']) !== '') {
            $q = trim($v['q']);
            // A pure number of 8-14 digits is a barcode: match it exactly (12-digit UPC-A gets its leading zero).
            if (preg_match('/^\d{8,14}$/', $q)) {
                $query->where('products.barcode', strlen($q) === 12 ? '0'.$q : $q);
            } else {
                // Escape LIKE wildcards typed by the visitor so "%" or "_" are treated as plain characters.
                $like = '%'.addcslashes($q, '%_\\').'%';
                // Words made only of letters/digits, for the FULLTEXT query (InnoDB ignores words under 3 characters).
                $words = collect(preg_split('/\s+/u', $q))->map(fn ($w) => preg_replace('/[^\p{L}\p{N}]/u', '', $w))->filter(fn ($w) => mb_strlen($w) >= 3);

                $query->where(function ($w) use ($like, $words) {
                    // Brand name contains the text.
                    $w->whereHas('brand', fn ($b) => $b->where('name', 'like', $like));
                    // Product name: FULLTEXT prefix match on every word ("kerep" finds "kerepek"), or plain LIKE for very short input.
                    if ($words->isNotEmpty()) {
                        $boolean = $words->map(fn ($x) => '+'.$x.'*')->implode(' ');
                        $w->orWhereRaw('MATCH(products.name) AGAINST (? IN BOOLEAN MODE)', [$boolean]);
                    }
                    // The LIKE also catches matches in the middle of a word and short queries.
                    $w->orWhere('products.name', 'like', $like);
                });
            }
        }

        // ---- sorting ----
        match ($v['sort'] ?? 'popular') {
            // Most scanned first; id keeps the order stable between pages.
            'popular' => $query->orderByDesc('products.scan_count')->orderBy('products.id'),
            // Newest first.
            'newest' => $query->orderByDesc('products.created_at')->orderByDesc('products.id'),
            // Alphabetical.
            'az' => $query->orderBy('products.name')->orderBy('products.id'),
        };

        // Paginate (12 per page unless asked otherwise) and keep the filters in the next/prev links.
        return $query->paginate($v['per_page'] ?? 12)->withQueryString();
    }

    // GET /api/products/recent: newest products that are confirmed or likely Malaysian.
    public function recent()
    {
        // Start a query on the products table.
        return Product::query()
            // Load the brand and manufacturer in 2 extra queries instead of 1 per product (avoids N+1).
            ->with(['brand:id,name', 'manufacturer:id,state'])
            // Only show the statuses the default catalogue view allows (see planning doc, section 5).
            ->whereIn('origin_status', ['verified_my', 'likely_my'])
            // Newest first.
            ->latest()
            // The home page only shows a few.
            ->limit(5)
            // Pick just the columns the home screen needs.
            ->get(self::CARD_COLUMNS);
    }

    // GET /api/products/{barcode}: everything the result page needs for one product.
    // Looks in our database first, then asks Open Food Facts and saves what it finds.
    public function show(string $barcode, OffService $off)
    {
        // A 12-digit UPC-A is the same product as the 13-digit EAN with a leading zero; store/look up one form only.
        $barcode = strlen($barcode) === 12 ? '0'.$barcode : $barcode;

        // Is it already saved?
        $exists = Product::where('barcode', $barcode)->exists();

        // Not saved: ask Open Food Facts (and its beauty/products sisters).
        if (! $exists) {
            // The lookup can fail because OFF is slow, down or rate-limiting us.
            try {
                // Save the product if OFF has it; null means nobody has it.
                $imported = $off->importBarcode($barcode);
            } catch (RequestException|ConnectionException $e) {
                // Log the real reason for us, but tell the client only "service unavailable" (503), not "not found".
                report($e);
                abort(503, 'Product lookup is temporarily unavailable.');
            }

            // Unknown everywhere: a normal 404.
            if ($imported === null) {
                abort(404);
            }
        }

        // Load the product with everything the page needs.
        $product = Product::query()
            // Load related rows in a few queries.
            ->with(['brand:id,name', 'manufacturer:id,name,state,country', 'category.parent'])
            // Count only admin-approved label photos (used to show the "label checked" evidence row).
            ->withCount(['evidence as approved_evidence_count' => fn ($q) => $q->where('status', 'approved')])
            // Match the barcode.
            ->where('barcode', $barcode)
            // 404 if nothing matches (should not happen after the import above).
            ->firstOrFail();

        // Prefer hand-picked alternatives from the link table.
        $alternatives = $product->alternatives()->with('brand:id,name')->limit(2)->get(self::CARD_COLUMNS);

        // If there are none, fall back to other Malaysian products in the same category.
        if ($alternatives->isEmpty() && $product->category_id) {
            // Same category, confirmed/likely Malaysian, and not the product itself.
            $alternatives = Product::query()
                ->with('brand:id,name')
                ->where('category_id', $product->category_id)
                ->whereIn('origin_status', ['verified_my', 'likely_my'])
                ->whereKeyNot($product->id)
                ->limit(2)
                ->get(self::CARD_COLUMNS);
        }

        // Send the product fields plus its alternatives as one JSON object.
        return [...$product->toArray(), 'alternatives' => $alternatives];
    }
}
