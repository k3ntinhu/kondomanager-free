<script setup lang="ts">

import { computed } from 'vue';
import { Link, Head, useForm } from '@inertiajs/vue3';
import { trans } from 'laravel-vue-i18n';
import GestionaleLayout from '@/layouts/GestionaleLayout.vue';
import { usePermission } from "@/composables/permissions";
import { Button } from '@/components/ui/button';
import { List, Plus, LoaderCircle} from 'lucide-vue-next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/InputError.vue';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import vSelect from "vue-select";
import type { Building } from '@/types/buildings';
import type { BreadcrumbItem } from '@/types';
import type { Palazzina } from '@/types/gestionale/palazzine';
import type { Scala } from '@/types/gestionale/scale';
import type { Immobile } from '@/types/gestionale/immobili';
import type { TipologiaImmobile } from '@/types/gestionale/tipologie-immobili';

const props = defineProps<{
  condominio: Building;
  immobile: Immobile;
  palazzine: Palazzina[];
  scale: Scala[];
  tipologie: TipologiaImmobile[]
}>()

const { generatePath, generateRoute } = usePermission();

const localizeTipologia = (tipologia: TipologiaImmobile): string => {
  const slug = tipologia.nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const key = `gestionale.immobili_form.property_types.${slug}`;
  const translated = trans(key);

  return translated === key ? (tipologia.localized_name || tipologia.nome) : translated;
};

const tipologieOptions = computed(() =>
  props.tipologie.map((tipologia) => ({
    ...tipologia,
    label: localizeTipologia(tipologia),
  }))
);

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { title: trans('gestionale.list_pages.immobili.breadcrumbs.management'), href: generatePath('gestionale/:condominio', { condominio: props.condominio.id }) },
  { title: props.condominio.nome, href: '#' },
  { title: trans('gestionale.list_pages.immobili.breadcrumbs.list'), href: generatePath('gestionale/:condominio/immobili', { condominio: props.condominio.id }) },
  { title: props.immobile.nome, href: generatePath('gestionale/:condominio/immobili/:immobile', { condominio: props.condominio.id, immobile: props.immobile.id }) },
  { title: trans('gestionale.form_common.actions.edit'), href: '#' },
]);

const form = useForm({
  nome: props.immobile.nome,
  descrizione: props.immobile.descrizione,
  note: props.immobile.note,
  comune_catasto: props.immobile.comune_catasto,
  codice_catasto: props.immobile.codice_catasto,
  sezione_catasto: props.immobile.sezione_catasto,
  foglio_catasto: props.immobile.foglio_catasto,
  particella_catasto: props.immobile.particella_catasto,
  subalterno_catasto: props.immobile.subalterno_catasto,
  interno: props.immobile.interno,
  piano: props.immobile.piano,
  superficie: props.immobile.superficie,
  numero_vani: props.immobile.numero_vani,
  palazzina_id: props.immobile.palazzina ? props.immobile.palazzina.id : '',
  scala_id: props.immobile.scala ? props.immobile.scala.id : '',
  tipologia_id: props.immobile.tipologia ? props.immobile.tipologia.id : '',
});

const submit = () => {
    form.put(route(...generateRoute('gestionale.immobili.update', { condominio: props.condominio.id, immobile: props.immobile.id })), {
        preserveScroll: true,
        onSuccess: () => {
            form.reset()
        }
    });
};

</script>

