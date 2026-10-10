<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

// "Forgot my password": email a one-time link, then let the person choose a new password.
class PasswordResetController extends Controller
{
    // POST /api/auth/forgot-password  { "email": "..." }
    // Always answers the same way, whether or not the email has an account, so nobody can use this to find out who is registered.
    public function forgot(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'string', 'email']]);

        // Laravel creates the one-time token, stores a hash of it, and emails the link (see AppServiceProvider for the link's address).
        // The result (sent / unknown email / asked too soon) is deliberately ignored.
        // It runs after the answer is sent, so the time taken can't reveal whether the address has an account.
        $email = strtolower(trim($data['email']));
        defer(fn () => Password::sendResetLink(['email' => $email]));

        return response()->json(['message' => 'If that email has an account, we have sent a link to reset the password.']);
    }

    // POST /api/auth/reset-password  { "email", "token", "password" }
    public function reset(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'token' => ['required', 'string', 'max:200'],
            'password' => ['required', 'string', PasswordRule::min(10), 'max:200'],
        ]);

        $status = Password::reset(
            ['email' => strtolower(trim($data['email'])), 'token' => $data['token'], 'password' => $data['password']],
            function (User $user, string $password) {
                // Set the new password (hashed by the model), and rotate the "remember me" value.
                $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)]);
                // They received the email, which proves they own the address.
                if (! $user->hasVerifiedEmail()) {
                    $user->markEmailAsVerified();
                }
                $user->save();
                // Anyone who had been logged in (including whoever caused the lock-out) has to log in again.
                $user->tokens()->delete();
                event(new PasswordReset($user));
            },
        );

        // Wrong, used or expired token (or unknown email): one generic message.
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => ['This password reset link is invalid or has expired.']]);
        }

        return response()->json(['message' => 'Your password has been changed. Please log in.']);
    }
}
