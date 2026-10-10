<?php

// Namespace for our service classes.
namespace App\Services;

use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

// The one place that creates or changes a product by hand. It is used by the staff page, by approving a contribution
// and by `php artisan product:add`, so all of them follow the same rules about who may set which origin status.
class ProductEditor
{
    // Statuses a person decides (not an open-data guess): they always need a written reason, and only admins may set them.
    public const HUMAN_DECIDED = ['verified_my', 'foreign', 'foreign_made_my'];

    // Statuses a moderator may set. (They are the "unverified" ones: at most "likely Malaysian".)
    public const MODERATOR_ALLOWED = ['unknown', 'my_brand_unknown_origin', 'my_brand_overseas', 'likely_my'];

    // Every status the database accepts.
    public const ALL = ['verified_my', 'likely_my', 'my_brand_unknown_origin', 'my_brand_overseas', 'foreign_made_my', 'foreign', 'unknown'];

    // Which statuses a role may set.
    public static function allowedStatuses(Role $role): array
    {
        return $role->rank() >= Role::Admin->rank() ? self::ALL : self::MODERATOR_ALLOWED;
    }

    // Create a product (when $product is null) or change one. Values left out (null) stay as they are on an update.
    // $in keys: name, brand, category (slug), manufacturer, state, country, halal (yes|no|unknown), quantity, image_url,
    //           origin_status, origin_note.
    // $actor is the signed-in staff member (null when run from the command line).
    public function save(?Product $product, string $barcode, array $in, Role $actorRole, ?User $actor = null, string $source = 'manual'): Product
    {
        $creating = $product === null;
        $before = $creating ? [] : $this->snapshot($product);

        // ---- who may set which status ----
        $newStatus = $in['origin_status'] ?? null;
        $allowed = self::allowedStatuses($actorRole);
        if ($newStatus !== null && ! in_array($newStatus, self::ALL, true)) {
            throw ValidationException::withMessages(['origin_status' => ['Unknown status.']]);
        }
        $changesStatus = $newStatus !== null && ($creating || $newStatus !== $product->origin_status);
        if ($changesStatus) {
            // Rule 1: you may only set a status your role is allowed to set.
            if (! in_array($newStatus, $allowed, true)) {
                throw ValidationException::withMessages(['origin_status' => ['Your role cannot set this status. Only an admin can.']]);
            }
            // Rule 2: you may not overwrite a status that only an admin could have set.
            if (! $creating && ! in_array($product->origin_status, $allowed, true)) {
                throw ValidationException::withMessages(['origin_status' => ['Only an admin can change this product\'s current status.']]);
            }
            // Rule 3: a status decided by a person needs a written reason.
            $note = trim((string) ($in['origin_note'] ?? ($creating ? '' : $product->origin_note)));
            if (in_array($newStatus, self::HUMAN_DECIDED, true) && $note === '') {
                throw ValidationException::withMessages(['origin_note' => ['This status needs a written reason (evidence).']]);
            }
        }

        // ---- shared records ----
        $brand = ! empty($in['brand'])
            ? Brand::firstOrCreate(['slug' => Str::slug($in['brand']) ?: Str::random(8)], ['name' => trim($in['brand'])])
            : null;
        $category = ! empty($in['category']) ? Category::where('slug', $in['category'])->firstOrFail() : null;
        $maker = ! empty($in['manufacturer'])
            ? Manufacturer::firstOrCreate(['name' => trim($in['manufacturer'])], ['state' => $in['state'] ?? null, 'country' => strtoupper($in['country'] ?? 'MY')])
            : null;
        // A known state fills in a manufacturer that was saved earlier without one (never overwrites an existing state).
        $state = $in['state'] ?? null;
        $makerForState = $maker ?? $product?->manufacturer;
        if ($state && $makerForState && $makerForState->state === null) {
            $makerForState->update(['state' => $state]);
        }

        // ---- the values to write (only what was given) ----
        $values = array_filter([
            'name' => isset($in['name']) ? mb_substr(trim($in['name']), 0, 255) : null,
            'brand_id' => $brand?->id,
            'category_id' => $category?->id,
            'manufacturer_id' => $maker?->id,
            'quantity' => isset($in['quantity']) && trim($in['quantity']) !== '' ? mb_substr(trim($in['quantity']), 0, 64) : null,
            'image_url' => ! empty($in['image_url']) ? $in['image_url'] : null,
            'origin_note' => isset($in['origin_note']) && trim($in['origin_note']) !== '' ? mb_substr(trim($in['origin_note']), 0, 500) : null,
        ], fn ($v) => $v !== null);

        // halal can legitimately be null ("unknown"), so it is handled separately.
        if (array_key_exists('halal', $in) && $in['halal'] !== null) {
            $values['halal'] = match ($in['halal']) {
                'yes' => true,
                'no' => false,
                default => null,
            };
        }
        if ($changesStatus) {
            $values['origin_status'] = $newStatus;
        }

        if ($creating) {
            // New products default to the cautious classifier result (e.g. a 955 barcode = "Malaysian brand, origin unconfirmed").
            $values += ['barcode' => $barcode, 'source' => $source, 'origin_status' => $values['origin_status'] ?? OriginClassifier::classify($barcode, null, [], $brand?->owner_country === 'MY')];
            $product = Product::create($values);
        } else {
            $product->update($values);
        }

        // ---- audit trail: what changed, by whom ----
        $after = $this->snapshot($product->fresh());
        // Strict comparison, so null -> false (halal "unknown" -> "no") counts as a change too.
        $changed = array_keys(array_filter($after, fn ($value, $key) => ($before[$key] ?? null) !== $value, ARRAY_FILTER_USE_BOTH));
        if ($creating || $changed !== []) {
            AuditLog::record(
                $actor,
                $creating ? 'product.created' : 'product.updated',
                $product,
                $creating ? null : array_intersect_key($before, array_flip($changed)),
                $creating ? $after : array_intersect_key($after, array_flip($changed)),
                $actor === null ? 'Set from the command line' : null,
            );
        }

        return $product->fresh();
    }

    // The fields worth recording in the audit log.
    private function snapshot(Product $p): array
    {
        return $p->only(['name', 'brand_id', 'category_id', 'manufacturer_id', 'origin_status', 'origin_note', 'halal', 'quantity', 'image_url']);
    }
}
