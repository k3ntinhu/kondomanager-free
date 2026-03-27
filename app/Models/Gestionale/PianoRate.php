<?php

namespace App\Models\Gestionale;

use App\Enums\StatoPianoRate;
use App\Models\Condominio;
use App\Models\Gestione;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Database\Factories\Gestionale\PianoRateFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PianoRate extends Model
{
    use HasFactory;

    protected $table = 'piani_rate';

    protected $fillable = [
        'gestione_id',
        'condominio_id',
        'nome',
        'descrizione',
        'metodo_distribuzione',
        'numero_rate',
        'giorno_scadenza',
        'data_inizio',
        'attivo',
        'note',
        'stato',
        'data_delibera_assemblea',
        'numero_verbale',
        'nota_approvazione',
        'approvato_da_user_id',
        'approvato_il',
    ];

    protected $casts = [
        'stato'                   => StatoPianoRate::class,
        'data_inizio'             => 'date',
        'data_delibera_assemblea' => 'date',
        'approvato_il'            => 'datetime',
        'attivo'                  => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELAZIONI
    |--------------------------------------------------------------------------
    */

    public function gestione(): BelongsTo
    {
        return $this->belongsTo(Gestione::class);
    }

    public function condominio(): BelongsTo
    {
        return $this->belongsTo(Condominio::class);
    }

    public function ricorrenza(): HasOne
    {
        return $this->hasOne(RicorrenzaRata::class);
    }

    public function rate(): HasMany
    {
        return $this->hasMany(Rata::class);
    }

    /**
     * Relazione con lo storico dei movimenti di budget.
     * Necessaria per il modulo "Sposta Spesa" e Audit Log.
     */
    public function budgetMovements(): HasMany
    {
        return $this->hasMany(BudgetMovement::class);
    }

    /**
     * I capitoli di spesa inclusi in questo piano rate.
     * CRUCIALE: withPivot carica i campi 'importo' e 'note' dalla tabella di collegamento.
     * Senza questo, il sistema ignora gli importi parziali e usa il totale del conto.
     */
    public function capitoli(): BelongsToMany
    {
        return $this->belongsToMany(Conto::class, 'piano_rate_capitoli', 'piano_rate_id', 'conto_id')
                    ->withPivot(['importo', 'note']) // <--- IL FIX FONDAMENTALE
                    ->withTimestamps();
    }

    public function approvatoDa(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approvato_da_user_id');
    }

    /**
     * Collega esplicitamente la Factory corretta.
     */
    protected static function newFactory()
    {
        return PianoRateFactory::new();
    }
}
