<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers;

use App\Models\User;
// Fired once an address is confirmed.
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;

// Confirms people's email addresses.
class EmailVerificationController extends Controller
{
    // GET /api/email/verify/{id}/{hash}: the link inside the email. The `signed` route middleware has already
    // checked that the link was issued by us and has not expired or been altered.
    public function verify(string $id, string $hash)
    {
        // The account the link was made for (404 if it no longer exists).
        $user = User::findOrFail($id);

        // The hash must match this account's current email address (so an old link can't verify a changed address).
        abort_unless(hash_equals(sha1($user->getEmailForVerification()), $hash), 403, 'Invalid verification link.');

        // Mark verified once (opening the link twice is harmless).
        if (! $user->hasVerifiedEmail() && $user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        // Send the person back to the website, which shows a "email confirmed" message.
        return redirect(rtrim(config('makakami.frontend_url'), '/').'/log-masuk?verified=1');
    }

    // POST /api/email/resend: send the confirmation email again (limited to 3 per minute).
    public function resend(Request $request)
    {
        $user = $request->user();

        // Already confirmed: nothing to send.
        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Your email is already confirmed.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Confirmation email sent.']);
    }
}
