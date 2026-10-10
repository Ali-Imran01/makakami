<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers;

// Models used below.
use App\Models\Product;
use App\Models\ScanLog;
// The incoming HTTP request.
use Illuminate\Http\Request;
// Used to make the log + counter update all-or-nothing.
use Illuminate\Support\Facades\DB;

// Records that someone scanned (or typed) a barcode.
class ScanController extends Controller
{
    // POST /api/scans  { "barcode": "9550000000011" }
    public function store(Request $request)
    {
        // Only accept 8-14 digit barcodes; anything else gets a 422 error response automatically.
        $barcode = $request->validate(['barcode' => ['required', 'string', 'regex:/^\d{8,14}$/']])['barcode'];

        // Same normalisation as the product lookup: a 12-digit UPC-A equals the 13-digit EAN with a leading zero.
        $barcode = strlen($barcode) === 12 ? '0'.$barcode : $barcode;

        // The product, if we have it (an unknown barcode is still worth logging: it shows demand for missing products).
        $productId = Product::where('barcode', $barcode)->value('id');

        // Do both writes together so the counter and the log can't drift apart.
        DB::transaction(function () use ($request, $barcode, $productId) {
            // One log row. user_id is the signed-in user's id, or null for guests. No IP or device info is stored.
            ScanLog::create([
                'product_id' => $productId,
                'barcode' => $barcode,
                'user_id' => $request->user('sanctum')?->id,
            ]);

            // Bump the "most scanned" counter for known products (atomic SQL +1, safe under concurrent scans).
            if ($productId !== null) {
                Product::whereKey($productId)->increment('scan_count');
            }
        });

        // Nothing to send back: 204 No Content.
        return response()->noContent();
    }
}
