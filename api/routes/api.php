<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ScanController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/categories', [CategoryController::class, 'index']);
// One category (by slug) with its subcategories, states and counts.
Route::get('/categories/{slug}', [CategoryController::class, 'show'])->where('slug', '[a-z0-9-]+');
// Record a scan; limited to 60 per minute per client so bots can't inflate the counters.
Route::post('/scans', [ScanController::class, 'store'])->middleware('throttle:60,1');
// Product list for the catalogue, category pages and search (filters in the query string).
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/recent', [ProductController::class, 'recent']);
// Barcodes are 8-14 digits; anything else gets a 404 before reaching the controller.
Route::get('/products/{barcode}', [ProductController::class, 'show'])->where('barcode', '[0-9]{8,14}');
