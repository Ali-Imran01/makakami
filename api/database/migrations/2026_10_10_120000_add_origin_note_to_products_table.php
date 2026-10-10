<?php

// Base class for migrations.
use Illuminate\Database\Migrations\Migration;
// Describes table columns.
use Illuminate\Database\Schema\Blueprint;
// Entry point for schema changes.
use Illuminate\Support\Facades\Schema;

// Adds a short free-text note explaining why a product has its origin status (the evidence behind a manual decision).
return new class extends Migration
{
    // Apply the change.
    public function up(): void
    {
        // Change the existing `products` table.
        Schema::table('products', function (Blueprint $table) {
            // e.g. "Label photo checked: made in Perak". Shown on the result page as evidence.
            $table->string('origin_note', 500)->nullable()->after('manufacturing_places');
        });
    }

    // Undo the change.
    public function down(): void
    {
        // Remove the column again.
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('origin_note');
        });
    }
};
