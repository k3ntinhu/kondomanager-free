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
import type { BreadcrumbItem } from '@/types';
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: trans('fornitori.header.list_title'),
        href: '/fornitori',
    },
];

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

    <div class="px-4 py-6">
      
      <Heading :title="trans('fornitori.header.list_title')" :description="trans('fornitori.header.list_description')" />
    
      <div v-if="flashMessage" class="py-4"> 
        <Alert :message="flashMessage.message" :type="flashMessage.type" />
      </div>

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
