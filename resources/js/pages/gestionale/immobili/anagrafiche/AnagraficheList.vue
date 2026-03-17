<script setup lang="ts">

import { computed } from "vue";
import { Head, Link, usePage } from '@inertiajs/vue3';
import { trans } from 'laravel-vue-i18n';
import GestionaleLayout from '@/layouts/GestionaleLayout.vue';
import ImmobileLayout from '@/layouts/gestionale/ImmobileLayout.vue';
import DataTable from '@/components/gestionale/immobili/anagrafiche/DataTable.vue';
import { createColumns } from '@/components/gestionale/immobili/anagrafiche/columns'
import Alert from "@/components/Alert.vue";
import PageHeaderGuide from '@/components/PageHeaderGuide.vue';
import { usePermission } from "@/composables/permissions";
import { UsersRound, ArrowRightLeft, PieChart, UserPlus, List } from 'lucide-vue-next';
import type { BreadcrumbItem } from '@/types';
import type { Flash } from '@/types/flash';
import type { Building } from '@/types/buildings';
import type { Immobile } from '@/types/gestionale/immobili';

const props = defineProps<{
  condominio: Building;
  immobile: Immobile;
}>()
 
const { generatePath, generateRoute } = usePermission();

const page = usePage<{ flash: { message?: Flash } }>();
const flashMessage = computed(() => page.props.flash.message);

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { title: trans('gestionale.list_pages.immobili.breadcrumbs.management'), href: generatePath('gestionale/:condominio', { condominio: props.condominio.id }) },
  { title: props.condominio.nome, href: '#' },
  { title: trans('gestionale.list_pages.immobili.breadcrumbs.list'), href: generatePath('gestionale/:condominio/immobili', { condominio: props.condominio.id }) },
  { title: props.immobile.nome, href: generatePath('gestionale/:condominio/immobili/:immobile', { condominio: props.condominio.id, immobile: props.immobile.id }) },
  { title: trans('gestionale.immobile_layout.tabs.registry'), href: '#' },
]);

const headerBreadcrumbs = computed(() => [
  { title: trans('gestionale.immobili_anagrafiche.breadcrumbs.management'), href: generatePath('gestionale/:condominio', { condominio: props.condominio.id }) },
  { title: props.condominio.nome, href: '#' },
  { title: trans('gestionale.immobili_anagrafiche.breadcrumbs.properties'), href: generatePath('gestionale/:condominio/immobili', { condominio: props.condominio.id }) },
  { title: props.immobile.nome, href: generatePath('gestionale/:condominio/immobili/:immobile', { condominio: props.condominio.id, immobile: props.immobile.id }) },
  { title: trans('gestionale.immobili_anagrafiche.breadcrumbs.current') },
]);

const pageGuides = computed(() => [
  {
    title: trans('gestionale.immobili_anagrafiche.guides.associated_subjects_title'),
    description: trans('gestionale.immobili_anagrafiche.guides.associated_subjects_description'),
    icon: UsersRound,
    colorVariant: 'blue' as const
  },
  {
    title: trans('gestionale.immobili_anagrafiche.guides.competence_shares_title'),
    description: trans('gestionale.immobili_anagrafiche.guides.competence_shares_description'),
    icon: PieChart,
    colorVariant: 'emerald' as const
  },
  {
    title: trans('gestionale.immobili_anagrafiche.guides.turnover_history_title'),
    description: trans('gestionale.immobili_anagrafiche.guides.turnover_history_description'),
    icon: ArrowRightLeft,
    colorVariant: 'amber' as const
  }
]);

</script>

<template>
  <GestionaleLayout :breadcrumbs="breadcrumbs">
    <Head :title="trans('gestionale.immobili_anagrafiche.head_title')" />

    <div class="px-6 py-8 space-y-4">
      <PageHeaderGuide
        :page-title="trans('gestionale.immobili_anagrafiche.page_title')"
        :page-subtitle="trans('gestionale.immobili_anagrafiche.page_subtitle', { name: props.immobile.nome, interno: props.immobile.interno ?? '-' })"
        :guides="pageGuides"
        :breadcrumbs="headerBreadcrumbs"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <Link
              as="button"
              :href="generatePath('gestionale/:condominio/immobili', { condominio: props.condominio.id })"
              class="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <List class="w-3.5 h-3.5" />
              <span>{{ trans('gestionale.immobili_anagrafiche.header_actions.properties') }}</span>
            </Link>

            <Link
              :href="route(generateRoute('gestionale.immobili.anagrafiche.create'), { condominio: props.condominio.id, immobile: props.immobile.id })"
              class="inline-flex h-8 items-center justify-center gap-2 rounded-md shadow px-4 bg-primary text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <UserPlus class="w-3.5 h-3.5" />
              <span>{{ trans('gestionale.immobili_anagrafiche.header_actions.associate_subject') }}</span>
            </Link>
          </div>
        </template>
      </PageHeaderGuide>

      <ImmobileLayout>

        <div v-if="flashMessage" class="py-3">
            <Alert :message="flashMessage.message" :type="flashMessage.type" />
        </div>

        <div class="container mx-auto p-0 space-y-4 mt-2">
          <DataTable
            :columns="createColumns(props.condominio, props.immobile)"
            :data="props.immobile.anagrafiche"
          />
        </div>

      </ImmobileLayout>
    </div>
  </GestionaleLayout>
</template>
