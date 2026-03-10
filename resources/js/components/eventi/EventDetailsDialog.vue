<script setup lang="ts">

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEventStyling } from '@/composables/useEventStyling';
import { useCurrencyFormatter } from '@/composables/useCurrencyFormatter'; 
import { format, differenceInDays } from 'date-fns';
import { it, enUS, pt } from 'date-fns/locale';
import { Building2, Wallet, Banknote, CalendarDays, AlertCircle, ArrowRight, CheckCircle, AlertTriangle, Clock, XCircle, RotateCcw, History, TrendingDown } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { router } from '@inertiajs/vue3'; 
import { trans } from 'laravel-vue-i18n';

const props = defineProps<{ isOpen: boolean; evento: any; }>();
const emit = defineEmits(['close']);
const { getEventStyle } = useEventStyling();
// Configurazione formatter (fromCents: true è default)
const { euro } = useCurrencyFormatter(); 
const isProcessing = ref(false); 

const isAdmin = computed(() => props.evento?.meta?.type === 'emissione_rata');
const isCondomino = computed(() => props.evento?.meta?.type === 'scadenza_rata_condomino');

// Determina se mostrare la colonna sinistra con dettagli finanziari
const hasFinancialDetails = computed(() => {
    // Mostra se è un evento di rata (admin o condomino)
    if (isAdmin.value || isCondomino.value) return true;
    
    // Mostra se ci sono metadati finanziari (numero_rata, gestione, totale_rata, ecc.)
    const meta = props.evento?.meta;
    if (meta?.numero_rata || meta?.totale_rata || meta?.importo_originale || meta?.gestione) {
        return true;
    }
    
    return false;
});

// --- FIX TYPESCRIPT: Tipizzazione esplicita <number> ---
const importoOriginale = computed<number>(() => Number(props.evento?.meta?.totale_rata || props.evento?.meta?.importo_originale || 0));
const importoRestante = computed<number>(() => props.evento?.meta?.importo_restante !== undefined ? Number(props.evento?.meta?.importo_restante) : importoOriginale.value);
const importoPagato = computed<number>(() => Number(props.evento?.meta?.importo_pagato || 0));
const arretratiPregressi = computed<number>(() => Number(props.evento?.meta?.arretrati_pregressi || 0));
const saldoIncorporato = computed<number>(() => Number(props.evento?.meta?.saldo_incorporato || 0));
// --- Riferimento Arretrati "Smart" ---
const rifArretrati = computed<string>(() => {
    const raw = props.evento?.meta?.rif_arretrati || '';
    if (!raw) return '';

    // 1. Convertiamo in array e Rimuoviamo duplicati
    const parts = raw.split(', ').filter(Boolean);
    const uniqueParts = [...new Set(parts)]; // Rimuove #1 duplicati

    // 2. Se sono poche (max 4), le mostriamo tutte
    if (uniqueParts.length <= 4) {
        return uniqueParts.join(', ');
    }

    // 3. Se sono tante, mostriamo le prime 3 e il conteggio delle altre
    const firstFew = uniqueParts.slice(0, 2).join(', ');
    const remaining = uniqueParts.length - 2;
    
    return trans('dashboard.event_details.and_others', { items: firstFew, count: remaining });
});

// Stati
const isPaid = computed(() => props.evento?.meta?.status === 'paid'); 
const isReported = computed(() => props.evento?.meta?.status === 'reported');
const isRejected = computed(() => props.evento?.meta?.status === 'rejected');

// Logiche Credito
const isGeneratingCredit = computed(() => isCondomino.value && importoRestante.value < -0.01);
const isFullyCoveredByCredit = computed(() => props.evento?.meta?.is_covered_by_credit === true);

// Ora TS non si lamenta più perché sa che sono number
const isPartiallyCoveredByCredit = computed(() => 
    isCondomino.value && 
    !isGeneratingCredit.value && 
    !isFullyCoveredByCredit.value && 
    !isPaid.value && 
    importoRestante.value > 0.01 && 
    importoRestante.value < importoOriginale.value
);

const daysDiff = computed(() => { if (!props.evento?.start_time) return 0; return differenceInDays(new Date(props.evento.start_time), new Date()); });
const isExpired = computed(() => daysDiff.value < 0 && !isGeneratingCredit.value && !isFullyCoveredByCredit.value && !isPaid.value && !isReported.value && importoRestante.value > 0.01);
const isEmitted = computed(() => props.evento?.meta?.is_emitted === true);

