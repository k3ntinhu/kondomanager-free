<script setup lang="ts">
import { computed } from 'vue';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import vSelect from 'vue-select';
import { useCurrencyFormatter } from '@/composables/useCurrencyFormatter';
import { trans } from 'laravel-vue-i18n';
import { 
    AlertTriangle, History, Scale, Info, 
    AlertOctagon, CheckCircle, Trash2, FileText, Calculator, Activity, Zap
} from 'lucide-vue-next';

const { euro } = useCurrencyFormatter();

// --- PROPS ---
const props = defineProps<{
    form: any; 
    fornitoreId: number | null;
    debitiPatrimoniali: any[];
    contiSpesa: any[];
    fondiRiserva: any[];
    capienzaRataZero: number; 
    incassatoRataZero: number;
    totaleFatturaLordo: number; 
    bankForecast: { attuale_cents: number, post_cents: number, isRed: boolean } | null; 
}>();

// --- COMPUTED ---
const debitiFiltrati = computed(() => {
    if (!props.fornitoreId) return [];
    return props.debitiPatrimoniali.filter(d => d.fornitore_id === props.fornitoreId);
});

const debitoSelezionato = computed(() => {
    return debitiFiltrati.value.find(d => d.id === props.form.saldo_patrimoniale_id);
});

const fatturaCents = computed(() => Math.round(props.totaleFatturaLordo * 100));

// Calcolo Scarto Partita Doppia (Lo Scontrino)
const scopertoAttualeEuro = computed(() => {
    const disponibileCents = debitoSelezionato.value?.importo_disponibile || 0;
    
    let extraCents = 0;
    if (props.form.coperture && props.form.coperture.length) {
        props.form.coperture.forEach((c: any) => { 
            extraCents += Math.round(Number(c.importo || 0) * 100); 
        });
    }

    const scopertoCents = fatturaCents.value - disponibileCents - extraCents;
    return Math.max(0, scopertoCents / 100);
});

// Calcolo Salute Rata 0 (Il Termometro)
const bucoRataZeroCents = computed(() => {
    const debitoCents = debitoSelezionato.value?.importo_disponibile || 0;
    return Math.max(0, debitoCents - props.capienzaRataZero);
});

const semaforoContabile = computed(() => {
    if (!props.form.saldo_patrimoniale_id) return 'WAITING';
    if (scopertoAttualeEuro.value > 0) return 'ORANGE'; 
    if (bucoRataZeroCents.value > 0) return 'RED'; 
    return 'GREEN'; 
});

// --- ASSISTENTE FISCALE ---
const fiscalAssistant = computed(() => {
    if (!props.form.saldo_patrimoniale_id) {
        return {
            title: trans('gestionale.fatture.double_lock.assistant.waiting_title'),
            desc: trans('gestionale.fatture.double_lock.assistant.waiting_description'),
            icon: Info,
            colorClass: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700',
            iconColor: 'text-slate-400'
        };
    }

    if (semaforoContabile.value === 'ORANGE') {
        return {
            title: trans('gestionale.fatture.double_lock.assistant.unbalanced_title'),
            desc: trans('gestionale.fatture.double_lock.assistant.unbalanced_description', { amount: euro(scopertoAttualeEuro.value * 100) }),
            icon: Scale,
            colorClass: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/50',
            iconColor: 'text-amber-600 dark:text-amber-400'
        };
    }

    if (semaforoContabile.value === 'RED') {
        return {
            title: trans('gestionale.fatture.double_lock.assistant.structural_alert_title'),
            desc: trans('gestionale.fatture.double_lock.assistant.structural_alert_description', { amount: euro(bucoRataZeroCents.value) }),
            icon: AlertOctagon,
            colorClass: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800/50',
            iconColor: 'text-rose-600 dark:text-rose-400'
        };
    }

    if (props.bankForecast?.isRed) {
        return {
            title: trans('gestionale.fatture.double_lock.assistant.cash_warning_title'),
            desc: trans('gestionale.fatture.double_lock.assistant.cash_warning_description'),
            icon: AlertTriangle,
            colorClass: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/50',
            iconColor: 'text-yellow-600 dark:text-yellow-400'
        };
    }

    return {
        title: trans('gestionale.fatture.double_lock.assistant.ideal_title'),
        desc: trans('gestionale.fatture.double_lock.assistant.ideal_description'),
        icon: CheckCircle,
        colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400'
    };
});

