<?php

use App\Http\Controllers\Admin\UserRoleController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ScanController;
use App\Http\Controllers\Staff\AuditController;
use App\Http\Controllers\Staff\ProductController as StaffProductController;
use App\Http\Controllers\Staff\SubmissionReviewController;
use App\Http\Controllers\Staff\UserController as StaffUserController;
use App\Http\Controllers\SubmissionController;
use Illuminate\Support\Facades\Route;

// ---- Accounts ----
// Sign up and log in; limited per client so passwords can't be guessed quickly. The last word (register, login...) gives each limit
// its own counter: without it, every "throttle:N,M" route would share one counter and block each other.
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,60,register');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1,login');
// The rest need a valid login token.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    // Send the confirmation email again.
    Route::post('/email/resend', [EmailVerificationController::class, 'resend'])->middleware('throttle:3,1,resend');
    // Contributions. Sending one needs a confirmed email address; limited to 30 attempts per hour per person (typos in the form count too).
    Route::post('/submissions', [SubmissionController::class, 'store'])->middleware(['verified', 'throttle:30,60,submit']);
    Route::get('/submissions/mine', [SubmissionController::class, 'mine']);
    // ---- Staff area (needs a confirmed email, and at least the moderator role) ----
    Route::prefix('staff')->middleware(['verified', 'role:moderator'])->group(function () {
        // The review queue and its decisions.
        Route::get('/submissions', [SubmissionReviewController::class, 'index']);
        Route::post('/submissions/{submission}/approve', [SubmissionReviewController::class, 'approve']);
        Route::post('/submissions/{submission}/reject', [SubmissionReviewController::class, 'reject']);
        // Adding and correcting products directly.
        Route::get('/products/{barcode}', [StaffProductController::class, 'show'])->where('barcode', '[0-9]{8,14}');
        Route::post('/products', [StaffProductController::class, 'store']);
        Route::put('/products/{barcode}', [StaffProductController::class, 'update'])->where('barcode', '[0-9]{8,14}');
        // Admins only: look people up, and read the audit log.
        Route::middleware('role:admin')->group(function () {
            Route::get('/users', [StaffUserController::class, 'index']);
            Route::get('/audit', [AuditController::class, 'index']);
        });
    });
    // Admin tools: reachable by admins and super_admins only; the controller applies the ladder rules on top.
    Route::put('/admin/users/role', [UserRoleController::class, 'update'])->middleware('role:admin');
});
// The link inside the confirmation email (`signed` rejects forged or expired links). The name is what Laravel's email message looks up.
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])->middleware(['signed', 'throttle:6,1,verify'])->name('verification.verify');

Route::get('/categories', [CategoryController::class, 'index']);
// One category (by slug) with its subcategories, states and counts.
Route::get('/categories/{slug}', [CategoryController::class, 'show'])->where('slug', '[a-z0-9-]+');
// Record a scan; limited to 60 per minute per client so bots can't inflate the counters.
Route::post('/scans', [ScanController::class, 'store'])->middleware('throttle:60,1,scans');
// Product list for the catalogue, category pages and search (filters in the query string).
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/recent', [ProductController::class, 'recent']);
// Barcodes are 8-14 digits; anything else gets a 404 before reaching the controller.
Route::get('/products/{barcode}', [ProductController::class, 'show'])->where('barcode', '[0-9]{8,14}');
