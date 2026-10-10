<?php

// Namespace for middleware (code that runs before a controller).
namespace App\Http\Middleware;

// The role ladder.
use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Lets a route through only for people at or above a given role: `->middleware('role:moderator')`.
// Always put it after `auth:sanctum`, which is what identifies the person.
class EnsureMinRole
{
    // Runs for each request to a protected route.
    public function handle(Request $request, Closure $next, string $minimum): Response
    {
        // The signed-in user (null if not logged in).
        $user = $request->user();

        // Not logged in: 401 tells the website to show the login page.
        if ($user === null) {
            abort(401, 'Please log in.');
        }

        // Logged in but below the required rank: 403 forbidden.
        if ($user->role->rank() < Role::from($minimum)->rank()) {
            abort(403, 'You do not have permission to do this.');
        }

        // Allowed: carry on to the controller.
        return $next($request);
    }
}
