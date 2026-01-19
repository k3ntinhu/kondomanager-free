<?php

namespace App\Http\Controllers\Gestionale\Movimenti;

use App\Http\Controllers\Controller;
use App\Models\Condominio;
use App\Models\Gestionale\RataQuote; 
use App\Traits\HasEsercizio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SituazioneDebitoriaController extends Controller
{
    use HasEsercizio;

    public function __invoke(Request $request, Condominio $condominio): JsonResponse
    {
        // 1. Base Query
        $query = RataQuote::query()
            ->whereHas('rata', function($q) use ($condominio) {
                $q->whereHas('pianoRate', fn($p) => $p->where('condominio_id', $condominio->id));
            });

        // 2. Filtro Logico
        $query->where(function($q) {
            $q->whereRaw('importo > importo_pagato') 
              ->orWhere('importo', '<', 0);          
        });

        // 3. Filtri Contestuali
        if ($request->has('immobile_id') && $request->immobile_id) {
            $query->where('immobile_id', $request->immobile_id);
        } elseif ($request->has('anagrafica_id') && $request->anagrafica_id) {
            $query->where('anagrafica_id', $request->anagrafica_id);
        } else {
            return response()->json(['rate' => []]);
        }

        // 4. Esecuzione
        $rawQuotes = $query->with(['rata.pianoRate.gestione', 'immobile', 'rata', 'anagrafica'])
            ->orderBy('data_scadenza', 'asc') 
            ->get();

        // 5. AGGREGAZIONE
        $groupedRate = $rawQuotes->groupBy('rata_id')->map(function ($gruppoQuotes) use ($condominio) {
            
            $first = $gruppoQuotes->first(); // Questa è la "quota principale" del gruppo
            
            $importoTotale = $gruppoQuotes->sum('importo');
            $importoPagato = $gruppoQuotes->sum('importo_pagato');
            $residuoNetto = ($importoTotale - $importoPagato);

            if (abs($residuoNetto) < 1) return null; 

            $pianoRate = $first->rata->pianoRate;
            $metodoDist = $pianoRate->metodo_distribuzione ?? 'prima_rata'; 
            $numeroRata = $first->rata->numero_rata;
            $totaleRatePiano = $pianoRate->numero_rate;

            // Recupero Esercizio tramite data scadenza (o fallback)
            $esercizioId = null;
            if ($first->data_scadenza) {
                $esercizioId = DB::table('esercizi')
                    ->where('condominio_id', $condominio->id)
                    ->whereDate('data_inizio', '<=', $first->data_scadenza)
                    ->whereDate('data_fine', '>=', $first->data_scadenza)
                    ->value('id');
            }
            if (!$esercizioId) {
                $esercizioCorrente = $this->getEsercizioCorrente($condominio);
                $esercizioId = $esercizioCorrente ? $esercizioCorrente->id : null;
            }

            // MAPPATURA DETTAGLIO
            // Passiamo $first->id per identificare la prima quota
            $dettaglioTooltip = $gruppoQuotes->map(function($q) use ($condominio, $esercizioId, $metodoDist, $numeroRata, $totaleRatePiano, $first) {
                
                $residuoNettoQuota = ($q->importo - $q->importo_pagato); 
                $unita = $q->immobile ? "Int. {$q->immobile->interno}" : 'Generico';
                
                // Recupero Saldo Totale Anagrafica
                $saldoInizialeTrovato = 0;
                if ($q->anagrafica_id && $esercizioId) {
                    try {
                        $saldoInizialeTrovato = DB::table('saldi')
                            ->where('condominio_id', $condominio->id)
                            ->where('esercizio_id', $esercizioId)
                            ->where('anagrafica_id', $q->anagrafica_id)
                            ->sum('saldo_iniziale'); 
                    } catch (\Exception $e) {
                        Log::error("Errore query saldi: " . $e->getMessage());
                    }
                }

                // --- FIX DUPLICAZIONE: Applichiamo il saldo SOLO alla prima quota del gruppo ---
                $componenteSaldo = 0;
                $applicareSaldoQui = ($q->id === $first->id); // True solo per la prima riga (es. Int 1A)

                if ($applicareSaldoQui) {
                    if ($metodoDist === 'prima_rata') {
                        if ($numeroRata == 1) {
                            $componenteSaldo = $saldoInizialeTrovato;
                        }
                    } elseif ($metodoDist === 'tutte_rate' && $totaleRatePiano > 0) {
                        $componenteSaldo = intval($saldoInizialeTrovato / $totaleRatePiano);
                    }
                }

                // Reverse Engineering
                $componenteSpesa = $residuoNettoQuota - $componenteSaldo;

                return [
                    'unita' => $unita,
                    'residuo' => $residuoNettoQuota / 100, 
                    'is_credito' => $residuoNettoQuota < 0,
                    'componente_saldo' => $componenteSaldo / 100, 
                    'componente_spesa' => $componenteSpesa / 100
                ];
            })->values();

            $unitaCoinvolte = $gruppoQuotes->map(function($q) {
                return $q->immobile ? "Int. {$q->immobile->interno} ({$q->immobile->nome})" : null;
            })->filter()->unique()->join(', ');

            $isEmitted = $gruppoQuotes->contains(fn($q) => !is_null($q->scrittura_contabile_id));

            return [
                'id'              => $first->id,
                'rata_padre_id'   => $first->rata_id,
                'descrizione'     => ($first->rata->descrizione ?? 'Rata') . ' n.' . ($first->rata->numero_rata ?? '-'),
                'scadenza_human'  => $first->data_scadenza ? Carbon::parse($first->data_scadenza)->format('d/m/Y') : 'N/D',
                'importo_totale'  => $importoTotale / 100,
                'residuo'         => $residuoNetto / 100,
                'gestione'        => $first->rata->pianoRate->gestione->nome ?? 'Generica',
                'gestione_id'     => $first->rata->pianoRate->gestione_id,
                'unita'           => $unitaCoinvolte ?: 'Generico',
                'intestatario'    => $first->anagrafica ? $first->anagrafica->nome : 'N/D',
                'tipologia'       => 'Aggregato',
                'da_pagare'       => 0,     
                'selezionata'     => false, 
                'scaduta'         => $first->data_scadenza && Carbon::parse($first->data_scadenza)->isPast(),
                'is_credito'      => $residuoNetto < 0,
                'is_emitted'      => $isEmitted,
                'dettaglio_quote' => $dettaglioTooltip 
            ];
        })
        ->filter()
        ->values();

        return response()->json(['rate' => $groupedRate]);
    }
}