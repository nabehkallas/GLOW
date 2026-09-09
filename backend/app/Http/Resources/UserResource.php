<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'email'          => $this->email,
            'role'           => $this->role,
            'phone'          => $this->phone,
            'is_super_admin' => $this->when($this->role === 'admin', (bool) $this->is_super_admin),
            'permissions'    => $this->when($this->role === 'admin', $this->permissions ?? []),
            'salon'          => $this->whenLoaded('salon', fn() => new SalonResource($this->salon)),
        ];
    }
}
