<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use HasUlids;

    // --- Scopes Locales ---

    public function scopeSearch(Builder $query, ?string $search = null): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('guard_name', 'LIKE', "%{$search}%");
            });
        });
    }

    public function scopeByGuard(Builder $query, ?string $guard = null): Builder
    {
        return $query->when($guard, fn ($q) => $q->where('guard_name', $guard));
    }
}
