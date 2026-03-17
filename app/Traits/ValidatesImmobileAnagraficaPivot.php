<?php

namespace App\Traits;


trait ValidatesImmobileAnagraficaPivot
{
    protected function withPivotValidator($validator, $tipologiaField = 'tipologia', $quotaField = 'quota')
    {
        $validator->after(function ($validator) use ($tipologiaField, $quotaField) {
         
            $immobile = $this->route('immobile');
            $currentAnagraficaId = $this->route('anagrafica')->id ?? null;

            $newAnagraficaId = (int) $this->input('anagrafica_id');
            $newQuota = (float) $this->input($quotaField);
            $newTipologia = $this->input($tipologiaField);

            // 1️⃣ Prevent duplicate anagrafica
            $alreadyExists = $immobile->anagrafiche()
                ->where('anagrafica_id', $newAnagraficaId)
                ->when($currentAnagraficaId, fn($q) => $q->where('anagrafica_id', '!=', $currentAnagraficaId))
                ->exists();

            if ($alreadyExists) {
                $validator->errors()->add(
                    'anagrafica_id',
                    __('gestionale.immobili_anagrafiche.validation.already_linked')
                );
            }

            // 2️⃣ Quota sum validation per tipologia
            $totalQuotaByTipologia = $immobile->anagrafiche()
                ->wherePivot('tipologia', $newTipologia)
                ->when($currentAnagraficaId, fn($q) => $q->where('anagrafica_id', '!=', $currentAnagraficaId))
                ->sum('quota');

            if ($totalQuotaByTipologia + $newQuota > 100) {
                $typeKey = "gestionale.list_pages.immobili.anagrafiche.types.{$newTipologia}";
                $typeLabel = __($typeKey);
                if ($typeLabel === $typeKey) {
                    $typeLabel = ucfirst((string) $newTipologia);
                }

                $validator->errors()->add(
                    $quotaField,
                    __('gestionale.immobili_anagrafiche.validation.quota_sum_exceeded', [
                        'type' => $typeLabel,
                    ])
                );
            }
        });
    }
}
