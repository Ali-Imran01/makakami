<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\Submission;
use App\Services\ProductEditor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

// The review queue: moderators and above look at what contributors sent in and approve or reject it.
class SubmissionReviewController extends Controller
{
    // GET /api/staff/submissions?status=pending: the queue (oldest first) and how many are in each state.
    public function index(Request $request)
    {
        $status = $request->validate(['status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])]])['status'] ?? 'pending';

        $items = Submission::with(['user:id,name', 'product.brand:id,name', 'product.manufacturer:id,name,state', 'product.category:id,slug'])
            ->where('status', $status)
            // Waiting ones oldest first (fair queue); reviewed ones newest first.
            ->orderBy('created_at', $status === 'pending' ? 'asc' : 'desc')
            ->limit(50)
            ->get()
            ->map(fn (Submission $s) => [
                'id' => $s->id,
                'type' => $s->type,
                'barcode' => $s->barcode,
                'status' => $s->status,
                'created_at' => $s->created_at?->toIso8601String(),
                // The contributor's name only (no email) is shown to reviewers.
                'contributor' => ['id' => $s->user?->id, 'name' => $s->user?->name],
                // What they proposed.
                'payload' => $s->payload,
                // What the product looks like now (for corrections), so the reviewer can compare.
                'current' => $s->product ? [
                    'name' => $s->product->name,
                    'brand' => $s->product->brand?->name,
                    'category' => $s->product->category?->slug,
                    'manufacturer' => $s->product->manufacturer?->name,
                    'state' => $s->product->manufacturer?->state,
                    'halal' => $s->product->halal === null ? 'unknown' : ($s->product->halal ? 'yes' : 'no'),
                    'quantity' => $s->product->quantity,
                    'image_url' => $s->product->image_url,
                    'origin_status' => $s->product->origin_status,
                ] : null,
                'review_note' => $s->review_note,
                'reviewed_at' => $s->reviewed_at?->toIso8601String(),
            ]);

        return [
            'data' => $items,
            'counts' => Submission::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            // Statuses this reviewer's role may set when approving.
            'allowed_statuses' => ProductEditor::allowedStatuses($request->user()->role),
        ];
    }

    // POST /api/staff/submissions/{id}/approve: apply the submission to the catalogue.
    public function approve(Request $request, Submission $submission, ProductEditor $editor)
    {
        $data = $request->validate([
            // Optional: the status to give the product. Leave out to keep the current one (corrections) or use the cautious default (new products).
            'origin_status' => ['nullable', Rule::in(ProductEditor::ALL)],
            // Required by the editor for statuses decided by a person.
            'evidence' => ['nullable', 'string', 'max:500'],
            // What the contributor will read.
            'review_note' => ['nullable', 'string', 'max:500'],
        ]);
        abort_unless($submission->status === 'pending', 409, 'This submission has already been reviewed.');

        $reviewer = $request->user();
        $payload = $submission->payload;

        $result = DB::transaction(function () use ($submission, $payload, $data, $reviewer, $editor) {
            // The submission's own fields, passed to the editor.
            $fields = collect($payload)->only(['name', 'brand', 'category', 'manufacturer', 'state', 'halal', 'quantity', 'image_url'])->all();
            $fields['origin_status'] = $data['origin_status'] ?? null;

            if ($submission->type === 'new_product') {
                // Someone may have added it in the meantime.
                abort_if(Product::where('barcode', $submission->barcode)->exists(), 409, 'This product has been added since. Reject this submission or send it as a correction.');
                // The contributor's source note is shown as the product's "review note" unless the reviewer wrote evidence.
                $fields['origin_note'] = $data['evidence'] ?? ($payload['note'] ?? null);
                $product = $editor->save(null, $submission->barcode, $fields, $reviewer->role, $reviewer, 'community');
            } else {
                $existing = Product::where('barcode', $submission->barcode)->firstOrFail();
                // For a correction, the existing note stays unless the reviewer gives new evidence.
                $fields['origin_note'] = $data['evidence'] ?? null;
                $product = $editor->save($existing, $submission->barcode, $fields, $reviewer->role, $reviewer, 'community');
            }

            // Mark the submission done.
            $submission->forceFill([
                'status' => 'approved',
                'product_id' => $product->id,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'review_note' => $data['review_note'] ?? null,
            ])->save();
            AuditLog::record($reviewer, 'submission.approved', $submission, null, ['product_id' => $product->id, 'type' => $submission->type]);

            return $product;
        });

        return ['id' => $submission->id, 'status' => 'approved', 'product' => ['id' => $result->id, 'barcode' => $result->barcode, 'origin_status' => $result->origin_status]];
    }

    // POST /api/staff/submissions/{id}/reject: turn it down, with a message the contributor will read.
    public function reject(Request $request, Submission $submission)
    {
        $data = $request->validate(['review_note' => ['required', 'string', 'min:5', 'max:500']]);
        abort_unless($submission->status === 'pending', 409, 'This submission has already been reviewed.');

        $reviewer = $request->user();
        $submission->forceFill([
            'status' => 'rejected',
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'review_note' => $data['review_note'],
        ])->save();
        AuditLog::record($reviewer, 'submission.rejected', $submission, null, ['type' => $submission->type], $data['review_note']);

        return ['id' => $submission->id, 'status' => 'rejected'];
    }
}
