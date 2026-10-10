<?php

// Namespace for seeders.
namespace Database\Seeders;

// Models we insert rows into.
use App\Models\Brand;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
// Base seeder class.
use Illuminate\Database\Seeder;
// Turns "Jenama Contoh A" into "jenama-contoh-a".
use Illuminate\Support\Str;

// LOCAL DEMO DATA ONLY. These are made-up sample products so the UI can be checked.
// Deliberately NOT called from DatabaseSeeder: run it with `php artisan db:seed --class=DemoProductSeeder`.
// Never run it on a real/production database: the origin statuses here are not real claims.
class DemoProductSeeder extends Seeder
{
    // Entry point Laravel calls when this seeder runs.
    public function run(): void
    {
        // Sample rows: [name, brand, state, country, origin status, barcode, halal, category slug].
        $rows = [
            ['Kerepek Pisang Pedas', 'Jenama Contoh A', 'Perak', 'MY', 'verified_my', '9550000000011', true, 'food-snacks'],
            ['Sambal Bilis Botol', 'Jenama Contoh B', 'Johor', 'MY', 'likely_my', '9550000000028', null, 'food-sauces-condiments'],
            ['Kerepek Ubi Pedas', 'Jenama Contoh C', 'Kedah', 'MY', 'verified_my', '9550000000035', true, 'food-snacks'],
            ['Kerepek Pisang Manis', 'Jenama Contoh D', 'Selangor', 'MY', 'verified_my', '9550000000042', true, 'food-snacks'],
            // A foreign sample so the grey "not Malaysian" result can be checked.
            ['Keropok Import Contoh', 'Brand Import Contoh', null, 'TH', 'foreign', '8850000000019', false, 'food-snacks'],
            // An unknown sample so the amber "not yet verified" result can be checked.
            ['Mi Segera Tanpa Maklumat', 'Jenama Contoh E', null, 'MY', 'unknown', '9000000000017', null, 'food-rice-noodles'],
        ];

        // Walk through each sample row.
        foreach ($rows as [$name, $brandName, $state, $country, $status, $barcode, $halal, $categorySlug]) {
            // Create the brand if it doesn't exist yet (matched by its slug).
            $brand = Brand::firstOrCreate(['slug' => Str::slug($brandName)], ['name' => $brandName]);
            // Create a sample manufacturer (state may be empty for foreign/unknown ones).
            $maker = Manufacturer::firstOrCreate(['name' => $brandName.' Sdn Bhd'], ['state' => $state, 'country' => $country]);
            // Create or update the product, keyed by barcode so re-running doesn't duplicate.
            Product::updateOrCreate(['barcode' => $barcode], [
                'name' => $name,
                'brand_id' => $brand->id,
                'manufacturer_id' => $maker->id,
                // Look up the subcategory (created by CategorySeeder); null if it hasn't been seeded.
                'category_id' => Category::where('slug', $categorySlug)->value('id'),
                'origin_status' => $status,
                'halal' => $halal,
                // Marked 'demo' so these rows are easy to find and delete later.
                'source' => 'demo',
            ]);
        }

        // Link the first product to two hand-picked alternatives so that section can be checked.
        $first = Product::where('barcode', '9550000000011')->first();
        // syncWithoutDetaching adds the links without duplicating them when re-run.
        $first?->alternatives()->syncWithoutDetaching(Product::whereIn('barcode', ['9550000000035', '9550000000042'])->pluck('id'));
    }
}
