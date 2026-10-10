<?php

// Namespace for artisan commands.
namespace App\Console\Commands;

// Models and services used below.
use App\Models\Product;
use App\Services\OffService;
// Base class for artisan commands.
use Illuminate\Console\Command;
// Errors thrown by Laravel's HTTP client.
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
// Laravel's HTTP client.
use Illuminate\Support\Facades\Http;

// Bulk-imports products that Open Food Facts lists for a country (planning doc, "Data pipeline" step 1).
// Examples:
//   php artisan off:import --prefix=955 --limit=50 --dry-run
//   php artisan off:import --prefix=955 --enrich
class ImportFromOff extends Command
{
    // Command name and options.
    protected $signature = 'off:import
        {--country=malaysia : Country as spelled in Open Food Facts tags (products sold there)}
        {--prefix= : Only barcodes starting with these digits, e.g. 955 for GS1 Malaysia brands}
        {--limit=0 : Stop after this many products (0 = no limit)}
        {--page-size=100 : Products per request (1-100)}
        {--enrich : Also fetch each new product\'s manufacturing place (one extra request each; slower, but allows "likely Malaysian")}
        {--enrich-existing : With --enrich, also retry products already saved from Open Food Facts that still have no manufacturing place}
        {--sleep=1 : Seconds to wait between requests, to be polite to Open Food Facts}
        {--dry-run : Count what would be imported without saving anything}';

    // Shown by `php artisan list`.
    protected $description = 'Import products listed for a country from Open Food Facts';

    // Open Food Facts search service (the older search endpoints refuse anonymous clients).
    private const SEARCH_URL = 'https://search.openfoodfacts.org/search';

    // Fields to request from the search service.
    private const FIELDS = 'code,product_name,product_name_ms,product_name_en,generic_name,brands,quantity,categories_tags,image_front_small_url,image_front_url';

    // Runs the command.
    public function handle(OffService $off): int
    {
        // ---- read and check the options ----
        $country = strtolower((string) $this->option('country'));
        $prefix = (string) $this->option('prefix');
        $limit = max(0, (int) $this->option('limit'));
        $pageSize = (int) $this->option('page-size');
        $sleep = max(0.0, (float) $this->option('sleep'));
        $dryRun = (bool) $this->option('dry-run');
        $enrich = (bool) $this->option('enrich');
        $enrichExisting = (bool) $this->option('enrich-existing');

        // Reject values that could break the search query.
        if (! preg_match('/^[a-z0-9-]+$/', $country)) {
            $this->error('--country may only contain letters, digits and hyphens.');
            return self::INVALID;
        }
        if ($prefix !== '' && ! preg_match('/^\d{1,13}$/', $prefix)) {
            $this->error('--prefix must be digits only.');
            return self::INVALID;
        }
        if ($pageSize < 1 || $pageSize > 100) {
            $this->error('--page-size must be between 1 and 100.');
            return self::INVALID;
        }

        // The search expression: products sold in the country, optionally limited to a barcode prefix.
        $query = "countries_tags:\"en:{$country}\"".($prefix !== '' ? " AND code:{$prefix}*" : '');
        $this->info("Query: {$query}".($dryRun ? '  (dry run, nothing is saved)' : ''));

        // Counters for the final summary.
        $stats = ['seen' => 0, 'created' => 0, 'existing' => 0, 'invalid' => 0, 'noname' => 0, 'enriched' => 0, 'upgraded' => 0, 'failed' => 0];
        // How many requests in a row failed (to stop instead of hammering a service that is down).
        $failuresInARow = 0;
        // Progress bar, created once the first page tells us the total.
        $bar = null;

        // Walk through the result pages.
        for ($page = 1; ; $page++) {
            // Ask the search service for one page.
            try {
                $response = Http::withUserAgent(config('services.off.user_agent'))
                    ->timeout(30)
                    ->retry(2, 1500, throw: false)
                    ->acceptJson()
                    ->get(self::SEARCH_URL, ['q' => $query, 'page_size' => $pageSize, 'page' => $page, 'fields' => self::FIELDS])
                    ->throw();
            } catch (RequestException|ConnectionException $e) {
                // A failed page stops the import, but everything saved so far is kept.
                $this->newLine();
                $this->error("Stopped on page {$page}: ".$e->getMessage());
                $this->summary($stats, $dryRun);
                return self::FAILURE;
            }

            // On the first page, learn the total and set up the progress bar.
            if ($page === 1) {
                $total = (int) $response->json('count', 0);
                $this->info("Open Food Facts lists {$total} matching products".($limit > 0 ? ", importing at most {$limit}" : '').'.');
                if ($total === 0) {
                    return self::SUCCESS;
                }
                $bar = $this->output->createProgressBar($limit > 0 ? min($limit, $total) : $total);
                $bar->start();
            }

            // The products on this page.
            $hits = $response->json('hits', []);
            // An empty page means we ran out of results.
            if ($hits === []) {
                break;
            }

            // Normalise barcodes first so one query can tell us which already exist (a 12-digit UPC-A equals the 13-digit form with a leading 0).
            $codes = collect($hits)->map(fn ($h) => $this->normalise((string) ($h['code'] ?? '')))->filter()->all();
            $existing = Product::whereIn('barcode', $codes)->pluck('barcode')->flip();

            foreach ($hits as $hit) {
                // Honour --limit.
                if ($limit > 0 && $stats['seen'] >= $limit) {
                    break 2;
                }
                $stats['seen']++;
                $bar->advance();

                // Skip anything that isn't a usable 8-14 digit product barcode.
                $code = $this->normalise((string) ($hit['code'] ?? ''));
                if ($code === null) {
                    $stats['invalid']++;
                    continue;
                }
                // Never overwrite a product we already have (it may have been corrected by an admin).
                if ($existing->has($code)) {
                    $stats['existing']++;
                    // With --enrich-existing, products that came from Open Food Facts but still lack a manufacturing place
                    // (e.g. their detail request failed in an earlier run) get another try. Nothing else about them changes.
                    if ($enrich && $enrichExisting && ! $dryRun) {
                        $old = Product::where('barcode', $code)->where('source', 'off')->whereNull('manufacturing_places')->first();
                        if ($old !== null && ! $this->enrich($off, $old, $sleep, $stats, $failuresInARow)) {
                            $this->summary($stats, $dryRun);
                            return self::FAILURE;
                        }
                    }
                    continue;
                }
                // Dry run: pretend it was created.
                if ($dryRun) {
                    $stats['created']++;
                    continue;
                }

                // Save it (the same conversion the scan-time lookup uses).
                $product = $off->store($code, 'off', 'https://world.openfoodfacts.org', $hit);
                if ($product === null) {
                    // No usable name.
                    $stats['noname']++;
                    continue;
                }
                $stats['created']++;

                // Optionally fetch where it is made, which may promote it to "likely Malaysian".
                if ($enrich && ! $this->enrich($off, $product, $sleep, $stats, $failuresInARow)) {
                    // Open Food Facts keeps failing: stop (everything saved so far is kept).
                    $this->summary($stats, $dryRun);
                    return self::FAILURE;
                }
            }

            // Last page reached.
            if ($page >= (int) $response->json('page_count', 1)) {
                break;
            }
            // Pause between pages.
            usleep((int) ($sleep * 1_000_000));
        }

        // Finish the progress bar and print the totals.
        $bar?->finish();
        $this->newLine(2);
        $this->summary($stats, $dryRun);

        return self::SUCCESS;
    }

    // Fetch one product's manufacturing place and apply it. Returns false when the service keeps failing and the run should stop.
    private function enrich(OffService $off, Product $product, float &$sleep, array &$stats, int &$failuresInARow): bool
    {
        // Remember the status to see whether enrichment changed it.
        $before = $product->origin_status;
        try {
            // One request per product; sleep first to stay under Open Food Facts' rate limit.
            usleep((int) ($sleep * 1_000_000));
            // Retries with growing waits when Open Food Facts answers "too many requests" (and slows us down for the rest of the run).
            $detail = $this->detailWithBackoff($off, $product->barcode, $sleep);
            if ($detail !== null) {
                $off->applyDetail($product, $detail);
                $stats['enriched']++;
                $stats['upgraded'] += $product->origin_status !== $before ? 1 : 0;
            }
            $failuresInARow = 0;
        } catch (RequestException|ConnectionException $e) {
            // The product is saved already; only the extra detail is missing. Give up if the service keeps failing.
            $stats['failed']++;
            if (++$failuresInARow >= 5) {
                $this->newLine();
                $this->error('Open Food Facts keeps failing; stopping. Re-run later to continue.');
                return false;
            }
        }
        return true;
    }

    // Ask for one product's details; on HTTP 429 ("too many requests") wait and try again, up to 4 attempts.
    // $sleep is passed by reference: every 429 also increases the normal pause between requests for the rest of the run.
    private function detailWithBackoff(OffService $off, string $code, float &$sleep): ?array
    {
        for ($attempt = 1; ; $attempt++) {
            try {
                // Success (or a clean "not found"): return it.
                return $off->detail($code);
            } catch (RequestException $e) {
                // Only rate limiting is worth retrying, and only a few times.
                if ($e->response->status() !== 429 || $attempt >= 4) {
                    throw $e;
                }
                // Honour Retry-After if the server sent one, otherwise wait 5s, 10s, 20s.
                $wait = (int) $e->response->header('Retry-After') ?: 5 * 2 ** ($attempt - 1);
                $this->newLine();
                $this->warn("Rate limited by Open Food Facts; waiting {$wait}s (attempt {$attempt}/4)...");
                sleep(min($wait, 60));
                // Be gentler for the remaining requests (up to one every 3 seconds).
                $sleep = min($sleep * 1.5, 3.0);
            }
        }
    }

    // Return a clean 8-14 digit barcode (12-digit UPC-A gets its leading zero), or null if it isn't one.
    private function normalise(string $code): ?string
    {
        // Digits only, 8 to 14 of them.
        if (! preg_match('/^\d{8,14}$/', $code)) {
            return null;
        }
        // UPC-A -> EAN-13.
        return strlen($code) === 12 ? '0'.$code : $code;
    }

    // Print the result counters as a small table.
    private function summary(array $stats, bool $dryRun): void
    {
        $this->table(['Result', 'Count'], [
            ['Products looked at', $stats['seen']],
            [$dryRun ? 'New products (would be saved)' : 'New products saved', $stats['created']],
            ['Already in our database (skipped)', $stats['existing']],
            ['Skipped: not an 8-14 digit barcode', $stats['invalid']],
            ['Skipped: no product name', $stats['noname']],
            ['Manufacturing place fetched', $stats['enriched']],
            ['...of which status changed', $stats['upgraded']],
            ['Detail requests that failed', $stats['failed']],
        ]);
    }
}
