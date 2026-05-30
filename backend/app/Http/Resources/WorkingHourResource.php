<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkingHourResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'day_of_week' => $this->day_of_week,
            'day_name'    => $this->day_name,
            'open_time'   => $this->open_time,
            'close_time'  => $this->close_time,
            'is_closed'   => $this->is_closed,
        ];
    }
}
