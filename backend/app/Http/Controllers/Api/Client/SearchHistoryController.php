<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Models\SearchLog;
use Illuminate\Http\Request;

class SearchHistoryController extends Controller
{
    private const CONTEXTS = 'product,salon';

    public function index(Request $request)
    {
        $data = $request->validate(['context' => 'required|string|in:' . self::CONTEXTS]);

        $terms = SearchLog::where('user_id', $request->user()->id)
            ->where('context', $data['context'])
            ->latest('id')
            ->limit(30)
            ->pluck('term')
            ->unique()
            ->take(8)
            ->values();

        return response()->json(['data' => $terms]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'context' => 'required|string|in:' . self::CONTEXTS,
            'term'    => 'required|string|max:255',
        ]);

        SearchLog::create([
            'user_id' => $request->user()->id,
            'context' => $data['context'],
            'term'    => trim($data['term']),
        ]);

        return response()->json(['message' => 'ok']);
    }
}
