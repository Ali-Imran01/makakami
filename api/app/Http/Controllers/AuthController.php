<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers;

// Models and enums used below.
use App\Models\User;
// Fired after sign-up; Laravel's listener sends the "confirm your email" message.
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
// Password strength rules.
use Illuminate\Validation\Rules\Password;
// Used to report a failed login in the same shape as other validation errors.
use Illuminate\Validation\ValidationException;

// Sign-up, login, logout and "who am I".
class AuthController extends Controller
{
    // POST /api/auth/register: create a normal user account (role "user") and log it in.
    public function register(Request $request)
    {
        // Check the input; Laravel answers 422 with reasons if anything is wrong.
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            // Emails are stored in lowercase so "A@x.com" and "a@x.com" can't both register.
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            // At least 10 characters.
            'password' => ['required', 'string', Password::min(10), 'max:200'],
            // The box must be ticked, and the version shown to the person must be the current one.
            'accept_terms' => ['accepted'],
            'terms_version' => ['required', 'string', 'in:'.config('makakami.terms_version')],
        ]);

        // Build the account. Role, terms fields are set explicitly: they are not mass-assignable, so a request can't set them itself.
        $user = new User([
            'name' => trim($data['name']),
            'email' => strtolower(trim($data['email'])),
            'password' => $data['password'],
        ]);
        // New accounts are always plain users; staff roles are granted separately by people who outrank them.
        $user->forceFill([
            'role' => 'user',
            'terms_accepted_at' => now(),
            'terms_version' => $data['terms_version'],
        ])->save();

        // Sends the "confirm your email" message after the answer has been sent, so a slow email provider never slows sign-up down.
        defer(fn () => event(new Registered($user)));

        // Log them in straight away so the website can show their profile.
        return response()->json(['token' => $this->issueToken($user), 'user' => $user->toPublicArray()], 201);
    }

    // POST /api/auth/login: check email + password and return a token.
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Find the account.
        $user = User::where('email', strtolower(trim($data['email'])))->first();

        // Always do one password check, even for an unknown email (against a real but meaningless hash),
        // so the response time doesn't reveal which emails exist.
        $ok = Hash::check($data['password'], $user->password ?? '$2y$12$v.zMOibVWcsYtSd2R7.hGOM8RYPNvRtJcBFo4GQCWux5TqS.C2zAy');

        // Same message whether the email or the password was wrong.
        if (! $user || ! $ok) {
            throw ValidationException::withMessages(['email' => ['These credentials do not match our records.']]);
        }

        return response()->json(['token' => $this->issueToken($user), 'user' => $user->toPublicArray()]);
    }

    // POST /api/auth/logout: invalidate the token that was used for this request.
    public function logout(Request $request)
    {
        // Delete only this device's token; other devices stay logged in.
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    // GET /api/auth/me: the signed-in person (used by the website on page load).
    public function me(Request $request)
    {
        return $request->user()->toPublicArray();
    }

    // Create a login token that expires after the configured number of days.
    private function issueToken(User $user): string
    {
        return $user->createToken('web', ['*'], now()->addDays(config('makakami.token_days')))->plainTextToken;
    }
}
