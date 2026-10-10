<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Submission;
use App\Support\Gtin;
use App\Support\ProductRules;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

// What contributors send in. Nothing here changes a product: every submission waits for a moderator, and a
// contributor cannot set an origin status at all (there is simply no such field).
class SubmissionController extends Controller
{
    // How many unreviewed submissions one person may have at a time (stops flooding the review queue).
    private const MAX_PENDING = 20;

    // POST /api/submissions: send in a new product or a correction. Needs a confirmed email address (route middleware).
    public function store(Request $request)
    {
        $data = $request->validate([
            'barcode' => ['required', 'string', 'regex:/^\d{8,14}$/'],
            // The product detail rules shared with the staff page.
            ...ProductRules::details(),
            // Where the information comes from; helps the moderator check it.
            'note' => ['required', 'string', 'min:10', 'max:500'],
        ]);
        $user = $request->user();
        $barcode = Gtin::normalise($data['barcode']);

        // Typos in the barcode would waste a moderator's time.
        if (! Gtin::isValid($barcode)) {
            throw ValidationException::withMessages(['barcode' => ['This barcode has a wrong check digit; please check it.']]);
        }

        // Do we already have this product? Then this is a correction; otherwise a new product.
        $product = Product::where('barcode', $barcode)->first();
        $type = $product ? 'correction' : 'new_product';

        // Keep only the fields that were filled in.
        $payload = array_filter(
            collect($data)->except('barcode')->all(),
            fn ($value) => $value !== null && trim((string) $value) !== '',
        );

        // A new product needs at least a name; a correction needs at least one thing to change.
        if ($type === 'new_product' && empty($payload['name'])) {
            throw ValidationException::withMessages(['name' => ['A name is required for a product we do not have yet.']]);
        }
        if ($type === 'correction' && count(array_diff_key($payload, ['note' => 1])) === 0) {
            throw ValidationException::withMessages(['name' => ['Fill in at least one thing that should change.']]);
        }

        // One open submission per person per barcode, and a cap on open submissions overall.
        $pending = Submission::where('user_id', $user->id)->where('status', 'pending');
        if ((clone $pending)->where('barcode', $barcode)->exists()) {
            throw ValidationException::withMessages(['barcode' => ['You already have a submission for this barcode waiting for review.']]);
        }
        if ((clone $pending)->count() >= self::MAX_PENDING) {
            throw ValidationException::withMessages(['barcode' => ['You have too many submissions waiting for review. Please wait for some to be reviewed.']]);
        }

        // Save it. `status` is not part of the request: it starts as "pending" (the column default).
        $submission = Submission::create([
            'user_id' => $user->id,
            'type' => $type,
            'barcode' => $barcode,
            'product_id' => $product?->id,
            'payload' => $payload,
        ]);

        return response()->json($submission->fresh('product')->toOwnerArray(), 201);
    }

    // GET /api/submissions/mine: the person's own submissions, newest first.
    public function mine(Request $request)
    {
        return Submission::with('product:id,name')
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->limit(100)
            ->get()
            ->map->toOwnerArray();
    }
}
