<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

// Admins looking people up, so they can change roles with PUT /api/admin/users/role.
class UserController extends Controller
{
    // GET /api/staff/users?q=...: up to 20 accounts whose name or email contains the text.
    public function index(Request $request)
    {
        $q = trim($request->validate(['q' => ['nullable', 'string', 'max:100']])['q'] ?? '');
        // Escape LIKE wildcards typed by the admin so "%" and "_" are plain characters.
        $like = '%'.addcslashes($q, '%_\\').'%';

        return User::query()
            ->when($q !== '', fn ($query) => $query->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like)))
            // Highest roles first, then newest.
            ->orderByRaw("FIELD(role, 'super_admin', 'admin', 'moderator', 'user')")
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (User $u) => $u->toPublicArray() + ['created_at' => $u->created_at?->toIso8601String()]);
    }
}
