<script setup lang="ts">

import { computed, ref } from "vue";
import { Head } from '@inertiajs/vue3';
import { trans } from 'laravel-vue-i18n';
import GestionaleLayout from '@/layouts/GestionaleLayout.vue';
import StrutturaLayout from '@/layouts/gestionale/StrutturaLayout.vue';
import { usePermission } from "@/composables/permissions";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter";
import PageHeaderGuide from '@/components/PageHeaderGuide.vue';
import SaldiDetailPanel from '@/components/gestionale/saldi/SaldiDetailPanel.vue';
import { Coins, Lock, Search, Building2, Users } from 'lucide-vue-next';
import type { Building } from '@/types/buildings';
import type { ImmobileConSaldi } from '@/types/gestionale/saldi';

const props = defineProps<{
  condominio: Building;
  esercizio: any;
  immobili: ImmobileConSaldi[];
  gestioni: any[];
}>();

const { generatePath } = usePermission();
const { euro } = useCurrencyFormatter({ fromCents: false, forcePlus: true });

// ── State ──────────────────────────────────────────────────────────────────
const selectedId = ref<number | null>(null);
const search = ref('');

const selectedImmobile = computed(() =>
  props.immobili.find(i => i.id === selectedId.value) ?? null
);

const filteredImmobili = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return props.immobili;
  return props.immobili.filter(i =>
    i.nome?.toLowerCase().includes(q) ||
    i.interno?.toLowerCase().includes(q)
  );
});

// ── Breadcrumbs ────────────────────────────────────────────────────────────
const headerBreadcrumbs = computed(() => [
  { title: trans('gestionale.saldi.breadcrumbs.management'), href: generatePath('gestionale/:condominio', { condominio: props.condominio.id }) },
  { title: trans('gestionale.saldi.breadcrumbs.structure'), href: '#' },
  { title: trans('gestionale.saldi.breadcrumbs.current') }
]);

const pageGuides = [
  {
    title: trans('gestionale.saldi.guides.separation_title'),
    description: trans('gestionale.saldi.guides.separation_description'),
    icon: Coins,
    colorVariant: 'emerald' as const
  },
  {
    title: trans('gestionale.saldi.guides.locked_title'),
    description: trans('gestionale.saldi.guides.locked_description'),
    icon: Lock,
    colorVariant: 'blue' as const
  },
  {
    title: trans('gestionale.saldi.guides.turnover_title'),
    description: trans('gestionale.saldi.guides.turnover_description'),
    icon: Users,
    colorVariant: 'amber' as const
  }
];
</script>

<template>
  <Head :title="trans('gestionale.saldi.head_title')" />
  <GestionaleLayout>
    <div class="px-6 py-8 space-y-4">
      <PageHeaderGuide
        :page-title="trans('gestionale.saldi.page_title', { esercizio: esercizio?.nome || trans('gestionale.saldi.exercise_fallback') })"
        :page-subtitle="trans('gestionale.saldi.page_subtitle')"
        :guides="pageGuides"
        :breadcrumbs="headerBreadcrumbs"
        :condominio="condominio"
      />

      <StrutturaLayout>
        <!-- Split layout container -->
        <div class="flex h-[calc(100vh-280px)] min-h-[500px] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">

          <!-- ── LEFT PANEL: lista immobili ────────────────────────────── -->
          <div class="w-[300px] xl:w-[340px] shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800">

            <!-- Search -->
            <div class="p-3 border-b border-slate-200 dark:border-slate-800">
              <div class="relative">
                <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  v-model="search"
                  type="text"
                  :placeholder="trans('gestionale.saldi.search_placeholder')"
                  class="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700
                         bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200
                         placeholder:text-slate-400 outline-none
                         focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40
                         transition-all"
                />
              </div>
            </div>

            <!-- List -->
            <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
              <button
                v-for="imm in filteredImmobili"
                :key="imm.id"
                @click="selectedId = imm.id"
                class="w-full text-left rounded-lg px-3 py-2.5 transition-all border flex items-center justify-between gap-2 group"
                :class="selectedId === imm.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'"
              >
                <div class="min-w-0 flex-1">
                  <p
                    class="text-sm font-semibold truncate"
                    :class="selectedId === imm.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'"
                  >
                    {{ imm.nome }}
                    <span class="font-normal text-slate-400 dark:text-slate-500"> · {{ trans('gestionale.saldi.labels.unit_short') }} {{ imm.interno }}</span>
                  </p>
                  <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                    <Building2 class="w-3 h-3 shrink-0" />
                    <span v-if="imm.palazzina">{{ trans('gestionale.saldi.labels.building_short') }} {{ imm.palazzina.name }}</span>
                    <span v-if="imm.scala"> · {{ trans('gestionale.saldi.labels.stair_short') }} {{ imm.scala.name }}</span>
                    <span> · {{ imm.anagrafiche?.length ?? 0 }} {{ (imm.anagrafiche?.length ?? 0) === 1 ? trans('gestionale.saldi.labels.subject_singular') : trans('gestionale.saldi.labels.subject_plural') }}</span>
                  </p>
                </div>
              </button>

              <div v-if="filteredImmobili.length === 0" class="text-center py-10 text-slate-400 text-sm">
                {{ trans('gestionale.saldi.empty.no_properties_found') }}
              </div>
            </div>
          </div>

          <!-- ── RIGHT PANEL: dettaglio ─────────────────────────────────── -->
          <div class="flex-1 overflow-y-auto">
            <!-- Empty state -->
            <div
              v-if="!selectedImmobile"
              class="h-full flex flex-col items-center justify-center text-slate-400 gap-3 p-8"
            >
              <Coins class="w-10 h-10 opacity-30" />
              <p class="text-sm">{{ trans('gestionale.saldi.empty.select_property') }}</p>
            </div>

            <!-- Detail panel -->
            <SaldiDetailPanel
              v-else
              :immobile="selectedImmobile"
              :gestioni="gestioni"
              :esercizio="esercizio"
              :condominio="condominio"
              :valori-in-centesimi="true"
            />
          </div>

        </div>
      </StrutturaLayout>
    </div>
  </GestionaleLayout>
</template>
