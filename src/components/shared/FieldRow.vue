<script setup lang="ts">
defineProps<{ single?: boolean }>()
</script>

<template>
    <div
        class="grid gap-4 py-2"
        :class="single ? '' : 'sm:grid-cols-2'"
    >
        <slot />
    </div>
</template>