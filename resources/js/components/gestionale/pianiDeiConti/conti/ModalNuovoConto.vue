<script setup lang="ts">

import { useForm } from '@inertiajs/vue3'
import { ref, watch } from 'vue'
import { trans } from 'laravel-vue-i18n'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import InputError from '@/components/InputError.vue'
import { useTabelle } from '@/composables/useTabelle'
import { useCapitoliConti, type CapitoloDropdown } from '@/composables/useCapitoliConti'
import vSelect from 'vue-select'
import MoneyInput from '@/components/MoneyInput.vue'
import type { TabellaDropdown } from '@/types/gestionale/tabelle'

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'success'): void
}

interface Props {
  show: boolean
  condominioId: number
  esercizioId: number
  pianoContoId: number
  fornitori?: Array<{ id: number, ragione_sociale: string }> 
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const isCapitolo = ref(false)
const isSottoConto = ref(false)
const { tabelle, isLoading: isLoadingTabelle, fetchTabelle } = useTabelle()
const { capitoli, isLoading: isLoadingCapitoli, fetchCapitoliConti } = useCapitoliConti()

const moneyOptions = ref({
  prefix: '',              
  suffix: '',              
  thousands: '.',          
  decimal: ',',          
  precision: 2,            
  allowBlank: false,
  masked: true 
})

const form = useForm({
  nome: '',
  codice: '', 
  default_fornitore_id: null as number | null, 
  tipo_spesa: 'standard', 
  tipo: 'spesa' as 'spesa' | 'entrata',
  importo: '',
  descrizione: '',
  note: '',
  parent_id: null as number | null,
  tabella_millesimale_id: '' as string | number,
  percentuale_proprietario: 100,
  percentuale_inquilino: 0,
  percentuale_usufruttuario: 0,
  isCapitolo: false,
  isSottoConto: false,
})

watch(isCapitolo, (val) => {
  if (val) {
    isSottoConto.value = false
    form.parent_id = null
  }
  form.isCapitolo = val 
})

watch(isSottoConto, (val) => {
  if (val) {
    isCapitolo.value = false
  }
  form.isSottoConto = val 
})

const closeModal = () => {
  emit('update:show', false)
  form.reset()
}

const onDropdownTabelleOpen = () => {
  if (tabelle.value.length === 0) {
    fetchTabelle(props.condominioId)
  }
}

const onDropdownCapitoliOpen = () => {
  if (capitoli.value.length === 0) {
    fetchCapitoliConti(props.condominioId, props.pianoContoId)
  }
}

const submit = () => {
  form.post(route('admin.gestionale.esercizi.piani-conti.conti.store', {
    condominio: props.condominioId,
    esercizio: props.esercizioId,
    pianoConto: props.pianoContoId 
  }), {
    preserveScroll: true,
    onSuccess: () => {
      form.reset()
      isCapitolo.value = false
      isSottoConto.value = false
      emit('success')
      closeModal()
    },
    onError: (errors) => {
      console.error('Errore nella creazione della voce di spesa:', errors)
      isCapitolo.value = false
      isSottoConto.value = false
    }
  })
}
</script>

<template>
  <Dialog v-model:open="props.show" @update:open="closeModal">
    <DialogContent class="sm:max-w-[700px]"> <DialogHeader>
        <DialogTitle>{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.title') }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-4 overflow-y-auto px-6 max-h-[70vh]">
          <form @submit.prevent="submit" class="space-y-4 mt-2">
            <input type="hidden" v-model="form.isCapitolo" />
            <input type="hidden" v-model="form.isSottoConto" />

            <div class="grid grid-cols-4 gap-4">
               <div class="col-span-1">
                  <Label for="codice">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.code') }}</Label>
                  <Input id="codice" v-model="form.codice" :placeholder="trans('gestionale.list_pages.piani_conti.show.new_entry_modal.placeholders.code')" class="mt-1" />
               </div>
               <div class="col-span-3">
                  <Label for="nome">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.entry_name') }}</Label>
                  <Input id="nome" v-model="form.nome" :placeholder="trans('gestionale.list_pages.piani_conti.show.new_entry_modal.placeholders.entry_name')" class="mt-1" required />
                  <InputError :message="form.errors.nome" />
               </div>
            </div>

            <div>
              <Label for="descrizione">{{ trans('gestionale.form_common.labels.description') }}</Label>
              <Textarea id="descrizione" v-model="form.descrizione" :placeholder="trans('gestionale.list_pages.piani_conti.show.new_entry_modal.placeholders.description')" class="mt-1" />
            </div>

            <div class="flex items-center gap-6 pb-2">
              <Label class="font-medium">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.movement_type') }}</Label>
              <div class="flex items-center gap-2">
                <input type="radio" id="spesa" value="spesa" v-model="form.tipo" />
                <Label for="spesa">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.options.expense_outgoing') }}</Label>
              </div>
              <div class="flex items-center gap-2">
                <input type="radio" id="entrata" value="entrata" v-model="form.tipo" />
                <Label for="entrata">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.options.income') }}</Label>
              </div>
            </div>

            <div class="flex flex-col gap-3 border-y border-gray-100 py-3">
               <div class="flex items-center justify-between">
                 <Label for="isCapitolo" class="cursor-pointer">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.is_expense_chapter') }}</Label>
                 <Switch id="isCapitolo" v-model="isCapitolo" :disabled="isSottoConto" />
               </div>
               <div class="flex items-center justify-between">
                 <Label for="isSottoConto" class="cursor-pointer">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.is_expense_subaccount') }}</Label>
                 <Switch id="isSottoConto" v-model="isSottoConto" :disabled="isCapitolo" />
               </div>
            </div>

            <div v-if="isSottoConto">
              <Label>{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.parent_chapter') }}</Label>
              <v-select
                :options="capitoli"
                label="nome"
                v-model="form.parent_id"
                :placeholder="trans('gestionale.list_pages.piani_conti.show.new_entry_modal.placeholders.parent_chapter')"
                :reduce="(c: CapitoloDropdown) => c.id"
                @open="onDropdownCapitoliOpen"
                :loading="isLoadingCapitoli"
                :clearable="true"
                class="mt-1"
              >
              </v-select>
              <InputError :message="form.errors.parent_id" />
            </div>

            <div v-if="!isCapitolo" class="bg-slate-50 p-4 rounded-md border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                   <Label for="fornitore" class="text-xs font-semibold uppercase text-slate-500">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.suggested_supplier') }}</Label>
                   <select 
                      id="fornitore"
                      v-model="form.default_fornitore_id"
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-ring"
                   >
                      <option :value="null">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.options.none') }}</option>
                      <option v-for="f in props.fornitori" :key="f.id" :value="f.id">
                        {{ f.ragione_sociale }}
                      </option>
                   </select>
                   <p class="text-[10px] text-slate-500 mt-1">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.help.supplier_prefill') }}</p>
                </div>

                <div>
                   <Label for="tipo_spesa" class="text-xs font-semibold uppercase text-slate-500">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.fiscal_expense_nature') }}</Label>
                   <select 
                      id="tipo_spesa"
                      v-model="form.tipo_spesa"
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-ring"
                   >
                      <option value="standard">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.expense_types.standard') }}</option>
                      <option value="professionista">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.expense_types.professional') }}</option>
                      <option value="lavori">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.expense_types.works') }}</option>
                      <option value="utenza">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.expense_types.utility') }}</option>
                   </select>
                </div>
            </div>

            <div v-if="!isCapitolo">
              <Label for="importo">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.planned_amount') }}</Label>
              <MoneyInput
                id="importo"
                v-model="form.importo"
                :money-options="moneyOptions"
                :lazy="true" 
                :placeholder="trans('gestionale.list_pages.piani_conti.show.new_entry_modal.placeholders.amount')"
                class="mt-1"
                @focus="form.clearErrors('importo')"
              />
              <InputError :message="form.errors.importo" />
            </div>

            <div v-if="!isCapitolo">
              <Label>{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.allocation_table') }}</Label>
              <v-select
                :options="tabelle"
                label="nome"
                v-model="form.tabella_millesimale_id"
                :placeholder="trans('gestionale.list_pages.piani_conti.show.new_entry_modal.placeholders.allocation_table')"
                :reduce="(t: TabellaDropdown) => t.id"
                @open="onDropdownTabelleOpen"
                :loading="isLoadingTabelle"
                :clearable="true"
                class="mt-1"
              >
              </v-select>
              <InputError :message="form.errors.tabella_millesimale_id" />
            </div>

            <div v-if="!isCapitolo" class="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-md">
              <div>
                <Label class="text-xs">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.owner_percent') }}</Label>
                <Input type="number" v-model="form.percentuale_proprietario" placeholder="100" class="h-8 mt-1" />
              </div>
              <div>
                <Label class="text-xs">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.tenant_percent') }}</Label>
                <Input type="number" v-model="form.percentuale_inquilino" placeholder="0" class="h-8 mt-1" />
              </div>
              <div>
                <Label class="text-xs">{{ trans('gestionale.list_pages.piani_conti.show.new_entry_modal.labels.usufruct_percent') }}</Label>
                <Input type="number" v-model="form.percentuale_usufruttuario" placeholder="0" class="h-8 mt-1" />
              </div>
            </div>

            <div>
              <Label for="note">{{ trans('gestionale.form_common.labels.notes') }}</Label>
              <Textarea id="note" v-model="form.note" :placeholder="trans('gestionale.list_pages.piani_conti.show.new_entry_modal.placeholders.notes')" class="mt-1" />
            </div>

            <DialogFooter class="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" @click="closeModal">{{ trans('gestionale.form_common.actions.cancel') }}</Button>
              <Button type="submit" :disabled="form.processing">
                {{ form.processing ? trans('gestionale.list_pages.piani_conti.show.new_entry_modal.actions.saving') : trans('gestionale.form_common.actions.save') }}
              </Button>
            </DialogFooter>
          </form>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style src="vue-select/dist/vue-select.css"></style>
