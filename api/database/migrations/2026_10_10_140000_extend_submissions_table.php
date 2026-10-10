<?php

// Base class for migrations.
use Illuminate\Database\Migrations\Migration;
// Describes table columns.
use Illuminate\Database\Schema\Blueprint;
// Entry point for schema changes.
use Illuminate\Support\Facades\Schema;

// Prepares `submissions` (what contributors send in) for review by moderators.
return new class extends Migration
{
    // Apply the change.
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            // A brand new product, or a correction to a product we already have.
            $table->enum('type', ['new_product', 'correction'])->default('new_product')->after('user_id');
            // The product being corrected (empty for brand new products).
            $table->foreignId('product_id')->nullable()->after('barcode')->constrained()->nullOnDelete();
            // Who reviewed it, when, and what they told the contributor.
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('review_note', 500)->nullable();
            // The review queue is read oldest-first within a status.
            $table->index(['status', 'created_at']);
        });
    }

    // Undo the change.
    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropConstrainedForeignId('product_id');
            $table->dropColumn(['type', 'reviewed_at', 'review_note']);
        });
    }
};
