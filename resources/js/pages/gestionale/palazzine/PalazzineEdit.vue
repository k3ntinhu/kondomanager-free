<script setup lang="ts">

import { computed } from 'vue';
import { Link, Head, useForm } from '@inertiajs/vue3';
import { trans } from 'laravel-vue-i18n';
import GestionaleLayout from '@/layouts/GestionaleLayout.vue';
import StrutturaLayout from '@/layouts/gestionale/StrutturaLayout.vue';
import { usePermission } from "@/composables/permissions";
import CondominioDropdown from "@/components/CondominioDropdown.vue";
import { Button } from '@/components/ui/button';
import { List, Plus, LoaderCircle} from 'lucide-vue-next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/InputError.vue';
import { Textarea } from '@/components/ui/textarea';
import type { Building } from '@/types/buildings'
import type { Palazzina } from '@/types/gestionale/palazzine';
import type { BreadcrumbItem } from '@/types';

const props = defineProps<{
  condominio: Building;
  palazzina: Palazzina;
}>()

const { generatePath, generateRoute } = usePermission();

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { title: 'Gestionale', href: generatePath('gestionale/:condominio', { condominio: props.condominio.id }) },
  { title: props.condominio.nome, href: '#' },
  { title: 'modifica palazzina', href: '#' },
]);

const form = useForm({
  id: props.palazzina.id,
  name: props.palazzina.name,
  description: props.palazzina.description,
  note: props.palazzina.note,
});

const submit = () => {
    form.put(route(...generateRoute('gestionale.palazzine.update', { condominio: props.condominio.id, palazzina: props.palazzina.id })), {
        preserveScroll: true,
        onSuccess: () => {
            form.reset()
        }
    });
};

</script>

<template>

    <Head title="Modifica palazzina" />

    <GestionaleLayout :breadcrumbs="breadcrumbs">

      <StrutturaLayout>

          <form class="space-y-2" @submit.prevent="submit">

            <!-- Action buttons -->
            <div class="flex flex-col lg:flex-row lg:justify-end gap-2 w-full">
              <Button :disabled="form.processing" class="h-8 w-full lg:w-auto">
                <Plus class="w-4 h-4" v-if="!form.processing" />
                <LoaderCircle v-if="form.processing" class="h-4 w-4 animate-spin" />{{ trans('gestionale.form_common.actions.save') }}</Button>

              <Link
                as="button"
                :href="generatePath('gestionale/:condominio/palazzine', { condominio: props.condominio.id })"
                class="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <List class="w-4 h-4" />
                <span>{{ trans('gestionale.form_common.actions.list') }}</span>
              </Link>
            </div>

            <div class="bg-white dark:bg-muted rounded shadow-sm p-3 space-y-4 border mt-3" >

              <!--  Name field -->
              <div class="mt-2 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div class="sm:col-span-3">
                    <Label for="nome">{{ trans('gestionale.form_common.labels.name') }}</Label>
                    <Input 
                      id="nome" 
                      class="mt-1 block w-full"
                        v-model="form.name" 
                        v-on:focus="form.clearErrors('name')"
                        :placeholder="trans('gestionale.form_common.labels.name')" 
                    />
                    
                    <InputError :message="form.errors.name" />
          
                  </div>
              </div> 

              <!--  Indirizzo field -->
              <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div class="sm:col-span-6">
                    <Label for="indirizzo">{{ trans('gestionale.form_common.labels.description') }}</Label>
                    <Input 
                      id="indirizzo" 
                      class="mt-1 block w-full"
                        v-model="form.description" 
                        v-on:focus="form.clearErrors('description')"
                        :placeholder="trans('gestionale.form_common.labels.description')" 
                    />
                    
                    <InputError class="mt-2" :message="form.errors.description" />
          
                  </div>
              </div>

              <!--  Note -->
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
       
            </div>

          </form>

      </StrutturaLayout>

    </GestionaleLayout>

  </template>
