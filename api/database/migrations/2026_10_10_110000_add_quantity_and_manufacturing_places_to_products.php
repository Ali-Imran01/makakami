<?php

// Base class for migrations.
use Illuminate\Database\Migrations\Migration;
// Describes table columns.
use Illuminate\Database\Schema\Blueprint;
// Entry point for schema changes.
use Illuminate\Support\Facades\Schema;

// Adds two fields that Open Food Facts gives us and the result page shows.
return new class extends Migration
{
    // Apply the change.
    public function up(): void
    {
        // Change the existing `products` table.
        Schema::table('products', function (Blueprint $table) {
            // Pack size as printed, e.g. "150 g" (the result design shows it next to the brand).
            $table->string('quantity', 64)->nullable()->after('image_url');
            // Free text of where it is made, e.g. "Malaysia" (from OFF `manufacturing_places`); used as evidence.
            $table->string('manufacturing_places')->nullable()->after('quantity');
        });
    }

    // Undo the change.
    public function down(): void
    {
        // Remove both columns again.
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['quantity', 'manufacturing_places']);
        });
    }
};
