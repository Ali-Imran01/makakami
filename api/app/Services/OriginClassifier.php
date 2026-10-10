<?php

// Namespace for our service classes.
namespace App\Services;

// Turns the little evidence we get from open data into an origin status.
// Rules follow MakaKami-Planning.md section 3, and are deliberately cautious:
// open data alone never produces `verified_my` or `foreign` (those need an admin or a label photo).
class OriginClassifier
{
    // Decide the status from a barcode and the "where is it made" text/tags (either may be empty).
    public static function classify(string $barcode, ?string $manufacturingPlaces, array $manufacturingTags = [], bool $knownMalaysianBrand = false): string
    {
        // Does the data say it is made in Malaysia? (OFF tags look like "en:malaysia".)
        $madeInMalaysia = in_array('en:malaysia', $manufacturingTags, true)
            // Fall back to searching the free text for the word "Malaysia" (case-insensitive).
            || preg_match('/\bmalaysia\b/i', (string) $manufacturingPlaces) === 1;

        // A Malaysian brand: barcode prefix 955 (brand owner registered with GS1 Malaysia) or a brand on our list of Malaysian-owned brands.
        // Neither says anything about where the product is made.
        $malaysianBrand = str_starts_with($barcode, '955') || $knownMalaysianBrand;

        // Made in Malaysia according to open data: "likely Malaysian".
        if ($madeInMalaysia) {
            return 'likely_my';
        }

        // Some manufacturing place is given and it is not Malaysia.
        $madeElsewhere = trim((string) $manufacturingPlaces) !== '';

        // Malaysian brand + made elsewhere: the "Malaysian brand, made overseas" case.
        if ($malaysianBrand && $madeElsewhere) {
            return 'my_brand_overseas';
        }

        // Malaysian brand, no manufacturing info yet.
        if ($malaysianBrand) {
            return 'my_brand_unknown_origin';
        }

        // Everything else: we simply don't know yet.
        return 'unknown';
    }
}
