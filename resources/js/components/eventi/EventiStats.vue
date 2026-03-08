<script setup lang="ts">

import { AlertTriangle, ClockAlert, ClockArrowUp, Clock } from 'lucide-vue-next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trans } from 'laravel-vue-i18n';
import { computed } from 'vue';

const emit = defineEmits<{
  (e: 'setFilter', payload: { date_from: string; date_to: string }): void;
}>();

defineProps<{
  stats: {
    next_seven_days: number,
    next_fourteen_days: number,
    next_twentyeight_days: number,
    expired_last_seven_days?: number,
  }
}>();

const now = new Date();
const formatDate = (d: Date) => d.toISOString().slice(0, 10);

const displayStats = computed(() => ({
  expired_last_seven_days: {
    title: trans('eventi.stats.expired_last_seven_days'),
    icon: AlertTriangle,
    range: {
      date_from: formatDate(new Date(now.getTime() - 7 * 86400000)),
      date_to: formatDate(now),
    },
  },
  next_seven_days: {
    title: trans('eventi.stats.next_seven_days'),
    icon: ClockAlert,
    range: {
      date_from: formatDate(now),
      date_to: formatDate(new Date(now.getTime() + 7 * 86400000)),
    },
  },
  next_fourteen_days: {
    title: trans('eventi.stats.next_fourteen_days'),
    icon: ClockArrowUp,
    range: {
      date_from: formatDate(now),
      date_to: formatDate(new Date(now.getTime() + 14 * 86400000)),
    },
  },
  next_twentyeight_days: {
    title: trans('eventi.stats.next_twentyeight_days'),
    icon: Clock,
    range: {
      date_from: formatDate(now),
      date_to: formatDate(new Date(now.getTime() + 28 * 86400000)),
    },
  },
}));
</script>

<template>
  <div class="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
    <Card
      v-for="(stat, key) in displayStats"
      :key="key"
      class="cursor-pointer hover:shadow-lg transition"
      @click="emit('setFilter', stat.range)"
    >
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">
          {{ stat.title }}
        </CardTitle>
        <component :is="stat.icon" class="w-5 h-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">
          {{ stats[key] || 0 }}
        </div>
      </CardContent>
    </Card>
  </div>
</template>
