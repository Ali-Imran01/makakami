<?php

// Namespace: where this class lives.
namespace App\Models;

// Lists the columns that may be mass-assigned.
use Illuminate\Database\Eloquent\Attributes\Fillable;
// Base Eloquent model class.
use Illuminate\Database\Eloquent\Model;

// Allow these columns to be filled in bulk.
#[Fillable(['name', 'state', 'country'])]
// A Manufacturer is one row in the `manufacturers` table.
class Manufacturer extends Model
{
    // Nothing extra needed yet: the table name `manufacturers` is inferred.
}
