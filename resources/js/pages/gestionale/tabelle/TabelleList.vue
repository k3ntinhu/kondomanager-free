<script setup lang="ts">

import { computed } from "vue";
import { Head, usePage } from "@inertiajs/vue3";
import GestionaleLayout from "@/layouts/GestionaleLayout.vue";
import DataTable from "@/components/gestionale/tabelle/DataTable.vue";
import { getColumns } from "@/components/gestionale/tabelle/columns";
import Alert from "@/components/Alert.vue";
import { usePermission } from "@/composables/permissions";
import { trans } from 'laravel-vue-i18n';
import PageHeaderGuide from '@/components/PageHeaderGuide.vue';
import { PieChart, Scale, TableProperties } from 'lucide-vue-next';
import type { Flash } from "@/types/flash";
import type { Tabella } from "@/types/gestionale/tabelle";
import type { Building } from "@/types/buildings";
import type { PaginationMeta } from "@/types/pagination";

const props = defineProps<{
  condominio: Building;
  condomini: Building[];
  tabelle: Tabella[];
  meta: PaginationMeta;
}>();

const { generatePath } = usePermission();

const columns = computed(() => getColumns(props.condominio));

const page = usePage<{ flash: { message?: Flash } }>();
const flashMessage = computed(() => page.props.flash.message);

// Breadcrumbs testuali per il nuovo componente Header
const headerBreadcrumbs = computed(() => [
  { title: trans('gestionale.list_pages.tabelle.breadcrumbs.management'), href: generatePath('gestionale/:condominio', { condominio: props.condominio.id }) },
  { title: trans('gestionale.list_pages.tabelle.breadcrumbs.list') }
]);

const pageGuides = computed(() => [
  {
    title: trans('gestionale.list_pages.tabelle.guides.allocation_engine_title'),
    description: trans('gestionale.list_pages.tabelle.guides.allocation_engine_description'),
    icon: PieChart,
    colorVariant: 'blue' as const
  },
  {
    title: trans('gestionale.list_pages.tabelle.guides.auto_validation_title'),
    description: trans('gestionale.list_pages.tabelle.guides.auto_validation_description'),
    icon: Scale,
    colorVariant: 'emerald' as const
  },
  {
    title: trans('gestionale.list_pages.tabelle.guides.mixed_allocation_title'),
    description: trans('gestionale.list_pages.tabelle.guides.mixed_allocation_description'),
    icon: TableProperties,
    colorVariant: 'amber' as const
  }
]);
</script>

<template>
  <Head :title="trans('gestionale.list_pages.tabelle.head_title')" />

  <GestionaleLayout>

    <div class="px-6 py-8 space-y-4">
      
      <PageHeaderGuide
        :page-title="trans('gestionale.list_pages.tabelle.page_title')"
        :page-subtitle="trans('gestionale.list_pages.tabelle.page_subtitle')"
        :guides="pageGuides"
        :breadcrumbs="headerBreadcrumbs"
        :video-url="null /* 'https://youtube.com/...' */"
        :condominio="props.condominio"
        :condomini="props.condomini"
      />

      <div class="w-full">
        <section class="w-full space-y-4">
          <div v-if="flashMessage">
            <Alert :message="flashMessage.message" :type="flashMessage.type" />
          </div>

          <div class="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm p-4">
            <DataTable
              :columns="columns"
              :data="props.tabelle"
              :meta="props.meta"
              :condominio="props.condominio"
            />
          </div>
        </section>
      </div>
    </div>
  </GestionaleLayout>
</template>
