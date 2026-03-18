<script setup lang="ts">
import { computed } from 'vue';
import { Link, Head, useForm } from '@inertiajs/vue3';
import { trans } from 'laravel-vue-i18n';
import GestionaleLayout from '@/layouts/GestionaleLayout.vue';
import PageHeaderGuide from '@/components/PageHeaderGuide.vue';
import { usePermission } from "@/composables/permissions";
import CondominioDropdown from '@/components/CondominioDropdown.vue';
import { Button } from '@/components/ui/button';
import { Save, LoaderCircle, FolderTree, Layers, CalendarRange } from 'lucide-vue-next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/InputError.vue';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useDateConverter } from '@/composables/useDateConverter';
import vSelect from "vue-select";
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import type { Building } from '@/types/buildings';
import type { BreadcrumbItem } from '@/types';
import type { DropdownType } from '@/types/dropdown';
import type { Esercizio } from '@/types/gestionale/esercizi';
import type { Gestione } from '@/types/gestionale/gestioni';

const props = defineProps<{
  condominio: Building;
  condomini: Building[];
  esercizio: Esercizio;
  gestione: Gestione;
}>()

const { generatePath, generateRoute } = usePermission();
const { toBackend } = useDateConverter();

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { title: trans('gestionale.list_pages.gestioni.breadcrumbs.management'), href: generatePath('gestionale/:condominio', { condominio: props.condominio.id }) },
  { title: props.condominio.nome, component: "condominio-dropdown" } as any,
  { title: trans('gestionale.list_pages.gestioni.page_title'), href: generatePath('gestionale/:condominio/esercizi/:esercizio/gestioni', { condominio: props.condominio.id, esercizio: props.esercizio.id }) },
  { title: props.gestione.nome, href: '#' },
  { title: trans('gestionale.gestioni_form.edit.breadcrumb_edit'), href: '#' },
]);

const pageGuides = computed(() => [
  {
    title: trans('gestionale.gestioni_form.edit.guides.edit_title'),
    description: trans('gestionale.gestioni_form.edit.guides.edit_description', { gestione: props.gestione.nome, esercizio: props.esercizio.nome }),
    icon: FolderTree,
    colorVariant: 'blue' as const
  },
  {
    title: trans('gestionale.list_pages.gestioni.guides.expense_types_title'),
    description: trans('gestionale.list_pages.gestioni.guides.expense_types_description'),
    icon: Layers,
    colorVariant: 'amber' as const
  },
  {
    title: trans('gestionale.list_pages.gestioni.guides.unlimited_duration_title'),
    description: trans('gestionale.list_pages.gestioni.guides.unlimited_duration_description'),
    icon: CalendarRange,
    colorVariant: 'emerald' as const
  },
]);

const tipologie = [
  { label: trans('gestionale.list_pages.gestioni.type_values.ordinary'),     id: 'ordinaria' },
  { label: trans('gestionale.list_pages.gestioni.type_values.extraordinary'), id: 'straordinaria' },
];

const form = useForm({
  nome: props.gestione.nome,
  descrizione: props.gestione.descrizione,
  note: props.gestione.note,
  data_inizio: props.gestione.data_inizio,
  data_fine: props.gestione.data_fine,
  tipo: props.gestione.tipo,
});

const submit = () => {
    form.data_inizio = toBackend(form.data_inizio);
    form.data_fine   = toBackend(form.data_fine);

    form.put(route(...generateRoute('gestionale.esercizi.gestioni.update', { condominio: props.condominio.id, esercizio: props.esercizio.id, gestione: props.gestione.id })), {
        preserveScroll: true,
        // In fase di modifica è preferibile non resettare il form onSuccess, 
        // così l'utente vede i dati aggiornati ricaricarsi o rimanere a schermo.
    });
};
</script>

