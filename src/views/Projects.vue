```vue
<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
    id: number
    first_name: string
    last_name: string
}

interface Project {
    id: number
    client_id: number
    name: string
    description: string | null
    status: string
    priority: string
    start_date: string | null
    due_date: string | null
    budget: number | null
    archived_at: string | null
}

const router = useRouter()

const clients = ref<Client[]>([])
const projects = ref<Project[]>([])
const dueDateFilter = ref('')
const priorityFilter = ref('All')
const clientFilter = ref('All')
const statusFilter = ref('All')
const search = ref('')
const viewMode = ref<'active' | 'archived'>('active')
const isLoading = ref(true)
const actionLoading = ref<number | null>(null)
const error = ref('')

const filteredProjects = computed(() => {
    return projects.value.filter((project) => {
        const isArchived = project.archived_at !== null

        const matchesView =
            viewMode.value === 'archived'
                ? isArchived
                : !isArchived

        const matchesSearch = project.name
            .toLowerCase()
            .includes(search.value.toLowerCase())

        const matchesClient =
            clientFilter.value === 'All' ||
            project.client_id === Number(clientFilter.value)

        const matchesStatus =
            statusFilter.value === 'All' ||
            project.status === statusFilter.value

        const matchesPriority =
            priorityFilter.value === 'All' ||
            project.priority === priorityFilter.value

        const matchesDueDate =
            dueDateFilter.value === '' ||
            project.due_date === dueDateFilter.value

        return (
            matchesSearch &&
            matchesClient &&
            matchesStatus &&
            matchesPriority &&
            matchesDueDate &&
            matchesView
        )
    })
})

function getClientName(clientId: number): string {
    const client = clients.value.find(
        (item) => item.id === clientId,
    )

    return client
        ? `${client.first_name} ${client.last_name}`
        : '-'
}

function openProject(id: number) {
    router.push(`/projects/${id}`)
}

function createProject() {
    router.push('/projects/create')
}

async function fetchProjects() {
    isLoading.value = true
    error.value = ''

    try {
        const response = await api.get('/projects', {
            params: {
                archived:
                    viewMode.value === 'archived' ? 1 : 0,
            },
        })

        projects.value = response.data
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            error.value =
                err.response?.data?.message ??
                'Unable to load projects. Please try again.'
        } else {
            error.value =
                'Unable to load projects. Please try again.'
        }
    } finally {
        isLoading.value = false
    }
}

async function fetchClients() {
    try {
        const response = await api.get('/clients', {
            params: {
                archived: 0,
            },
        })

        clients.value = response.data
    } catch {
        clients.value = []
    }
}

async function archiveProject(project: Project) {
    actionLoading.value = project.id

    try {
        await api.patch(
            `/projects/${project.id}/archive`,
        )

        projects.value = projects.value.filter(
            (item) => item.id !== project.id,
        )

        toast.success('Project archived successfully')
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            toast.error(
                err.response?.data?.message ??
                    'Unable to archive the project.',
            )
        } else {
            toast.error('Unable to archive the project.')
        }
    } finally {
        actionLoading.value = null
    }
}

async function restoreProject(id: number) {
    actionLoading.value = id

    try {
        await api.patch(`/projects/${id}/restore`)

        projects.value = projects.value.filter(
            (project) => project.id !== id,
        )

        toast.success('Project restored successfully')
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            toast.error(
                err.response?.data?.message ??
                    'Unable to restore the project.',
            )
        } else {
            toast.error('Unable to restore the project.')
        }
    } finally {
        actionLoading.value = null
    }
}

async function deleteProject(project: Project) {
    actionLoading.value = project.id

    try {
        await api.delete(`/projects/${project.id}`)

        projects.value = projects.value.filter(
            (item) => item.id !== project.id,
        )

        toast.success('Project deleted successfully')
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            toast.error(
                err.response?.data?.message ??
                    'Unable to delete the project.',
            )
        } else {
            toast.error('Unable to delete the project.')
        }
    } finally {
        actionLoading.value = null
    }
}

onMounted(async () => {
    await Promise.all([
        fetchProjects(),
        fetchClients(),
    ])
})

watch(viewMode, fetchProjects)
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="space-y-6">
            <div
                class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <h1
                        class="text-3xl font-bold tracking-tight"
                    >
                        Projects
                    </h1>

                    <p class="text-muted-foreground">
                        Manage projects and their clients
                    </p>
                </div>

                <Button @click="createProject">
                    Create Project
                </Button>
            </div>

            <div
                class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center"
            >
                <Input
                    v-model="search"
                    placeholder="Search projects by name..."
                    class="md:max-w-sm"
                />

                <div class="flex gap-2">
                    <Button
                        :variant="
                            viewMode === 'active'
                                ? 'default'
                                : 'outline'
                        "
                        @click="viewMode = 'active'"
                    >
                        Active
                    </Button>

                    <Button
                        :variant="
                            viewMode === 'archived'
                                ? 'default'
                                : 'outline'
                        "
                        @click="viewMode = 'archived'"
                    >
                        Archived
                    </Button>
                </div>
            </div>

            <div
                class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4"
            >
                <select
                    v-model="clientFilter"
                    class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                >
                    <option value="All">
                        Filter by Client
                    </option>

                    <option
                        v-for="client in clients"
                        :key="client.id"
                        :value="client.id"
                    >
                        {{ client.first_name }}
                        {{ client.last_name }}
                    </option>
                </select>

                <select
                    v-model="statusFilter"
                    class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                >
                    <option value="All">
                        Filter by Status
                    </option>

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

                <select
                    v-model="priorityFilter"
                    class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                >
                    <option value="All">
                        Filter by Priority
                    </option>

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

                <div
                    class="bg-background rounded-md border px-3 py-2"
                >
                    <label
                        class="text-muted-foreground mb-1 block text-xs font-medium"
                    >
                        Due Date
                    </label>

                    <Input
                        v-model="dueDateFilter"
                        type="date"
                        class="border-0 p-0 shadow-none focus-visible:ring-0"
                    />
                </div>
            </div>

            <div
                class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>State</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <TableRow v-if="isLoading">
                            <TableCell
                                :colspan="9"
                                class="text-muted-foreground h-24 text-center"
                            >
                                Loading projects...
                            </TableCell>
                        </TableRow>

                        <TableRow v-else-if="error">
                            <TableCell
                                :colspan="9"
                                class="h-32 text-center"
                            >
                                <div
                                    class="flex flex-col items-center justify-center gap-2"
                                >
                                    <p
                                        class="text-destructive font-medium"
                                    >
                                        {{ error }}
                                    </p>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        @click="fetchProjects"
                                    >
                                        Try again
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow
                            v-else-if="
                                filteredProjects.length === 0
                            "
                        >
                            <TableCell
                                :colspan="9"
                                class="h-32 text-center"
                            >
                                <div
                                    class="flex flex-col items-center justify-center gap-1"
                                >
                                    <p
                                        class="font-medium text-slate-900"
                                    >
                                        {{
                                            search ||
                                            clientFilter !==
                                                'All' ||
                                            statusFilter !==
                                                'All' ||
                                            priorityFilter !==
                                                'All' ||
                                            dueDateFilter
                                                ? 'No projects match your filters.'
                                                : viewMode ===
                                                    'archived'
                                                  ? 'No archived projects.'
                                                  : 'No projects yet.'
                                        }}
                                    </p>

                                    <p
                                        class="text-muted-foreground text-sm"
                                    >
                                        {{
                                            search ||
                                            clientFilter !==
                                                'All' ||
                                            statusFilter !==
                                                'All' ||
                                            priorityFilter !==
                                                'All' ||
                                            dueDateFilter
                                                ? 'Try adjusting your search or filters.'
                                                : viewMode ===
                                                    'archived'
                                                  ? 'Archived projects will appear here.'
                                                  : 'Create your first project to get started.'
                                        }}
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow
                            v-for="project in filteredProjects"
                            v-else
                            :key="project.id"
                            class="cursor-pointer"
                            @click="openProject(project.id)"
                        >
                            <TableCell>
                                {{ project.name }}
                            </TableCell>

                            <TableCell>
                                {{ getClientName(project.client_id) }}
                            </TableCell>

                            <TableCell>
                                <span
                                    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                    :class="{
                                        'bg-slate-100 text-slate-700':
                                            project.status ===
                                            'Planning',
                                        'bg-blue-50 text-blue-700':
                                            project.status ===
                                            'In Progress',
                                        'bg-amber-50 text-amber-700':
                                            project.status ===
                                            'On Hold',
                                        'bg-emerald-50 text-emerald-700':
                                            project.status ===
                                            'Completed',
                                        'bg-red-50 text-red-700':
                                            project.status ===
                                            'Canceled',
                                    }"
                                >
                                    {{ project.status }}
                                </span>
                            </TableCell>

                            <TableCell>
                                <span
                                    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                    :class="{
                                        'bg-emerald-50 text-emerald-700':
                                            !project.archived_at,
                                        'bg-amber-50 text-amber-700':
                                            project.archived_at,
                                    }"
                                >
                                    {{
                                        project.archived_at
                                            ? 'Archived'
                                            : 'Active'
                                    }}
                                </span>
                            </TableCell>

                            <TableCell>
                                <Badge variant="outline">
                                    {{ project.priority }}
                                </Badge>
                            </TableCell>

                            <TableCell>
                                {{ project.start_date || '-' }}
                            </TableCell>

                            <TableCell>
                                {{ project.due_date || '-' }}
                            </TableCell>

                            <TableCell>
                                {{ project.budget ?? '-' }}
                            </TableCell>

                            <TableCell>
                                <div
                                    class="flex items-center gap-2"
                                    @click.stop
                                >
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            as-child
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                            >
                                                Actions
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent
                                            align="end"
                                        >
                                            <DropdownMenuItem
                                                v-if="
                                                    viewMode ===
                                                    'active'
                                                "
                                                :disabled="
                                                    actionLoading ===
                                                    project.id
                                                "
                                                @click="
                                                    archiveProject(
                                                        project,
                                                    )
                                                "
                                            >
                                                {{
                                                    actionLoading ===
                                                    project.id
                                                        ? 'Archiving...'
                                                        : 'Archive'
                                                }}
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                v-else
                                                :disabled="
                                                    actionLoading ===
                                                    project.id
                                                "
                                                @click="
                                                    restoreProject(
                                                        project.id,
                                                    )
                                                "
                                            >
                                                {{
                                                    actionLoading ===
                                                    project.id
                                                        ? 'Restoring...'
                                                        : 'Restore'
                                                }}
                                            </DropdownMenuItem>

                                            <AlertDialog
                                                v-if="
                                                    viewMode ===
                                                    'archived'
                                                "
                                            >
                                                <AlertDialogTrigger
                                                    as-child
                                                >
                                                    <DropdownMenuItem
                                                        class="text-destructive focus:text-destructive"
                                                        @select.prevent
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>

                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Delete
                                                            project?
                                                        </AlertDialogTitle>

                                                        <AlertDialogDescription>
                                                            This action
                                                            cannot be undone.
                                                            This will
                                                            permanently
                                                            delete the
                                                            project and its
                                                            record.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>

                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Cancel
                                                        </AlertDialogCancel>

                                                        <AlertDialogAction
                                                            :disabled="
                                                                actionLoading ===
                                                                project.id
                                                            "
                                                            @click="
                                                                deleteProject(
                                                                    project,
                                                                )
                                                            "
                                                        >
                                                            {{
                                                                actionLoading ===
                                                                project.id
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
