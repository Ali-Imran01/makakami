<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Report;
use App\Support\Gtin;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

// "Laporkan salah": a signed-in person with a confirmed email tells us a product's information looks wrong.
// A report changes nothing by itself; staff read it and decide.
class ReportController extends Controller
{
    // How many unhandled reports one person may have at a time.
    private const MAX_OPEN = 10;

    // POST /api/reports  { barcode, type, note }
    public function store(Request $request)
    {
        $data = $request->validate([
            'barcode' => ['required', 'string', 'regex:/^\d{8,14}$/'],
            'type' => ['required', Rule::in(Report::TYPES)],
            // What exactly is wrong, and how they know.
            'note' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        // Only products we have can be reported.
        $product = Product::where('barcode', Gtin::normalise($data['barcode']))->first();
        if ($product === null) {
            throw ValidationException::withMessages(['barcode' => ['We do not have this product.']]);
        }

        $user = $request->user();
        $open = Report::where('user_id', $user->id)->where('status', 'open');
        if ((clone $open)->where('product_id', $product->id)->exists()) {
            throw ValidationException::withMessages(['note' => ['You already reported this product and it is waiting for review.']]);
        }
        if ((clone $open)->count() >= self::MAX_OPEN) {
            throw ValidationException::withMessages(['note' => ['You have too many reports waiting for review. Please wait for some to be handled.']]);
        }

        Report::create(['product_id' => $product->id, 'user_id' => $user->id, 'type' => $data['type'], 'note' => $data['note']]);

        return response()->json(['message' => 'Report received.'], 201);
    }
}
