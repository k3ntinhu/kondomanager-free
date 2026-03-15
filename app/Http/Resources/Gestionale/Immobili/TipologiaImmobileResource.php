<?php

namespace App\Http\Resources\Gestionale\Immobili;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class TipologiaImmobileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $slug = Str::slug((string) $this->nome, '_');
        $translationKey = 'gestionale.immobili_form.property_types.' . $slug;
        $localizedName = __($translationKey);

        if ($localizedName === $translationKey) {
            $localizedName = $this->nome;
        }

        return [
            'id'          => $this->id,
            'nome'        => $this->nome,
            'localized_name' => $localizedName,
            'categoria'   => $this->categoria,
        ];
    }
}
