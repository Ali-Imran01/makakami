<?php

// Base class for migrations.
use Illuminate\Database\Migrations\Migration;
// Describes table columns.
use Illuminate\Database\Schema\Blueprint;
// Entry point for schema changes.
use Illuminate\Support\Facades\Schema;

// Prepares `reports` ("Laporkan salah": someone says a product's information is wrong) for review by staff.
return new class extends Migration
{
    // Apply the change.
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            // Who handled it, when, and what they concluded.
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('resolution_note', 500)->nullable();
            // The queue is read oldest-first within a status.
            $table->index(['status', 'created_at']);
        });
    }

    // Undo the change.
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn(['reviewed_at', 'resolution_note']);
        });
    }
};
