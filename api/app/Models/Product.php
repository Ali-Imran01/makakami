<?php

// Namespace: tells PHP/Laravel where this class lives.
namespace App\Models;

// Attribute that lists which columns may be filled in bulk (mass assignment).
use Illuminate\Database\Eloquent\Attributes\Fillable;
// Base class that gives us database access for this table.
use Illuminate\Database\Eloquent\Model;
// Relationship types used by the methods below.
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Only these columns can be set through create()/fill(); protects against bad input.
#[Fillable(['barcode', 'name', 'brand_id', 'manufacturer_id', 'category_id', 'origin_status', 'halal', 'image_url', 'quantity', 'manufacturing_places', 'source', 'source_url'])]
// A Product is one row in the `products` table.
class Product extends Model
{
    // Convert raw database values into PHP types.
    protected function casts(): array
    {
        // halal is stored as 0/1 (or NULL = unknown); expose it as true/false/null in JSON.
        return ['halal' => 'boolean'];
    }

    // Each product points to one brand (the brand name shown on cards).
    public function brand(): BelongsTo
    {
        // products.brand_id -> brands.id
        return $this->belongsTo(Brand::class);
    }

    // Each product points to one manufacturer (gives us the state, e.g. Perak).
    public function manufacturer(): BelongsTo
    {
        // products.manufacturer_id -> manufacturers.id
        return $this->belongsTo(Manufacturer::class);
    }

    // Each product sits in one (sub)category.
    public function category(): BelongsTo
    {
        // products.category_id -> categories.id
        return $this->belongsTo(Category::class);
    }

    // Label photos submitted as proof for this product.
    public function evidence(): HasMany
    {
        // evidence.product_id -> products.id
        return $this->hasMany(Evidence::class);
    }

    // Hand-picked Malaysian alternatives, stored in the `alternatives` link table.
    public function alternatives(): BelongsToMany
    {
        // Link table columns: product_id (this product) and alternative_product_id (the suggestion).
        return $this->belongsToMany(self::class, 'alternatives', 'product_id', 'alternative_product_id');
    }
}
