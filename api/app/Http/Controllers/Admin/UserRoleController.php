<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// Changing who has which role. Reachable by admins and above (route middleware `role:admin`);
// the ladder rules below decide what each of them may actually do.
class UserRoleController extends Controller
{
    // PUT /api/admin/users/role  { "email": "...", "role": "moderator" }
    public function update(Request $request)
    {
        $data = $request->validate([
            // The person must already have registered (they choose their own password; we never handle it).
            'email' => ['required', 'string', 'email'],
            // super_admin can never be granted through the website, so it is not an accepted value.
            'role' => ['required', Rule::in(['user', 'moderator', 'admin'])],
        ]);

        $actor = $request->user();
        // The account to change (404 if nobody registered with that address).
        $target = User::where('email', strtolower(trim($data['email'])))->firstOrFail();
        $newRole = Role::from($data['role']);

        // Rule 1: you may only touch people who rank below you (so nobody edits themselves, an equal or a superior).
        abort_unless($actor->outranks($target), 403, 'You cannot change the role of this account.');
        // Rule 2: you may only grant roles below your own (admins can make moderators; only the super_admin can make admins).
        abort_unless($actor->canGrant($newRole), 403, 'You cannot grant this role.');

        // Nothing to do if it is already that role.
        if ($target->role === $newRole) {
            return $target->toPublicArray();
        }

        $before = ['role' => $target->role->value];
        // `role` is not mass-assignable on purpose, so it is set directly.
        $target->forceFill(['role' => $newRole])->save();
        // Their existing login tokens stay valid, but the role is read from the database on every request,
        // so a demotion takes effect immediately.

        // Leave a record of who did it.
        AuditLog::record($actor, 'role.changed', $target, $before, ['role' => $newRole->value]);

        return $target->toPublicArray();
    }
}
