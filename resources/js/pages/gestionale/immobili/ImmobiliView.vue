<script setup lang="ts">

import { computed } from "vue";
import { Head, Link, usePage } from '@inertiajs/vue3';
import { trans } from 'laravel-vue-i18n';
import GestionaleLayout from '@/layouts/GestionaleLayout.vue';
import ImmobileLayout from '@/layouts/gestionale/ImmobileLayout.vue';
import Alert from "@/components/Alert.vue";
import PageHeaderGuide from '@/components/PageHeaderGuide.vue';
import { usePermission } from "@/composables/permissions";
import { List, Pencil } from 'lucide-vue-next';
import type { Flash } from '@/types/flash';
import type { Immobile } from '@/types/gestionale/immobili';
import type { Building } from '@/types/buildings';

const props = defineProps<{
  condominio: Building;
  immobile: Immobile;
}>()

const { generatePath } = usePermission();

const page = usePage<{ flash: { message?: Flash } }>();
const flashMessage = computed(() => page.props.flash.message);

const headerBreadcrumbs = computed(() => [
  { title: trans('gestionale.list_pages.immobili.breadcrumbs.management'), href: generatePath('gestionale/:condominio', { condominio: props.condominio.id }) },
  { title: props.condominio.nome, href: '#' },
  { title: trans('gestionale.list_pages.immobili.breadcrumbs.list'), href: generatePath('gestionale/:condominio/immobili', { condominio: props.condominio.id }) },
  { title: props.immobile.nome, href: generatePath('gestionale/:condominio/immobili/:immobile', { condominio: props.condominio.id, immobile: props.immobile.id }) },
]);

const truncate = (text: string, length: number = 120) => {
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

const localizeTipologia = (immobile: Immobile): string => {
  if (!immobile.tipologia) return '-';

  if (immobile.tipologia.localized_name) {
    return immobile.tipologia.localized_name;
  }

  const slug = immobile.tipologia.nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const key = `gestionale.immobili_form.property_types.${slug}`;
  const translated = trans(key);

  return translated === key ? immobile.tipologia.nome : translated;
};

</script>

<template>
  <GestionaleLayout>
    <Head :title="trans('gestionale.immobili_view.head_title')" />

    <div class="px-6 py-8 space-y-4">
      <PageHeaderGuide
        :page-title="props.immobile.nome"
        :page-subtitle="trans('gestionale.immobili_view.head_title')"
        :guides="[]"
        :breadcrumbs="headerBreadcrumbs"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <Link
              as="button"
              :href="generatePath('gestionale/:condominio/immobili/:immobile/edit', { condominio: props.condominio.id, immobile: props.immobile.id })"
              class="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Pencil class="w-4 h-4" />
              <span>{{ trans('gestionale.form_common.actions.edit') }}</span>
            </Link>

            <Link
              as="button"
              :href="generatePath('gestionale/:condominio/immobili', { condominio: props.condominio.id })"
              class="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <List class="w-4 h-4" />
              <span>{{ trans('gestionale.list_pages.immobili.page_title') }}</span>
            </Link>
          </div>
        </template>
      </PageHeaderGuide>

      <ImmobileLayout>

        <div v-if="flashMessage" class="py-3">
          <Alert :message="flashMessage.message" :type="flashMessage.type" />
        </div>

      <div class="container mx-auto p-0">
        <div class="bg-card mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-lg border p-6 text-sm mt-4">

          <!-- Left block -->
          <div class="space-y-6 pr-6 border-r">
            <div class="border-b pb-2 mb-8">
              <h3 class="text-lg font-bold">{{immobile.nome}}</h3>
              <p class="text-muted-foreground text-sm ">
                {{ truncate(immobile.descrizione, 80) }}
              </p>
            </div>
    
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Column 1 -->
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-24">{{ trans('gestionale.list_pages.immobili.table.type') }}:</span>
                  <div class="inline-flex items-center rounded-md border px-2.5 py-0.5 font-medium shadow-sm text-xs">
                    {{ localizeTipologia(immobile) }}
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-24">{{ trans('gestionale.list_pages.immobili.table.building') }}:</span>
                  <div>{{ immobile.palazzina?.name ?? '-' }}</div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-24">{{ trans('gestionale.list_pages.immobili.table.stair') }}:</span>
                  <div>{{ immobile.scala?.name ?? '-' }}</div>
                </div>
              </div>

              <!-- Column 2 -->
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-24">{{ trans('gestionale.form_common.labels.unit') }}:</span>
                  <div>{{ immobile.interno }}</div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-24">{{ trans('gestionale.form_common.labels.floor') }}:</span>
                  <div>{{ immobile.piano ?? '-' }}</div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-24">{{ trans('gestionale.form_common.labels.surface') }}:</span>
                  <div>{{ immobile.superficie ? immobile.superficie + ' m²' : '-' }}</div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-24">{{ trans('gestionale.form_common.labels.rooms') }}:</span>
                  <div>{{ immobile.numero_vani ?? '-' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right block -->
          <div class="space-y-6 ">

            <div class="border-b pb-2 mb-8">
              <h3 class="text-lg font-bold">{{ trans('gestionale.immobili_form.create.cadastral.title') }}</h3>
              <p class="text-muted-foreground text-sm ">
                {{ trans('gestionale.immobili_view.cadastral_description') }}
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Column 3 -->
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-30">{{ trans('gestionale.immobili_form.create.placeholders.cadastral_city') }}:</span>
                  <div>{{ immobile.comune_catasto ?? '-' }}</div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-30">{{ trans('gestionale.immobili_form.create.placeholders.cadastral_code') }}:</span>
                  <div>{{ immobile.codice_catasto ?? '-'}}</div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-30">{{ trans('gestionale.immobili_form.create.labels.cadastral_section') }}:</span>
                  <div>{{ immobile.sezione_catasto ?? '-' }}</div>
                </div>
              </div>

              <!-- Column 4 -->
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-24">{{ trans('gestionale.immobili_form.create.labels.cadastral_sheet') }}:</span>
                  <div>{{ immobile.foglio_catasto ?? '-' }}</div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-24">{{ trans('gestionale.immobili_form.create.labels.cadastral_parcel') }}:</span>
                  <div>{{ immobile.particella_catasto ?? '-' }}</div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-semibold w-24">{{ trans('gestionale.immobili_form.create.labels.cadastral_sub') }}:</span>
                  <div>{{ immobile.subalterno_catasto ?? '-' }}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div class="bg-card mb-2 rounded-lg border p-6 text-sm">
        <!-- Notes Section -->
        <div class="border-b pb-2 mb-4">
          <span class="text-lg font-bold">{{ trans('gestionale.immobili_view.notes_title') }}</span>
        </div>

        <div class="text-sm text-gray-700"> 
          {{ immobile.note ? immobile.note : trans('gestionale.immobili_view.no_notes') }}
        </div>
      </div>

      </ImmobileLayout>
    </div>
  </GestionaleLayout>
</template>
