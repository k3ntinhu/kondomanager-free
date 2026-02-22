<script setup lang="ts">

import { computed, onMounted, watch } from "vue";
import { usePage } from "@inertiajs/vue3";
import DataTable from '@/components/fornitori/DataTable.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import { Head } from '@inertiajs/vue3';
import PageHeaderGuide from '@/components/PageHeaderGuide.vue';
import { columns } from '@/components/fornitori/columns';
import Alert from "@/components/Alert.vue";
import { trans } from 'laravel-vue-i18n';
import { Building2, Briefcase, FileText } from 'lucide-vue-next';
import type { Flash } from '@/types/flash';
import type { Fornitore } from '@/types/fornitori';

defineProps<{ 
  fornitori: Fornitore[],
  meta: {
    current_page: number,
    per_page: number,
    last_page: number,
    total: number
  } 
}>()

// Extract `$page` props with proper typing
const page = usePage<{ flash: { message?: Flash } }>();

// Computed property to safely access flash messages
const flashMessage = computed(() => page.props.flash.message);

const breadcrumbs: never[] = [];

const pageGuides = computed(() => [
  {
    title: trans('fornitori.guides.registry_title'),
    description: trans('fornitori.guides.registry_desc'),
    icon: Building2,
    colorVariant: 'blue' as const,
  },
  {
    title: trans('fornitori.guides.contacts_title'),
    description: trans('fornitori.guides.contacts_desc'),
    icon: Briefcase,
    colorVariant: 'emerald' as const,
  },
  {
    title: trans('fornitori.guides.documents_title'),
    description: trans('fornitori.guides.documents_desc'),
    icon: FileText,
    colorVariant: 'amber' as const,
  },
]);

// Scroll to top when flashMessage exists
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

// Scroll on mount and watch for flash message changes
onMounted(() => {
  if (flashMessage.value) {
    scrollToTop();
  }
});

// Optional: Watch for flashMessage changes (e.g., after Inertia navigation)
watch(flashMessage, (newValue) => {
  if (newValue) {
    scrollToTop();
  }
});

</script>

<template>

  <Head :title="trans('fornitori.header.list_title')" />

  <AppLayout :breadcrumbs="breadcrumbs">

    <div class="px-6 py-8 space-y-4">
      <PageHeaderGuide
        :page-title="trans('fornitori.header.list_title')"
        :page-subtitle="trans('fornitori.header.list_description')"
        :guides="pageGuides"
        :breadcrumbs="breadcrumbs"
        :video-url="null"
      />

      <div class="w-full">
        <section class="w-full">
          <div v-if="flashMessage" class="py-3">
            <Alert :message="flashMessage.message" :type="flashMessage.type" />
          </div>

          <div class="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm p-4 mt-2">
            <DataTable :columns="columns" :data="fornitori" :meta="meta" />
          </div>
        </section>
      </div>
    </div>
  </AppLayout> 

</template>
