    ```vue
    <script setup lang="ts">
    import axios from 'axios'
    import { onMounted, ref, watch } from 'vue'

    import { useRouter } from 'vue-router'

    import { toast } from 'vue-sonner'

    import { Button } from '@/components/ui/button'

    import { Input } from '@/components/ui/input'

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

    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
        AlertDialogTrigger,
    } from '@/components/ui/alert-dialog'

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

    const router = useRouter()

    const clients = ref<Client[]>([])

    const error = ref('')

    const isLoading = ref(true)

    const search = ref('')

    const statusFilter = ref('All')

    const viewMode = ref<'active' | 'archived'>('active')

    const actionLoading = ref<string | null>(null)



    async function fetchClients() {
        isLoading.value = true
        error.value = ''

        try {
            const response = await api.get('/clients', {
                params: {
                    archived:
                        viewMode.value === 'archived' ? 1 : 0,
                    search: search.value.trim(),
                    status: statusFilter.value,
                },
            })

            clients.value = response.data
        } catch {
            error.value =
                'Unable to load clients. Please try again.'
        } finally {
            isLoading.value = false
        }
    }

    function openClient(id: string) {
        router.push(`/clients/${id}`)
    }

    function createClient() {
        router.push('/clients/create')
    }

    async function archiveClient(id: string) {
        actionLoading.value = id

        try {
            await api.patch(`/clients/${id}/archive`)

            clients.value = clients.value.filter(
                (client) => client.id !== id,
            )

            toast.success('Client archived successfully')
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                toast.error(
                    err.response?.data?.message ??
                    'Unable to archive the client.',
                )
            } else {
                toast.error('Unable to archive the client.')
            }
        } finally {
            actionLoading.value = null
        }
    }

    async function restoreClient(id: string) {
        actionLoading.value = id

        try {
            await api.patch(`/clients/${id}/restore`)

            clients.value = clients.value.filter(
                (client) => client.id !== id,
            )

            toast.success('Client restored successfully')
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                toast.error(
                    err.response?.data?.message ??
                    'Unable to restore the client.',
                )
            } else {
                toast.error('Unable to restore the client.')
            }
        } finally {
            actionLoading.value = null
        }
    }

    async function deleteClient(id: string) {
        actionLoading.value = id

        try {
            await api.delete(`/clients/${id}`)

            clients.value = clients.value.filter(
                (client) => client.id !== id,
            )

            toast.success('Client deleted successfully')
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                toast.error(
                    err.response?.data?.message ??
                    'Unable to delete the client.',
                )
            } else {
                toast.error('Unable to delete the client.')
            }
        } finally {
            actionLoading.value = null
        }
    }

    onMounted(fetchClients)

    watch(
        [viewMode, search, statusFilter],
        fetchClients,
    )
</script>

    <template>
        <main class="min-h-screen bg-background p-6">
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

                    <Button @click="createClient">
                        Add Client
                    </Button>
                </div>

                <div
                    class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                    <Input v-model="search" placeholder="Search by name, email, or phone..." class="md:max-w-sm" />

                    <div class="flex gap-2">
                        <Button :variant="viewMode === 'active'
                            ? 'default'
                            : 'outline'
                            " @click="viewMode = 'active'">
                            Active
                        </Button>

                        <Button :variant="viewMode === 'archived'
                            ? 'default'
                            : 'outline'
                            " @click="viewMode = 'archived'">
                            Archived
                        </Button>
                    </div>

                    <select v-model="statusFilter"
                        class="border-input bg-background h-10 rounded-md border px-3 py-2 text-sm md:ml-auto md:w-48">
                        <option value="All">
                            All statuses
                        </option>

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
                </div>

                <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            <TableRow v-if="isLoading">
                                <TableCell :colspan="9" class="text-muted-foreground h-24 text-center">
                                    Loading clients...
                                </TableCell>
                            </TableRow>

                            <TableRow v-else-if="error">
                                <TableCell :colspan="9" class="text-destructive h-24 text-center">
                                    {{ error }}
                                </TableCell>
                            </TableRow>

                            <TableRow v-else-if="
                                clients.length === 0
                            ">
                                <TableCell :colspan="9" class="text-muted-foreground h-24 text-center">
                                    No clients found.
                                </TableCell>
                            </TableRow>

                            <TableRow v-for="client in clients" v-else :key="client.id" class="cursor-pointer"
                                @click="openClient(client.id)">
                                <TableCell>
                                    {{ client.first_name }}
                                    {{ client.last_name }}
                                </TableCell>

                                <TableCell>
                                    {{ client.email }}
                                </TableCell>

                                <TableCell>
                                    {{ client.phone || '-' }}
                                </TableCell>

                                <TableCell>
                                    {{ client.company || '-' }}
                                </TableCell>

                                <TableCell>
                                    {{ client.address || '-' }}
                                </TableCell>

                                <TableCell>
                                    {{ client.city || '-' }}
                                </TableCell>

                                <TableCell>
                                    {{ client.country || '-' }}
                                </TableCell>

                                <TableCell>
                                    <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                        :class="{
                                            'bg-emerald-50 text-emerald-700':
                                                client.status === 'Active',
                                            'bg-slate-100 text-slate-600':
                                                client.status === 'Inactive',
                                            'bg-blue-50 text-blue-700':
                                                client.status === 'Lead',
                                            'bg-amber-50 text-amber-700':
                                                client.status === 'Archived',
                                        }">
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
                                                <DropdownMenuItem v-if="
                                                    viewMode ===
                                                    'active'
                                                " :disabled="actionLoading ===
                                                    client.id
                                                    " @click="
                                                            archiveClient(
                                                                client.id,
                                                            )
                                                            ">
                                                    {{
                                                        actionLoading ===
                                                            client.id
                                                            ? 'Archiving...'
                                                            : 'Archive'
                                                    }}
                                                </DropdownMenuItem>

                                                <DropdownMenuItem v-else :disabled="actionLoading ===
                                                    client.id
                                                    " @click="
                                                        restoreClient(
                                                            client.id,
                                                        )
                                                        ">
                                                    {{
                                                        actionLoading ===
                                                            client.id
                                                            ? 'Restoring...'
                                                            : 'Restore'
                                                    }}
                                                </DropdownMenuItem>

                                                <AlertDialog v-if="
                                                    viewMode ===
                                                    'archived'
                                                ">
                                                    <AlertDialogTrigger as-child>
                                                        <DropdownMenuItem
                                                            class="text-destructive focus:text-destructive"
                                                            @select.prevent>
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>

                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Delete client?
                                                            </AlertDialogTitle>

                                                            <AlertDialogDescription>
                                                                This action cannot
                                                                be undone. This will
                                                                permanently delete
                                                                the client and their
                                                                record.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>

                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>

                                                            <AlertDialogAction :disabled="actionLoading ===
                                                                client.id
                                                                " @click="
                                                                    deleteClient(
                                                                        client.id,
                                                                    )
                                                                    ">
                                                                {{
                                                                    actionLoading ===
                                                                        client.id
                                                                        ? 'Deleting...'
                                                                        : 'Delete'
                                                                }}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </main>
    </template>


