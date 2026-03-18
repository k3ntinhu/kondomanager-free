<script setup lang="ts">
import { router } from "@inertiajs/vue3"
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { usePermission } from "@/composables/permissions";
import { MoreHorizontal, Eye, CreditCard, Trash2 } from 'lucide-vue-next'
import { trans } from 'laravel-vue-i18n';

const props = defineProps<{
  fattura: any,
  condominioId: number
}>()

const { generateRoute } = usePermission();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0 data-[state=open]:bg-muted">
        <span class="sr-only">{{ trans('gestionale.fatture.actions.open_menu') }}</span>
        <MoreHorizontal class="h-4 w-4 text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[160px]">
      <DropdownMenuLabel class="text-xs font-normal text-muted-foreground">{{ trans('gestionale.fatture.actions.invoice_number') }} {{ fattura.numero_documento }}</DropdownMenuLabel>
      
      <DropdownMenuItem @click="router.visit(route(generateRoute('gestionale.fatture.show'), { condominio: condominioId, fattura: fattura.id }))">
        <Eye class="w-4 h-4 mr-2" /> {{ trans('gestionale.fatture.actions.details') }}
      </DropdownMenuItem>
      
      <DropdownMenuItem 
        v-if="fattura.stato_pagamento !== 'pagata'"
        @click="router.visit(route(generateRoute('gestionale.pagamenti.create'), { condominio: condominioId, fattura_id: fattura.id }))"
        class="text-blue-600 focus:text-blue-700 focus:bg-blue-50 font-medium"
      >
        <CreditCard class="w-4 h-4 mr-2" /> {{ trans('gestionale.fatture.actions.order_transfer') }}
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      
      <DropdownMenuItem class="text-red-600 focus:text-red-600 focus:bg-red-50">
        <Trash2 class="w-4 h-4 mr-2" /> {{ trans('gestionale.fatture.actions.delete') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
