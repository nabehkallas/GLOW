<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalonTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'type'     => $this->type,
            'category' => $this->category,
            'amount'   => $this->amount,
            'comment'  => $this->comment,
            'date'     => $this->date->toDateString(),
        ];
    }
}
