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

interface Client {
    id: string
    first_name: string
    last_name: string
}

interface Project {
    id: string
    name: string
    description: string | null
    status: string
    priority: string
    start_date: string | null
    due_date: string | null
    budget: number | null
    client: { id: string } | null
}

type FieldKey =
    | 'name'
    | 'client_id'
    | 'status'
    | 'priority'
    | 'start_date'
    | 'due_date'
    | 'budget'
    | 'description'

const statuses = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Canceled']
const priorities = ['Low', 'Medium', 'High', 'Urgent']

// With a project: edit mode (used inside ProjectShow, which owns the buttons).
// Without: create mode (used inside a popup, which shows its own buttons at the bottom).
const props = defineProps<{
    project?: Project
}>()

const emit = defineEmits<{
    saved: []
    cancel: []
}>()

// Lets the parent page show "Saving..." on its Save button.
const loading = defineModel<boolean>('loading', { default: false })

const isEdit = computed(() => !!props.project)

function dateOnly(value: string | null | undefined) {
    return value ? value.substring(0, 10) : ''
}

function toForm(p?: Project): Record<FieldKey, string> {
    return {
        name: p?.name ?? '',
        client_id: p?.client?.id ?? '',
        status: p?.status ?? 'Planning',
        priority: p?.priority ?? 'Low',
        start_date: dateOnly(p?.start_date),
        due_date: dateOnly(p?.due_date),
        budget: p?.budget != null ? String(p.budget) : '',
        description: p?.description ?? '',
    }
}

const form = ref<Record<FieldKey, string>>(toForm(props.project))
const clients = ref<Client[]>([])
const errors = ref<Record<string, string[]>>({})
const generalError = ref('')

function errorMessage(err: unknown, fallback: string) {
    return axios.isAxiosError(err)
        ? (err.response?.data?.message ?? fallback)
        : fallback
}

async function fetchClients() {
    try {
        const response = await api.get('/clients', { params: { archived: 0 } })

        clients.value = response.data.data ?? response.data
    } catch (err) {
        generalError.value = errorMessage(err, 'Unable to load clients. Please try again.')
    }
}

async function submit() {
    loading.value = true
    errors.value = {}
    generalError.value = ''

    try {
        if (props.project) {
            await api.patch(`/projects/${props.project.id}`, form.value)

            toast.success('Project updated successfully.')
        } else {
            await api.post('/projects', form.value)

            toast.success('Project created successfully.')
        }

        emit('saved')
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 422) {
            errors.value = err.response.data.errors ?? {}
        } else {
            generalError.value = errorMessage(err, 'Unable to save project. Please try again.')
        }
    } finally {
        loading.value = false
    }
}

onMounted(fetchClients)
</script>

<template>
    <form id="project-form" novalidate @submit.prevent="submit">
        <FieldRow>
            <FormField label="Client" required :error="errors.client_id?.[0]">
                <select
                    v-model="form.client_id"
                    class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                    <option value="" disabled>Select client</option>
                    <option v-for="c in clients" :key="c.id" :value="c.id">
                        {{ c.first_name }} {{ c.last_name }}
                    </option>
                </select>
            </FormField>

            <FormField label="Project Name" required :error="errors.name?.[0]">
                <Input v-model="form.name" placeholder="Project name" />
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

        <FieldRow>
            <FormField label="Start Date" :error="errors.start_date?.[0]">
                <Input v-model="form.start_date" type="date" />
            </FormField>

            <FormField label="Due Date" :error="errors.due_date?.[0]">
                <Input v-model="form.due_date" type="date" />
            </FormField>
        </FieldRow>

        <FieldRow single>
            <FormField label="Budget" :error="errors.budget?.[0]">
                <Input
                    v-model="form.budget"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                />
            </FormField>
        </FieldRow>

        <FieldRow single>
            <FormField label="Description" :error="errors.description?.[0]">
                <Textarea
                    v-model="form.description"
                    rows="4"
                    placeholder="Describe the project..."
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
                {{ loading ? 'Saving...' : 'Create Project' }}
            </Button>
        </div>
    </form>
</template>