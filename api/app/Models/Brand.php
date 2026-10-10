<?php

// Namespace: where this class lives.
namespace App\Models;

// Lists the columns that may be mass-assigned.
use Illuminate\Database\Eloquent\Attributes\Fillable;
// Base Eloquent model class.
use Illuminate\Database\Eloquent\Model;

// Allow these columns to be filled in bulk (seeders, create()).
#[Fillable(['name', 'slug', 'ssm_no', 'owner_country', 'owner_source', 'verified'])]
// A Brand is one row in the `brands` table.
class Brand extends Model
{
    // Nothing extra needed yet: Eloquent infers the table name `brands` from the class name.
}
