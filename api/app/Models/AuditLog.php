<?php

// Namespace: where this class lives.
namespace App\Models;

// Lists the columns that may be mass-assigned.
use Illuminate\Database\Eloquent\Attributes\Fillable;
// Base Eloquent model class.
use Illuminate\Database\Eloquent\Model;

// One line in the audit log: who did what to which record, with before/after values.
#[Fillable(['user_id', 'action', 'subject_type', 'subject_id', 'before', 'after', 'note'])]
class AuditLog extends Model
{
    // The table only has created_at (no updated_at): log lines are never edited.
    public const UPDATED_AT = null;

    // Store before/after as JSON.
    protected function casts(): array
    {
        return ['before' => 'array', 'after' => 'array'];
    }

    // Shortcut to write a line: AuditLog::record($actor, 'role.changed', $target, ['role' => 'user'], ['role' => 'admin']).
    public static function record(?User $actor, string $action, ?Model $subject = null, ?array $before = null, ?array $after = null, ?string $note = null): self
    {
        return self::create([
            'user_id' => $actor?->id,
            'action' => $action,
            // The kind of record, in lowercase (e.g. "user").
            'subject_type' => $subject ? strtolower(class_basename($subject)) : null,
            'subject_id' => $subject?->getKey(),
            'before' => $before,
            'after' => $after,
            'note' => $note,
        ]);
    }
}
