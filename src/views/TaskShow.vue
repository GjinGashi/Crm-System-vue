<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

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

interface Project {
    id: string
    name: string
}

interface User {
    id: string
    first_name: string
    last_name: string
}

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    start_time: string | null
    end_time: string | null
    due_date: string | null
    project: Project | null
    user: User | null
}

const route = useRoute()
const router = useRouter()

const task = ref<Task | null>(null)
const projects = ref<Project[]>([])
const users = ref<User[]>([])

const error = ref('')
const errors = ref<Record<string, string[]>>({})

const isLoading = ref(true)
const isEditing = ref(false)
const isSaving = ref(false)
const isArchiving = ref(false)
const isLoadingOptions = ref(false)

const form = ref({
    project_id: '',
    user_id: '',
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Low',
    start_time: '',
    end_time: '',
    due_date: '',
})

async function fetchProjects() {
    try {
        const response = await api.get('/projects', {
            params: {
                archived: 0,
            },
        })

        projects.value = response.data
    } catch {
        projects.value = []
    }
}

async function fetchUsers() {
    try {
        const response = await api.get('/users')

        users.value = response.data
    } catch {
        users.value = []
    }
}

async function fetchTask() {
    isLoading.value = true
    error.value = ''

    try {
        const taskId = route.params.id

        const response = await api.get(`/tasks/${taskId}`)

        const data: Task = response.data

        task.value = data

        form.value = {
            project_id: data.project?.id?.toString() ?? '',
            user_id: data.user?.id?.toString() ?? '',
            title: data.title,
            description: data.description ?? '',
            status: data.status,
            priority: data.priority,
            start_time: data.start_time ?? '',
            end_time: data.end_time ?? '',
            due_date: data.due_date ?? '',
        }
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            error.value =
                err.response?.data?.message ??
                'Unable to load task. Please try again.'
        } else {
            error.value =
                'Unable to load task. Please try again.'
        }
    } finally {
        isLoading.value = false
    }
}

async function loadEditOptions() {
    isLoadingOptions.value = true

    try {
        await Promise.all([
            fetchProjects(),
            fetchUsers(),
        ])
    } finally {
        isLoadingOptions.value = false
    }
}

function goBack() {
    router.push('/tasks')
}

function startEditing() {
    if (!task.value) {
        return
    }

    form.value = {
        project_id: task.value.project?.id?.toString() ?? '',
        user_id: task.value.user?.id?.toString() ?? '',
        title: task.value.title,
        description: task.value.description ?? '',
        status: task.value.status,
        priority: task.value.priority,
        start_time: task.value.start_time ?? '',
        end_time: task.value.end_time ?? '',
        due_date: task.value.due_date ?? '',
    }

    errors.value = {}
    error.value = ''
    isEditing.value = true

    if (projects.value.length === 0 || users.value.length === 0) {
        loadEditOptions()
    }
}

function cancelEditing() {
    if (!task.value) {
        return
    }

    form.value = {
        project_id: task.value.project?.id?.toString() ?? '',
        user_id: task.value.user?.id?.toString() ?? '',
        title: task.value.title,
        description: task.value.description ?? '',
        status: task.value.status,
        priority: task.value.priority,
        start_time: task.value.start_time ?? '',
        end_time: task.value.end_time ?? '',
        due_date: task.value.due_date ?? '',
    }

    errors.value = {}
    error.value = ''
    isEditing.value = false
}

async function saveTask() {
    if (!task.value) {
        return
    }

    errors.value = {}
    error.value = ''
    isSaving.value = true

    try {
        const response = await api.patch(
            `/tasks/${task.value.id}`,
            {
                project_id: form.value.project_id,
                user_id: form.value.user_id,
                title: form.value.title,
                description: form.value.description,
                status: form.value.status,
                priority: form.value.priority,
                start_time: form.value.start_time || null,
                end_time: form.value.end_time || null,
                due_date: form.value.due_date || null,
            },
        )

        const updatedTask: Task = response.data

        task.value = updatedTask

        form.value = {
            project_id:
                updatedTask.project?.id?.toString() ?? '',
            user_id:
                updatedTask.user?.id?.toString() ?? '',
            title: updatedTask.title,
            description: updatedTask.description ?? '',
            status: updatedTask.status,
            priority: updatedTask.priority,
            start_time: updatedTask.start_time ?? '',
            end_time: updatedTask.end_time ?? '',
            due_date: updatedTask.due_date ?? '',
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
                    'Unable to update task. Please try again.'
            }
        } else {
            error.value =
                'Unable to update task. Please try again.'
        }
    } finally {
        isSaving.value = false
    }
}

async function archiveTask() {
    if (!task.value) {
        return
    }

    isArchiving.value = true
    error.value = ''

    try {
        await api.patch(`/tasks/${task.value.id}/archive`)

        await router.push('/tasks')
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            error.value =
                err.response?.data?.message ??
                'Unable to archive task. Please try again.'
        } else {
            error.value =
                'Unable to archive task. Please try again.'
        }
    } finally {
        isArchiving.value = false
    }
}

function openProject() {
    if (task.value?.project) {
        router.push(`/projects/${task.value.project.id}`)
    }
}

