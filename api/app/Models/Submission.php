<?php

// Namespace: where this class lives.
namespace App\Models;

// Lists the columns that may be mass-assigned.
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// What a contributor sent in: a new product or a correction, waiting for a moderator.
// Only the fields a contributor may influence are fillable: status and review fields are set by code, never by a request.
#[Fillable(['user_id', 'type', 'barcode', 'product_id', 'payload'])]
class Submission extends Model
{
    // The details they sent, stored as JSON.
    protected function casts(): array
    {
        return ['payload' => 'array', 'reviewed_at' => 'datetime'];
    }

    // The contributor.
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // The product being corrected, if any.
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // What the contributor is allowed to see about their own submission.
    public function toOwnerArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'barcode' => $this->barcode,
            // The name they proposed, or the existing product's name for a correction that doesn't rename it.
            'name' => $this->payload['name'] ?? $this->product?->name,
            'status' => $this->status,
            // The moderator's message (e.g. why it was rejected).
            'review_note' => $this->review_note,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
