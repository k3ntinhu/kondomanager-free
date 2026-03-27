<?php

namespace App\Http\Controllers\Eventi;

use App\Http\Controllers\Controller;
use App\Http\Resources\Evento\Categorie\CategoriaEventoResource;
use App\Models\CategoriaEvento;
use Illuminate\Http\JsonResponse;

class FetchCategorieController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(): JsonResponse
    {
        // Keep localized_name flow via Resource, but limit selected columns.
        $categorie = CategoriaEvento::select('id', 'name', 'description')
            ->orderBy('name')
            ->get();

        return response()->json(CategoriaEventoResource::collection($categorie));
    }
}
