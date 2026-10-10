<?php

// Base class for migrations.
use Illuminate\Database\Migrations\Migration;
// Describes table columns.
use Illuminate\Database\Schema\Blueprint;
// Raw SQL for the enum change, and the schema builder.
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Prepares the database for accounts: the super_admin role, Terms acceptance records, and an audit log.
return new class extends Migration
{
    // Apply the change.
    public function up(): void
    {
        // Add 'super_admin' to the list of allowed roles (MySQL needs the whole list restated).
        DB::statement("ALTER TABLE users MODIFY role ENUM('user','moderator','admin','super_admin') NOT NULL DEFAULT 'user'");

        // Record which version of the Terms and Privacy Policy each person accepted, and when (see Documents\TnC.md, section 4).
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('terms_accepted_at')->nullable()->after('trust_score');
            $table->string('terms_version', 40)->nullable()->after('terms_accepted_at');
        });

        // Who changed what, when and why. Only ever appended to.
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            // The person who did it; NULL when done from the command line.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // Short action name, e.g. "role.changed".
            $table->string('action', 64)->index();
            // What it was done to, e.g. type "user" and its id.
            $table->string('subject_type', 32)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            // Values before and after, and an optional written reason.
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->string('note', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();
            // Look up the history of one record quickly.
            $table->index(['subject_type', 'subject_id']);
        });
    }

    // Undo the change.
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['terms_accepted_at', 'terms_version']);
        });
        // Anyone who is super_admin becomes admin so the shorter list is valid again.
        DB::table('users')->where('role', 'super_admin')->update(['role' => 'admin']);
        DB::statement("ALTER TABLE users MODIFY role ENUM('user','moderator','admin') NOT NULL DEFAULT 'user'");
    }
};
