```vue
<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
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

interface Task {
    id: number
    project_id: number
    user_id: number
    title: string
    description: string | null
    status: string
    priority: string
    start_time: string | null
    end_time: string | null
    due_date: string | null
}

interface Project {
    id: number
    name: string
}

interface User {
    id: number
    first_name: string
    last_name: string
}

const router = useRouter()

const tasks = ref<Task[]>([])
const search = ref('')
const projectFilter = ref('All')
const userFilter = ref('All')
const statusFilter = ref('All')
const priorityFilter = ref('All')
const dueDateFilter = ref('')
const projects = ref<Project[]>([])
const users = ref<User[]>([])
const isLoading = ref(true)
const actionLoading = ref<number | null>(null)
const error = ref('')

const filteredTasks = computed(() => {
    return tasks.value.filter((task) => {
        const matchesSearch = task.title
            .toLowerCase()
            .includes(search.value.toLowerCase())

        const matchesProject =
            projectFilter.value === 'All' ||
            task.project_id === Number(projectFilter.value)

        const matchesUser =
            userFilter.value === 'All' ||
            task.user_id === Number(userFilter.value)

        const matchesStatus =
            statusFilter.value === 'All' ||
            task.status === statusFilter.value

        const matchesPriority =
            priorityFilter.value === 'All' ||
            task.priority === priorityFilter.value

        const matchesDueDate =
            dueDateFilter.value === '' ||
            task.due_date === dueDateFilter.value

        return (
            matchesSearch &&
            matchesProject &&
            matchesUser &&
            matchesStatus &&
            matchesPriority &&
            matchesDueDate
        )
    })
})

async function fetchTasks() {
    isLoading.value = true
    error.value = ''

    try {
        const response = await api.get('/tasks')
        tasks.value = response.data
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            error.value =
                err.response?.data?.message ??
                'Unable to load tasks. Please try again.'
        } else {
            error.value =
                'Unable to load tasks. Please try again.'
        }
    } finally {
        isLoading.value = false
    }
}

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

function createTask() {
    router.push('/tasks/create')
}

function openTask(id: number) {
    router.push(`/tasks/${id}`)
}

async function deleteTask(id: number) {
    actionLoading.value = id

    try {
        await api.delete(`/tasks/${id}`)

        tasks.value = tasks.value.filter(
            (task) => task.id !== id,
        )

        toast.success('Task deleted successfully')
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            toast.error(
                err.response?.data?.message ??
                'Unable to delete the task.',
            )
        } else {
            toast.error('Unable to delete the task.')
        }
    } finally {
        actionLoading.value = null
    }
}

onMounted(() => {
    fetchTasks()
    fetchProjects()
    fetchUsers()
})
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="space-y-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">
                        Tasks
                    </h1>

                    <p class="text-muted-foreground">
                        Manage tasks, projects, and deadlines.
                    </p>
                </div>

                <Button @click="createTask">
                    Create Task
                </Button>
            </div>

            <div
                class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-6">
                <Input v-model="search" placeholder="Search tasks by name..." />

                <select v-model="projectFilter"
                    class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm">
                    <option value="All">
                        Filter by Project
                    </option>

                    <option v-for="project in projects" :key="project.id" :value="project.id">
                        {{ project.name }}
                    </option>
                </select>

                <select v-model="userFilter"
                    class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm">
                    <option value="All">
                        Filter by User
                    </option>

                    <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ user.first_name }} {{ user.last_name }}
                    </option>
                </select>

                <select v-model="statusFilter"
                    class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm">
                    <option value="All">
                        Filter by Status
                    </option>

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

                <select v-model="priorityFilter"
                    class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm">
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

                <div class="bg-background rounded-md border px-3 py-2">
                    <label class="text-muted-foreground mb-1 block text-xs font-medium">
                        Due Date
                    </label>

                    <Input v-model="dueDateFilter" type="date" class="border-0 p-0 shadow-none focus-visible:ring-0" />
                </div>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <TableRow v-if="isLoading">
                            <TableCell :colspan="7" class="text-muted-foreground h-24 text-center">
                                Loading tasks...
                            </TableCell>
                        </TableRow>

                        <TableRow v-else-if="error">
                            <TableCell :colspan="7" class="h-32 text-center">
                                <div class="flex flex-col items-center justify-center gap-2">
                                    <p class="text-destructive font-medium">
                                        {{ error }}
                                    </p>

                                    <Button variant="outline" size="sm" @click="fetchTasks">
                                        Try again
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow v-else-if="
                            filteredTasks.length === 0
                        ">
                            <TableCell :colspan="7" class="h-32 text-center">
                                <div class="flex flex-col items-center justify-center gap-1">
                                    <p class="font-medium text-slate-900">
                                        {{
                                            search ||
                                                projectFilter !== 'All' ||
                                                userFilter !== 'All' ||
                                                statusFilter !== 'All' ||
                                                priorityFilter !== 'All' ||
                                                dueDateFilter
                                                ? 'No tasks match your filters.'
                                                : 'No tasks yet.'
                                        }}
                                    </p>

                                    <p class="text-muted-foreground text-sm">
                                        {{
                                            search ||
                                                projectFilter !== 'All' ||
                                                userFilter !== 'All' ||
                                                statusFilter !== 'All' ||
                                                priorityFilter !== 'All' ||
                                                dueDateFilter
                                                ? 'Try adjusting your search or filters.'
                                                : 'Create your first task to get started.'
                                        }}
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow v-else v-for="task in filteredTasks" :key="task.id" class="cursor-pointer"
                            @click="openTask(task.id)">
                            <TableCell>
                                {{ task.title }}
                            </TableCell>

                            <TableCell>
                                {{
                                    projects.find(
                                        (project) =>
                                            project.id ===
                                            task.project_id,
                                    )?.name || '-'
                                }}
                            </TableCell>

                            <TableCell>
                                {{
                                    (() => {
                                        const user = users.find(
                                            (user) =>
                                                user.id ===
                                                task.user_id,
                                        )

                                        return user
                                            ? `${user.first_name} ${user.last_name}`
                                            : '-'
                                    })()
                                }}
                            </TableCell>

                            <TableCell>
                                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                    :class="{
                                        'bg-slate-100 text-slate-700':
                                            task.status === 'Todo',
                                        'bg-blue-50 text-blue-700':
                                            task.status ===
                                            'In Progress',
                                        'bg-emerald-50 text-emerald-700':
                                            task.status ===
                                            'Completed',
                                        'bg-red-50 text-red-700':
                                            task.status ===
                                            'Canceled',
                                    }">
                                    {{ task.status }}
                                </span>
                            </TableCell>

                            <TableCell>
                                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                    :class="{
                                        'bg-slate-100 text-slate-700':
                                            task.priority === 'Low',
                                        'bg-blue-50 text-blue-700':
                                            task.priority ===
                                            'Medium',
                                        'bg-amber-50 text-amber-700':
                                            task.priority ===
                                            'High',
                                        'bg-red-50 text-red-700':
                                            task.priority ===
                                            'Urgent',
                                    }">
                                    {{ task.priority }}
                                </span>
                            </TableCell>

                            <TableCell>
                                {{ task.due_date || '-' }}
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


                                            <AlertDialog>
                                                <AlertDialogTrigger as-child>
                                                    <DropdownMenuItem class="text-destructive focus:text-destructive"
                                                        @select.prevent>
                                                        Delete
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>

                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Delete task?
                                                        </AlertDialogTitle>

                                                        <AlertDialogDescription>
                                                            This action cannot
                                                            be undone. This will
                                                            permanently delete
                                                            the task and its
                                                            record.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>

                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Cancel
                                                        </AlertDialogCancel>

                                                        <AlertDialogAction :disabled="actionLoading ===
                                                            task.id
                                                            " @click="
                                                                deleteTask(
                                                                    task.id,
                                                                )
                                                                ">
                                                            {{
                                                                actionLoading ===
                                                                    task.id
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
