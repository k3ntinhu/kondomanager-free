import { h } from 'vue'
import DataTableColumnHeader from '@/components/gestionale/movimenti/fatture/DataTableColumnHeader.vue' 
import DropdownAction from './DataTableRowActions.vue'
import { Archive, AlertTriangle, CheckCircle, Clock, FileMinus } from 'lucide-vue-next'
import { useCurrencyFormatter } from '@/composables/useCurrencyFormatter'
import { trans } from 'laravel-vue-i18n'
import type { FatturaPassiva } from '@/types/gestionale/fatture'
import type { ColumnDef } from '@tanstack/vue-table'

const { euro } = useCurrencyFormatter(); 

export const createColumns = (condominioId: number): ColumnDef<FatturaPassiva>[] => [
  {
    accessorKey: 'fornitore',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: trans('gestionale.fatture.table.supplier_document') }),
    size: 280,
    cell: ({ row }) => {
        const fattura = row.original;
        const fornitoreNome = fattura.fornitore?.ragione_sociale || trans('gestionale.fatture.table.na');
        
        // Riga 1: nome fornitore
        // Riga 2: numero documento + dot ritenuta (discreto)
        // Riga 3: badge tipo documento + badge pregresso (solo se presenti)

        const badgeRow = [];

        if (fattura.tipo_documento === 'nota_credito') {
            badgeRow.push(
                h('span', { 
                    class: 'inline-flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded' 
                }, [h(FileMinus, { class: 'w-3 h-3' }), ` ${trans('gestionale.fatture.table.credit_note')}`])
            );
        }

        if (fattura.is_pregresso) {
            badgeRow.push(
                h('span', { 
                    class: 'inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded' 
                }, [h(Archive, { class: 'w-3 h-3' }), ` ${trans('gestionale.fatture.table.previous_balance')}`])
            );
        }

        return h('div', { class: 'flex flex-col gap-0.5 overflow-hidden' }, [
            // Riga 1: Ragione sociale
            h('span', { class: 'font-bold text-sm text-slate-900 truncate' }, fornitoreNome),

            // Riga 2: Numero documento + dot ritenuta
            h('span', { class: 'text-xs text-slate-400 font-mono flex items-center gap-1.5' }, [
                `${trans('gestionale.fatture.table.number_short')} ${fattura.numero_documento}`,
                fattura.importo_ritenuta && fattura.importo_ritenuta > 0
                    ? h('span', { 
                        class: 'w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 cursor-help',
                        title: trans('gestionale.fatture.table.withholding_tax')
                      })
                    : null
            ]),

            // Riga 3: Badge (solo se presenti)
            badgeRow.length > 0
                ? h('div', { class: 'flex items-center gap-1 flex-wrap mt-0.5' }, badgeRow)
                : null
        ]);
    },
    enableSorting: false,
  },
  {
    accessorKey: 'data_documento',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: trans('gestionale.fatture.table.dates') }),
    size: 130,
    cell: ({ row }) => {
        const fattura = row.original;
        const dataDoc  = new Date(fattura.data_documento).toLocaleDateString('it-IT');
        const dataScad = new Date(fattura.data_scadenza).toLocaleDateString('it-IT');
        const isScaduta = new Date(fattura.data_scadenza) < new Date() && fattura.stato_pagamento !== 'pagata';

        return h('div', { class: 'flex flex-col gap-0.5' }, [
            h('span', { class: 'text-xs text-slate-600 font-medium whitespace-nowrap' }, `${trans('gestionale.fatture.table.doc_short')}: ${dataDoc}`),
            h('span', { class: `text-xs whitespace-nowrap ${isScaduta ? 'text-red-600 font-bold' : 'text-slate-400'}` }, `${trans('gestionale.fatture.table.due_short')}: ${dataScad}`)
        ]);
    },
  },
  {
    accessorKey: 'stato_approvazione',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: trans('gestionale.fatture.table.approval') }),
    size: 150,
    cell: ({ row }) => {
        const stato = row.getValue('stato_approvazione') as string;

        const config: Record<string, { label: string; class: string; icon: any }> = {
            approvata: { 
                label: trans('gestionale.fatture.status.approved'), 
                class: 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
                icon: CheckCircle 
            },
            da_approvare: { 
                label: trans('gestionale.fatture.status.to_approve'), 
                class: 'bg-slate-100 text-slate-500 border border-slate-200', 
                icon: Clock 
            },
            contestata: { 
                label: trans('gestionale.fatture.status.disputed'), 
                class: 'bg-red-50 text-red-700 border border-red-200', 
                icon: AlertTriangle 
            },
            sforo_motivato: { 
                label: trans('gestionale.fatture.status.overrun_motivated'), 
                class: 'bg-orange-50 text-orange-700 border border-orange-200', 
                icon: AlertTriangle 
            },
        };

        const { label, class: cssClass, icon } = config[stato] ?? config['da_approvare'];

        return h('span', { 
            class: `inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider whitespace-nowrap ${cssClass}` 
        }, [
            h(icon, { class: 'w-3 h-3 shrink-0' }), 
            label
        ]);
    }
  },
  {
    accessorKey: 'stato_pagamento',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: trans('gestionale.fatture.table.payment') }),
    size: 120,
    cell: ({ row }) => {
        const stato = row.getValue('stato_pagamento') as string;

        const config: Record<string, { label: string; class: string; icon: any }> = {
            aperta:   { 
                label: trans('gestionale.fatture.status.to_pay'), 
                class: 'bg-amber-50 text-amber-700 border border-amber-200', 
                icon: Clock 
            },
            pagata:   { 
                label: trans('gestionale.fatture.status.paid'), 
                class: 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
                icon: CheckCircle 
            },
            parziale: { 
                label: trans('gestionale.fatture.status.partial'), 
                class: 'bg-blue-50 text-blue-700 border border-blue-200', 
                icon: AlertTriangle 
            },
        };

        const { label, class: cssClass, icon } = config[stato] ?? config['aperta'];

        return h('span', { 
            class: `inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider whitespace-nowrap ${cssClass}` 
        }, [
            h(icon, { class: 'w-3 h-3 shrink-0' }), 
            label
        ]);
    }
  },
  {
    accessorKey: 'netto_a_pagare', 
    header: ({ column }) => h(DataTableColumnHeader, { column, title: trans('gestionale.fatture.table.amount') }),
    size: 120,
    cell: ({ row }) => {
        const importoRaw = row.getValue('netto_a_pagare') as number;
        const isNota = importoRaw < 0;

        return h('div', { class: 'flex flex-col items-end' }, [
            h('span', { 
                class: `font-black text-sm whitespace-nowrap ${isNota ? 'text-emerald-600' : 'text-slate-900'}` 
            }, euro(importoRaw)),
            isNota
                ? h('span', { class: 'text-[9px] text-emerald-500 font-bold uppercase tracking-wide' }, trans('gestionale.fatture.table.credit'))
                : null
        ]);
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    size: 50,
    cell: ({ row }) => h(DropdownAction, { 
        fattura: row.original,
        condominioId: condominioId 
    }),
  },
]
