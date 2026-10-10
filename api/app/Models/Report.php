<?php

// Namespace: where this class lives.
namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// "This product's information is wrong": one report from one person about one product, waiting for staff.
// Only the fields the reporter chooses are fillable; status and review fields are set by code.
#[Fillable(['product_id', 'user_id', 'type', 'note'])]
class Report extends Model
{
    // The kinds of mistake a reporter can pick.
    public const TYPES = ['wrong_origin', 'wrong_name', 'wrong_photo', 'wrong_category', 'other'];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
