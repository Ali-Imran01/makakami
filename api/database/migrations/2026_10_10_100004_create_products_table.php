<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('barcode', 32)->nullable()->unique();
            $table->string('name');
            $table->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('manufacturer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('origin_status', [
                'verified_my',
                'likely_my',
                'my_brand_unknown_origin',
                'my_brand_overseas',
                'foreign_made_my',
                'foreign',
                'unknown',
            ])->default('unknown')->index();
            $table->boolean('halal')->nullable();
            $table->string('image_url', 1024)->nullable();
            $table->unsignedInteger('scan_count')->default(0);
            $table->string('source', 32)->default('community'); // off | obf | opf | community
            $table->string('source_url', 1024)->nullable();     // for OFF attribution
            $table->timestamps();

            $table->fullText('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
