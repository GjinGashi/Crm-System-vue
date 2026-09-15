```vue
<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import api from '@/lib/api'

interface Project {
    id: string
    name: string
}

interface User {
    id: string
    first_name: string
    last_name: string
}

const router = useRouter()

const projects = ref<Project[]>([])
const users = ref<User[]>([])

const form = ref({
    project_id: null as string | null,
    user_id: null as string | null,
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Low',
    start_time: '',
    end_time: '',
    due_date: '',
})

const errors = ref<Record<string, string[]>>({})
const error = ref('')
const isLoading = ref(false)

async function fetchProjects() {
    try {
        const response = await api.get('/projects', {
            params: {
                archived: 0,
            },
        })

        projects.value = response.data
    } catch {
        error.value = 'Unable to load projects. Please try again.'
    }
}

async function fetchUsers() {
    try {
        const response = await api.get('/users')

        users.value = response.data
    } catch {
        error.value = 'Unable to load users. Please try again.'
    }
}

async function createTask() {
    isLoading.value = true
    error.value = ''
    errors.value = {}

    if (
        form.value.start_time &&
        form.value.end_time &&
        form.value.end_time < form.value.start_time
    ) {
        error.value = 'End time cannot be before start time.'
        isLoading.value = false
        return
    }

    try {
        await api.post('/tasks', form.value)

        await router.push('/tasks')
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            if (err.response?.status === 422) {
                errors.value = err.response.data.errors ?? {}
            } else {
                error.value =
                    err.response?.data?.message ??
                    'Unable to create task. Please try again.'
            }
        } else {
            error.value =
                'Unable to create task. Please try again.'
        }
    } finally {
        isLoading.value = false
    }
}

function cancel() {
    router.push('/tasks')
}

onMounted(() => {
    fetchProjects()
    fetchUsers()
})
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="space-y-6">
            <div>
                <Button
                    variant="outline"
                    type="button"
                    @click="cancel"
                >
                    Back to Tasks
                </Button>

                <h1 class="mt-2 text-3xl font-bold tracking-tight">
                    Create Task
                </h1>

                <p class="text-muted-foreground">
                    Create a new task and assign it to a project and user.
                </p>
            </div>

            <div
                class="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <form
                    novalidate
                    class="space-y-5"
                    @submit.prevent="createTask"
                >
                    <div>
                        <label class="mb-1 block text-sm font-medium">
                            Task Title
                            <span class="text-destructive">*</span>
                        </label>

                        <Input
                            v-model="form.title"
                            placeholder="Enter task title"
                        />

                        <p
                            v-if="errors.title"
                            class="text-destructive mt-1 text-sm"
                        >
                            {{ errors.title[0] }}
                        </p>
                    </div>

                    <div class="grid gap-5 md:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium">
                                Project
                                <span class="text-destructive">*</span>
                            </label>

                            <select
                                v-model="form.project_id"
                                class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                            >
                                <option :value="null">
                                    Select Project
                                </option>

                                <option
                                    v-for="project in projects"
                                    :key="project.id"
                                    :value="project.id"
                                >
                                    {{ project.name }}
                                </option>
                            </select>

                            <p
                                v-if="errors.project_id"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.project_id[0] }}
                            </p>
                        </div>

                        <div>
                            <label class="mb-1 block text-sm font-medium">
                                Assigned User
                                <span class="text-destructive">*</span>
                            </label>

                            <select
                                v-model="form.user_id"
                                class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                            >
                                <option :value="null">
                                    Select User
                                </option>

                                <option
                                    v-for="user in users"
                                    :key="user.id"
                                    :value="user.id"
                                >
                                    {{ user.first_name }} {{ user.last_name }}
                                </option>
                            </select>

                            <p
                                v-if="errors.user_id"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.user_id[0] }}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label class="mb-1 block text-sm font-medium">
                            Description
                        </label>

                        <Textarea
                            v-model="form.description"
                            placeholder="Describe the task..."
                        />

                        <p
                            v-if="errors.description"
                            class="text-destructive mt-1 text-sm"
                        >
                            {{ errors.description[0] }}
                        </p>
                    </div>

                    <div class="grid gap-5 md:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium">
                                Status
                            </label>

                            <select
                                v-model="form.status"
                                class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                            >
                                <option value="Todo">Todo</option>
                                <option value="In Progress">
                                    In Progress
                                </option>
                                <option value="Completed">
                                    Completed
                                </option>
                                <option value="Canceled">
                                    Canceled
                                </option>
                            </select>

                            <p
                                v-if="errors.status"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.status[0] }}
                            </p>
                        </div>

                        <div>
                            <label class="mb-1 block text-sm font-medium">
                                Priority
                            </label>

                            <select
                                v-model="form.priority"
                                class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>

                            <p
                                v-if="errors.priority"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.priority[0] }}
                            </p>
                        </div>
                    </div>

                    <div class="grid gap-5 md:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium">
                                Start Time
                            </label>

                            <Input
                                v-model="form.start_time"
                                type="datetime-local"
                            />

                            <p
                                v-if="errors.start_time"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.start_time[0] }}
                            </p>
                        </div>

                        <div>
                            <label class="mb-1 block text-sm font-medium">
                                End Time
                            </label>

                            <Input
                                v-model="form.end_time"
                                type="datetime-local"
                            />

                            <p
                                v-if="errors.end_time"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.end_time[0] }}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label class="mb-1 block text-sm font-medium">
                            Due Date
                        </label>

                        <Input
                            v-model="form.due_date"
                            type="date"
                        />

                        <p
                            v-if="errors.due_date"
                            class="text-destructive mt-1 text-sm"
                        >
                            {{ errors.due_date[0] }}
                        </p>
                    </div>

                    <div
                        v-if="error"
                        class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {{ error }}
                    </div>

                    <div class="flex gap-3 pt-2">
                        <Button
                            type="submit"
                            :disabled="isLoading"
                        >
                            {{
                                isLoading
                                    ? 'Creating...'
                                    : 'Create Task'
                            }}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            :disabled="isLoading"
                            @click="cancel"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    </main>
</template>
```
