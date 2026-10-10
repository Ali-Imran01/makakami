<?php

// Namespace: where this class lives.
namespace App\Models;

// Lists the columns that may be mass-assigned.
use Illuminate\Database\Eloquent\Attributes\Fillable;
// Base Eloquent model class.
use Illuminate\Database\Eloquent\Model;

// Allow these columns to be filled in bulk. Note: no IP address or device info is stored on purpose.
#[Fillable(['product_id', 'barcode', 'user_id'])]
// One row = one barcode scan (table `scan_logs`).
class ScanLog extends Model
{
    // The table only has created_at (no updated_at), so tell Eloquent not to maintain an updated_at column.
    public const UPDATED_AT = null;
}
