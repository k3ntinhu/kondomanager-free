<script setup lang="ts">

import { computed, reactive } from 'vue';
import { usePage, Head, router } from '@inertiajs/vue3';
import DataTable from '@/components/eventi/DataTable.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import PageHeaderGuide from '@/components/PageHeaderGuide.vue';
import { columns } from '@/components/eventi/columns';
import Alert from '@/components/Alert.vue';
import EventiStats from '@/components/eventi/EventiStats.vue';
import { usePermission } from "@/composables/permissions";
import { CalendarClock, CalendarRange, BellRing } from 'lucide-vue-next';
import { trans } from 'laravel-vue-i18n';
import type { Flash } from '@/types/flash';
import type { Evento, Stats } from '@/types/eventi';
import type { PaginationMeta } from '@/types/pagination';

const props = defineProps<{
  eventi: Evento[],
  stats: Stats,
  meta: PaginationMeta,
  filters: Record<string, any>
}>()

const { generateRoute } = usePermission();
const page = usePage<{ flash: { message?: Flash } }>();
const flashMessage = computed(() => page.props.flash.message);
const breadcrumbs: never[] = [];
const pageGuides = [
  {
    title: trans('eventi.guides.centralized_title'),
    description: trans('eventi.guides.centralized_desc'),
    icon: CalendarClock,
    colorVariant: 'blue' as const,
  },
  {
    title: trans('eventi.guides.planning_title'),
    description: trans('eventi.guides.planning_desc'),
    icon: CalendarRange,
    colorVariant: 'emerald' as const,
  },
  {
    title: trans('eventi.guides.tracking_title'),
    description: trans('eventi.guides.tracking_desc'),
    icon: BellRing,
    colorVariant: 'amber' as const,
  },
];

const filters = reactive({ ...props.filters });

function setFilter(range: { date_from: string; date_to: string }) {
  filters.date_from = range.date_from;
  filters.date_to = range.date_to;
  filters.page = 1;

  router.get(route(generateRoute('eventi.index')), filters, {
    preserveScroll: true,
    preserveState: true,
  });
}

</script>

<template>
  <Head :title="trans('eventi.header.list_events_head')" />

  <AppLayout :breadcrumbs="breadcrumbs">
    <div class="px-6 py-8 space-y-4">
      <PageHeaderGuide
        :page-title="trans('eventi.header.list_events_title')"
        :page-subtitle="trans('eventi.header.list_events_description')"
        :guides="pageGuides"
        :breadcrumbs="breadcrumbs"
        :video-url="null"
      />

      <EventiStats :stats="stats" @setFilter="setFilter" />

      <div class="w-full">
        <section class="w-full">
          <div v-if="flashMessage" class="py-3">
            <Alert :message="flashMessage.message" :type="flashMessage.type" />
          </div>

          <div class="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm p-4 mt-2">
            <DataTable :columns="columns" :data="eventi" :meta="meta" />
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>
