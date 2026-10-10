<?php

// Namespace: where this class lives.
namespace App\Models;

// Lists the columns that may be mass-assigned.
use Illuminate\Database\Eloquent\Attributes\Fillable;
// Base Eloquent model class.
use Illuminate\Database\Eloquent\Model;

// Allow these columns to be filled in bulk.
#[Fillable(['product_id', 'user_id', 'photo_path', 'status'])]
// One label photo submitted as proof of a product's origin (table `evidence`).
class Evidence extends Model
{
    // The table is literally named `evidence` (the word has no plural), so say so explicitly.
    protected $table = 'evidence';
}
