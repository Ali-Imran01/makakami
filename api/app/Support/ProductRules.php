<?php

// Namespace for small helper classes.
namespace App\Support;

use Illuminate\Validation\Rule;

// The validation rules for product details, shared by contributions and the staff page so both accept exactly the same things.
class ProductRules
{
    // Rules for the product detail fields (everything optional here; callers add what they require).
    public static function details(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:100'],
            // Must be one of our category slugs.
            'category' => ['nullable', 'string', 'exists:categories,slug'],
            'manufacturer' => ['nullable', 'string', 'max:150'],
            // Must be a Malaysian state or federal territory.
            'state' => ['nullable', Rule::in(config('makakami.states'))],
            'halal' => ['nullable', Rule::in(['yes', 'no', 'unknown'])],
            'quantity' => ['nullable', 'string', 'max:64'],
            // Only web links (blocks "javascript:" and similar).
            'image_url' => ['nullable', 'url:http,https', 'max:1000'],
        ];
    }
}
