<?php

namespace App\Http\Resources\Fornitore\Categorie;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class CategoriaFornitoreResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $slug = Str::slug((string) $this->name, '_');
        $translationKey = 'fornitori.categories.' . $slug;
        $localizedName = __($translationKey);

        if ($localizedName === $translationKey) {
            $localizedName = $this->name;
        }

        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'localized_name' => $localizedName,
            'description'  => $this->description
        ];
    }
}
