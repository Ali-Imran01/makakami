<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;

// Admins reading the audit log (who changed what, when and why). Read-only: nobody can edit or delete entries here.
class AuditController extends Controller
{
    // GET /api/staff/audit: the 100 newest entries.
    public function index()
    {
        return AuditLog::query()
            ->leftJoin('users', 'users.id', '=', 'audit_logs.user_id')
            ->orderByDesc('audit_logs.id')
            ->limit(100)
            ->get(['audit_logs.id', 'audit_logs.action', 'audit_logs.subject_type', 'audit_logs.subject_id', 'audit_logs.before', 'audit_logs.after', 'audit_logs.note', 'audit_logs.created_at', 'users.name as actor'])
            ->map(fn ($l) => [
                'id' => $l->id,
                'action' => $l->action,
                // NULL actor means it was done from the command line.
                'actor' => $l->actor,
                'subject' => $l->subject_type ? "{$l->subject_type} #{$l->subject_id}" : null,
                'before' => $l->before,
                'after' => $l->after,
                'note' => $l->note,
                'created_at' => $l->created_at?->toIso8601String(),
            ]);
    }
}
