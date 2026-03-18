<script setup lang="ts">
import { computed } from 'vue';
import { Head, router } from '@inertiajs/vue3';
import GestionaleLayout from '@/layouts/GestionaleLayout.vue';
import MovimentiLayout from '@/layouts/gestionale/MovimentiLayout.vue';
import PageHeaderGuide from '@/components/PageHeaderGuide.vue';
import DataTable from '@/components/gestionale/movimenti/fatture/DataTable.vue'; 
import { createColumns } from '@/components/gestionale/movimenti/fatture/columns';
import { usePermission } from '@/composables/permissions';
import { useCurrencyFormatter } from '@/composables/useCurrencyFormatter';
import { FileText, Clock, AlertTriangle, Euro } from 'lucide-vue-next';
import type { Building } from '@/types/buildings';
import { trans } from 'laravel-vue-i18n';

const props = defineProps<{
    condominio: Building;
    condomini:  Building[];
    fatture:    { data: any[]; meta: any };
    stats:      { totale_aperte: number; totale_sfori: number; importo_da_pagare: number };
    filters:    { stato_pagamento?: string; stato_approvazione?: string; search?: string };
}>();

const { generatePath, generateRoute } = usePermission();
const { euro } = useCurrencyFormatter();

const headerBreadcrumbs = computed(() => [
    { title: trans('gestionale.fatture.breadcrumbs.management'), href: generatePath('gestionale/:condominio', { condominio: props.condominio.id }) },
    { title: trans('gestionale.fatture.breadcrumbs.movements') },
    { title: trans('gestionale.fatture.breadcrumbs.supplier_invoices') },
]);

const pageGuides = [
    { title: trans('gestionale.fatture.guides.payables_cycle_title'), description: trans('gestionale.fatture.guides.payables_cycle_description'), icon: FileText, colorVariant: 'blue' as const },
    { title: trans('gestionale.fatture.guides.motivated_overruns_title'), description: trans('gestionale.fatture.guides.motivated_overruns_description'), icon: AlertTriangle, colorVariant: 'amber' as const },
    { title: trans('gestionale.fatture.guides.due_dates_title'), description: trans('gestionale.fatture.guides.due_dates_description'), icon: Clock, colorVariant: 'emerald' as const },
];

const sforiFilterActive = computed(() => props.filters.stato_approvazione === 'sforo_motivato');

// Toggle filtro sfori — click attiva, secondo click rimuove
const filterSfori = () => {
    if (props.stats.totale_sfori === 0 && !sforiFilterActive.value) return;

    router.get(
        route(generateRoute('gestionale.fatture.index'), { condominio: props.condominio.id }),
        sforiFilterActive.value ? {} : { stato_approvazione: 'sforo_motivato' },
        {
            preserveScroll: true,
            preserveState: true,
        }
    );
};

</script>

<template>
    <Head :title="trans('gestionale.fatture.head_title')" />
    <GestionaleLayout>
        <div class="px-6 py-8 space-y-3">
            <PageHeaderGuide
                :page-title="trans('gestionale.fatture.page_title')"
                :page-subtitle="trans('gestionale.fatture.page_subtitle')"
                :guides="pageGuides"
                :breadcrumbs="(headerBreadcrumbs as any)"
                :condominio="(props.condominio as any)"
                :condomini="(props.condomini as any)"
            />

            <div class="w-full">
                <section class="w-full space-y-4">
                    <MovimentiLayout>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

                            <!-- Card: Fatture Aperte -->
                            <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
                                <div class="bg-amber-100 p-2.5 rounded-lg border border-amber-200">
                                    <Clock class="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">{{ trans('gestionale.fatture.cards.open_invoices') }}</p>
                                    <p class="text-2xl font-black text-slate-900">{{ stats.totale_aperte }}</p>
                                </div>
                            </div>

                            <!-- Card: Importo da Pagare -->
                            <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
                                <div class="bg-red-50 p-2.5 rounded-lg border border-red-100">
                                    <Euro class="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">{{ trans('gestionale.fatture.cards.amount_to_pay') }}</p>
                                    <p class="text-2xl font-black text-slate-900">{{ euro(stats.importo_da_pagare) }}</p>
                                </div>
                            </div>

                            <!-- Card: Da Ratificare (toggle filtro) -->
                            <div
                                @click="filterSfori"
                                class="border rounded-xl p-4 flex items-center gap-4 transition-all select-none"
                                :class="[
                                    stats.totale_sfori > 0 || sforiFilterActive
                                        ? 'bg-orange-50 border-orange-200 hover:bg-orange-100 cursor-pointer shadow-sm'
                                        : 'bg-white border-slate-200 opacity-70 cursor-default'
                                ]"
                            >
                                <div
                                    class="p-2.5 rounded-lg"
                                    :class="stats.totale_sfori > 0 || sforiFilterActive ? 'bg-orange-100 border border-orange-200' : 'bg-slate-100'"
                                >
                                    <AlertTriangle
                                        class="w-5 h-5"
                                        :class="stats.totale_sfori > 0 || sforiFilterActive ? 'text-orange-600' : 'text-slate-400'"
                                    />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">{{ trans('gestionale.fatture.cards.to_ratify') }}</p>
                                        <span
                                            v-if="sforiFilterActive"
                                            class="text-[9px] font-black uppercase bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                        >
                                            {{ trans('gestionale.fatture.cards.active_filter_hint') }}
                                        </span>
                                    </div>
                                    <p
                                        class="text-2xl font-black"
                                        :class="stats.totale_sfori > 0 || sforiFilterActive ? 'text-orange-700' : 'text-slate-900'"
                                    >
                                        {{ stats.totale_sfori }}
                                    </p>
                                </div>
                            </div>

                        </div>

                        <div>
                            <DataTable 
                                :columns="createColumns(props.condominio.id)"
                                :data="props.fatture.data"
                                :meta="props.fatture.meta || props.fatture" 
                                :condominio="props.condominio"
                            />
                        </div>

                    </MovimentiLayout>
                </section>
            </div>
        </div>
    </GestionaleLayout>
</template>