onMounted(fetchTask)
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">
                        Task Details
                    </h1>

                    <p class="text-muted-foreground">
                        View task information
                    </p>
                </div>

                <div class="flex gap-2">
                    <Button
                        variant="outline"
                        type="button"
                        @click="goBack"
                    >
                        Back to Tasks
                    </Button>

                    <template v-if="task">
                        <Button
                            v-if="!isEditing"
                            type="button"
                            @click="startEditing"
                        >
                            Edit Task
                        </Button>

                        <template v-else>
                            <Button
                                type="button"
                                :disabled="
                                    isSaving ||
                                    isArchiving ||
                                    isLoadingOptions
                                "
                                @click="saveTask"
                            >
                                {{
                                    isSaving
                                        ? 'Saving...'
                                        : 'Save'
                                }}
                            </Button>

                            <Button
                                variant="outline"
                                type="button"
                                :disabled="
                                    isSaving ||
                                    isArchiving
                                "
                                @click="cancelEditing"
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="destructive"
                                type="button"
                                :disabled="
                                    isSaving ||
                                    isArchiving
                                "
                                @click="archiveTask"
                            >
                                {{
                                    isArchiving
                                        ? 'Archiving...'
                                        : 'Archive'
                                }}
                            </Button>
                        </template>
                    </template>
                </div>
            </div>

            <div v-if="isLoading">
                <p class="text-muted-foreground">
                    Loading task...
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
                v-else-if="task"
                class="space-y-6 rounded-lg border p-6"
            >
                <div>
                    <p class="text-muted-foreground mb-2 text-sm">
                        Title
                    </p>

                    <Input
                        v-if="isEditing"
                        v-model="form.title"
                    />

                    <p
                        v-if="isEditing && errors.title"
                        class="text-destructive mt-1 text-sm"
                    >
                        {{ errors.title[0] }}
                    </p>

                    <h2
                        v-if="!isEditing"
                        class="text-xl font-semibold"
                    >
                        {{ task.title }}
                    </h2>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div>
                        <p class="text-muted-foreground text-sm">
                            Project
                        </p>

                        <Select
                            v-if="isEditing"
                            v-model="form.project_id"
                            :disabled="isLoadingOptions"
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder="Select Project"
                                />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem
                                    v-for="project in projects"
                                    :key="project.id"
                                    :value="project.id.toString()"
                                >
                                    {{ project.name }}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <p
                            v-if="
                                isEditing &&
                                errors.project_id
                            "
                            class="text-destructive mt-1 text-sm"
                        >
                            {{ errors.project_id[0] }}
                        </p>

                        <button
                            v-if="!isEditing && task.project"
                            type="button"
                            class="font-medium hover:underline"
                            @click="openProject"
                        >
                            {{ task.project.name }}
                        </button>

                        <p
                            v-if="!isEditing && !task.project"
                            class="font-medium"
                        >
                            -
                        </p>
                    </div>

                    <div>
                        <p class="text-muted-foreground text-sm">
                            Assigned To
                        </p>

                        <Select
                            v-if="isEditing"
                            v-model="form.user_id"
                            :disabled="isLoadingOptions"
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder="Select User"
                                />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem
                                    v-for="user in users"
                                    :key="user.id"
                                    :value="user.id.toString()"
                                >
                                    {{ user.first_name }}
                                    {{ user.last_name }}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <p
                            v-if="
                                isEditing &&
                                errors.user_id
                            "
                            class="text-destructive mt-1 text-sm"
                        >
                            {{ errors.user_id[0] }}
                        </p>

                        <p
                            v-if="!isEditing"
                            class="font-medium"
                        >
                            {{
                                task.user
                                    ? `${task.user.first_name} ${task.user.last_name}`
                                    : '-'
                            }}
                        </p>
                    </div>

                    <div>
                        <p class="text-muted-foreground text-sm">
                            Status
                        </p>

                        <select
                            v-if="isEditing"
                            v-model="form.status"
                            class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                        >
                            <option value="Todo">
                                Todo
                            </option>

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
                            v-if="
                                isEditing &&
                                errors.status
                            "
                            class="text-destructive mt-1 text-sm"
                        >
                            {{ errors.status[0] }}
                        </p>

                        <p
                            v-if="!isEditing"
                            class="font-medium"
                        >
                            {{ task.status }}
                        </p>
                    </div>

                    <div>
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
                            v-if="!isEditing"
                            class="font-medium"
                        >
                            {{ task.priority }}
                        </p>
                    </div>

                    <div>
                        <p class="text-muted-foreground text-sm">
                            Start Time
                        </p>

                        <Input
                            v-if="isEditing"
                            v-model="form.start_time"
                            type="datetime-local"
                        />

                        <p
                            v-if="
                                isEditing &&
                                errors.start_time
                            "
                            class="text-destructive mt-1 text-sm"
                        >
                            {{ errors.start_time[0] }}
                        </p>

                        <p
                            v-if="!isEditing"
                            class="font-medium"
                        >
                            {{ task.start_time || '-' }}
                        </p>
                    </div>

                    <div>
                        <p class="text-muted-foreground text-sm">
                            End Time
                        </p>

                        <Input
                            v-if="isEditing"
                            v-model="form.end_time"
                            type="datetime-local"
                        />

                        <p
                            v-if="
                                isEditing &&
                                errors.end_time
                            "
                            class="text-destructive mt-1 text-sm"
                        >
                            {{ errors.end_time[0] }}
                        </p>

                        <p
                            v-if="!isEditing"
                            class="font-medium"
                        >
                            {{ task.end_time || '-' }}
                        </p>
                    </div>

                    <div>
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
                            v-if="!isEditing"
                            class="font-medium"
                        >
                            {{ task.due_date || '-' }}
                        </p>
                    </div>

                    <div class="md:col-span-2">
                        <p
                            class="text-muted-foreground mb-2 text-sm"
                        >
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
                            v-if="!isEditing"
                            class="font-medium"
                        >
                            {{ task.description || '-' }}
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
        </div>
    </main>
</template>