<script setup lang="ts">

import { computed } from 'vue';
import { usePage, Head } from '@inertiajs/vue3';
import DataTable from '@/components/documenti/DataTable.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import PageHeaderGuide from '@/components/PageHeaderGuide.vue';
import { columns } from '@/components/documenti/columns';
import Alert from '@/components/Alert.vue';
import DocumentiStats from '@/components/documenti/DocumentiStats.vue';
import { trans } from 'laravel-vue-i18n';
import { FolderArchive, FolderTree, ShieldCheck } from 'lucide-vue-next';
import type { Flash } from '@/types/flash';
import type { Documento, Stats } from '@/types/documenti';
import type { PaginationMeta } from '@/types/pagination';

defineProps<{
  documenti: Documento[],
  stats: Stats,
  meta: PaginationMeta
}>()

const page = usePage<{ flash: { message?: Flash } }>();
const flashMessage = computed(() => page.props.flash.message);
const breadcrumbs: never[] = [];
const pageGuides = computed(() => [
  {
    title: trans('documenti.guides.archive_title'),
    description: trans('documenti.guides.archive_desc'),
    icon: FolderArchive,
    colorVariant: 'blue' as const,
  },
  {
    title: trans('documenti.guides.categories_title'),
    description: trans('documenti.guides.categories_desc'),
    icon: FolderTree,
    colorVariant: 'emerald' as const,
  },
  {
    title: trans('documenti.guides.access_title'),
    description: trans('documenti.guides.access_desc'),
    icon: ShieldCheck,
    colorVariant: 'amber' as const,
  },
]);

</script>

<template>
  <Head :title="trans('documenti.header.list_documents_head')" />

  <AppLayout :breadcrumbs="breadcrumbs">
    <div class="px-6 py-8 space-y-4">
      <PageHeaderGuide
        :page-title="trans('documenti.header.list_documents_title')"
        :page-subtitle="trans('documenti.header.list_documents_description')"
        :guides="pageGuides"
        :breadcrumbs="breadcrumbs"
        :video-url="null"
      />

      <DocumentiStats :stats="stats" />

      <div class="w-full">
        <section class="w-full">
          <div v-if="flashMessage" class="py-3">
            <Alert :message="flashMessage.message" :type="flashMessage.type" />
          </div>

          <div class="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm p-4 mt-2">
            <DataTable :columns="columns" :data="documenti" :meta="meta" />
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>
