<script setup lang="ts">
import { computed } from "vue";
import { Head, usePage } from '@inertiajs/vue3';
import GestionaleLayout from '@/layouts/GestionaleLayout.vue';
import MovimentiLayout from '@/layouts/gestionale/MovimentiLayout.vue';
import DataTable from '@/components/gestionale/movimenti/incassi/DataTable.vue'; 
import { createColumns } from '@/components/gestionale/movimenti/incassi/columns';
import { usePermission } from "@/composables/permissions";
import PageHeaderGuide from '@/components/PageHeaderGuide.vue';
import { Wallet, Coins, CheckCircle } from 'lucide-vue-next';
import { trans } from 'laravel-vue-i18n';

// 1. IMPORTIAMO I TIPI CORRETTI
import type { Building } from '@/types/buildings';
import type { Esercizio } from "@/types/gestionale/esercizi";

// 2. AGGIUNGIAMO ESERCIZIO E TIPIZZIAMO CONDOMINIO
const props = defineProps<{
  condominio: Building;
  condomini: Building[];
  esercizio: Esercizio;
  esercizi: Esercizio[];
  movimenti: { data: any[], meta: any }; // Dati paginati
  filters: any;
}>();

const { generatePath } = usePermission();

const headerBreadcrumbs = computed(() => [
  { title: trans('gestionale.movimenti_rate.breadcrumbs.management'), href: generatePath('gestionale/:condominio', { condominio: props.condominio.id }) },
  { title: trans('gestionale.movimenti_rate.breadcrumbs.movements') },
  { title: trans('gestionale.movimenti_rate.breadcrumbs.installment_receipts') }
]);

const pageGuides = [
  {
    title: trans('gestionale.movimenti_rate.guides.quick_recording_title'),
    description: trans('gestionale.movimenti_rate.guides.quick_recording_description'),
    icon: Wallet,
    colorVariant: 'blue' as const
  },
  {
    title: trans('gestionale.movimenti_rate.guides.partial_payments_title'),
    description: trans('gestionale.movimenti_rate.guides.partial_payments_description'),
    icon: Coins,
    colorVariant: 'amber' as const
  },
  {
    title: trans('gestionale.movimenti_rate.guides.settle_previous_balances_title'),
    description: trans('gestionale.movimenti_rate.guides.settle_previous_balances_description'),
    icon: CheckCircle,
    colorVariant: 'emerald' as const
  }
];
</script>

<template>
  <Head :title="trans('gestionale.movimenti_rate.head_title')" />

  <GestionaleLayout>

    <div class="px-6 py-8 space-y-3">
      
      <PageHeaderGuide
        :page-title="trans('gestionale.movimenti_rate.page_title')"
        :page-subtitle="trans('gestionale.movimenti_rate.page_subtitle')"
        :guides="pageGuides"
        :breadcrumbs="headerBreadcrumbs"
        :video-url="null /* 'https://youtube.com/...' */"
        :condominio="props.condominio"
        :condomini="props.condomini"
        :esercizio="props.esercizio"
        :esercizi="props.esercizi"
      >
      </PageHeaderGuide>

      <div class="w-full">
        <section class="w-full space-y-4">
          
          <MovimentiLayout>
            <div>
                <DataTable 
                    :columns="createColumns(props.condominio.id)"
                    :data="props.movimenti.data"
                    :meta="props.movimenti.meta || props.movimenti" 
                    :condominio="props.condominio"
                />
            </div>
          </MovimentiLayout>

        </section>
      </div>

    </div>

  </GestionaleLayout>
</template>
