<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
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

        // Our two emails are written in Malay first and English below it (we don't know a new person's language yet),
        // instead of Laravel's default English-only text.
        VerifyEmail::toMailUsing(function ($notifiable, string $url) {
            $minutes = config('auth.verification.expire', 60);

            return (new MailMessage)
                ->subject('Sahkan emel anda / Confirm your email')
                ->greeting('Salam '.$notifiable->name.',')
                ->line("Terima kasih kerana mendaftar di MakaKami. Sila sahkan alamat emel anda dengan menekan butang di bawah. Pautan ini sah selama {$minutes} minit.")
                ->action('Sahkan emel / Confirm email', $url)
                ->line("Thank you for signing up to MakaKami. Please confirm your email address with the button above. The link is valid for {$minutes} minutes.")
                ->line('Jika anda tidak membuat akaun, abaikan emel ini. / If you did not create an account, you can ignore this email.')
                ->salutation('MakaKami');
        });

        ResetPassword::toMailUsing(function ($notifiable, string $token) {
            $minutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);
            // Same address the link in createUrlUsing builds above.
            $url = rtrim(config('makakami.frontend_url'), '/').'/tetapkan-semula?token='.urlencode($token).'&email='.urlencode($notifiable->getEmailForPasswordReset());

            return (new MailMessage)
                ->subject('Tetapkan semula kata laluan / Reset your password')
                ->greeting('Salam '.$notifiable->name.',')
                ->line("Kami menerima permintaan untuk menetapkan semula kata laluan akaun MakaKami anda. Tekan butang di bawah untuk memilih kata laluan baharu. Pautan sah selama {$minutes} minit dan hanya boleh digunakan sekali.")
                ->action('Tetapkan kata laluan / Reset password', $url)
                ->line("We received a request to reset the password of your MakaKami account. Use the button above to choose a new password. The link is valid for {$minutes} minutes and can be used once.")
                ->line('Jika bukan anda yang membuat permintaan ini, abaikan emel ini; kata laluan anda tidak berubah. / If you did not ask for this, ignore this email; your password stays the same.')
                ->salutation('MakaKami');
        });
    }
}
