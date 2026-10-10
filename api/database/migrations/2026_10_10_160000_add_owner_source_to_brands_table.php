<?php

// Base class for migrations.
use Illuminate\Database\Migrations\Migration;
// Describes table columns.
use Illuminate\Database\Schema\Blueprint;
// Entry point for schema changes.
use Illuminate\Support\Facades\Schema;

// Records WHERE a brand's ownership claim came from. "This brand is Malaysian-owned" is a claim about a real company,
// so it must always be traceable (and re-checkable, because ownership changes over time).
return new class extends Migration
{
    // Apply the change.
    public function up(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            // e.g. "malaysian-products.md (2026-10-10), not verified".
            $table->string('owner_source', 150)->nullable()->after('owner_country');
        });
    }

    // Undo the change.
    public function down(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            $table->dropColumn('owner_source');
        });
    }
};