// --- LOGICA UX: MESSAGGI DINAMICI PER CREDITO ---
// Capire se questa rata è coperta specificamente dal "Tesoretto" dell'anno scorso
const isSubsequentRataCoveredByInitialCredit = computed(() => 
    isFullyCoveredByCredit.value &&          // La rata è coperta (verde)
    saldoIncorporato.value < -0.01 &&        // C'era un credito iniziale forte
    (props.evento?.meta?.numero_rata || 0) > 1 // Siamo dalla rata 2 in poi
);

const getDateLocale = () => {
    const lang = (document.documentElement.lang || 'it').toLowerCase();
    if (lang.startsWith('pt')) return pt;
    if (lang.startsWith('en')) return enUS;
    return it;
};

const formatDate = (dateStr: string) => { if(!dateStr) return ''; return format(new Date(dateStr), "d MMMM yyyy", { locale: getDateLocale() }); };

const reportPayment = () => {
    isProcessing.value = true;
    router.post(route('user.eventi.report_payment', props.evento.id), {}, {
        preserveScroll: true,
        onSuccess: () => { isProcessing.value = false; emit('close'); },
        onError: () => isProcessing.value = false
    });
};

// --- INTERFACCIA PER TYPESCRIPT ---
interface ScontrinoItem {
    descrizione: string;
    credito_disponibile: number;
    quota_rata: number;
    nuovo_saldo: number;
    is_credito: boolean;
}

// --- LOGICA SCONTRINO ---
const scontrinoData = computed<ScontrinoItem[]>(() => {
    const quote = props.evento.meta?.dettaglio_quote || [];
    
    // FIX: Non calcoliamo più saldoInizialeGlobale sommando i 'saldo_usato' grezzi.
    // Questo causava il raddoppio se più quote avevano lo stesso saldo di origine.
    // Partiamo da 0 e lasciamo che sia il loop (qui sotto) a leggere il 
    // 'credito_pregresso_usato' che il Backend ha iniettato nella prima quota.
    
    let currentAvailableCredit = 0; 

    return quote.map((q: any) => {
        const quotaPura = Number(q.audit?.quota_pura !== undefined ? q.audit.quota_pura : q.importo);
        
        // Qui leggiamo il valore "Waterfall" calcolato dal Trait (es. -10000 per Rata 1, -16671 per Rata 2)
        if (q.audit?.credito_pregresso_usato) {
            // Nota: Se currentAvailableCredit è 0, lo sovrascriviamo o sommiamo.
            // Dato che questo valore rappresenta lo "stato al momento 0 della rata",
            // lo sommiamo (che equivale a settarlo se è la prima riga).
            currentAvailableCredit += Number(q.audit.credito_pregresso_usato);
        }

        const nuovoSaldo = currentAvailableCredit + quotaPura;
        
        const item: ScontrinoItem = {
            descrizione: q.descrizione,
            credito_disponibile: currentAvailableCredit,
            quota_rata: quotaPura,
            nuovo_saldo: nuovoSaldo,
            is_credito: nuovoSaldo < -0.01
        };

        currentAvailableCredit = nuovoSaldo;
        
        return item;
    });
});

</script>

