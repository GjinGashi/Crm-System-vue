<script setup lang="ts">
interface StatusItem {
    label: string
    value: number
    percentage: number
    color: string
}

defineProps<{
    title: string
    items: StatusItem[]
}>()
</script>

<template>
    <div>
        <h3 class="font-semibold text-slate-900">
            {{ title }}
        </h3>

        <div class="mt-6 space-y-5">
            <div v-for="item in items" :key="item.label">
                <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center gap-2">
                        <span
                            class="h-2 w-2 rounded-full"
                            :class="item.color"
                        ></span>

                        <span class="font-medium text-slate-700">
                            {{ item.label }}
                        </span>
                    </div>

                    <span class="font-semibold text-slate-900">
                        {{ item.value }}
                    </span>
                </div>

                <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="item.color"
                        :style="{ width: `${item.percentage}%` }"
                    ></div>
                </div>
            </div>
        </div>
    </div>
</template>