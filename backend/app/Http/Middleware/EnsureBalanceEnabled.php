<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBalanceEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()->salon?->balance_management_enabled) {
            return response()->json(['message' => 'Balance management is not enabled for this salon.'], 403);
        }

        return $next($request);
    }
}