<template>

    <Head :title="trans('gestionale.form_common.actions.edit')" />

    <GestionaleLayout :breadcrumbs="breadcrumbs">

      <div class="px-4 py-6">
        <div class="w-full shadow ring-1 ring-black/5 md:rounded-lg p-4">
          <section class="w-full">

            <form class="space-y-2" @submit.prevent="submit">

              <!-- Action buttons -->
              <div class="flex flex-col lg:flex-row lg:justify-end gap-2 w-full">
                <Button :disabled="form.processing" class="h-8 w-full lg:w-auto">
                  <Plus class="w-4 h-4" v-if="!form.processing" />
                  <LoaderCircle v-if="form.processing" class="h-4 w-4 animate-spin" />{{ trans('gestionale.form_common.actions.save') }}</Button>

                <Link
                  as="button"
                  :href="generatePath('gestionale/:condominio/immobili', { condominio: props.condominio.id })"
                  class="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <List class="w-4 h-4" />
                  <span>{{ trans('gestionale.list_pages.immobili.page_title') }}</span>
                </Link>
              </div>

              <Separator class="my-4" />

              <div class="bg-white dark:bg-muted rounded space-y-4 mt-3" >

                <div class="mt-2 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div class="sm:col-span-3">
                      <Label for="nome">{{ trans('gestionale.form_common.labels.name') }}</Label>
                      <Input 
                        id="nome" 
                        class="mt-1 block w-full"
                          v-model="form.nome" 
                          v-on:focus="form.clearErrors('nome')"
                          :placeholder="trans('gestionale.form_common.labels.name')" 
                      />
                      
                      <InputError :message="form.errors.nome" />
            
                    </div>
                </div> 

                <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div class="sm:col-span-6">
                    <Label for="indirizzo">{{ trans('gestionale.form_common.labels.description') }}</Label>
                    <Input 
                      id="descrizione" 
                      class="mt-1 block w-full"
                        v-model="form.descrizione" 
                        v-on:focus="form.clearErrors('descrizione')"
                        :placeholder="trans('gestionale.form_common.labels.description')" 
                    />
                    
                    <InputError class="mt-2" :message="form.errors.descrizione" />
          
                  </div>
                </div>

                <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                  <div class="sm:col-span-2">
                    <Label for="tipologia">{{ trans('gestionale.form_common.labels.type') }}</Label>
                    <v-select 
                        :options="tipologieOptions" 
                        label="label" 
                        class="mt-1 block w-full"
                        v-model="form.tipologia_id"
                        :placeholder="trans('gestionale.immobili_form.create.placeholders.type')"
                        @update:modelValue="form.clearErrors('tipologia_id')" 
                        :reduce="(tipologia: TipologiaImmobile) => tipologia.id"
                    >
                      <template #no-options>
                        {{ trans('gestionale.form_common.messages.no_matching_options') }}
                      </template>
                    </v-select>
                    <InputError :message="form.errors.tipologia_id" />
                  </div>

                  <div class="sm:col-span-2">
                    <Label for="palazzina">{{ trans('gestionale.immobili_form.create.labels.building') }}</Label>
                      <v-select 
                          :options="palazzine" 
                          label="name" 
                          class="mt-1 block w-full"
                          v-model="form.palazzina_id"
                          :placeholder="trans('gestionale.immobili_form.create.placeholders.building')"
                          @update:modelValue="form.clearErrors('palazzina_id')" 
                          :reduce="(palazzina: Palazzina) => palazzina.id"
                      >
                        <template #no-options>
                          {{ trans('gestionale.form_common.messages.no_matching_options') }}
                        </template>
                      </v-select>
                    <InputError :message="form.errors.palazzina_id" />
                  </div>

                  <div class="sm:col-span-2">
                    <Label for="scala">{{ trans('gestionale.immobili_form.create.labels.stair') }}</Label>
                    <v-select 
                        :options="scale" 
                        label="name" 
                        class="mt-1 block w-full"
                        v-model="form.scala_id"
                        :placeholder="trans('gestionale.immobili_form.create.placeholders.stair')"
                        @update:modelValue="form.clearErrors('scala_id')" 
                        :reduce="(scala: Scala) => scala.id"
                    >
                      <template #no-options>
                        {{ trans('gestionale.form_common.messages.no_matching_options') }}
                      </template>
                    </v-select>
                    <InputError :message="form.errors.scala_id" />
                  </div>
                  
                </div>

                <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-8">

                  <div class="sm:col-span-2">
                    <Label for="interno">{{ trans('gestionale.form_common.labels.unit') }}</Label>
                    <Input 
                      id="interno" 
                      class="mt-1 block w-full"
                      v-model="form.interno" 
                      v-on:focus="form.clearErrors('interno')"
                      :placeholder="trans('gestionale.form_common.labels.unit')" 
                    />
                    <InputError :message="form.errors.interno" />
                  </div>

                  <div class="sm:col-span-2">
                    <Label for="piano">{{ trans('gestionale.form_common.labels.floor') }}</Label>
                    <Input 
                      id="foglio_catasto" 
                      class="mt-1 block w-full"
                      v-model="form.piano" 
                      v-on:focus="form.clearErrors('piano')"
                      :placeholder="trans('gestionale.form_common.labels.floor')" 
                    />
                    <InputError :message="form.errors.piano" />
                  </div>

                  <div class="sm:col-span-2">
                    <Label for="superficie">{{ trans('gestionale.form_common.labels.surface') }}</Label>
                    <Input 
                      id="superficie" 
                      class="mt-1 block w-full"
                      v-model="form.superficie" 
                      v-on:focus="form.clearErrors('superficie')"
                      :placeholder="trans('gestionale.form_common.labels.surface')" 
                    />
                    <InputError :message="form.errors.superficie" />
                  </div>

                  <div class="sm:col-span-2">
                    <Label for="numero_vani">{{ trans('gestionale.form_common.labels.rooms') }}</Label>
                    <Input 
                      id="numero_vani" 
                      class="mt-1 block w-full"
                      v-model="form.numero_vani" 
                      v-on:focus="form.clearErrors('numero_vani')"
                      :placeholder="trans('gestionale.form_common.labels.rooms')" 
                    />
                    <InputError :message="form.errors.numero_vani" />
                  </div>
                </div>

                <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div class="sm:col-span-6">
                        <Label for="note">{{ trans('gestionale.form_common.labels.notes') }}</Label>
                        <Textarea 
                            id="note" 
                            :placeholder="trans('gestionale.form_common.placeholders.insert_note')" 
                            v-model="form.note" 
                            v-on:focus="form.clearErrors('note')"
                        />
                    </div>

                    <InputError :message="form.errors.note" />
          
                </div>

                <div>
                  <h3 class="text-lg font-medium leading-6 text-gray-900">{{ trans('gestionale.immobili_form.create.cadastral.title') }}</h3>
                  <p class="mt-1 text-sm text-gray-500">{{ trans('gestionale.immobili_form.create.cadastral.description') }}</p>
                </div>
                
                <Separator class="my-4" />

                <div class="pt-3 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-4">
                  <!-- Comune catasto (3/4) -->
                  <div class="sm:col-span-3">
                    <Label for="comune_catasto">{{ trans('gestionale.form_common.labels.city') }}</Label>
                    <Input 
                      id="comune_catasto" 
                      class="mt-1 block w-full"
                      v-model="form.comune_catasto" 
                      v-on:focus="form.clearErrors('comune_catasto')"
                      :placeholder="trans('gestionale.immobili_form.create.placeholders.cadastral_city')" 
                    />
                    <InputError :message="form.errors.comune_catasto" />
                  </div>

                  <!-- Codice catasto (1/4) -->
                  <div class="sm:col-span-1">
                    <Label for="codice_catasto">{{ trans('gestionale.immobili_form.create.labels.cadastral_code') }}</Label>
                    <Input 
                      id="codice_catasto" 
                      class="mt-1 block w-full"
                      v-model="form.codice_catasto" 
                      v-on:focus="form.clearErrors('codice_catasto')"
                      :placeholder="trans('gestionale.immobili_form.create.placeholders.cadastral_code')" 
                    />
                    <InputError :message="form.errors.codice_catasto" />
                  </div>
                </div>

                <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-8">

                  <div class="sm:col-span-2">
                    <Label for="sezione_catasto">{{ trans('gestionale.immobili_form.create.labels.cadastral_section') }}</Label>
                    <Input 
                      id="sezione_catasto" 
                      class="mt-1 block w-full"
                      v-model="form.sezione_catasto" 
                      v-on:focus="form.clearErrors('sezione_catasto')"
                      :placeholder="trans('gestionale.immobili_form.create.placeholders.cadastral_section')" 
                    />
                    <InputError :message="form.errors.sezione_catasto" />
                  </div>
                  
                  <div class="sm:col-span-2">
                    <Label for="foglio_catasto">{{ trans('gestionale.immobili_form.create.labels.cadastral_sheet') }}</Label>
                    <Input 
                      id="foglio_catasto" 
                      class="mt-1 block w-full"
                      v-model="form.foglio_catasto" 
                      v-on:focus="form.clearErrors('foglio_catasto')"
                      :placeholder="trans('gestionale.immobili_form.create.placeholders.cadastral_sheet')" 
                    />
                    <InputError :message="form.errors.foglio_catasto" />
                  </div>

                  <div class="sm:col-span-2">
                    <Label for="particella_catasto">{{ trans('gestionale.immobili_form.create.labels.cadastral_parcel') }}</Label>
                    <Input 
                      id="particella_catasto" 
                      class="mt-1 block w-full"
                      v-model="form.particella_catasto" 
                      v-on:focus="form.clearErrors('particella_catasto')"
                      :placeholder="trans('gestionale.immobili_form.create.placeholders.cadastral_parcel')" 
                    />
                    <InputError :message="form.errors.particella_catasto" />
                  </div>

                  <div class="sm:col-span-2">
                    <Label for="subalterno_catasto">{{ trans('gestionale.immobili_form.create.labels.cadastral_sub') }}</Label>
                    <Input 
                      id="subalterno_catasto" 
                      class="mt-1 block w-full"
                      v-model="form.subalterno_catasto" 
                      v-on:focus="form.clearErrors('subalterno_catasto')"
                      :placeholder="trans('gestionale.immobili_form.create.placeholders.cadastral_sub')" 
                    />
                    <InputError :message="form.errors.subalterno_catasto" />
                  </div>
                </div>

              </div>

            </form>

          </section>
        </div>
      </div>

    </GestionaleLayout>

  </template>

  <style src="vue-select/dist/vue-select.css"></style>
