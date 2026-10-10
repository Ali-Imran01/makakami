<?php

// Namespace for artisan commands.
namespace App\Console\Commands;

// Models used below.
use App\Models\Brand;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
// Base class for artisan commands.
use Illuminate\Console\Command;
// Simple log, so there is a trail of who-ran-what until the admin panel's audit log exists.
use Illuminate\Support\Facades\Log;
// Turns a brand name into a URL-friendly slug.
use Illuminate\Support\Str;
use App\Support\Gtin;

// Adds (or corrects) one product by hand, e.g. a Malaysian product that Open Food Facts doesn't have.
// Missing values are asked for interactively; pass every option to run it without prompts.
// Examples:
//   php artisan product:add 9555999000018
//   php artisan product:add 9555999000018 --name="Kicap Manis" --brand="Jenama X" --category=food-sauces-condiments --status=likely_my
//   php artisan product:add 9555999000018 --update --status=verified_my --evidence="Label photo checked: made in Perak"
class AddProduct extends Command
{
    // Command name, argument and options.
    protected $signature = 'product:add
        {barcode? : 8-14 digit barcode}
        {--name= : Product name}
        {--brand= : Brand name (created if new)}
        {--category= : Category or subcategory slug, e.g. food-snacks}
        {--manufacturer= : Manufacturer name (created if new)}
        {--state= : Manufacturer state, e.g. Perak}
        {--country=MY : Manufacturer country code}
        {--status= : Origin status (default: unknown)}
        {--evidence= : Why this status (required for verified_my, foreign and foreign_made_my)}
        {--halal= : yes, no or unknown}
        {--quantity= : Pack size as printed, e.g. "150 g"}
        {--image= : Photo address (http/https link)}
        {--update : Change an existing product instead of refusing}
        {--ignore-checksum : Accept a barcode whose check digit is wrong}
        {--yes : Skip the final confirmation}';

    // Shown by `php artisan list`.
    protected $description = 'Add or correct a single product by hand';

    // The origin statuses the database accepts (same list as the products.origin_status column).
    private const STATUSES = ['verified_my', 'likely_my', 'my_brand_unknown_origin', 'my_brand_overseas', 'foreign_made_my', 'foreign', 'unknown'];

    // Statuses that are a human judgement (not an open-data guess): they must come with a written reason.
    private const NEEDS_EVIDENCE = ['verified_my', 'foreign', 'foreign_made_my'];

