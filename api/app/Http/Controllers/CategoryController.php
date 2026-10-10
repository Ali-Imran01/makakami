<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers;

// Models used below.
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;

// Handles requests about categories.
class CategoryController extends Controller
{
    // GET /api/categories: all top-level categories with their subcategories.
    public function index()
    {
        return Category::whereNull('parent_id')
            ->with('children')
            ->orderBy('sort_order')
            ->get();
    }

    // GET /api/categories/{slug}: one category with its parent, subcategories, filter options and counts.
    public function show(string $slug)
    {
        // The category (404 if the slug is wrong), with the related categories loaded.
        $category = Category::with(['parent', 'children'])->where('slug', $slug)->firstOrFail();

        // The category itself plus its subcategories (or just itself when it is a subcategory).
        $ids = $category->parent_id === null ? $category->children->pluck('id')->push($category->id) : collect([$category->id]);

        // Products in this category.
        $inCategory = Product::whereIn('category_id', $ids);

        // Send the category fields plus the extras the category page needs.
        return [
            ...$category->toArray(),
            // How many confirmed/likely Malaysian products are in this category (shown under the title).
            'malaysian_count' => (clone $inCategory)->whereIn('origin_status', ['verified_my', 'likely_my'])->count(),
            // States that have a manufacturer in this category, for the "Negeri pengilang" filter.
            'states' => Manufacturer::whereIn('id', (clone $inCategory)->whereNotNull('manufacturer_id')->select('manufacturer_id'))
                ->whereNotNull('state')->distinct()->orderBy('state')->pluck('state'),
        ];
    }
}
