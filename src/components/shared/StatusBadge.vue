<script setup lang="ts">
defineProps<{ value: string }>()

const colors: Record<string, string> = {

    Low: 'bg-slate-100 text-slate-700',
    Medium: 'bg-blue-50 text-blue-700',
    High: 'bg-orange-50 text-orange-700',
    Urgent: 'bg-red-50 text-red-700',

    Todo: 'bg-slate-100 text-slate-700',
    Planning: 'bg-slate-100 text-slate-700',
    'In Progress': 'bg-blue-50 text-blue-700',
    'On Hold': 'bg-amber-50 text-amber-700',
    Completed: 'bg-emerald-50 text-emerald-700',
    Canceled: 'bg-red-50 text-red-700',
}
</script>

<template>
    <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" :class="colors[value]">
        {{ value }}
    </span>
</template>