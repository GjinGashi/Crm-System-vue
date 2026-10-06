<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

import FieldRow from '@/components/shared/FieldRow.vue'
import FormField from '@/components/shared/FormField.vue'
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

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    due_date: string | null
    project: { id: string } | null
    user: { id: string } | null
}

// Values to start a new task with, e.g. the project whose Tasks tab you are on.
interface TaskDefaults {
    project_id?: string
    user_id?: string
}

type FieldKey =
    | 'title'
    | 'project_id'
    | 'user_id'
    | 'due_date'
    | 'status'
    | 'priority'
    | 'description'

const statuses = ['Todo', 'In Progress', 'Completed', 'Canceled']
const priorities = ['Low', 'Medium', 'High', 'Urgent']

// With a task: edit mode (used inside TaskShow, which owns the buttons).
// Without: create mode (used inside a popup, which shows its own buttons at the bottom).
const props = defineProps<{
    task?: Task
    defaults?: TaskDefaults
}>()

const emit = defineEmits<{
    saved: []
    cancel: []
}>()

// Lets the parent page show "Saving..." on its Save button.
const loading = defineModel<boolean>('loading', { default: false })

const isEdit = computed(() => !!props.task)

// When the project or user was chosen by the page you came from, keep it fixed.
const projectLocked = computed(() => !isEdit.value && !!props.defaults?.project_id)
const userLocked = computed(() => !isEdit.value && !!props.defaults?.user_id)

function dateOnly(value: string | null | undefined) {
    return value ? value.substring(0, 10) : ''
}

function toForm(t?: Task, defaults?: TaskDefaults): Record<FieldKey, string> {
    return {
        title: t?.title ?? '',
        project_id: t?.project?.id ?? defaults?.project_id ?? '',
        user_id: t?.user?.id ?? defaults?.user_id ?? '',
        due_date: dateOnly(t?.due_date),
        status: t?.status ?? 'Todo',
        priority: t?.priority ?? 'Low',
        description: t?.description ?? '',
    }
}

const form = ref<Record<FieldKey, string>>(toForm(props.task, props.defaults))
const projects = ref<Project[]>([])
const users = ref<User[]>([])
const errors = ref<Record<string, string[]>>({})
const generalError = ref('')

function errorMessage(err: unknown, fallback: string) {
    return axios.isAxiosError(err)
        ? (err.response?.data?.message ?? fallback)
        : fallback
}

async function fetchOptions() {
    try {
        const [projectsResponse, usersResponse] = await Promise.all([
            api.get('/task-projects', { params: { archived: 0 } }),
            api.get('/task-users'),
        ])

        projects.value = projectsResponse.data.data ?? projectsResponse.data
        users.value = usersResponse.data.data ?? usersResponse.data
    } catch (err) {
        generalError.value = errorMessage(
            err,
            'Unable to load projects and users. Please try again.',
        )
    }
}

async function submit() {
    loading.value = true
    errors.value = {}
    generalError.value = ''

    const payload = {
        ...form.value,
        due_date: form.value.due_date || null,
    }

    try {
        if (props.task) {
            await api.patch(`/tasks/${props.task.id}`, payload)

            toast.success('Task updated successfully.')
        } else {
            await api.post('/tasks', payload)

            toast.success('Task created successfully.')
        }

        emit('saved')
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 422) {
            errors.value = err.response.data.errors ?? {}
        } else {
            generalError.value = errorMessage(err, 'Unable to save task. Please try again.')
        }
    } finally {
        loading.value = false
    }
}

onMounted(fetchOptions)
</script>

<template>
    <form id="task-form" novalidate @submit.prevent="submit">
        <FieldRow>
            <FormField label="Title" required :error="errors.title?.[0]">
                <Input v-model="form.title" placeholder="Task title" />
            </FormField>

            <FormField label="Project" required :error="errors.project_id?.[0]">
                <select
                    v-model="form.project_id"
                    :disabled="projectLocked"
                    class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm disabled:opacity-60"
                >
                    <option value="" disabled>Select project</option>
                    <option v-for="p in projects" :key="p.id" :value="p.id">
                        {{ p.name }}
                    </option>
                </select>
            </FormField>
        </FieldRow>

        <FieldRow>
            <FormField label="Assigned User" required :error="errors.user_id?.[0]">
                <select
                    v-model="form.user_id"
                    :disabled="userLocked"
                    class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm disabled:opacity-60"
                >
                    <option value="" disabled>Select user</option>
                    <option v-for="u in users" :key="u.id" :value="u.id">
                        {{ u.first_name }} {{ u.last_name }}
                    </option>
                </select>
            </FormField>

            <FormField label="Due Date" :error="errors.due_date?.[0]">
                <Input v-model="form.due_date" type="date" />
            </FormField>
        </FieldRow>

        <FieldRow>
            <FormField label="Status" :error="errors.status?.[0]">
                <select
                    v-model="form.status"
                    class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                    <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                </select>
            </FormField>

            <FormField label="Priority" :error="errors.priority?.[0]">
                <select
                    v-model="form.priority"
                    class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                    <option v-for="p in priorities" :key="p" :value="p">{{ p }}</option>
                </select>
            </FormField>
        </FieldRow>

        <FieldRow single>
            <FormField label="Description" :error="errors.description?.[0]">
                <Textarea
                    v-model="form.description"
                    rows="4"
                    placeholder="Describe the task..."
                />
            </FormField>
        </FieldRow>

        <p
            v-if="generalError"
            class="mt-2 rounded-md bg-red-50 p-3 text-sm text-destructive"
        >
            {{ generalError }}
        </p>

       <div v-if="!isEdit" class="mt-2 flex justify-end gap-3 pt-2">
            <Button
                type="button"
                variant="outline"
                :disabled="loading"
                @click="emit('cancel')"
            >
                Cancel
            </Button>

            <Button type="submit" :disabled="loading">
                {{ loading ? 'Saving...' : 'Create Task' }}
            </Button>
        </div>
    </form>
</template>