    // Runs the command.
    public function handle(): int
    {
        // ---- barcode ----
        $barcode = $this->argument('barcode') ?? $this->ask('Barcode (8-14 digits)');
        $barcode = preg_replace('/\s+/', '', (string) $barcode);
        if (! preg_match('/^\d{8,14}$/', $barcode)) {
            return $this->refuse('The barcode must be 8 to 14 digits.');
        }
        // A 12-digit UPC-A is stored as the 13-digit EAN with a leading zero, like everywhere else in the app.
        $barcode = strlen($barcode) === 12 ? '0'.$barcode : $barcode;
        // Catch typos: real barcodes have a valid check digit.
        if (! Gtin::isValid($barcode) && ! $this->option('ignore-checksum')) {
            return $this->refuse("The check digit of {$barcode} is wrong (probably a typo). Re-check it, or pass --ignore-checksum.");
        }

        // ---- does it exist already? ----
        $product = Product::where('barcode', $barcode)->first();
        if ($product && ! $this->option('update')) {
            return $this->refuse("{$barcode} already exists as \"{$product->name}\" ({$product->origin_status}). Use --update to change it.");
        }
        if (! $product && $this->option('update')) {
            return $this->refuse("{$barcode} does not exist yet, so there is nothing to update.");
        }

        // Values to start from: the existing product when updating, otherwise empty.
        $current = $product ?? new Product();
        // Only prompt when someone is at the keyboard.
        $interactive = $this->input->isInteractive();

        // ---- name ----
        $name = trim((string) ($this->option('name') ?? ($interactive ? $this->ask('Product name', $current->name) : $current->name)));
        if ($name === '') {
            return $this->refuse('A product name is required (--name).');
        }

        // ---- brand ----
        $brandName = $this->option('brand') ?? ($interactive ? $this->ask('Brand (blank for none)', $current->brand?->name) : $current->brand?->name);

        // ---- category ----
        $category = null;
        // Not given: keep the product's current category (when updating) unless someone is at the keyboard to choose.
        $categorySlug = $this->option('category') ?? (! $interactive ? $current->category?->slug : null);
        if ($categorySlug === null && $interactive) {
            // Offer every subcategory as "Parent > Child", plus "none".
            $choices = ['' => '(none)'] + Category::with('parent')->whereNotNull('parent_id')->orderBy('parent_id')->orderBy('sort_order')->get()
                ->mapWithKeys(fn ($c) => [$c->slug => "{$c->parent->name_en} > {$c->name_en}"])->all();
            $categorySlug = $this->choice('Category', $choices, $current->category?->slug ?? '');
        }
        if ($categorySlug) {
            $category = Category::where('slug', $categorySlug)->first();
            if (! $category) {
                return $this->refuse("Unknown category \"{$categorySlug}\". See the slugs in the categories table (e.g. food-snacks).");
            }
        }

        // ---- manufacturer ----
        $makerName = $this->option('manufacturer') ?? ($interactive ? $this->ask('Manufacturer name (blank for none)', $current->manufacturer?->name) : $current->manufacturer?->name);
        $state = $this->option('state') ?? ($makerName && $interactive ? $this->ask('Manufacturer state (blank for none)', $current->manufacturer?->state) : $current->manufacturer?->state);

        // ---- status and evidence ----
        $status = $this->option('status') ?? ($interactive ? $this->choice('Origin status', self::STATUSES, $current->origin_status ?? 'unknown') : ($current->origin_status ?? 'unknown'));
        if (! in_array($status, self::STATUSES, true)) {
            return $this->refuse('Unknown status "'.$status.'". Allowed: '.implode(', ', self::STATUSES).'.');
        }
        $evidence = $this->option('evidence') ?? $current->origin_note;
        if (in_array($status, self::NEEDS_EVIDENCE, true) && trim((string) $evidence) === '') {
            // Ask for it when possible; otherwise refuse.
            $evidence = $interactive ? $this->ask("Why is this \"{$status}\"? (evidence, required)") : null;
            if (trim((string) $evidence) === '') {
                return $this->refuse("Status \"{$status}\" needs a written reason: pass --evidence=\"...\".");
            }
        }

        // ---- halal ----
        $halalInput = $this->option('halal') ?? ($interactive ? $this->choice('Halal', ['unknown', 'yes', 'no'], match ($current->halal) { true => 'yes', false => 'no', default => 'unknown' }) : null);
        $halal = match (strtolower((string) $halalInput)) {
            'yes' => true,
            'no' => false,
            'unknown', '' => $halalInput === null ? $current->halal : null,
            default => 'invalid',
        };
        if ($halal === 'invalid') {
            return $this->refuse('--halal must be yes, no or unknown.');
        }

        // ---- image ----
        $image = $this->option('image') ?? $current->image_url;
        if ($image !== null && $image !== '' && ! preg_match('#^https?://#i', $image)) {
            return $this->refuse('--image must be a link starting with http:// or https://.');
        }

        // ---- show what will be saved, and confirm ----
        $this->table(['Field', 'Value'], [
            ['Barcode', $barcode],
            ['Name', $name],
            ['Brand', $brandName ?: '-'],
            ['Category', $category ? "{$category->name_en} ({$category->slug})" : '-'],
            ['Manufacturer', $makerName ? $makerName.($state ? " ({$state})" : '') : '-'],
            ['Origin status', $status],
            ['Evidence', $evidence ?: '-'],
            ['Halal', $halal === null ? 'unknown' : ($halal ? 'yes' : 'no')],
            ['Pack size', $this->option('quantity') ?? $current->quantity ?? '-'],
            ['Photo', $image ?: '-'],
        ]);
        if ($interactive && ! $this->option('yes') && ! $this->confirm($product ? 'Update this product?' : 'Add this product?', true)) {
            $this->warn('Nothing saved.');
            return self::SUCCESS;
        }

        // ---- save ----
        // Brand and manufacturer are shared records: reuse them when they already exist.
        $brand = $brandName ? Brand::firstOrCreate(['slug' => Str::slug($brandName) ?: Str::random(8)], ['name' => trim($brandName)]) : null;
        $maker = $makerName ? Manufacturer::firstOrCreate(['name' => trim($makerName)], ['state' => $state ?: null, 'country' => strtoupper((string) $this->option('country'))]) : null;
        // A known state fills in a manufacturer that was created earlier without one.
        if ($maker && $state && $maker->state === null) {
            $maker->update(['state' => $state]);
        }

        // Values to write; a manual product is marked source "manual" so it is easy to find and is never auto-overwritten.
        $values = [
            'name' => mb_substr($name, 0, 255),
            'brand_id' => $brand?->id,
            'category_id' => $category?->id,
            'manufacturer_id' => $maker?->id,
            'origin_status' => $status,
            'origin_note' => $evidence ? mb_substr(trim($evidence), 0, 500) : null,
            'halal' => $halal,
            'quantity' => ($q = $this->option('quantity') ?? $current->quantity) ? mb_substr(trim($q), 0, 64) : null,
            'image_url' => $image ?: null,
        ];

        if ($product) {
            // Keep the original source when correcting an imported product; just record the change.
            $product->update($values);
        } else {
            $product = Product::create($values + ['barcode' => $barcode, 'source' => 'manual']);
        }

        // Leave a trail until the admin panel's audit log exists.
        Log::info('product:add', ['barcode' => $barcode, 'status' => $status, 'evidence' => $evidence, 'updated' => (bool) $this->option('update'), 'user' => get_current_user()]);

        $this->info(($this->option('update') ? 'Updated' : 'Added')." \"{$product->name}\". Open it at /p/{$barcode}");

        return self::SUCCESS;
    }

    // Print an error and return a failure exit code (so scripts can detect it).
    private function refuse(string $message): int
    {
        $this->error($message);

        return self::FAILURE;
    }
}
