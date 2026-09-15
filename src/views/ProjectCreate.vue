```vue
<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import api from '@/lib/api'

interface Client {
    id: string
    first_name: string
    last_name: string
}

const router = useRouter()

const clients = ref<Client[]>([])

const form = ref({
    client_id: null as string | null,
    name: '',
    description: '',
    status: 'Planning',
    priority: 'Low',
    start_date: '',
    due_date: '',
    budget: '' as string | number,
})

const errors = ref<Record<string, string[]>>({})
const error = ref('')
const isLoading = ref(false)

async function fetchClients() {
    try {
        const response = await api.get('/clients', {
            params: {
                archived: 0,
            },
        })

        clients.value = response.data
    } catch {
        error.value = 'Unable to load clients. Please try again.'
    }
}

async function createProject() {
    isLoading.value = true
    error.value = ''
    errors.value = {}

    try {
        await api.post('/projects', form.value)

        await router.push('/projects')
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            if (err.response?.status === 422) {
                errors.value = err.response.data.errors ?? {}
            } else {
                error.value =
                    err.response?.data?.message ??
                    'Unable to create project. Please try again.'
            }
        } else {
            error.value =
                'Unable to create project. Please try again.'
        }
    } finally {
        isLoading.value = false
    }
}

function cancel() {
    router.push('/projects')
}

onMounted(fetchClients)
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="space-y-6">
            <div>
                <Button variant="outline" type="button" @click="cancel">
                    Back to Projects
                </Button>

                <h1 class="mt-2 text-3xl font-bold tracking-tight">
                    Create Project
                </h1>

                <p class="text-muted-foreground">
                    Create a new project and assign it to a client.
                </p>
            </div>

            <div class="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <form novalidate class="space-y-5" @submit.prevent="createProject">
                    <div>
                        <label class="mb-1 block text-sm font-medium">
                            Project Name
                            <span class="text-destructive">*</span>
                        </label>

                        <Input v-model="form.name" placeholder="Enter project name" />

                        <p v-if="errors.name" class="text-destructive mt-1 text-sm">
                            {{ errors.name[0] }}
                        </p>
                    </div>

                    <div>
                        <label class="mb-1 block text-sm font-medium">
                            Client
                            <span class="text-destructive">*</span>
                        </label>

                        <select v-model="form.client_id"
                            class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm">
                            <option :value="null">
                                Select Client
                            </option>

                            <option v-for="client in clients" :key="client.id" :value="client.id">
                                {{ client.first_name }} {{ client.last_name }}
                            </option>
                        </select>

                        <p v-if="errors.client_id" class="text-destructive mt-1 text-sm">
                            {{ errors.client_id[0] }}
                        </p>
                    </div>

                    <div>
                        <label class="mb-1 block text-sm font-medium">
                            Description
                        </label>

                        <Textarea v-model="form.description" placeholder="Describe the project..." />

                        <p v-if="errors.description" class="text-destructive mt-1 text-sm">
                            {{ errors.description[0] }}
                        </p>
                    </div>

                    <div class="grid gap-5 md:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium">
                                Status
                            </label>

                            <select v-model="form.status"
                                class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm">
                                <option value="Planning">Planning</option>
                                <option value="In Progress">
                                    In Progress
                                </option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">
                                    Completed
                                </option>
                                <option value="Canceled">Canceled</option>
                            </select>

                            <p v-if="errors.status" class="text-destructive mt-1 text-sm">
                                {{ errors.status[0] }}
                            </p>
                        </div>

                        <div>
                            <label class="mb-1 block text-sm font-medium">
                                Priority
                            </label>

                            <select v-model="form.priority"
                                class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>

                            <p v-if="errors.priority" class="text-destructive mt-1 text-sm">
                                {{ errors.priority[0] }}
                            </p>
                        </div>
                    </div>

                    <div class="grid gap-5 md:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium">
                                Start Date
                            </label>

                            <Input v-model="form.start_date" type="date" />

                            <p v-if="errors.start_date" class="text-destructive mt-1 text-sm">
                                {{ errors.start_date[0] }}
                            </p>
                        </div>

                        <div>
                            <label class="mb-1 block text-sm font-medium">
                                Due Date
                            </label>

                            <Input v-model="form.due_date" type="date" />

                            <p v-if="errors.due_date" class="text-destructive mt-1 text-sm">
                                {{ errors.due_date[0] }}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label class="mb-1 block text-sm font-medium">
                            Budget
                        </label>

                        <Input v-model="form.budget" type="number" min="0" step="0.01" placeholder="0.00" />

                        <p v-if="errors.budget" class="text-destructive mt-1 text-sm">
                            {{ errors.budget[0] }}
                        </p>
                    </div>

                    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {{ error }}
                    </div>

                    <div class="flex gap-3 pt-2">
                        <Button type="submit" :disabled="isLoading">
                            {{
                                isLoading
                                    ? 'Creating...'
                                    : 'Create Project'
                            }}
                        </Button>

                        <Button type="button" variant="outline" :disabled="isLoading" @click="cancel">
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    </main>
</template>


