<?php

// Namespace: where this controller lives.
namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// Staff reading the "this looks wrong" reports and closing them. Correcting the product itself is done on the Product tab.
class ReportReviewController extends Controller
{
    // GET /api/staff/reports?status=open
    public function index(Request $request)
    {
        $status = $request->validate(['status' => ['nullable', Rule::in(['open', 'resolved', 'dismissed'])]])['status'] ?? 'open';

        $items = Report::with(['product:id,barcode,name,origin_status', 'user:id,name'])
            ->where('status', $status)
            ->orderBy('created_at', $status === 'open' ? 'asc' : 'desc')
            ->limit(50)
            ->get()
            ->map(fn (Report $r) => [
                'id' => $r->id,
                'type' => $r->type,
                'note' => $r->note,
                'status' => $r->status,
                'created_at' => $r->created_at?->toIso8601String(),
                // The reporter's name only (no email).
                'reporter' => $r->user?->name,
                'product' => $r->product ? ['barcode' => $r->product->barcode, 'name' => $r->product->name, 'origin_status' => $r->product->origin_status] : null,
                'resolution_note' => $r->resolution_note,
            ]);

        return ['data' => $items, 'counts' => Report::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status')];
    }

    // POST /api/staff/reports/{id}/resolve (the report was right and has been dealt with) or /dismiss (it was not).
    public function resolve(Request $request, Report $report)
    {
        return $this->close($request, $report, 'resolved', false);
    }

    public function dismiss(Request $request, Report $report)
    {
        // Turning a report down needs a reason the reporter's case can be understood by.
        return $this->close($request, $report, 'dismissed', true);
    }

    private function close(Request $request, Report $report, string $status, bool $noteRequired)
    {
        $data = $request->validate(['resolution_note' => [$noteRequired ? 'required' : 'nullable', 'string', 'min:5', 'max:500']]);
        abort_unless($report->status === 'open', 409, 'This report has already been handled.');

        $staff = $request->user();
        $report->forceFill([
            'status' => $status,
            'reviewed_by' => $staff->id,
            'reviewed_at' => now(),
            'resolution_note' => $data['resolution_note'] ?? null,
        ])->save();
        AuditLog::record($staff, "report.{$status}", $report, null, ['product_id' => $report->product_id], $data['resolution_note'] ?? null);

        return ['id' => $report->id, 'status' => $status];
    }
}
