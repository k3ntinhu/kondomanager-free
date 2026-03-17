import { h } from 'vue';
import { trans } from 'laravel-vue-i18n';
import type { ColumnDef } from '@tanstack/vue-table';
import DataTableColumnHeader from '@/components/gestionale/saldi/DataTableColumnHeader.vue'; // <-- Import corretto!
import WalletCell from '@/components/gestionale/saldi/WalletCell.vue'; 
import type { ImmobileConSaldi } from '@/types/gestionale/saldi';
import type { Building } from '@/types/buildings';

export function getColumns(condominio: Building, gestioni: any[]): ColumnDef<ImmobileConSaldi>[] {
  return [
    {
      accessorKey: 'nome', 
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: trans('gestionale.saldi.table.property') }),
      cell: ({ row }) => {
        const immobile = row.original;
        const scala = immobile.scala ? `${trans('gestionale.saldi.labels.stair_short')} ${immobile.scala.name}` : '';
        const palazzina = immobile.palazzina ? `${trans('gestionale.saldi.labels.building_short')} ${immobile.palazzina.name}` : '';
        const location = [palazzina, scala].filter(Boolean).join(' - ');

        return h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'font-bold' }, `${immobile.nome} ${immobile.interno ? `(${trans('gestionale.saldi.labels.unit_short')} ${immobile.interno})` : ''}`),
          h('span', { class: 'text-xs text-muted-foreground' }, location),
        ]);
      },
    },
    {
      id: 'soggetti',
      header: () => h('div', { class: 'font-bold text-muted-foreground' }, trans('gestionale.saldi.table.subjects')),
      cell: ({ row }) => {
        const anagrafiche = row.original.anagrafiche;
        
        if (!anagrafiche || anagrafiche.length === 0) {
            return h('span', { class: 'text-xs text-muted-foreground italic' }, trans('gestionale.saldi.empty.no_subjects_associated'));
        }

        return h('div', { class: 'flex flex-col gap-2' }, 
          anagrafiche.map(anagrafica => h('div', { class: 'flex flex-col' }, [
            h('span', { class: 'font-medium text-sm' }, `${anagrafica.nome} ${anagrafica.cognome}`),
            h('span', { class: 'text-[10px] uppercase text-muted-foreground' }, anagrafica.pivot.tipo_rapporto)
          ]))
        );
      },
    },
    {
      id: 'wallet',
      header: () => h('div', { class: 'font-bold text-muted-foreground' }, trans('gestionale.saldi.table.wallet')),
      cell: ({ row }) => {
        return h(WalletCell, { 
            immobile: row.original, 
            gestioni: gestioni 
        });
      },
    },
  ];
}
