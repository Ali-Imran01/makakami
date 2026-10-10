<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->change(); // Google-only accounts have no password
            $table->string('google_id')->nullable()->unique()->after('email');
            $table->enum('role', ['user', 'moderator', 'admin'])->default('user')->after('google_id');
            $table->integer('trust_score')->default(0)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'role', 'trust_score']);
        });
    }
};
