import { Sun, Zap } from 'lucide-vue-next';
import { trans } from 'laravel-vue-i18n';
import type { StatusType } from '@/types/gestionale/gestioni';

  
  export const typeConstants: StatusType[] = [
    { 
      value: 'ordinaria', 
      label: trans('gestionale.list_pages.gestioni.type_values.ordinary'),
      icon: Sun, 
      colorClass: 'text-green-500 bg-transparent'
    },
    { 
      value: 'straordinaria', 
      label: trans('gestionale.list_pages.gestioni.type_values.extraordinary'),
      icon: Zap, 
      colorClass: 'text-yellow-500 bg-transparent'
    }
  ];
  
