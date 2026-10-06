<script setup lang="ts">
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

defineProps<{
    open: boolean
    title: string
    description?: string
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
}>()
</script>

<template>
    <Dialog :open="open" @update:open="emit('update:open', $event)">
        <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{{ title }}</DialogTitle>

                <DialogDescription v-if="description">
                    {{ description }}
                </DialogDescription>
            </DialogHeader>

      
            <slot />
        </DialogContent>
    </Dialog>
</template>