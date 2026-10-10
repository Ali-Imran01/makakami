<?php

// Namespace for artisan commands.
namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Console\Command;

// Sets an account's role from the command line. This is the ONLY way to create a super_admin, and it is the bootstrap
// for the very first admin. It needs shell access to the server, which is what makes it safe.
// Example: php artisan user:role someone@example.com super_admin
class SetUserRole extends Command
{
    protected $signature = 'user:role {email : Email of an account that has already registered} {role : user, moderator, admin or super_admin} {--yes : Skip the confirmation}';

    protected $description = 'Set the role of an existing account (the only way to create a super_admin)';

    public function handle(): int
    {
        // The role must be one of the four on the ladder.
        $role = Role::tryFrom((string) $this->argument('role'));
        if ($role === null) {
            $this->error('Role must be one of: user, moderator, admin, super_admin.');

            return self::FAILURE;
        }

        // The account must exist already (people register themselves; nobody else sets their password).
        $user = User::where('email', strtolower(trim((string) $this->argument('email'))))->first();
        if ($user === null) {
            $this->error('No account with that email. They must register on the website first.');

            return self::FAILURE;
        }

        $this->line("{$user->name} <{$user->email}>: {$user->role->value} -> {$role->value}");
        if (! $this->option('yes') && ! $this->confirm('Apply this change?')) {
            $this->warn('Nothing changed.');

            return self::SUCCESS;
        }

        $before = ['role' => $user->role->value];
        $user->forceFill(['role' => $role])->save();
        // No signed-in actor here, so user_id stays empty; the note says it came from the command line.
        AuditLog::record(null, 'role.changed', $user, $before, ['role' => $role->value], 'Set from the command line');

        $this->info('Done.');

        return self::SUCCESS;
    }
}
