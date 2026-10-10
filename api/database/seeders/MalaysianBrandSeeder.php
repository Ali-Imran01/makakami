<?php

// Namespace for seeders.
namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

// Loads the list of brands that are believed to be Malaysian-owned (from Downloads\malaysian-products.md, categories 1-9).
//
// IMPORTANT: this is a list of LEADS, not evidence. Every brand is saved with verified = false and a note saying where the
// claim came from, and the only thing it changes is that imported products from these brands read "Malaysian brand, origin
// unconfirmed" instead of "not yet verified". It can never make a product "Made in Malaysia". Ownership changes over time:
// re-check brands against KPDN (buymalaysian.kpdn.gov.my), MATRADE or SSM before relying on them.
class MalaysianBrandSeeder extends Seeder
{
    // Where the claim comes from (stored on every brand).
    private const SOURCE = 'malaysian-products.md (2026-10-10), not verified';

    // Brand names by category, exactly as listed (qualifiers like "(Power Root)" removed).
    private const BRANDS = [
        'Food' => ['Mamee Monster', 'Mister Potato', 'Adabi', "Brahim's", 'Faiza', "Baba's", 'Ramly', "Tean's Gourmet", 'MyKuali', 'Mak Siti'],
        'Beverages' => ['BOH', 'Sabah Tea', 'Cameron Valley', 'Aik Cheong', 'Alicafe', 'Kopi 434', 'Chek Hup', 'Spritzer'],
        'Dairy & Eggs' => ['Farm Fresh', 'Desa Cattle', 'Nutriplus', 'Wise Choice', 'Teo Seng'],
        'Confectionery' => ["Beryl's", 'Vochelle', "Julie's", 'Hup Seng', 'Super Ring', 'Jacker'],
        'Personal Care' => ['Good Virtues Co', 'Bad Lab', "Mu'min", 'Pro Dental B', 'Sendayu Tinggi'],
        'Cosmetics' => ['SimplySiti', 'Velvet Vanity', 'Breena Beauty', 'Nurraysa', 'Elianto', 'Kayman Beauty', 'LUMI Beauty', 'Dododots'],
        'Health' => ['Appeton', 'Hovid', 'CHAMPS', 'Pharmaniaga', 'Halagel', 'Hai-O', 'Elken'],
        'Household' => ["Do'zee", 'Khind'],
        'Baby & Kids' => ['Diapex', 'Anakku', 'Bebimora', 'Poney', 'Groomy'],
    ];

    // Deliberately NOT loaded, so a human can decide:
    // - names so generic that a foreign product could share them, which would wrongly label that product as Malaysian;
    // - brands the list itself marks as "made in Malaysia, foreign parent" (they are not Malaysian-owned brands).
    // Categories 10-12 (fashion, electronics & automotive, crafts) wait for Phase 4 (outlets and brands).
    private const SKIPPED = ['Premier', 'Royal Gold', 'Cutie', 'Intimate', 'Vitagen', 'Pureen'];

    public function run(): void
    {
        $created = 0;
        $updated = 0;
        $conflicts = [];
        $brandIds = [];

        foreach (self::BRANDS as $names) {
            foreach ($names as $name) {
                // Same slug rule as the Open Food Facts import, so "Julie's" from OFF lands on this same brand.
                $brand = Brand::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name]);
                $brand->wasRecentlyCreated ? $created++ : null;

                // Never overwrite an ownership someone already set to something else (e.g. an admin's decision).
                if ($brand->owner_country !== null && $brand->owner_country !== 'MY') {
                    $conflicts[] = "{$name} (already {$brand->owner_country})";

                    continue;
                }
                if ($brand->owner_country === null) {
                    $brand->forceFill(['owner_country' => 'MY', 'owner_source' => self::SOURCE, 'verified' => false])->save();
                    $updated++;
                }
                $brandIds[] = $brand->id;
            }
        }

        // Products already imported from Open Food Facts that were "not yet verified" but belong to one of these brands.
        $moved = Product::whereIn('brand_id', $brandIds)
            ->whereIn('source', ['off', 'obf', 'opf'])
            ->where('origin_status', 'unknown')
            ->update(['origin_status' => 'my_brand_unknown_origin']);

        $this->command?->info("Brands: {$created} new, {$updated} marked Malaysian-owned (unverified), ".count($brandIds).' in total.');
        $this->command?->info("Imported products changed to \"Malaysian brand, origin unconfirmed\": {$moved}.");
        $this->command?->warn('Not loaded (need a human decision): '.implode(', ', self::SKIPPED).'.');
        if ($conflicts !== []) {
            $this->command?->warn('Left alone because their owner country is already set: '.implode(', ', $conflicts).'.');
        }
    }
}
