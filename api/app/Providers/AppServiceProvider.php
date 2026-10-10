<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // The "reset your password" email must link to the website's page (the API has no pages), carrying the one-time
        // token and the email address, e.g. http://localhost:5173/tetapkan-semula?token=...&email=...
        ResetPassword::createUrlUsing(
            fn ($user, string $token) => rtrim(config('makakami.frontend_url'), '/').'/tetapkan-semula?token='.urlencode($token).'&email='.urlencode($user->getEmailForPasswordReset()),
        );
    }
}