// --- ACTIONS FORZATE PER VUE 3 + INERTIA ---
const addCopertura = (tipo: string) => {
    const newArr = [...(props.form.coperture || [])];
    newArr.push({ tipo_copertura: tipo, importo: scopertoAttualeEuro.value, fonte_id: null });
    props.form.coperture = newArr;
};

const removeCopertura = (idx: number) => {
    const newArr = [...props.form.coperture];
    newArr.splice(idx, 1);
    props.form.coperture = newArr;
};

const rischioPrescrizione = computed(() => {
    if (!props.form.data_competenza_originaria) return false;
    return (new Date().getFullYear() - new Date(props.form.data_competenza_originaria).getFullYear()) >= 5;
});
</script>

<template>
    <div class="space-y-5">
        
        <div class="bg-blue-50 dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm overflow-hidden">
            <div class="px-6 py-5 border-b border-blue-200 dark:border-blue-800/50 bg-blue-100/50 dark:bg-amber-900/20">
                <div class="flex items-center gap-2">
                    <History class="w-5 h-5 text-blue-600 dark:text-blue-500" />
                    <h3 class="text-sm font-bold text-blue-900 dark:text-blue-100">{{ trans('gestionale.fatture.double_lock.title') }}</h3>
                </div>
                <p class="text-[11px] text-blue-700 dark:text-blue-400 mt-1">
                    {{ trans('gestionale.fatture.double_lock.subtitle') }}
                </p>
            </div>

            <div class="p-6 space-y-6">
                
                <div class="space-y-1.5">
                    <Label class="text-[11px] font-bold uppercase text-slate-500">{{ trans('gestionale.fatture.double_lock.labels.debt_origin_date') }}</Label>
                    <Input type="date" v-model="form.data_competenza_originaria" class="h-9 w-48 text-sm" />
                    <p v-if="rischioPrescrizione" class="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertTriangle class="w-3.5 h-3.5" /> {{ trans('gestionale.fatture.double_lock.labels.prescription_risk') }}
                    </p>
                </div>

                <div class="space-y-1.5 relative z-50">
                    <Label class="text-[11px] font-bold uppercase text-slate-500">{{ trans('gestionale.fatture.double_lock.labels.select_debt') }}</Label>
                    <v-select 
                        v-model="props.form.saldo_patrimoniale_id"
                        :options="debitiFiltrati" 
                        label="descrizione"
                        :reduce="(d: any) => d.id" 
                        :placeholder="trans('gestionale.fatture.double_lock.placeholders.no_debt_selected')" 
                        class="style-chooser w-full"
                        append-to-body 
                    >
                        <template #option="{ descrizione, importo_disponibile, importo_iniziale }">
                            <div class="flex justify-between py-1">
                                <span class="font-medium text-sm">{{ descrizione }}</span>
                                <div class="flex flex-col text-right">
                                    <span class="text-xs font-bold text-amber-600">{{ trans('gestionale.fatture.double_lock.labels.available_short') }}: {{ euro(importo_disponibile) }}</span>
                                    <span v-if="importo_iniziale && importo_disponibile !== importo_iniziale" class="text-[9px] text-slate-400 line-through">{{ trans('gestionale.fatture.double_lock.labels.original_short') }}: {{ euro(importo_iniziale) }}</span>
                                </div>
                            </div>
                        </template>
                    </v-select>

                    <div v-if="debitoSelezionato && debitoSelezionato.fatture_collegate?.length" class="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <div class="flex items-center gap-2 mb-2">
                            <History class="w-3.5 h-3.5 text-slate-400" />
                            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">{{ trans('gestionale.fatture.double_lock.labels.already_used_by', { count: debitoSelezionato.fatture_collegate.length }) }}</span>
                        </div>
                        <div class="space-y-1.5">
                            <div v-for="fat in debitoSelezionato.fatture_collegate" :key="fat.id" class="flex justify-between items-center text-xs bg-white dark:bg-slate-800 px-2 py-1.5 rounded border border-slate-100 dark:border-slate-700">
                                <div class="flex gap-2 text-slate-600 dark:text-slate-400">
                                    <FileText class="w-3.5 h-3.5" />
                                    <span>{{ trans('gestionale.fatture.double_lock.labels.invoice_number') }} <strong>{{ fat.numero_documento }}</strong> ({{ fat.data_documento }})</span>
                                </div>
                                <span class="font-bold text-rose-500">- {{ euro(fat.importo_usato * 100) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="debitoSelezionato" class="space-y-6">
                    
                    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        
                        <div class="p-4 bg-slate-900 font-mono text-[11px] rounded-xl shadow-inner border border-slate-800 text-slate-300 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                                    <Calculator class="w-3.5 h-3.5" /> {{ trans('gestionale.fatture.double_lock.labels.reconciliation') }}
                                </div>
                                <div class="flex justify-between mb-1.5">
                                    <span>[+] {{ trans('gestionale.fatture.double_lock.labels.invoice') }}</span>
                                    <span class="text-white">{{ euro(fatturaCents) }}</span>
                                </div>
                                <div class="flex justify-between mb-1.5 text-emerald-400">
                                    <span>[-] {{ trans('gestionale.fatture.double_lock.labels.database_debt') }}</span>
                                    <span>{{ euro(debitoSelezionato.importo_disponibile) }}</span>
                                </div>
                                <div v-for="(cop, idx) in props.form.coperture" :key="idx" class="flex justify-between mb-1.5 text-blue-400">
                                    <span class="truncate pr-2">[-] Split</span>
                                    <span>{{ euro((cop.importo || 0) * 100) }}</span>
                                </div>
                            </div>
                            <div>
                                <div class="border-t border-slate-700 my-2 border-dashed"></div>
                                <div class="flex justify-between font-bold text-xs">
                                    <span class="text-white">= {{ trans('gestionale.fatture.double_lock.labels.delta') }}</span>
                                    <span :class="scopertoAttualeEuro > 0 ? 'text-rose-500' : 'text-emerald-500'">
                                        {{ euro(scopertoAttualeEuro * 100) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="p-4 rounded-xl border flex flex-col justify-between" :class="bucoRataZeroCents > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/50 border-emerald-200'">
                            <div>
                                <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-3 border-b pb-2"
                                    :class="bucoRataZeroCents > 0 ? 'text-rose-600 border-rose-200' : 'text-emerald-600 border-emerald-200'">
                                    <Activity class="w-3.5 h-3.5" /> {{ trans('gestionale.fatture.double_lock.labels.resident_coverage') }}
                                </div>
                                <div class="flex justify-between text-[11px] mb-1">
                                    <span class="text-slate-600">{{ trans('gestionale.fatture.double_lock.labels.rate_zero_total') }}:</span>
                                    <span class="font-bold">{{ euro(capienzaRataZero) }}</span>
                                </div>
                                <div class="flex justify-between text-[10px] mb-2 text-slate-500">
                                    <span>{{ trans('gestionale.fatture.double_lock.labels.of_which_collected') }}:</span>
                                    <span>{{ euro(incassatoRataZero) }}</span>
                                </div>
                                
                                <div class="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div class="h-full transition-all duration-500"
                                        :class="bucoRataZeroCents > 0 ? 'bg-rose-500' : 'bg-emerald-500'"
                                        :style="{ width: Math.min((debitoSelezionato.importo_disponibile / Math.max(capienzaRataZero, 1)) * 100, 100) + '%' }">
                                    </div>
                                </div>
                            </div>
                            <div v-if="bucoRataZeroCents > 0" class="text-[10px] font-bold text-rose-600 mt-3 leading-tight">
                                {{ trans('gestionale.fatture.double_lock.labels.missing_amount', { amount: euro(bucoRataZeroCents) }) }}
                            </div>
                            <div v-else class="text-[10px] font-bold text-emerald-600 mt-3">
                                {{ trans('gestionale.fatture.double_lock.labels.rate_zero_sufficient') }}
                            </div>
                        </div>

                        <div class="p-4 rounded-xl border bg-slate-800 border-slate-700 text-white flex flex-col justify-between">
                            <div>
                                <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-3 border-b border-slate-700 pb-2 text-blue-400">
                                    <Zap class="w-3.5 h-3.5" /> {{ trans('gestionale.fatture.double_lock.labels.cash_impact') }}
                                </div>
                                <div v-if="bankForecast">
                                    <div class="flex justify-between text-[11px] mb-1 text-slate-300">
                                        <span>{{ trans('gestionale.fatture.double_lock.labels.current_balance') }}:</span>
                                        <span>{{ euro(bankForecast.attuale_cents) }}</span>
                                    </div>
                                    <div class="flex justify-between text-[11px] mb-2 text-rose-400">
                                        <span>{{ trans('gestionale.fatture.double_lock.labels.outgoing') }}:</span>
                                        <span>- {{ euro(fatturaCents) }}</span>
                                    </div>
                                </div>
                                <div v-else class="text-[10px] text-slate-400 italic">
                                    {{ trans('gestionale.fatture.double_lock.labels.select_account') }}
                                </div>
                            </div>
                            <div v-if="bankForecast" class="border-t border-slate-700 pt-2 mt-2">
                                <div class="flex justify-between font-black text-sm" :class="bankForecast.isRed ? 'text-rose-500' : 'text-emerald-400'">
                                    <span>{{ trans('gestionale.fatture.double_lock.labels.post_payment_short') }}</span>
                                    <span>{{ euro(bankForecast.post_cents) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="scopertoAttualeEuro > 0 || props.form.coperture?.length > 0" class="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        
                        <div class="flex gap-2">
                            <Button type="button" size="sm" variant="outline" class="text-xs" @click="addCopertura('sopravvenienza')" :disabled="scopertoAttualeEuro === 0">
                                {{ trans('gestionale.fatture.double_lock.actions.convert_current_expense') }}
                            </Button>
                            <Button type="button" size="sm" variant="outline" class="text-xs" @click="addCopertura('fondo_riserva')" :disabled="scopertoAttualeEuro === 0">
                                {{ trans('gestionale.fatture.double_lock.actions.reverse_from_reserve') }}
                            </Button>
                        </div>

                        <div v-if="props.form.coperture?.length > 0" class="space-y-3 mt-4 pt-4 border-t border-slate-200">
                            <div v-for="(cop, idx) in props.form.coperture" :key="idx" class="flex gap-3 items-end">
                                <div class="flex-1 relative z-40">
                                    <Label class="text-[10px] uppercase text-slate-500 block mb-1">
                                        {{ cop.tipo_copertura === 'sopravvenienza' ? trans('gestionale.fatture.double_lock.labels.expense_chapter') : trans('gestionale.fatture.double_lock.labels.fund') }}
                                    </Label>
                                    
                                    <div v-if="cop.tipo_copertura === 'sopravvenienza'" class="h-9 border border-slate-200 rounded-md bg-amber-50 flex items-center px-3 text-sm text-slate-600 font-medium">
                                        {{ trans('gestionale.fatture.double_lock.labels.extraordinary_integration') }}
                                    </div>
                                    <v-select v-else v-model="cop.fonte_id" :options="fondiRiserva" label="nome" :reduce="(f: any) => f.id" class="style-chooser text-xs bg-white" append-to-body />
                                    
                                </div>
                                <div class="w-32">
                                    <Label class="text-[10px] uppercase text-slate-500 block mb-1">{{ trans('gestionale.fatture.double_lock.labels.amount_eur') }}</Label>
                                    <Input type="number" step="0.01" v-model="cop.importo" class="h-9 text-sm bg-white" />
                                </div>
                                <Button type="button" variant="ghost" size="icon" @click="removeCopertura(idx)" class="h-9 w-9 text-rose-500 hover:bg-rose-100">
                                    <Trash2 class="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <div class="p-5 rounded-xl border transition-colors duration-300" :class="fiscalAssistant.colorClass">
            <div class="flex items-start gap-4">
                <component :is="fiscalAssistant.icon" class="w-6 h-6 shrink-0 mt-0.5" :class="fiscalAssistant.iconColor" />
                <div>
                    <h4 class="font-bold text-base mb-1" :class="fiscalAssistant.iconColor">{{ fiscalAssistant.title }}</h4>
                    <p class="text-sm leading-relaxed opacity-90">{{ fiscalAssistant.desc }}</p>
                </div>
            </div>
        </div>
        
    </div>
</template>
