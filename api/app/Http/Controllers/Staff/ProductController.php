<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ProductEditor;
use App\Support\Gtin;
use App\Support\ProductRules;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

// Staff adding and correcting products directly (moderators and above). The ProductEditor decides which statuses each role may set.
class ProductController extends Controller
{
    // GET /api/staff/products/{barcode}: the product as an editable form (404 if we don't have it).
    public function show(Request $request, string $barcode)
    {
        $product = Product::with(['brand:id,name', 'manufacturer:id,name,state', 'category:id,slug'])->where('barcode', Gtin::normalise($barcode))->firstOrFail();

        return [
            'barcode' => $product->barcode,
            'name' => $product->name,
            'brand' => $product->brand?->name,
            'category' => $product->category?->slug,
            'manufacturer' => $product->manufacturer?->name,
            'state' => $product->manufacturer?->state,
            'halal' => $product->halal === null ? 'unknown' : ($product->halal ? 'yes' : 'no'),
            'quantity' => $product->quantity,
            'image_url' => $product->image_url,
            'origin_status' => $product->origin_status,
            'origin_note' => $product->origin_note,
            'source' => $product->source,
            // Whether this role may change the status as it stands now.
            'status_locked' => ! in_array($product->origin_status, ProductEditor::allowedStatuses($request->user()->role), true),
            'allowed_statuses' => ProductEditor::allowedStatuses($request->user()->role),
        ];
    }

    // POST /api/staff/products: add a product we don't have.
    public function store(Request $request, ProductEditor $editor)
    {
        $data = $request->validate([
            'barcode' => ['required', 'string', 'regex:/^\d{8,14}$/'],
            ...ProductRules::details(),
            'origin_status' => ['nullable', Rule::in(ProductEditor::ALL)],
            'origin_note' => ['nullable', 'string', 'max:500'],
        ]);
        $barcode = Gtin::normalise($data['barcode']);
        if (! Gtin::isValid($barcode)) {
            throw ValidationException::withMessages(['barcode' => ['This barcode has a wrong check digit; please check it.']]);
        }
        if (Product::where('barcode', $barcode)->exists()) {
            throw ValidationException::withMessages(['barcode' => ['We already have this product. Look it up and edit it instead.']]);
        }
        if (empty($data['name'])) {
            throw ValidationException::withMessages(['name' => ['A name is required.']]);
        }

        $user = $request->user();
        $product = $editor->save(null, $barcode, $data, $user->role, $user, 'manual');

        return response()->json(['barcode' => $product->barcode, 'origin_status' => $product->origin_status], 201);
    }

    // PUT /api/staff/products/{barcode}: correct a product.
    public function update(Request $request, string $barcode, ProductEditor $editor)
    {
        $data = $request->validate([
            ...ProductRules::details(),
            'origin_status' => ['nullable', Rule::in(ProductEditor::ALL)],
            'origin_note' => ['nullable', 'string', 'max:500'],
        ]);
        $product = Product::where('barcode', Gtin::normalise($barcode))->firstOrFail();

        $user = $request->user();
        $product = $editor->save($product, $product->barcode, $data, $user->role, $user);

        return ['barcode' => $product->barcode, 'origin_status' => $product->origin_status];
    }
}
