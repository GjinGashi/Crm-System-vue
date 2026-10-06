<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Users, FolderKanban, CheckSquare } from 'lucide-vue-next'

import DashboardStatusCard from '@/components/dashboard/DashboardStatusCard.vue'
import api from '@/lib/api'

interface DashboardData {
    clients: {
        total: number
        active: number
        inactive: number
        lead: number
        archived: number
    }
    projects: {
        total: number
        planning: number
        in_progress: number
        on_hold: number
        completed: number
        canceled: number
        archived: number
    }
    tasks: {
        total: number
        todo: number
        in_progress: number
        completed: number
        canceled: number
        archived: number
    }
}

const dashboard = ref<DashboardData | null>(null)
const loading = ref(true)
const error = ref(false)

async function fetchDashboardData() {
    loading.value = true
    error.value = false

    try {
        const response = await api.get('/dashboard')
        dashboard.value = response.data
    } catch (err) {
        console.error('Failed to load dashboard data:', err)
        error.value = true
    } finally {
        loading.value = false
    }
}

function percentage(value: number, total: number) {
    if (!total) return 0

    return Math.min(Math.round((value / total) * 100), 100)
}

onMounted(fetchDashboardData)
</script>

<template>
    <div class="p-6 lg:p-8">
        <div
            v-if="error"
            class="mt-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4"
        >
            <div>
                <p class="font-medium text-red-800">
                    Unable to load dashboard data.
                </p>

                <p class="mt-1 text-sm text-red-600">
                    Please try again.
                </p>
            </div>

            <button
                type="button"
                class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                @click="fetchDashboardData"
            >
                Retry
            </button>
        </div>

        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500">
                            Clients
                        </p>

                        <p class="mt-2 text-3xl font-bold text-slate-900">
                            {{ loading ? '...' : dashboard?.clients.total ?? 0 }}
                        </p>

                        <p class="mt-1 text-xs text-slate-500">
                            Active records
                        </p>
                    </div>

                    <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                        <Users class="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500">
                            Projects
                        </p>

                        <p class="mt-2 text-3xl font-bold text-slate-900">
                            {{ loading ? '...' : dashboard?.projects.total ?? 0 }}
                        </p>

                        <p class="mt-1 text-xs text-slate-500">
                            Active projects
                        </p>
                    </div>

                    <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-50">
                        <FolderKanban class="h-6 w-6 text-violet-600" />
                    </div>
                </div>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500">
                            Tasks
                        </p>

                        <p class="mt-2 text-3xl font-bold text-slate-900">
                            {{ loading ? '...' : dashboard?.tasks.total ?? 0 }}
                        </p>

                        <p class="mt-1 text-xs text-slate-500">
                            Active tasks
                        </p>
                    </div>

                    <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
                        <CheckSquare class="h-6 w-6 text-emerald-600" />
                    </div>
                </div>
            </div>
        </div>

        <div
            v-if="!loading && dashboard"
            class="mt-12 grid gap-12 lg:grid-cols-3"
        >
            <DashboardStatusCard
                title="Client Status"
                :items="[
                    {
                        label: 'Active',
                        value: dashboard.clients.active,
                        percentage: percentage(
                            dashboard.clients.active,
                            dashboard.clients.total,
                        ),
                        color: 'bg-emerald-500',
                    },
                    {
                        label: 'Inactive',
                        value: dashboard.clients.inactive,
                        percentage: percentage(
                            dashboard.clients.inactive,
                            dashboard.clients.total,
                        ),
                        color: 'bg-slate-400',
                    },
                    {
                        label: 'Lead',
                        value: dashboard.clients.lead,
                        percentage: percentage(
                            dashboard.clients.lead,
                            dashboard.clients.total,
                        ),
                        color: 'bg-blue-500',
                    },
                ]"
            />

            <DashboardStatusCard
                title="Project Status"
                :items="[
                    {
                        label: 'Planning',
                        value: dashboard.projects.planning,
                        percentage: percentage(
                            dashboard.projects.planning,
                            dashboard.projects.total,
                        ),
                        color: 'bg-slate-400',
                    },
                    {
                        label: 'In Progress',
                        value: dashboard.projects.in_progress,
                        percentage: percentage(
                            dashboard.projects.in_progress,
                            dashboard.projects.total,
                        ),
                        color: 'bg-blue-500',
                    },
                    {
                        label: 'On Hold',
                        value: dashboard.projects.on_hold,
                        percentage: percentage(
                            dashboard.projects.on_hold,
                            dashboard.projects.total,
                        ),
                        color: 'bg-amber-500',
                    },
                    {
                        label: 'Completed',
                        value: dashboard.projects.completed,
                        percentage: percentage(
                            dashboard.projects.completed,
                            dashboard.projects.total,
                        ),
                        color: 'bg-emerald-500',
                    },
                    {
                        label: 'Canceled',
                        value: dashboard.projects.canceled,
                        percentage: percentage(
                            dashboard.projects.canceled,
                            dashboard.projects.total,
                        ),
                        color: 'bg-red-500',
                    },
                ]"
            />

            <DashboardStatusCard
                title="Task Status"
                :items="[
                    {
                        label: 'Todo',
                        value: dashboard.tasks.todo,
                        percentage: percentage(
                            dashboard.tasks.todo,
                            dashboard.tasks.total,
                        ),
                        color: 'bg-slate-400',
                    },
                    {
                        label: 'In Progress',
                        value: dashboard.tasks.in_progress,
                        percentage: percentage(
                            dashboard.tasks.in_progress,
                            dashboard.tasks.total,
                        ),
                        color: 'bg-blue-500',
                    },
                    {
                        label: 'Completed',
                        value: dashboard.tasks.completed,
                        percentage: percentage(
                            dashboard.tasks.completed,
                            dashboard.tasks.total,
                        ),
                        color: 'bg-emerald-500',
                    },
                    {
                        label: 'Canceled',
                        value: dashboard.tasks.canceled,
                        percentage: percentage(
                            dashboard.tasks.canceled,
                            dashboard.tasks.total,
                        ),
                        color: 'bg-red-500',
                    },
                ]"
            />
        </div>

        <div
            v-else-if="loading"
            class="mt-12 grid gap-12 lg:grid-cols-3"
        >
            <div
                v-for="card in 3"
                :key="card"
                class="h-105 animate-pulse rounded-lg bg-slate-50"
            ></div>
        </div>
    </div>
</template>