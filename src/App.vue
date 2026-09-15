<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import 'vue-sonner/style.css'
import AppLayout from '@/layouts/AppLayout.vue'

const route = useRoute()

const isAuthPage = computed(() => route.path === '/login')
</script>

<template>
    <AppLayout v-if="!isAuthPage">
        <RouterView />
    </AppLayout>

    <RouterView v-else />
</template>