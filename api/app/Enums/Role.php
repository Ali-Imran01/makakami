<?php

// Namespace for enums (fixed lists of allowed values).
namespace App\Enums;

// The role ladder: user < moderator < admin < super_admin. A higher rank can do everything a lower rank can.
// Stored in users.role as the text value.
enum Role: string
{
    // A self-registered contributor.
    case User = 'user';
    // Reviews submissions; promoted by an admin or the super_admin.
    case Moderator = 'moderator';
    // Created by the super_admin only.
    case Admin = 'admin';
    // Created from the command line only; never assignable through the website.
    case SuperAdmin = 'super_admin';

    // Position on the ladder: bigger = more powerful.
    public function rank(): int
    {
        return match ($this) {
            self::User => 1,
            self::Moderator => 2,
            self::Admin => 3,
            self::SuperAdmin => 4,
        };
    }
}
