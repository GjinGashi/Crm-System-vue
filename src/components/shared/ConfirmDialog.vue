<script setup lang="ts">
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

defineProps<{
    open: boolean
    title: string
    description: string
    confirmText: string
    loadingText?: string
    loading?: boolean
    destructive?: boolean
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    confirm: []
}>()
</script>

<template>
    <AlertDialog
        :open="open"
        @update:open="emit('update:open', $event)"
    >
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>
                    {{ title }}
                </AlertDialogTitle>

                <AlertDialogDescription>
                    {{ description }}
                </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
                <AlertDialogCancel>
                    Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                    :class="{
                        'bg-destructive text-destructive-foreground hover:bg-destructive/90':
                            destructive,
                    }"
                    :disabled="loading"
                    @click="emit('confirm')"
                >
                    {{ loading ? (loadingText ?? 'Processing...') : confirmText }}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
