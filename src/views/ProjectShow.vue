```vue
<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import api from '@/lib/api'

interface Client {
    id: number
    first_name: string
    last_name: string
}

interface Task {
    id: number
    title: string
    description: string | null
    status: string
    priority: string
}

interface Project {
    id: number
    name: string
    description: string | null
    status: string
    priority: string
    start_date: string | null
    due_date: string | null
    budget: number | null
    client: Client | null
    tasks: Task[]
}

const route = useRoute()
const router = useRouter()

const project = ref<Project | null>(null)
const clients = ref<Client[]>([])

const error = ref('')
const errors = ref<Record<string, string[]>>({})

const isLoading = ref(true)
const isEditing = ref(false)
const isSaving = ref(false)
const isLoadingClients = ref(false)

const form = ref({
    client_id: '',
    name: '',
    description: '',
    status: 'Planning',
    priority: 'Low',
    start_date: '',
    due_date: '',
    budget: '',
})

async function fetchClients() {
    isLoadingClients.value = true

    try {
        const response = await api.get('/clients', {
            params: {
                archived: 0,
            },
        })

        clients.value = response.data
    } catch {
        clients.value = []
    } finally {
        isLoadingClients.value = false
    }
}

async function fetchProject() {
    isLoading.value = true
    error.value = ''

    try {
        const projectId = route.params.id

        const response = await api.get(`/projects/${projectId}`)

        const data: Project = response.data

        project.value = data

        form.value = {
            client_id: data.client?.id?.toString() ?? '',
            name: data.name,
            description: data.description ?? '',
            status: data.status,
            priority: data.priority,
            start_date: data.start_date ?? '',
            due_date: data.due_date ?? '',
            budget: data.budget?.toString() ?? '',
        }
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            error.value =
                err.response?.data?.message ??
                'Unable to load project. Please try again.'
        } else {
            error.value =
                'Unable to load project. Please try again.'
        }
    } finally {
        isLoading.value = false
    }
}

function goBack() {
    router.push('/projects')
}

function startEditing() {
    if (!project.value) {
        return
    }

    form.value = {
        client_id: project.value.client?.id?.toString() ?? '',
        name: project.value.name,
        description: project.value.description ?? '',
        status: project.value.status,
        priority: project.value.priority,
        start_date: project.value.start_date ?? '',
        due_date: project.value.due_date ?? '',
        budget: project.value.budget?.toString() ?? '',
    }

    errors.value = {}
    error.value = ''
    isEditing.value = true

    if (clients.value.length === 0) {
        fetchClients()
    }
}

function cancelEditing() {
    if (!project.value) {
        return
    }

    form.value = {
        client_id: project.value.client?.id?.toString() ?? '',
        name: project.value.name,
        description: project.value.description ?? '',
        status: project.value.status,
        priority: project.value.priority,
        start_date: project.value.start_date ?? '',
        due_date: project.value.due_date ?? '',
        budget: project.value.budget?.toString() ?? '',
    }

    errors.value = {}
    error.value = ''
    isEditing.value = false
}

async function saveProject() {
    if (!project.value) {
        return
    }

    errors.value = {}
    error.value = ''
    isSaving.value = true

    try {
        const response = await api.patch(
            `/projects/${project.value.id}`,
            {
                client_id: Number(form.value.client_id),
                name: form.value.name,
                description: form.value.description,
                status: form.value.status,
                priority: form.value.priority,
                start_date: form.value.start_date || null,
                due_date: form.value.due_date || null,
                budget:
                    form.value.budget === ''
                        ? null
                        : Number(form.value.budget),
            },
        )

        const updatedProject: Project = response.data

        project.value = updatedProject

        form.value = {
            client_id:
                updatedProject.client?.id?.toString() ?? '',
            name: updatedProject.name,
            description: updatedProject.description ?? '',
            status: updatedProject.status,
            priority: updatedProject.priority,
            start_date: updatedProject.start_date ?? '',
            due_date: updatedProject.due_date ?? '',
            budget: updatedProject.budget?.toString() ?? '',
        }

        isEditing.value = false
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            if (err.response?.status === 422) {
                errors.value =
                    err.response.data.errors ?? {}
            } else {
                error.value =
                    err.response?.data?.message ??
                    'Unable to update project. Please try again.'
            }
        } else {
            error.value =
                'Unable to update project. Please try again.'
        }
    } finally {
        isSaving.value = false
    }
}

function openTask(id: number) {
    router.push(`/tasks/${id}`)
}

onMounted(async () => {
    await Promise.all([
        fetchProject(),
        fetchClients(),
    ])
})
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">
                        Project Details
                    </h1>

                    <p class="text-muted-foreground">
                        View project information and related tasks
                    </p>
                </div>

                <div class="flex gap-2">
                    <Button
                        variant="outline"
                        type="button"
                        @click="goBack"
                    >
                        Back to Projects
                    </Button>

                    <template v-if="project">
                        <Button
                            v-if="!isEditing"
                            type="button"
                            @click="startEditing"
                        >
                            Edit Project
                        </Button>

                        <template v-else>
                            <Button
                                type="button"
                                :disabled="
                                    isSaving || isLoadingClients
                                "
                                @click="saveProject"
                            >
                                {{ isSaving ? 'Saving...' : 'Save' }}
                            </Button>

                            <Button
                                variant="outline"
                                type="button"
                                :disabled="isSaving"
                                @click="cancelEditing"
                            >
                                Cancel
                            </Button>
                        </template>
                    </template>
                </div>
            </div>

            <div v-if="isLoading">
                <p class="text-muted-foreground">
                    Loading project...
                </p>
            </div>

            <div v-else-if="error">
                <p
                    class="text-destructive rounded-md bg-red-50 p-3 text-sm"
                >
                    {{ error }}
                </p>
            </div>

            <div
                v-else-if="project"
                class="space-y-6"
            >
                <div class="space-y-4 rounded-lg border p-6">
                    <div class="flex items-center gap-3">
                        <h2 class="text-xl font-semibold">
                            {{ project.name }}
                        </h2>

                        <span
                            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                            :class="{
                                'bg-slate-100 text-slate-700':
                                    project.status === 'Planning',
                                'bg-blue-50 text-blue-700':
                                    project.status === 'In Progress',
                                'bg-amber-50 text-amber-700':
                                    project.status === 'On Hold',
                                'bg-emerald-50 text-emerald-700':
                                    project.status === 'Completed',
                                'bg-red-50 text-red-700':
                                    project.status === 'Canceled',
                            }"
                        >
                            {{ project.status }}
                        </span>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Project Name
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.name"
                            />

                            <p
                                v-if="isEditing && errors.name"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.name[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ project.name }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Client
                            </p>

                            <Select
                                v-if="isEditing"
                                v-model="form.client_id"
                                :disabled="isLoadingClients"
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder="Select Client"
                                    />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem
                                        v-for="client in clients"
                                        :key="client.id"
                                        :value="
                                            client.id.toString()
                                        "
                                    >
                                        {{ client.first_name }}
                                        {{ client.last_name }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <p
                                v-if="
                                    isEditing &&
                                    errors.client_id
                                "
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.client_id[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{
                                    project.client
                                        ? `${project.client.first_name} ${project.client.last_name}`
                                        : '-'
                                }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Status
                            </p>

                            <select
                                v-if="isEditing"
                                v-model="form.status"
                                class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                            >
                                <option value="Planning">
                                    Planning
                                </option>

                                <option value="In Progress">
                                    In Progress
                                </option>

                                <option value="On Hold">
                                    On Hold
                                </option>

                                <option value="Completed">
                                    Completed
                                </option>

                                <option value="Canceled">
                                    Canceled
                                </option>
                            </select>

                            <p
                                v-if="
                                    isEditing &&
                                    errors.status
                                "
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.status[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ project.status }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Priority
                            </p>

                            <select
                                v-if="isEditing"
                                v-model="form.priority"
                                class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                            >
                                <option value="Low">
                                    Low
                                </option>

                                <option value="Medium">
                                    Medium
                                </option>

                                <option value="High">
                                    High
                                </option>

                                <option value="Urgent">
                                    Urgent
                                </option>
                            </select>

                            <p
                                v-if="
                                    isEditing &&
                                    errors.priority
                                "
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.priority[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ project.priority }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Budget
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.budget"
                                type="number"
                            />

                            <p
                                v-if="
                                    isEditing &&
                                    errors.budget
                                "
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.budget[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ project.budget ?? '-' }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Start Date
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.start_date"
                                type="date"
                            />

                            <p
                                v-if="
                                    isEditing &&
                                    errors.start_date
                                "
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.start_date[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ project.start_date || '-' }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Due Date
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.due_date"
                                type="date"
                            />

                            <p
                                v-if="
                                    isEditing &&
                                    errors.due_date
                                "
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.due_date[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ project.due_date || '-' }}
                            </p>
                        </div>

                        <div class="md:col-span-2">
                            <p class="text-muted-foreground mb-2 text-sm">
                                Description
                            </p>

                            <Textarea
                                v-if="isEditing"
                                v-model="form.description"
                                rows="5"
                            />

                            <p
                                v-if="
                                    isEditing &&
                                    errors.description
                                "
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.description[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ project.description || '-' }}
                            </p>
                        </div>
                    </div>

                    <p
                        v-if="isEditing && error"
                        class="text-destructive rounded-md bg-red-50 p-3 text-sm"
                    >
                        {{ error }}
                    </p>
                </div>

                <div class="space-y-4 rounded-lg border p-6">
                    <h2 class="text-xl font-semibold">
                        Tasks
                    </h2>

                    <div
                        v-if="
                            !project.tasks ||
                            project.tasks.length === 0
                        "
                    >
                        <p class="text-muted-foreground">
                            No tasks associated with this project yet.
                        </p>
                    </div>

                    <div
                        v-else
                        class="space-y-3"
                    >
                        <div
                            v-for="task in project.tasks"
                            :key="task.id"
                            class="cursor-pointer rounded-md border p-4 transition hover:bg-slate-50"
                            @click="openTask(task.id)"
                        >
                            <div
                                class="flex items-center justify-between"
                            >
                                <h3 class="font-semibold">
                                    {{ task.title }}
                                </h3>

                                <span class="text-sm">
                                    {{ task.status }}
                                </span>
                            </div>

                            <p
                                class="text-muted-foreground text-sm"
                            >
                                {{
                                    task.description ||
                                    'No description'
                                }}
                            </p>

                            <p class="text-sm">
                                Priority: {{ task.priority }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
