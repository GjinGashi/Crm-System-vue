<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import FormDialog from '@/components/shared/FormDialog.vue'
import ProjectForm from '@/components/projects/ProjectForm.vue'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import api from '@/lib/api'

interface Client {
    id: string
    first_name: string
    last_name: string
}

interface Project {
    id: string
    name: string
    status: string
    priority: string
    start_date: string | null
    due_date: string | null
    budget: number | null
    client: Client | null
}

type ProjectAction = 'archive' | 'restore' | 'delete'

const actionConfig: Record<
    ProjectAction,
    { request: (id: string) => Promise<unknown>; done: string }
> = {
    archive: { request: (id) => api.patch(`/projects/${id}/archive`), done: 'archived' },
    restore: { request: (id) => api.patch(`/projects/${id}/restore`), done: 'restored' },
    delete: { request: (id) => api.delete(`/projects/${id}`), done: 'deleted' },
}

const statuses = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Canceled']

const statusClasses: Record<string, string> = {
    Planning: 'bg-slate-100 text-slate-700',
    'In Progress': 'bg-blue-50 text-blue-700',
    'On Hold': 'bg-amber-50 text-amber-700',
    Completed: 'bg-emerald-50 text-emerald-700',
    Canceled: 'bg-red-50 text-red-700',
}

const priorityClasses: Record<string, string> = {
    Low: 'bg-slate-100 text-slate-700',
    Medium: 'bg-blue-50 text-blue-700',
    High: 'bg-orange-50 text-orange-700',
    Urgent: 'bg-red-50 text-red-700',
}

const router = useRouter()

const projects = ref<Project[]>([])
const error = ref('')
const isLoading = ref(true)
const search = ref('')
const statusFilter = ref('All')
const viewMode = ref<'active' | 'archived'>('active')
const actionLoading = ref<string | null>(null)
const projectDialogOpen = ref(false)

const dialogs = ref<Record<ProjectAction, boolean>>({
    archive: false,
    restore: false,
    delete: false,
})

const selectedProjectId = ref<string | null>(null)

const statusMessage = computed(() => {
    if (isLoading.value) return 'Loading projects...'
    if (error.value) return error.value
    if (projects.value.length === 0) return 'No projects found.'
    return ''
})

function dateOnly(value: string | null) {
    return value ? value.substring(0, 10) : '-'
}

async function fetchProjects() {
    isLoading.value = true
    error.value = ''

    try {
        const response = await api.get('/projects', {
            params: {
                archived: viewMode.value === 'archived' ? 1 : 0,
                search: search.value.trim(),
                status: statusFilter.value,
            },
        })

        projects.value = response.data.data ?? response.data
    } catch {
        error.value = 'Unable to load projects. Please try again.'
    } finally {
        isLoading.value = false
    }
}

function openProject(id: string) {
    router.push(`/projects/${id}`)
}

function createProject() {
    projectDialogOpen.value = true
}
async function onProjectCreated() {
    projectDialogOpen.value = false
    await fetchProjects()
}

function openDialog(action: ProjectAction, id: string) {
    selectedProjectId.value = id
    dialogs.value[action] = true
}

async function confirmAction(action: ProjectAction) {
    const id = selectedProjectId.value

    if (!id) return

    actionLoading.value = id

    try {
        await actionConfig[action].request(id)

        projects.value = projects.value.filter((project) => project.id !== id)

        toast.success(`Project ${actionConfig[action].done} successfully`)

        dialogs.value[action] = false
        selectedProjectId.value = null
    } catch (err: unknown) {
        const fallback = `Unable to ${action} the project.`

        toast.error(
            axios.isAxiosError(err)
                ? (err.response?.data?.message ?? fallback)
                : fallback,
        )
    } finally {
        actionLoading.value = null
    }
}

onMounted(fetchProjects)

watch([viewMode, search, statusFilter], fetchProjects)
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
                        Projects
                    </h1>

                    <p class="text-muted-foreground mt-1 text-sm">
                        Manage your projects and their progress
                    </p>
                </div>

                <Button @click="createProject">Add Project</Button>
            </div>

            <div
                class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                <Input v-model="search" placeholder="Search by project name..." class="md:max-w-sm" />

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
                    <option v-for="s in statuses" :key="s" :value="s">
                        {{ s }}
                    </option>
                </select>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <TableRow v-if="statusMessage">
                            <TableCell :colspan="8" class="h-24 text-center"
                                :class="error ? 'text-destructive' : 'text-muted-foreground'">
                                {{ statusMessage }}
                            </TableCell>
                        </TableRow>

                        <TableRow v-for="project in projects" v-else :key="project.id" class="cursor-pointer"
                            @click="openProject(project.id)">
                            <TableCell class="font-medium">{{ project.name }}</TableCell>

                            <TableCell>
                                {{
                                    project.client
                                        ? `${project.client.first_name} ${project.client.last_name}`
                                        : '-'
                                }}
                            </TableCell>

                            <TableCell>
                                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                    :class="statusClasses[project.status]">
                                    {{ project.status }}
                                </span>
                            </TableCell>

                            <TableCell>
                                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                    :class="priorityClasses[project.priority]">
                                    {{ project.priority }}
                                </span>
                            </TableCell>

                            <TableCell>{{ dateOnly(project.start_date) }}</TableCell>
                            <TableCell>{{ dateOnly(project.due_date) }}</TableCell>
                            <TableCell>{{ project.budget ?? '-' }}</TableCell>

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
                                                @select.prevent="openDialog('archive', project.id)">
                                                Archive
                                            </DropdownMenuItem>

                                            <DropdownMenuItem v-else
                                                @select.prevent="openDialog('restore', project.id)">
                                                Restore
                                            </DropdownMenuItem>

                                            <DropdownMenuItem v-if="viewMode === 'archived'"
                                                class="text-destructive focus:text-destructive"
                                                @select.prevent="openDialog('delete', project.id)">
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
        </div>

        <ConfirmDialog v-model:open="dialogs.archive" title="Archive project?"
            description="Are you sure you want to archive this project? You can restore it later."
            confirm-text="Archive" loading-text="Archiving..." :loading="actionLoading === selectedProjectId"
            destructive @confirm="confirmAction('archive')" />

        <ConfirmDialog v-model:open="dialogs.restore" title="Restore project?"
            description="Are you sure you want to restore this project?" confirm-text="Restore"
            loading-text="Restoring..." :loading="actionLoading === selectedProjectId"
            @confirm="confirmAction('restore')" />

        <ConfirmDialog v-model:open="dialogs.delete" title="Delete project?"
            description="This action cannot be undone. This will permanently delete the project and its record."
            confirm-text="Delete" loading-text="Deleting..." :loading="actionLoading === selectedProjectId" destructive
            @confirm="confirmAction('delete')" />
        <FormDialog v-model:open="projectDialogOpen" title="Create Project" description="Create a new project.">
            <ProjectForm @saved="onProjectCreated" @cancel="projectDialogOpen = false" />
        </FormDialog>
    </main>
</template>