<template>
    <Dialog :open="isOpen" @update:open="emit('close')">
        <DialogContent class="sm:max-w-5xl p-0 overflow-hidden rounded-xl border-none shadow-2xl bg-white dark:bg-slate-950 block gap-0">
            <div class="flex flex-col md:flex-row h-full min-h-[450px]">
                
                <!-- Colonna sinistra: mostrata SOLO se ci sono dettagli finanziari -->
                <div v-if="hasFinancialDetails" class="md:w-[45%] bg-slate-50 dark:bg-slate-900/50 p-8 flex flex-col gap-6 border-r border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[80vh]">
                    
                    <div>
                        <div class="flex flex-row flex-wrap items-center gap-2 mb-6">
                            <Badge variant="outline" :class="[getEventStyle(evento).color, 'border-current bg-white dark:bg-slate-900 shadow-sm px-2 py-0.5 whitespace-nowrap']">
                                <component :is="getEventStyle(evento).icon" class="w-3.5 h-3.5 mr-1.5" /> {{ getEventStyle(evento).label }}
                            </Badge>
                        </div>
                        
                        <div class="mb-0">
                            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">{{ trans('dashboard.event_details.reference_date') }}</span>
                            <div class="flex items-center gap-2" :class="isExpired ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'">
                                <CalendarDays class="w-5 h-5" :class="isExpired ? 'text-red-400' : 'text-slate-400'" />
                                <span class="text-lg font-medium capitalize">{{ formatDate(evento.start_time) }}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                         <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1"> 
                             {{ isAdmin ? trans('dashboard.event_details.total_issue') : (isGeneratingCredit ? trans('dashboard.event_details.credit_amount') : trans('dashboard.event_details.total_to_pay')) }} 
                         </span>
                        
                        <span class="text-3xl font-bold tracking-tight block tabular-nums" 
                              :class="isGeneratingCredit ? 'text-blue-600 dark:text-blue-400' : (isFullyCoveredByCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white')"> 
                            {{ euro(isFullyCoveredByCredit ? 0 : importoRestante, { forcePlus: false }) }} 
                        </span>

                        <div v-if="scontrinoData.length > 0" class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
                            
                            <div class="flex flex-col gap-2 mb-2">
                                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ trans('dashboard.event_details.coverage_details') }}</p>
                            </div>

                            <div v-for="(item, idx) in scontrinoData" :key="idx" class="relative group">
                                <div v-if="idx < scontrinoData.length - 1" class="absolute left-[11px] top-6 bottom-[-24px] w-px bg-slate-200 dark:bg-slate-700 z-0"></div>

                                <div class="flex items-start gap-3 relative z-10">
                                    <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-white dark:bg-slate-800 shadow-sm border-slate-200 text-slate-500">
                                        <Building2 class="h-3 w-3" />
                                    </div>
                                    
                                    <div class="flex-1">
                                        <div class="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2">{{ item.descrizione }}</div>
                                        
                                        <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg p-2.5 space-y-1.5 text-xs shadow-sm">
                                            
                                            <div class="flex justify-between items-center text-slate-500 dark:text-slate-400">
                                                <span class="flex items-center gap-1.5">
                                                    <div class="w-1.5 h-1.5 rounded-full" :class="item.credito_disponibile < 0 ? 'bg-emerald-500' : 'bg-red-400'"></div>
                                                    {{ item.credito_disponibile < 0 ? trans('dashboard.event_details.credit_available') : trans('dashboard.event_details.progressive_balance') }}
                                                </span>
                                                <span class="font-mono">{{ euro(item.credito_disponibile) }}</span>
                                            </div>

                                            <div class="flex justify-between items-center text-slate-900 dark:text-white font-medium">
                                                <span class="pl-3">{{ trans('dashboard.event_details.installment_quota') }}</span>
                                                <span class="font-mono text-slate-700 dark:text-slate-300">
                                                    {{ euro(item.quota_rata, { forcePlus: true }) }}
                                                </span>
                                            </div>

                                            <div class="border-t border-slate-100 dark:border-slate-700 pt-1.5 mt-1 flex justify-between items-center">
                                                <span class="text-xs font-bold uppercase text-slate-400">{{ trans('dashboard.event_details.new_balance') }}</span>
                                                <span class="font-mono font-bold" :class="item.nuovo_saldo < -0.01 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'">
                                                    {{ euro(item.nuovo_saldo) }}
                                                </span>
                                            </div>
                                            
                                            <div v-if="item.is_credito" class="text-right text-xs text-emerald-600 dark:text-emerald-500 italic">
                                                {{ trans('dashboard.event_details.still_in_credit') }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 -mx-2 px-3 py-3 rounded">
                                
                                <div v-if="importoPagato > 0.01 && !isGeneratingCredit && !isFullyCoveredByCredit" class="flex flex-col gap-1 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700 text-xs">
                                    <div class="flex justify-between text-slate-500 dark:text-slate-400">
                                        <span>{{ trans('dashboard.event_details.total_installment') }}</span>
                                        <span>{{ euro(importoOriginale) }}</span>
                                    </div>
                                    <div class="flex justify-between text-emerald-600 dark:text-emerald-500 font-medium">
                                        <span class="flex items-center gap-1"><CheckCircle class="w-3 h-3" /> {{ trans('dashboard.event_details.already_paid') }}</span>
                                        <span>- {{ euro(importoPagato) }}</span>
                                    </div>
                                </div>

                                <div class="flex justify-between items-center">
                                    <span class="font-bold text-sm text-slate-900 dark:text-white">{{ trans('dashboard.event_details.net_to_pay') }}</span>
                                    <span class="text-xl font-bold font-mono tracking-tight" 
                                          :class="isFullyCoveredByCredit ? 'text-emerald-600' : (isGeneratingCredit ? 'text-blue-600' : 'text-slate-900 dark:text-white')"> 
                                        {{ euro(isFullyCoveredByCredit ? 0 : importoRestante, { forcePlus: false }) }} 
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div :class="hasFinancialDetails ? 'md:w-[55%]' : 'w-full'" class="p-6 flex flex-col relative overflow-y-auto max-h-[80vh]">
                    
                    <!-- Badge e data per eventi generici (quando non c'è la colonna sinistra) -->
                    <div v-if="!hasFinancialDetails" class="mb-4">
                        <div class="flex flex-wrap items-center gap-3 mb-4">
                            <Badge variant="outline" :class="[getEventStyle(evento).color, 'border-current bg-white dark:bg-slate-900 shadow-sm px-2.5 py-1 whitespace-nowrap']">
                                <component :is="getEventStyle(evento).icon" class="w-3.5 h-3.5 mr-1.5" /> {{ getEventStyle(evento).label }}
                            </Badge>
                            
                            <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <CalendarDays class="w-4 h-4" />
                                <span class="text-sm font-medium capitalize">{{ formatDate(evento.start_time) }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <h2 class="text-xl font-bold pr-10 leading-tight flex items-start gap-2" :class="[isExpired ? 'text-red-600 dark:text-red-500' : 'text-slate-900 dark:text-white', hasFinancialDetails ? 'mb-6' : 'mb-3']"> <AlertTriangle v-if="isExpired" class="w-6 h-6 shrink-0" /> {{ evento.title }} </h2>
                    
                    <div v-if="isRejected" class="mb-3 p-4 rounded-lg bg-red-50 border border-red-100"><div class="flex items-start gap-3"><XCircle class="w-5 h-5 text-red-600 shrink-0 mt-0.5" /><div><h4 class="font-bold text-red-700 text-sm">{{ trans('dashboard.event_details.payment_rejected_title') }}</h4><div class="bg-white p-2.5 rounded text-xs text-red-800 font-medium border border-red-200/50 italic mt-2"> "{{ evento.meta?.rejection_reason }}" </div><p class="text-xs text-red-500 mt-2">{{ trans('dashboard.event_details.payment_rejected_retry') }}</p></div></div></div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                        <div v-if="evento.meta?.condominio_nome" class="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 rounded-lg min-w-0">
                            <span class="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <Building2 class="w-3.5 h-3.5" /> {{ trans('dashboard.event_details.building') }}
                            </span>
                            <p class="font-medium text-sm text-slate-900 dark:text-white truncate" :title="evento.meta.condominio_nome">
                                {{ evento.meta.condominio_nome }}
                            </p>
                        </div>
                        <div v-if="evento.meta?.gestione" class="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 rounded-lg min-w-0">
                            <span class="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <Wallet class="w-3.5 h-3.5" /> {{ trans('dashboard.event_details.management') }}
                            </span>
                            <p class="font-medium text-sm text-slate-900 dark:text-white truncate" :title="evento.meta.gestione">
                                {{ evento.meta.gestione }}
                            </p>
                        </div>
                        <div v-if="evento.meta?.numero_rata" class="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 rounded-lg min-w-0">
                            <span class="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <Banknote class="w-3.5 h-3.5" /> {{ trans('dashboard.event_details.installment') }}
                            </span>
                            <p class="font-medium text-sm text-slate-900 dark:text-white truncate">
                                {{ trans('dashboard.event_details.installment_number', { number: evento.meta.numero_rata }) }}
                            </p>
                        </div>
                    </div>

                    <div v-if="isCondomino">

                        <div v-if="saldoIncorporato > 0.01" class="mb-3 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                            <div class="p-1.5 bg-amber-100 rounded-full text-amber-600 shrink-0 mt-0.5">
                                <History class="w-4 h-4" />
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-amber-800 mb-1">{{ trans('dashboard.event_details.previous_balance_included_title') }}</h4>
                                <p class="text-xs text-amber-700 leading-relaxed mb-2">
                                    {{ trans('dashboard.event_details.previous_balance_included_description', { amount: euro(saldoIncorporato) }) }}
                                </p>
                                <p class="text-xs text-amber-600/80">
                                    {{ trans('dashboard.event_details.previous_balance_included_hint') }}
                                </p>
                            </div>
                        </div>

                        <div v-else-if="saldoIncorporato < -0.01" class="mb-3 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
                            <div class="p-1.5 bg-blue-100 rounded-full text-blue-600 shrink-0 mt-0.5">
                                <TrendingDown class="w-4 h-4" />
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-blue-800 mb-1">{{ trans('dashboard.event_details.previous_credit_discount_title') }}</h4>
                                <p class="text-xs text-blue-700 leading-relaxed mb-2">
                                    {{ trans('dashboard.event_details.previous_credit_discount_description', { amount: euro(Math.abs(saldoIncorporato)) }) }}
                                </p>
                            </div>
                        </div>

                        <div v-else-if="arretratiPregressi > 0.01" class="mb-3 p-4 rounded-lg bg-orange-50 border border-orange-200 flex items-start gap-3">
                            <div class="p-1.5 bg-orange-100 rounded-full text-orange-600 shrink-0 mt-0.5">
                                <AlertTriangle class="w-4 h-4" />
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-orange-800 mb-1">{{ trans('dashboard.event_details.unpaid_previous_installments_title') }}</h4>
                                <p class="text-xs text-orange-700 leading-relaxed mb-2">
                                    {{ trans('dashboard.event_details.unpaid_previous_installments_description', { amount: euro(arretratiPregressi) }) }}
                                    <span v-if="rifArretrati"> {{ trans('dashboard.event_details.unpaid_previous_installments_reference', { refs: rifArretrati }) }}</span>
                                </p>
                                <p class="text-xs text-orange-600/80">
                                    {{ trans('dashboard.event_details.unpaid_previous_installments_hint') }}
                                </p>
                            </div>
                        </div>

                        <div v-if="isPartiallyCoveredByCredit" class="mb-6">
                            <div class="flex items-center justify-between p-4 rounded-lg bg-indigo-50 border border-indigo-200 mb-4">
                                <div class="flex flex-col">
                                    <span class="text-indigo-700 flex items-center gap-2 font-semibold text-sm"><RotateCcw class="w-4 h-4" /> {{ trans('dashboard.event_details.partially_covered') }}</span>
                                    <span class="text-xs text-indigo-600/80 mt-1">{{ trans('dashboard.event_details.credit_covered_amount', { amount: euro(importoOriginale - importoRestante) }) }}</span>
                                </div>
                            </div>
                            <div class="flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                                <span class="text-amber-700 flex items-center gap-2 font-semibold text-sm"><AlertCircle class="w-4 h-4" /> {{ trans('dashboard.event_details.remaining_to_pay') }}</span>
                                <span class="font-bold text-xl text-amber-700">{{ euro(importoRestante) }}</span>
                            </div>

                            <div v-if="isReported">
                                <Button class="w-full h-12 bg-amber-100 text-amber-700 border border-amber-200 cursor-not-allowed rounded-lg font-medium shadow-none text-xs" disabled>
                                    {{ trans('dashboard.event_details.balance_sent_waiting') }}
                                </Button>
                            </div>
                            <div v-else-if="!isEmitted">
                                <div class="p-3 rounded-lg bg-slate-100 border border-slate-200 mb-3 flex gap-3 items-start">
                                    <Clock class="w-4 h-4 mt-0.5 text-slate-400" />
                                    <div>
                                        <h4 class="font-bold text-slate-700 text-xs mb-0.5">{{ trans('dashboard.event_details.installment_pending_issue_title') }}</h4>
                                        <p class="text-xs text-slate-500 leading-snug">
                                            {{ trans('dashboard.event_details.installment_pending_issue_description') }}
                                        </p>
                                    </div>
                                </div>
                                <Button class="w-full h-10 bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed rounded-lg font-medium hover:bg-slate-100 shadow-none text-xs" disabled>
                                    {{ trans('dashboard.event_details.payment_not_active') }}
                                </Button>
                            </div>
                            <div v-else><Button class="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold rounded-lg" :disabled="isProcessing" @click="reportPayment">{{ isProcessing ? trans('dashboard.event_details.sending') : trans('dashboard.event_details.report_balance_payment') }}</Button></div>
                        </div>

                        <div v-else-if="isFullyCoveredByCredit" class="mb-3 flex items-center justify-between p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                            <div class="flex flex-col">
                                <span class="text-emerald-700 flex items-center gap-2 font-semibold text-sm">
                                    <CheckCircle class="w-4 h-4" /> {{ trans('dashboard.event_details.fully_covered_by_credit') }}
                                </span>
                                <span class="text-xs text-emerald-600/80 mt-1">
                                    {{ isSubsequentRataCoveredByInitialCredit 
                                        ? trans('dashboard.event_details.covered_by_previous_credit') 
                                        : trans('dashboard.event_details.covered_by_residual_credit') 
                                    }}
                                </span>
                            </div>
                            <div class="text-right">
                                <span class="text-xs uppercase text-emerald-600/70 font-bold block">{{ trans('dashboard.event_details.amount_to_pay') }}</span>
                                <span class="font-bold text-xl text-emerald-700">{{ euro(0) }}</span>
                            </div>
                        </div>
                        
                        <div v-else-if="isGeneratingCredit" class="mb-3 flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                            <div class="flex flex-col">
                                <span class="text-blue-700 flex items-center gap-2 font-semibold text-sm"><Wallet class="w-4 h-4" /> {{ trans('dashboard.event_details.residual_credit') }}</span>
                                <span class="text-xs text-blue-600/80 mt-1">{{ trans('dashboard.event_details.excess_from_previous_balance') }}</span>
                            </div>
                            <span class="font-bold text-xl text-blue-700">{{ euro(importoRestante) }}</span>
                        </div>

                        <div v-else-if="isReported" class="mb-6">
                            <div class="p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4 flex gap-3 items-start">
                                <div class="p-1.5 bg-amber-100 rounded-full text-amber-600 shrink-0 mt-0.5">
                                   <Clock class="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 class="text-sm font-bold text-amber-800 mb-1">{{ trans('dashboard.event_details.payment_under_review_title') }}</h4>
                                    <p class="text-xs text-amber-700 leading-relaxed">
                                        {{ trans('dashboard.event_details.payment_under_review_description') }}
                                    </p>
                                </div>
                            </div>
                            <Button class="w-full h-12 bg-amber-100 text-amber-700 border border-amber-200 cursor-not-allowed rounded-lg font-medium shadow-none text-xs" disabled>
                                {{ trans('dashboard.event_details.waiting_confirmation') }}
                            </Button>
                        </div>

                        <div v-else-if="!isPaid && !isReported && !isRejected" class="mb-6 space-y-4">
                            <div class="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <span class="text-amber-700 flex items-center gap-2 font-semibold text-sm"><AlertCircle class="w-4 h-4" /> {{ trans('dashboard.event_details.total_to_pay') }}</span>
                                <span class="font-bold text-xl text-amber-700">{{ euro(importoRestante) }}</span>
                            </div>
                            
                            <div v-if="!isEmitted">
                                <div class="p-3 rounded-lg bg-slate-100 border border-slate-200 mb-3 flex gap-3 items-start">
                                    <Clock class="w-4 h-4 mt-0.5 text-slate-500" />
                                    <div>
                                        <h4 class="font-bold text-slate-700 text-xs mb-0.5">{{ trans('dashboard.event_details.installment_pending_issue_title') }}</h4>
                                        <p class="text-xs text-slate-500 leading-snug">
                                            {{ trans('dashboard.event_details.installment_pending_issue_description') }}
                                        </p>
                                    </div>
                                </div>
                                <Button class="w-full h-10 bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed rounded-lg font-medium hover:bg-slate-100 shadow-none text-xs" disabled>
                                    {{ trans('dashboard.event_details.payment_not_active') }}
                                </Button>
                            </div>
                            <div v-else>
                                <Button class="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold rounded-lg" :disabled="isProcessing" @click="reportPayment">{{ isProcessing ? trans('dashboard.event_details.sending') : trans('dashboard.event_details.report_payment_done') }}</Button>
                            </div>
                        </div>

                        <div v-if="isRejected" class="mb-6">
                             <Button variant="destructive" class="w-full h-12 shadow-sm font-semibold rounded-lg" :disabled="isProcessing" @click="reportPayment">{{ isProcessing ? trans('dashboard.event_details.sending') : trans('dashboard.event_details.retry_report') }}</Button>
                        </div>
                    </div>

                    <div v-if="isAdmin && evento.meta?.action_url" class="mb-6">
                        <Button as-child class="w-full h-12 text-white font-semibold shadow-lg rounded-lg" :class="isExpired ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'"><a :href="evento.meta.action_url" class="flex items-center justify-center gap-2">{{ isExpired ? trans('dashboard.event_details.issue_now') : trans('dashboard.event_details.go_to_issue') }}<ArrowRight class="w-4 h-4" /></a></Button>
                    </div>

                    <div v-if="evento.description" :class="hasFinancialDetails ? 'mt-3 pt-3 border-t border-slate-100 dark:border-slate-800' : ''">
                        <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{{ evento.description }}</p>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>
