<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import FormDialog from '@/components/shared/FormDialog.vue'
import ClientForm from '@/components/clients/ClientForm.vue'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import api from '@/lib/api'

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
    archived_at: string | null
}

type ClientAction = 'archive' | 'restore' | 'delete'

const actionConfig: Record<
    ClientAction,
    { request: (id: string) => Promise<unknown>; done: string }
> = {
    archive: { request: (id) => api.patch(`/clients/${id}/archive`), done: 'archived' },
    restore: { request: (id) => api.patch(`/clients/${id}/restore`), done: 'restored' },
    delete: { request: (id) => api.delete(`/clients/${id}`), done: 'deleted' },
}

const columns = [
    { key: 'phone', label: 'Phone' },
    { key: 'company', label: 'Company' },
    { key: 'address', label: 'Street' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' },
] as const

const statusClasses: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700',
    Inactive: 'bg-slate-100 text-slate-600',
    Lead: 'bg-blue-50 text-blue-700',
    Archived: 'bg-amber-50 text-amber-700',
}

const router = useRouter()

const clients = ref<Client[]>([])
const error = ref('')
const isLoading = ref(true)
const search = ref('')
const statusFilter = ref('All')
const viewMode = ref<'active' | 'archived'>('active')
const actionLoading = ref<string | null>(null)
const clientDialogOpen = ref(false)

const dialogs = ref<Record<ClientAction, boolean>>({
    archive: false,
    restore: false,
    delete: false,
})

const selectedClientId = ref<string | null>(null)

const statusMessage = computed(() => {
    if (isLoading.value) return 'Loading clients...'
    if (error.value) return error.value
    if (clients.value.length === 0) return 'No clients found.'
    return ''
})

async function fetchClients() {
    isLoading.value = true
    error.value = ''

    try {
        const response = await api.get('/clients', {
            params: {
                archived: viewMode.value === 'archived' ? 1 : 0,
                search: search.value.trim(),
                status: statusFilter.value,
            },
        })

        clients.value = response.data
    } catch {
        error.value = 'Unable to load clients. Please try again.'
    } finally {
        isLoading.value = false
    }
}

function openClient(id: string) {
    router.push(`/clients/${id}`)
}

function createClient() {
    clientDialogOpen.value = true
}
async function onClientCreated() {
    clientDialogOpen.value = false
    await fetchClients()
}

function openDialog(action: ClientAction, id: string) {
    selectedClientId.value = id
    dialogs.value[action] = true
}

async function confirmAction(action: ClientAction) {
    const id = selectedClientId.value

    if (!id) {
        return
    }

    actionLoading.value = id

    try {
        await actionConfig[action].request(id)

        clients.value = clients.value.filter((client) => client.id !== id)

        toast.success(`Client ${actionConfig[action].done} successfully`)

        dialogs.value[action] = false
        selectedClientId.value = null
    } catch (err: unknown) {
        const fallback = `Unable to ${action} the client.`

        toast.error(
            axios.isAxiosError(err)
                ? (err.response?.data?.message ?? fallback)
                : fallback,
        )
    } finally {
        actionLoading.value = null
    }
}

onMounted(fetchClients)

watch([viewMode, search, statusFilter], fetchClients)
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
                    Clients
                </h1>

                <p class="text-muted-foreground mt-1 text-sm">
                    Manage your clients and their information
                </p>
            </div>

            <Button @click="createClient">Add Client</Button>
        </div>

        <div
            class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
            <Input v-model="search" placeholder="Search by name, email, or phone..." class="md:max-w-sm" />

            <div class="flex gap-2">
                <Button :variant="viewMode === 'active' ? 'default' : 'outline'" @click="viewMode = 'active'">
                    Active
                </Button>

                <Button :variant="viewMode === 'archived' ? 'default' : 'outline'" @click="viewMode = 'archived'">
                    Archived
                </Button>
            </div>

            <select v-model="statusFilter"
                class="border-input bg-background h-10 rounded-md border px-3 py-2 text-sm md:ml-auto md:w-48">
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Lead">Lead</option>
                <option value="Archived">Archived</option>
            </select>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead v-for="c in columns" :key="c.key">
                            {{ c.label }}
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    <TableRow v-if="statusMessage">
                        <TableCell :colspan="9" class="h-24 text-center"
                            :class="error ? 'text-destructive' : 'text-muted-foreground'">
                            {{ statusMessage }}
                        </TableCell>
                    </TableRow>

                    <TableRow v-for="client in clients" v-else :key="client.id" class="cursor-pointer"
                        @click="openClient(client.id)">
                        <TableCell>
                            {{ client.first_name }} {{ client.last_name }}
                        </TableCell>

                        <TableCell>{{ client.email }}</TableCell>
                        <TableCell v-for="c in columns" :key="c.key">
                            {{ client[c.key] || '-' }}
                        </TableCell>

                        <TableCell>
                            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                :class="statusClasses[client.status]">
                                {{ client.status }}
                            </span>
                        </TableCell>

                        <TableCell>
                            <div class="flex items-center gap-2" @click.stop>
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <Button variant="outline" size="sm">
                                            Actions
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem v-if="viewMode === 'active'"
                                            @select.prevent="openDialog('archive', client.id)">
                                            Archive
                                        </DropdownMenuItem>

                                        <DropdownMenuItem v-else @select.prevent="openDialog('restore', client.id)">
                                            Restore
                                        </DropdownMenuItem>

                                        <DropdownMenuItem v-if="viewMode === 'archived'"
                                            class="text-destructive focus:text-destructive"
                                            @select.prevent="openDialog('delete', client.id)">
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>

        <ConfirmDialog v-model:open="dialogs.archive" title="Archive client?"
            description="Are you sure you want to archive this client? You can restore the client later."
            confirm-text="Archive" loading-text="Archiving..." :loading="actionLoading === selectedClientId" destructive
            @confirm="confirmAction('archive')" />

        <ConfirmDialog v-model:open="dialogs.restore" title="Restore client?"
            description="Are you sure you want to restore this client?" confirm-text="Restore"
            loading-text="Restoring..." :loading="actionLoading === selectedClientId"
            @confirm="confirmAction('restore')" />

        <ConfirmDialog v-model:open="dialogs.delete" title="Delete client?"
            description="This action cannot be undone. This will permanently delete the client and their record."
            confirm-text="Delete" loading-text="Deleting..." :loading="actionLoading === selectedClientId" destructive
            @confirm="confirmAction('delete')" />

        <FormDialog v-model:open="clientDialogOpen" title="Create Client" description="Create a new client.">
            <ClientForm @saved="onClientCreated" @cancel="clientDialogOpen = false" />
        </FormDialog>
    </div>
</template>