<template>
    <Head :title="trans('gestionale.gestioni_form.edit.head_title')" />

    <GestionaleLayout>
        <template #breadcrumb-condominio>
            <CondominioDropdown :condominio="props.condominio" :condomini="props.condomini" />
        </template>

        <div class="px-6 py-8 space-y-6">

            <PageHeaderGuide
                :page-title="trans('gestionale.gestioni_form.edit.heading_title', { gestione: props.gestione.nome })"
                :page-subtitle="trans('gestionale.gestioni_form.edit.heading_description')"
                :guides="pageGuides"
                :breadcrumbs="(breadcrumbs as any)"
                :back-url="generatePath('gestionale/:condominio/esercizi/:esercizio/gestioni', { condominio: props.condominio.id, esercizio: props.esercizio.id })"
                :back-text="trans('gestionale.list_pages.scale.create.back_to_list')"
            />

            <form @submit.prevent="submit" class="space-y-6">

                <Card class="border-dashed shadow-sm bg-slate-50/50 dark:bg-slate-900/20">
                    <CardHeader class="pb-3 border-b border-dashed mb-4">
                        <CardTitle class="text-base font-semibold">{{ trans('gestionale.gestioni_form.create.sections.main_data_title') }}</CardTitle>
                        <CardDescription>{{ trans('gestionale.gestioni_form.create.sections.main_data_description') }}</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-6">

                        <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                            <div class="sm:col-span-3">
                                <Label for="nome">{{ trans('gestionale.gestioni_form.create.labels.management_name') }}</Label>
                                <Input
                                    id="nome"
                                    class="mt-1 block w-full bg-white dark:bg-slate-950"
                                    v-model="form.nome"
                                    @focus="form.clearErrors('nome')"
                                    :placeholder="trans('gestionale.gestioni_form.create.placeholders.name')"
                                />
                                <InputError :message="form.errors.nome" />
                            </div>

                            <div class="sm:col-span-3">
                                <Label for="tipo">{{ trans('gestionale.form_common.labels.type') }}</Label>
                                <v-select
                                    :options="tipologie"
                                    label="label"
                                    class="mt-1 block w-full bg-white dark:bg-slate-950"
                                    v-model="form.tipo"
                                    :placeholder="trans('gestionale.gestioni_form.create.placeholders.type')"
                                    @update:modelValue="form.clearErrors('tipo')"
                                    :reduce="(d: DropdownType) => d.id"
                                    :clearable="false"
                                />
                                <InputError :message="form.errors.tipo" />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                            <div class="sm:col-span-6">
                                <Label for="descrizione">{{ trans('gestionale.form_common.labels.description') }}</Label>
                                <Input
                                    id="descrizione"
                                    class="mt-1 block w-full bg-white dark:bg-slate-950"
                                    v-model="form.descrizione"
                                    @focus="form.clearErrors('descrizione')"
                                    :placeholder="trans('gestionale.form_common.placeholders.description_optional')"
                                />
                                <InputError :message="form.errors.descrizione" />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                            <div class="sm:col-span-3">
                                <Label for="data_inizio">{{ trans('gestionale.form_common.labels.start_date') }}</Label>
                                <VueDatePicker
                                    v-model="form.data_inizio"
                                    class="w-full mt-1"
                                    format="dd/MM/yyyy"
                                    locale="pt-PT"
                                    :enable-time-picker="false"
                                    auto-apply
                                    @update:modelValue="form.clearErrors('data_inizio')"
                                    :placeholder="trans('gestionale.gestioni_form.create.placeholders.date')"
                                />
                                <InputError :message="form.errors.data_inizio" />
                            </div>

                            <div class="sm:col-span-3">
                                <Label for="data_fine">{{ trans('gestionale.form_common.labels.end_date') }}</Label>
                                <VueDatePicker
                                    v-model="form.data_fine"
                                    class="w-full mt-1"
                                    format="dd/MM/yyyy"
                                    locale="pt-PT"
                                    :enable-time-picker="false"
                                    auto-apply
                                    @update:modelValue="form.clearErrors('data_fine')"
                                    :placeholder="trans('gestionale.gestioni_form.create.placeholders.date')"
                                />
                                <InputError :message="form.errors.data_fine" />
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <Card class="border-dashed shadow-sm bg-slate-50/50 dark:bg-slate-900/20">
                    <CardHeader class="pb-3 border-b border-dashed mb-4">
                        <CardTitle class="text-base font-semibold">{{ trans('gestionale.gestioni_form.create.sections.internal_notes_title') }}</CardTitle>
                        <CardDescription>{{ trans('gestionale.gestioni_form.create.sections.internal_notes_description') }}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                            <div class="sm:col-span-6">
                                <Label for="note">{{ trans('gestionale.form_common.labels.notes') }}</Label>
                                <Textarea
                                    id="note"
                                    :placeholder="trans('gestionale.form_common.placeholders.insert_note')"
                                    v-model="form.note"
                                    @focus="form.clearErrors('note')"
                                    class="mt-1 bg-white dark:bg-slate-950 resize-none"
                                    rows="3"
                                />
                                <InputError :message="form.errors.note" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div class="flex items-center justify-end gap-3">
                    <Link
                        :href="generatePath('gestionale/:condominio/esercizi/:esercizio/gestioni', { condominio: props.condominio.id, esercizio: props.esercizio.id })"
                        class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        {{ trans('gestionale.form_common.actions.cancel') }}
                    </Link>

                    <Button
                        type="submit"
                        :disabled="form.processing"
                        class="h-9 px-8 text-[10px] font-bold uppercase tracking-widest shadow-md gap-2"
                    >
                        <LoaderCircle v-if="form.processing" class="h-4 w-4 animate-spin" />
                        <Save v-else class="h-3.5 w-3.5" />
                        {{ trans('gestionale.gestioni_form.edit.actions.save_changes') }}
                    </Button>
                </div>

            </form>
        </div>
    </GestionaleLayout>
</template>

<style src="vue-select/dist/vue-select.css"></style>
