import { h } from 'vue'
import { trans } from 'laravel-vue-i18n';
import type { ColumnDef } from '@tanstack/vue-table'
import type { AnagraficaWithPivot } from '@/types/anagrafiche'
import type { Building } from '@/types/buildings'
import type { Immobile } from '@/types/gestionale/immobili'
import DropdownAction from '@/components/gestionale/immobili/anagrafiche/DataTableRowActions.vue'

export const createColumns = (condominio: Building, immobile: Immobile): ColumnDef<AnagraficaWithPivot>[] => [
  {
    accessorKey: 'nome',
    header: trans('gestionale.immobili_anagrafiche.table.name'),
    cell: ({ row }) => {
      const anagrafica = row.original as AnagraficaWithPivot
      return h('span', { class: 'capitalize font-bold' }, anagrafica.nome)
    },
  },
  {
    accessorKey: 'tipologia',
    header: trans('gestionale.immobili_anagrafiche.table.type'),
    cell: ({ row }) => {
      const anagrafica = row.original as AnagraficaWithPivot
      const tipologia = anagrafica.pivot.tipologia

      // Definisci il colore in base alla tipologia
      let colore = ''
      switch (tipologia) {
        case 'proprietario':
          colore = 'text-blue-600'   
          break
        case 'usufruttuario':
          colore = 'text-purple-600' 
          break
        case 'inquilino':
          colore = 'text-green-600'  
          break
        default:
          colore = 'text-gray-600'
      }

      return h('span', { class: `capitalize ${colore}` }, tipologia)
    },
  },
  {
    accessorKey: 'saldo.iniziale',
    header: trans('gestionale.immobili_anagrafiche.table.opening_balance'),
    cell: ({ row }) => {
      const anagrafica = row.original as AnagraficaWithPivot
      
      // Recuperiamo i valori con sicurezza (fallback se null)
      const saldoFormattato = anagrafica.saldo?.iniziale ?? '€ 0,00'
      const saldoRaw = anagrafica.saldo?.amounts?.iniziale ?? 0
      
      // 🔥 LOGICA COLORI CORRETTA (Standard Contabile)
      let colore = 'text-emerald-600' // Default: Zero/Pareggio (Verde)

      if (saldoRaw > 0) {
        colore = 'text-red-600' // Positivo = Debito (Rosso)
      } else if (saldoRaw < 0) {
        colore = 'text-blue-600' // Negativo = Credito (Blu)
      }

      return h('span', { class: `${colore} font-medium` }, saldoFormattato)
    },
  },
  {
    accessorKey: 'quota',
    header: trans('gestionale.immobili_anagrafiche.table.share'),
    cell: ({ row }) => {
      const anagrafica = row.original as AnagraficaWithPivot
      return h('span', { class: 'capitalize' }, `${anagrafica.pivot.quota} %`)
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const anagrafica = row.original as AnagraficaWithPivot
      return h(DropdownAction, {
        anagrafica,
        condominio,
        immobile
      })
    },
  },
]
