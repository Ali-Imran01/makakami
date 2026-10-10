<?php

// Namespace for our service classes.
namespace App\Services;

// The category table, used to map OFF category tags onto ours.
use App\Models\Category;
// Brand table.
use App\Models\Brand;
// Product table.
use App\Models\Product;
// Laravel's HTTP client (wraps Guzzle).
use Illuminate\Support\Facades\Http;
// Cache, so we don't ask OFF again and again for barcodes it doesn't know.
use Illuminate\Support\Facades\Cache;
// Turns a brand name into a URL-friendly slug.
use Illuminate\Support\Str;

// Looks barcodes up in the Open Food Facts family of databases and saves what it finds.
class OffService
{
    // The three sister databases, tried in this order. Key = value stored in products.source.
    private const SOURCES = [
        'off' => 'https://world.openfoodfacts.org',
        'obf' => 'https://world.openbeautyfacts.org',
        'opf' => 'https://world.openproductsfacts.org',
    ];

    // Only ask for the fields we use; keeps the response small.
    private const FIELDS = 'code,product_name,product_name_ms,product_name_en,generic_name,brands,quantity,categories_tags,manufacturing_places,manufacturing_places_tags,image_front_small_url,image_front_url';

    // Find a barcode in OFF, save it as a product and return it; null if nobody has it.
    // Throws if OFF cannot be reached, so the caller can tell "not found" from "service down".
    public function importBarcode(string $barcode): ?Product
    {
        // We remember misses for an hour so repeated scans of an unknown barcode stay fast.
        $missKey = "off-miss:{$barcode}";
        // Recently confirmed miss: don't bother OFF again.
        if (Cache::has($missKey)) {
            return null;
        }

        // Try each database in turn.
        foreach (self::SOURCES as $source => $host) {
            // Fetch the product from this database (null = not there).
            $data = $this->fetch($host, $barcode);
            // Found: save and return it.
            if ($data !== null) {
                return $this->store($barcode, $source, $host, $data);
            }
        }

        // Not in any of them: remember the miss.
        Cache::put($missKey, true, now()->addHour());
        // Tell the caller there is no such product.
        return null;
    }

    // Ask one OFF host for one barcode; returns the product array or null.
    private function fetch(string $host, string $barcode): ?array
    {
        // GET /api/v2/product/{barcode}; User-Agent identifies us, timeout protects our page, retry once on network errors.
        $response = Http::withUserAgent(config('services.off.user_agent'))
            ->timeout(config('services.off.timeout'))
            ->retry(1, 200, throw: false)
            ->acceptJson()
            ->get("{$host}/api/v2/product/{$barcode}", ['fields' => self::FIELDS]);

        // OFF answers 404 (or status 0) for unknown barcodes: that is a normal "not found".
        if ($response->status() === 404) {
            return null;
        }

        // Any other failure (5xx, rate limit, ...) must not be mistaken for "not found".
        $response->throw();

        // status 1 = found.
        if ($response->json('status') !== 1) {
            return null;
        }

        // The product details.
        $product = $response->json('product');
        // Guard against an unexpected body shape.
        return is_array($product) ? $product : null;
    }

    // Convert OFF's fields to ours and save the product (and its brand).
    private function store(string $barcode, string $source, string $host, array $p): ?Product
    {
        // Prefer a Malay name, then English, then the default; first non-empty wins.
        $name = collect([$p['product_name_ms'] ?? null, $p['product_name_en'] ?? null, $p['product_name'] ?? null, $p['generic_name'] ?? null])
            ->map(fn ($n) => trim((string) $n))
            ->first(fn ($n) => $n !== '');

        // A product with no name at all is useless to show; treat it as not found.
        if ($name === null) {
            return null;
        }

        // OFF "brands" is a comma-separated list; take the first.
        $brandName = trim(explode(',', (string) ($p['brands'] ?? ''))[0]);
        // Create the brand if new (matched by slug), or leave it empty when OFF has none.
        $brand = $brandName !== '' ? Brand::firstOrCreate(['slug' => Str::slug($brandName) ?: Str::random(8)], ['name' => $brandName]) : null;

        // Where is it made, as text and as tags.
        $places = trim((string) ($p['manufacturing_places'] ?? '')) ?: null;
        $placeTags = $p['manufacturing_places_tags'] ?? [];

        // Save, or reuse the row if a parallel request already created it (barcode is unique).
        return Product::firstOrCreate(['barcode' => $barcode], [
            'name' => mb_substr($name, 0, 255),
            'brand_id' => $brand?->id,
            'category_id' => $this->mapCategory($p['categories_tags'] ?? []),
            'origin_status' => OriginClassifier::classify($barcode, $places, is_array($placeTags) ? $placeTags : []),
            'image_url' => $p['image_front_small_url'] ?? $p['image_front_url'] ?? null,
            'quantity' => isset($p['quantity']) ? mb_substr(trim((string) $p['quantity']), 0, 64) ?: null : null,
            'manufacturing_places' => $places ? mb_substr($places, 0, 255) : null,
            'source' => $source,
            // Link back to the page on OFF (required for attribution under the ODbL licence).
            'source_url' => "{$host}/product/{$barcode}",
        ]);
    }

    // Pick our most specific category whose off_tag appears in the product's OFF category tags.
    private function mapCategory(array $tags): ?int
    {
        // No tags, no category.
        if ($tags === []) {
            return null;
        }

        // Our categories that match any tag; subcategories (parent_id set) sort first because they are more specific.
        return Category::whereIn('off_tag', $tags)
            ->orderByRaw('parent_id is null')
            ->value('id');
    }
}
