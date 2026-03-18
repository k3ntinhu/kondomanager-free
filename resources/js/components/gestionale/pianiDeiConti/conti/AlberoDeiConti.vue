<script setup lang="ts">
import { computed } from 'vue'
import { Folder, FolderOpen, FileText, Lock, Plus } from 'lucide-vue-next'
import { trans } from 'laravel-vue-i18n'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useCurrencyFormatter } from '@/composables/useCurrencyFormatter'
import type { Conto } from '@/types/gestionale/conti'

interface Props {
  conti: Conto[]
}

interface Emits {
  (e: 'seleziona', conto: Conto): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { euro } = useCurrencyFormatter()

const selezionaConto = (conto: Conto) => {
  emit('seleziona', conto)
}

const hasSottoconti = (conto: Conto) => {
  return conto.sottoconti && conto.sottoconti.length > 0
}

const isCapitolo = (conto: Conto) => {
  return conto.parent_id === null && (conto.importo === '€ 0,00' || conto.importo === '0,00')
}

const contiOrdinati = computed(() => {
  return [...props.conti].sort((a, b) => {
    const aIsCap = isCapitolo(a)
    const bIsCap = isCapitolo(b)
    if (aIsCap && !bIsCap) return -1
    if (!aIsCap && bIsCap) return 1
    return a.nome.localeCompare(b.nome)
  })
})

// ─── NUOVA LOGICA COLORI SINCRONIZZATA CON IL DETTAGLIO ───

// 1. Colore della barra (Background)
const getBarColor = (conto: Conto) => {
  const status = conto.stato_copertura
  
  if (status === 'over') {
    // Se c'è uno spostamento, è "Extra Budget" (Viola), altrimenti è Eccedenza (Rosso)
    const hasShift = conto.dettaglio_copertura?.some(d => d.is_shifted)
    return hasShift ? 'bg-purple-500' : 'bg-red-500'
  }

  switch (status) {
    case 'full': return 'bg-emerald-500'
    case 'partial': return 'bg-blue-500'
    default: return 'bg-gray-200'
  }
}

// 2. Colore del testo (Text)
const getTextColor = (conto: Conto) => {
  const status = conto.stato_copertura
  
  if (status === 'over') {
    const hasShift = conto.dettaglio_copertura?.some(d => d.is_shifted)
    return hasShift ? 'text-purple-600 font-bold' : 'text-red-600 font-bold'
  }

  switch (status) {
    case 'full': return 'text-emerald-600 font-bold'
    case 'partial': return 'text-blue-600 font-bold'
    default: return 'text-gray-600 font-medium'
  }
}
</script>

<template>
  <div class="albero-conti">
    <div v-if="props.conti.length === 0" class="text-center py-4 text-muted-foreground">
      <Empty class="border border-dashed">
        <EmptyHeader class="max-w-lg">
          <EmptyMedia variant="icon">
            <FolderOpen/>
          </EmptyMedia>
          <EmptyTitle>{{ trans('gestionale.list_pages.piani_conti.show.tree.empty_title') }}</EmptyTitle>
          <EmptyDescription>
            {{ trans('gestionale.list_pages.piani_conti.show.tree.empty_description') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
    
    <div v-else class="space-y-0">
      <div
        v-for="conto in contiOrdinati"
        :key="conto.id"
        class="conto-item"
      >
        <div 
          class="flex flex-col py-1.5 px-2 hover:bg-muted rounded cursor-pointer transition-colors border-b"
          @click="selezionaConto(conto)"
        >
          <div class="flex items-center gap-1.5">
            <div class="w-3"></div>

            <Folder v-if="isCapitolo(conto)" class="w-4 h-4 text-indigo-500" />
            <FileText v-else class="w-4 h-4 text-gray-400" />

            <div class="flex-1 truncate text-sm font-medium">
              <span v-if="conto.codice" class="text-xs text-gray-500 mr-1.5">[{{ conto.codice }}]</span>
              <span :class="{'font-bold': isCapitolo(conto)}">{{ conto.nome }}</span>
            </div>

            <div class="flex items-center gap-1.5">
              <Lock v-if="conto.has_rate_emesse" class="w-3 h-3 text-amber-500" :title="trans('gestionale.list_pages.piani_conti.show.tree.locked_by_installments')" />
              
              <span 
                v-if="!isCapitolo(conto)" 
                class="text-sm font-medium"
                :class="conto.tipo === 'spesa' ? 'text-gray-900' : 'text-green-600'"
              >
                {{ conto.importo }} 
              </span>
            </div>
          </div>

          <div v-if="!isCapitolo(conto) && conto.percentuale_copertura !== undefined" class="mt-1 pl-6 pr-2">
              
              <div class="flex items-center">
                <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    :class="getBarColor(conto)"
                    :style="{ width: `${Math.min(conto.percentuale_copertura || 0, 100)}%` }"
                  ></div>
                </div>
              </div>

              <div class="flex justify-between items-center mt-0.5">
                <span class="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">
                  {{ trans('gestionale.list_pages.piani_conti.show.tree.coverage') }}
                </span>
                <div class="flex items-center gap-0.5 text-[10px]">
                  
                  <span :class="getTextColor(conto)">
                     {{ euro(conto.impegnato || 0) }}
                  </span>
                  
                  <span class="text-gray-400">/</span>
                  
                  <span class="text-gray-600 font-medium">
                      {{ conto.importo }}
                  </span>
                </div>
              </div>

              <div v-if="conto.stato_copertura === 'partial' && (conto.impegnato || 0) == 0" class="text-[9px] text-amber-600 mt-0.5">
                {{ trans('gestionale.list_pages.piani_conti.show.tree.no_direct_fund') }}
              </div>

          </div>
        </div>

        <div v-if="isCapitolo(conto)">
          <div 
            v-if="hasSottoconti(conto)" 
            class="sottoconti border-l-2 border-muted ml-4 border-b"
          >
            <AlberoDeiConti 
              :conti="conto.sottoconti || []" 
              @seleziona="selezionaConto"
            />
          </div>

          <div 
            v-else 
            class="ml-8 py-2 pr-4 border-l border-dashed border-slate-200"
          >
            <p class="text-[10px] text-slate-400 italic flex items-center gap-1.5">
              <Plus class="w-3 h-3" />
              {{ trans('gestionale.list_pages.piani_conti.show.tree.no_subaccounts_hint') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conto-item:last-child {
  border-bottom: none;
}
.sottoconti > div:last-child {
  border-bottom: none;
}
</style>
