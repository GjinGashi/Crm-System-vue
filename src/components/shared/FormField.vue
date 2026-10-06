<script setup lang="ts">
defineProps<{
    label: string
    required?: boolean
    error?: string
}>()
</script>

<template>
    <div class="space-y-1.5">
        <label class="text-sm font-medium">
            {{ label }}
            <span v-if="required" class="text-destructive">*</span>
        </label>

        <slot />

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    </div>
</template>