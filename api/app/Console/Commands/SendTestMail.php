<?php

// Namespace for artisan commands.
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

// Sends one plain test email through whatever mailer is configured, to check the email setup (e.g. Resend).
// Example: php artisan mail:test you@example.com
class SendTestMail extends Command
{
    protected $signature = 'mail:test {to : The address to send the test message to}';

    protected $description = 'Send a test email with the configured mailer (to check Resend / SMTP settings)';

    public function handle(): int
    {
        $to = (string) $this->argument('to');
        if (! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            $this->error('That is not a valid email address.');

            return self::FAILURE;
        }

        // Show what is about to be used, so a wrong setting is obvious.
        $mailer = config('mail.default');
        $from = config('mail.from.address');
        $this->line("Mailer: {$mailer}   From: ".config('mail.from.name')." <{$from}>   To: {$to}");

        if ($mailer === 'log') {
            $this->warn('MAIL_MAILER is "log": the message will only be written to storage/logs/laravel.log, nothing is sent. Set MAIL_MAILER=resend in .env for real delivery.');
        }

        try {
            Mail::raw("Ini ialah emel ujian daripada MakaKami. Jika anda menerimanya, tetapan emel berfungsi.\n\nThis is a test email from MakaKami. If you received it, the email setup works.", function ($message) use ($to) {
                $message->to($to)->subject('MakaKami: ujian emel / email test');
            });
        } catch (\Throwable $e) {
            // Resend answers with a clear reason (wrong key, sender domain not verified, recipient not allowed in test mode...).
            $this->error('Sending failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Handed to the mailer without an error. Check the inbox (and the spam folder).');

        return self::SUCCESS;
    }
}
