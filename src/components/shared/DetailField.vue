<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    label: string
    value?: string | number | null
    multiline?: boolean
}>()

const display = computed(() =>
    props.value === null || props.value === undefined || props.value === ''
        ? '-'
        : props.value,
)
</script>

<template>
    <div>
        <p class="text-sm font-medium text-muted-foreground">
            {{ label }}
        </p>

        <p
    class="mt-2 rounded-md bg-muted/50 px-3 py-2.5 text-sm font-medium text-foreground"
    :class="{ 'whitespace-pre-wrap': multiline }"
>
            <slot v-if="$slots.default" />
            <template v-else>{{ display }}</template>
        </p>
    </div>
</template>