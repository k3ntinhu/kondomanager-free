<?php

namespace App\Http\Resources\Documenti\Categorie;

use App\Http\Resources\Documenti\DocumentoResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class CategoriaDocumentoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $slug = Str::slug((string) $this->name, '_');
        $translationKey = 'documenti.categories.' . $slug;
        $localizedName = __($translationKey);

        if ($localizedName === $translationKey) {
            $localizedName = $this->name;
        }

        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'localized_name'  => $localizedName,
            'description'     => $this->description,
            'documenti_count' => $this->documenti_count ?? 0,
            'documenti'       => DocumentoResource::collection($this->whenLoaded('documenti')),
        ];
    }
}
