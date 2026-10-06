<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import ClientForm from '@/components/clients/ClientForm.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import DetailField from '@/components/shared/DetailField.vue'
import FieldRow from '@/components/shared/FieldRow.vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/api'

interface Project {
    id: string
    name: string
    description: string | null
    status: string
    priority: string
}

interface Client {
    id: string
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

const projectStatusClasses: Record<string, string> = {
    Planning: 'bg-slate-100 text-slate-700',
    'In Progress': 'bg-blue-50 text-blue-700',
    'On Hold': 'bg-amber-50 text-amber-700',
    Completed: 'bg-emerald-50 text-emerald-700',
    Canceled: 'bg-red-50 text-red-700',
}

const projectPriorityClasses: Record<string, string> = {
    Low: 'bg-slate-100 text-slate-700',
    Medium: 'bg-blue-50 text-blue-700',
    High: 'bg-orange-50 text-orange-700',
    Urgent: 'bg-red-50 text-red-700',
}

const route = useRoute()
const router = useRouter()

const client = ref<Client | null>(null)
const error = ref('')
const isLoading = ref(true)
const isEditing = ref(false)
const isArchiving = ref(false)
const archiveDialogOpen = ref(false)

const fields = computed(() => {
    const c = client.value
    if (!c) return []

    return [
        { label: 'First Name', value: c.first_name },
        { label: 'Last Name', value: c.last_name },
        { label: 'Email', value: c.email },
        { label: 'Phone', value: c.phone },
        { label: 'Company', value: c.company },
        { label: 'Status', value: c.status },
        { label: 'Address', value: c.address, full: true },
        { label: 'City', value: c.city },
        { label: 'Country', value: c.country },
        { label: 'Notes', value: c.notes, full: true, multiline: true },
    ]
})

function errorMessage(err: unknown, fallback: string) {
    return axios.isAxiosError(err)
        ? (err.response?.data?.message ?? fallback)
        : fallback
}

async function fetchClient() {
    isLoading.value = true
    error.value = ''

    try {
        const response = await api.get(`/clients/${route.params.id}`)
        client.value = response.data
    } catch (err) {
        error.value = errorMessage(err, 'Unable to load client. Please try again.')
    } finally {
        isLoading.value = false
    }
}

function onSaved(updated: Client) {
    if (client.value) {
        client.value = { ...client.value, ...updated }
    }

    isEditing.value = false
}

async function archiveClient() {
    if (!client.value) return

    isArchiving.value = true

    try {
        await api.patch(`/clients/${client.value.id}/archive`)
        toast.success('Client archived successfully.')
        await router.push('/clients')
    } catch (err) {
        toast.error(errorMessage(err, 'Unable to archive client.'))
    } finally {
        isArchiving.value = false
        archiveDialogOpen.value = false
    }
}

function openProject(id: string) {
    router.push(`/projects/${id}`)
}

onMounted(fetchClient)
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="space-y-6">
            <Button variant="outline" @click="router.push('/clients')">
                Back to Clients
            </Button>

            <div>
                <h1 class="text-3xl font-bold tracking-tight">Client Details</h1>
                <p class="text-muted-foreground">
                    View client information and related projects
                </p>
            </div>

            <p v-if="isLoading" class="text-muted-foreground">Loading client...</p>

            <p v-else-if="error" class="rounded-md bg-red-50 p-3 text-sm text-destructive">
                {{ error }}
            </p>

            <Tabs v-else-if="client" default-value="overview" class="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" class="mt-4">
                    <div class="rounded-lg border bg-white p-6">
                        <div class="flex flex-wrap items-start justify-between gap-4 pb-4">
                            <div>
                                <h2 class="text-lg font-semibold">Client Information</h2>
                                <p class="text-sm text-muted-foreground">
                                    Details about this client
                                </p>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                <Button v-if="!isEditing" type="button" @click="isEditing = true">
                                    Edit Client
                                </Button>

                                <template v-else>
                                    <Button type="button" variant="destructive" :disabled="isArchiving"
                                        @click="archiveDialogOpen = true">
                                        {{ isArchiving ? 'Archiving...' : 'Archive' }}
                                    </Button>

                                    <Button type="button" variant="outline" :disabled="isArchiving"
                                        @click="isEditing = false">
                                        Cancel
                                    </Button>

                                    <Button type="submit" form="client-form" :disabled="isArchiving">
                                        Save
                                    </Button>
                                </template>
                            </div>
                        </div>

                        <ClientForm v-if="isEditing" :client="client" :archiving="isArchiving" @saved="onSaved"
                            @cancel="isEditing = false" @archive="archiveDialogOpen = true" />

                        <div v-else>
                            <FieldRow>
                                <DetailField label="First Name" :value="client.first_name" />

                                <DetailField label="Last Name" :value="client.last_name" />
                            </FieldRow>

                            <FieldRow>
                                <DetailField label="Email" :value="client.email" />

                                <DetailField label="Phone" :value="client.phone" />
                            </FieldRow>

                            <FieldRow>
                                <DetailField label="Company" :value="client.company" />

                                <DetailField label="Status" :value="client.status" />
                            </FieldRow>

                            <FieldRow single>
                                <DetailField label="Street" :value="client.address" />
                            </FieldRow>

                            <FieldRow>
                                <DetailField label="City" :value="client.city" />

                                <DetailField label="Country" :value="client.country" />
                            </FieldRow>

                            <FieldRow single>
                                <DetailField label="Description" :value="client.notes || 'No description provided.'"
                                    multiline />
                            </FieldRow>
                        </div>
                    </div>
                </TabsContent>
                 
                <TabsContent value="projects" class="mt-4">
                    <div class="rounded-lg border p-6">
                        <h2 class="mb-4 text-xl font-semibold">Projects</h2>

                        <p v-if="!client.projects || client.projects.length === 0" class="text-muted-foreground">
                            No projects associated with this client yet.
                        </p>

                        <div v-else class="space-y-3">
                            <div v-for="project in client.projects" :key="project.id"
                                class="cursor-pointer rounded-md border p-4 transition hover:bg-slate-50"
                                @click="openProject(project.id)">
                                <div class="flex items-center justify-between">
                                    <h3 class="font-semibold">{{ project.name }}</h3>

                                    <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                        :class="projectStatusClasses[project.status]">
                                        {{ project.status }}
                                    </span>
                                </div>

                                <p class="text-sm text-muted-foreground">
                                    {{ project.description || 'No description' }}
                                </p>

                                <span class="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                    :class="projectPriorityClasses[project.priority]">
                                    {{ project.priority }}
                                </span>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>

        <ConfirmDialog v-model:open="archiveDialogOpen" title="Archive client?"
            description="Are you sure you want to archive this client? You can restore the client later."
            confirm-text="Archive" loading-text="Archiving..." :loading="isArchiving" destructive
            @confirm="archiveClient" />
    </main>
</template>