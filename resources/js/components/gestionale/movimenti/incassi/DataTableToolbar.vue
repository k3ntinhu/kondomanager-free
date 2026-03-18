<script setup lang="ts">

import { ref, computed } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { router, usePage, Link } from '@inertiajs/vue3';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { usePermission } from "@/composables/permissions";
import { trans } from 'laravel-vue-i18n';
import type { Table } from '@tanstack/vue-table';
import type { Building } from '@/types/buildings';

const props = defineProps<{ table: Table<any> }>();
const page = usePage<{ condominio: Building }>();
const { generateRoute } = usePermission();
const condominioId = computed(() => page.props.condominio.id);
const globalFilter = ref('')

const filterParams = computed(() => {
  const params: Record<string, any> = { page: 1 }
  if (globalFilter.value) params.search = globalFilter.value
  return params
})

watchDebounced(
  globalFilter,
  () => {
    router.get(
      route(generateRoute('gestionale.movimenti-rate.index'), { condominio: condominioId.value }),
      filterParams.value,
      {
        preserveState: true,
        replace: true,
        preserveScroll: true,
      }
    )
  },
  { debounce: 300 }
)

const isFiltered = computed(() => globalFilter.value.length > 0)
const resetFilter = () => { globalFilter.value = '' }
</script>

<template>
  <div class="flex items-center justify-between w-full ">

    <div class="flex items-center space-x-2">
      <div class="flex items-center space-x-2">
        <Input
          :placeholder="trans('gestionale.movimenti_rate.toolbar.filter_placeholder')"
          v-model="globalFilter"
          class="h-8 w-[150px] lg:w-[250px]"
        />

      </div>
    </div>

    <Button as-child>
        <Link 
          :href="route(generateRoute('gestionale.movimenti-rate.create'), { condominio: condominioId })"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 border border-slate-800 shadow-sm text-xs font-medium text-white hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          {{ trans('gestionale.movimenti_rate.toolbar.new_receipt') }}
        </Link>
    </Button>
  </div>
</template>
