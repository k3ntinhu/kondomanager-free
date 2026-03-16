import { CircleCheck, CircleX } from 'lucide-vue-next';
import { trans } from 'laravel-vue-i18n';
import type { StatusType } from '@/types/gestionale/esercizi';

  
  export const statusConstants: StatusType[] = [
    { 
      value: 'aperto', 
      label: trans('gestionale.esercizi_form.status_options.open'),
      icon: CircleCheck, 
      colorClass: 'text-green-500 bg-transparent'
    },
    { 
      value: 'chiuso', 
      label: trans('gestionale.esercizi_form.status_options.closed'),
      icon: CircleX, 
      colorClass: 'text-red-500 bg-transparent'
    }
  ];
  
