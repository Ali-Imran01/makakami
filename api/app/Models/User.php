<?php

// Namespace: where this class lives.
namespace App\Models;

// The role ladder.
use App\Enums\Role;
// Database factory used by tests/seeders.
use Database\Factories\UserFactory;
// Marks the account as one that must confirm its email address.
use Illuminate\Contracts\Auth\MustVerifyEmail;
// Attributes listing which columns may be mass-assigned and which are hidden from JSON.
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// Base class for accounts that can log in.
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
// Gives the user createToken() for API tokens.
use Laravel\Sanctum\HasApiTokens;

// `role`, `trust_score` and the terms fields are deliberately NOT fillable: they are set explicitly in code,
// so a request can never promote itself by sending extra fields.
#[Fillable(['name', 'email', 'password', 'google_id'])]
// Never include these when the user is turned into JSON.
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    // Convert raw database values into PHP types.
    protected function casts(): array
    {
        return [
            // Date the email was confirmed (null = not confirmed yet).
            'email_verified_at' => 'datetime',
            // Hash passwords automatically when they are assigned.
            'password' => 'hashed',
            // The role column becomes a Role enum.
            'role' => Role::class,
            // When the Terms were accepted.
            'terms_accepted_at' => 'datetime',
        ];
    }

    // Can this user act on `$target`? Only people who rank strictly above the target may (nobody manages an equal or a superior).
    public function outranks(User $target): bool
    {
        return $this->role->rank() > $target->role->rank();
    }

    // May this user hand out `$role`? Only roles strictly below their own, so an admin can promote to moderator but not to admin,
    // and super_admin can never be granted through the website at all.
    public function canGrant(Role $role): bool
    {
        return $this->role->rank() > $role->rank();
    }

    // What the website is allowed to know about an account (never the password hash, Google id or tokens).
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            // The role as plain text, e.g. "user".
            'role' => $this->role->value,
            // True once the email address was confirmed.
            'email_verified' => $this->hasVerifiedEmail(),
        ];
    }
}
