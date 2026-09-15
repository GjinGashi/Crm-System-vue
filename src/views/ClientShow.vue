```vue
<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import api from '@/lib/api'

interface Project {
    id: number
    name: string
    description: string | null
    status: string
    priority: string
}

interface Client {
    id: number
    first_name: string
    last_name: string
    email: string
    phone: string | null
    company: string | null
    address: string | null
    city: string | null
    country: string | null
    status: string
    notes: string | null
    projects?: Project[]
}

const route = useRoute()
const router = useRouter()

const client = ref<Client | null>(null)

const error = ref('')
const errors = ref<Record<string, string[]>>({})

const isLoading = ref(true)
const isEditing = ref(false)
const isSaving = ref(false)

const form = ref({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    country: '',
    status: 'Active',
    notes: '',
})

async function fetchClient() {
    isLoading.value = true
    error.value = ''

    try {
        const clientId = route.params.id

        const response = await api.get(`/clients/${clientId}`)

        const data: Client = response.data

        client.value = data

        form.value = {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone ?? '',
            company: data.company ?? '',
            address: data.address ?? '',
            city: data.city ?? '',
            country: data.country ?? '',
            status: data.status,
            notes: data.notes ?? '',
        }
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            error.value =
                err.response?.data?.message ??
                'Unable to load client. Please try again.'
        } else {
            error.value =
                'Unable to load client. Please try again.'
        }
    } finally {
        isLoading.value = false
    }
}

function goBack() {
    router.push('/clients')
}

function startEditing() {
    if (!client.value) {
        return
    }

    form.value = {
        first_name: client.value.first_name,
        last_name: client.value.last_name,
        email: client.value.email,
        phone: client.value.phone ?? '',
        company: client.value.company ?? '',
        address: client.value.address ?? '',
        city: client.value.city ?? '',
        country: client.value.country ?? '',
        status: client.value.status,
        notes: client.value.notes ?? '',
    }

    errors.value = {}
    error.value = ''
    isEditing.value = true
}

function cancelEditing() {
    if (!client.value) {
        return
    }

    form.value = {
        first_name: client.value.first_name,
        last_name: client.value.last_name,
        email: client.value.email,
        phone: client.value.phone ?? '',
        company: client.value.company ?? '',
        address: client.value.address ?? '',
        city: client.value.city ?? '',
        country: client.value.country ?? '',
        status: client.value.status,
        notes: client.value.notes ?? '',
    }

    errors.value = {}
    error.value = ''
    isEditing.value = false
}

async function saveClient() {
    if (!client.value) {
        return
    }

    errors.value = {}
    error.value = ''
    isSaving.value = true

    try {
        const response = await api.patch(
            `/clients/${client.value.id}`,
            form.value,
        )

        const updatedClient: Client = response.data

        client.value = updatedClient

        form.value = {
            first_name: updatedClient.first_name,
            last_name: updatedClient.last_name,
            email: updatedClient.email,
            phone: updatedClient.phone ?? '',
            company: updatedClient.company ?? '',
            address: updatedClient.address ?? '',
            city: updatedClient.city ?? '',
            country: updatedClient.country ?? '',
            status: updatedClient.status,
            notes: updatedClient.notes ?? '',
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
                    'Unable to update client. Please try again.'
            }
        } else {
            error.value =
                'Unable to update client. Please try again.'
        }
    } finally {
        isSaving.value = false
    }
}

function openProject(id: number) {
    router.push(`/projects/${id}`)
}

onMounted(fetchClient)
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">
                        Client Details
                    </h1>

                    <p class="text-muted-foreground">
                        View client information and related projects
                    </p>
                </div>

                <div class="flex gap-2">
                    <Button variant="outline" @click="goBack">
                        Back to Clients
                    </Button>

                    <template v-if="client">
                        <Button
                            v-if="!isEditing"
                            @click="startEditing"
                        >
                            Edit Client
                        </Button>

                        <template v-else>
                            <Button
                                :disabled="isSaving"
                                @click="saveClient"
                            >
                                {{ isSaving ? 'Saving...' : 'Save' }}
                            </Button>

                            <Button
                                variant="outline"
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
                    Loading client...
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
                v-else-if="client"
                class="space-y-6"
            >
                <div class="space-y-4 rounded-lg border p-6">
                    <div class="flex items-center gap-3">
                        <h2 class="text-xl font-semibold">
                            {{ client.first_name }}
                            {{ client.last_name }}
                        </h2>

                        <span
                            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                            :class="{
                                'bg-emerald-50 text-emerald-700':
                                    client.status === 'Active',
                                'bg-slate-100 text-slate-600':
                                    client.status === 'Inactive',
                                'bg-blue-50 text-blue-700':
                                    client.status === 'Lead',
                                'bg-amber-50 text-amber-700':
                                    client.status === 'Archived',
                            }"
                        >
                            {{ client.status }}
                        </span>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                First Name
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.first_name"
                            />

                            <p
                                v-if="isEditing && errors.first_name"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.first_name[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ client.first_name }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Last Name
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.last_name"
                            />

                            <p
                                v-if="isEditing && errors.last_name"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.last_name[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ client.last_name }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Email
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.email"
                                type="email"
                            />

                            <p
                                v-if="isEditing && errors.email"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.email[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ client.email }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Phone
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.phone"
                            />

                            <p
                                v-if="isEditing && errors.phone"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.phone[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ client.phone || '-' }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Company
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.company"
                            />

                            <p
                                v-if="isEditing && errors.company"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.company[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ client.company || '-' }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Address
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.address"
                            />

                            <p
                                v-if="isEditing && errors.address"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.address[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ client.address || '-' }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                City
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.city"
                            />

                            <p
                                v-if="isEditing && errors.city"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.city[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ client.city || '-' }}
                            </p>
                        </div>

                        <div class="rounded-lg bg-slate-50 p-3">
                            <p class="text-muted-foreground text-sm">
                                Country
                            </p>

                            <Input
                                v-if="isEditing"
                                v-model="form.country"
                            />

                            <p
                                v-if="isEditing && errors.country"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.country[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ client.country || '-' }}
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
                                <option value="Active">
                                    Active
                                </option>

                                <option value="Inactive">
                                    Inactive
                                </option>

                                <option value="Lead">
                                    Lead
                                </option>

                                <option value="Archived">
                                    Archived
                                </option>
                            </select>

                            <p
                                v-if="isEditing && errors.status"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.status[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ client.status }}
                            </p>
                        </div>

                        <div
                            class="rounded-lg bg-slate-50 p-3 md:col-span-2"
                        >
                            <p class="text-muted-foreground text-sm">
                                Notes
                            </p>

                            <Textarea
                                v-if="isEditing"
                                v-model="form.notes"
                                rows="5"
                            />

                            <p
                                v-if="isEditing && errors.notes"
                                class="text-destructive mt-1 text-sm"
                            >
                                {{ errors.notes[0] }}
                            </p>

                            <p
                                v-else
                                class="font-medium"
                            >
                                {{ client.notes || '-' }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="space-y-4 rounded-lg border p-6">
                    <h2 class="text-xl font-semibold">
                        Projects
                    </h2>

                    <div
                        v-if="!client.projects || client.projects.length === 0"
                    >
                        <p class="text-muted-foreground">
                            No projects associated with this client yet.
                        </p>
                    </div>

                    <div
                        v-else
                        class="space-y-3"
                    >
                        <div
                            v-for="project in client.projects"
                            :key="project.id"
                            class="cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition hover:bg-slate-50"
                            @click="openProject(project.id)"
                        >
                            <div
                                class="flex items-center justify-between"
                            >
                                <h3 class="font-semibold">
                                    {{ project.name }}
                                </h3>

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

                            <p
                                class="text-muted-foreground text-sm"
                            >
                                {{
                                    project.description ||
                                    'No description'
                                }}
                            </p>

                            <span
                                class="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                :class="{
                                    'bg-slate-100 text-slate-700':
                                        project.priority === 'Low',
                                    'bg-blue-50 text-blue-700':
                                        project.priority === 'Medium',
                                    'bg-orange-50 text-orange-700':
                                        project.priority === 'High',
                                    'bg-red-50 text-red-700':
                                        project.priority === 'Urgent',
                                }"
                            >
                                {{ project.priority }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>


