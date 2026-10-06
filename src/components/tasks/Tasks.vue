    <script setup lang="ts">
    import axios from 'axios'
    import { computed, onMounted, ref, watch } from 'vue'
    import { useRouter } from 'vue-router'
    import { toast } from 'vue-sonner'

    import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
    import FormDialog from '@/components/shared/FormDialog.vue'
    import TaskForm from '@/components/tasks/TaskForm.vue'
    import { Badge } from '@/components/ui/badge'
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
        status: string
        priority: string
        due_date: string | null
        project: Project | null
        user: User | null
    }

    type TaskAction = 'archive' | 'restore' | 'delete'

    const actionConfig: Record<
        TaskAction,
        { request: (id: string) => Promise<unknown>; done: string }
    > = {
        archive: { request: (id) => api.patch(`/tasks/${id}/archive`), done: 'archived' },
        restore: { request: (id) => api.patch(`/tasks/${id}/restore`), done: 'restored' },
        delete: { request: (id) => api.delete(`/tasks/${id}`), done: 'deleted' },
    }

    const statuses = ['Todo', 'In Progress', 'Completed', 'Canceled']
    const priorities = ['Low', 'Medium', 'High', 'Urgent']

    const statusClasses: Record<string, string> = {
        Todo: 'bg-gray-100 text-gray-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        Completed: 'bg-green-100 text-green-800',
        Canceled: 'bg-red-100 text-red-800',
    }

    const priorityClasses: Record<string, string> = {
        Low: 'bg-gray-100 text-gray-800',
        Medium: 'bg-blue-100 text-blue-800',
        High: 'bg-orange-100 text-orange-800',
        Urgent: 'bg-red-100 text-red-800',
    }

    const router = useRouter()

    const tasks = ref<Task[]>([])
    const projects = ref<Project[]>([])
    const users = ref<User[]>([])

    const search = ref('')
    const projectFilter = ref('All')
    const userFilter = ref('All')
    const statusFilter = ref('All')
    const priorityFilter = ref('All')
    const dueDateFilter = ref('')
    const viewMode = ref<'active' | 'archived'>('active')

    const error = ref('')
    const isLoading = ref(true)
    const isAdmin = ref(false)
    const actionLoading = ref<string | null>(null)
    const taskDialogOpen = ref(false)

    const dialogs = ref<Record<TaskAction, boolean>>({
        archive: false,
        restore: false,
        delete: false,
    })

    const selectedTaskId = ref<string | null>(null)

    const selectedTitle = computed(
        () => tasks.value.find((t) => t.id === selectedTaskId.value)?.title ?? 'this task',
    )

    const dialogText = computed(() => ({
        archive: `Are you sure you want to archive "${selectedTitle.value}"? You can restore it later from the Archived tasks section.`,
        restore: `Are you sure you want to restore "${selectedTitle.value}"? The task will return to the Active tasks list.`,
        delete: `This will permanently delete "${selectedTitle.value}". This action cannot be undone.`,
    }))

    const columnCount = computed(() => (isAdmin.value ? 7 : 6))

    const statusMessage = computed(() => {
        if (isLoading.value) return 'Loading tasks...'
        if (error.value) return error.value
        if (tasks.value.length === 0) return 'No tasks found.'
        return ''
    })

    function dateOnly(value: string | null) {
        return value ? value.substring(0, 10) : '-'
    }

    async function fetchTasks() {
        isLoading.value = true
        error.value = ''

        try {
            const response = await api.get('/tasks', {
                params: {
                    archived: viewMode.value === 'archived' ? 1 : 0,
                    search: search.value.trim(),
                    project_id: projectFilter.value,
                    user_id: userFilter.value,
                    status: statusFilter.value,
                    priority: priorityFilter.value,
                    due_date: dueDateFilter.value,
                },
            })

            tasks.value = response.data.data ?? response.data
        } catch (err) {
            error.value = axios.isAxiosError(err)
                ? (err.response?.data?.message ?? 'Unable to load tasks. Please try again.')
                : 'Unable to load tasks. Please try again.'
        } finally {
            isLoading.value = false
        }
    }

    async function fetchFilterOptions() {
        try {
            const [projectsResponse, usersResponse] = await Promise.all([
                api.get('/projects', { params: { archived: 0 } }),
                api.get('/users'),
            ])

            projects.value = projectsResponse.data.data ?? projectsResponse.data
            users.value = usersResponse.data.data ?? usersResponse.data
        } catch {
            projects.value = []
            users.value = []
        }
    }

    async function fetchUser() {
        try {
            const response = await api.get('/user')
            isAdmin.value = response.data.role === 'admin'
        } catch {
            isAdmin.value = false
        }
    }

    function openTask(id: string) {
        router.push(`/tasks/${id}`)
    }

    function createTask() {
        taskDialogOpen.value = true
    }
    async function onTaskCreated() {
        taskDialogOpen.value = false
        await fetchTasks()
    }

    function openDialog(action: TaskAction, id: string) {
        selectedTaskId.value = id
        dialogs.value[action] = true
    }

    async function confirmAction(action: TaskAction) {
        const id = selectedTaskId.value

        if (!id) return

        actionLoading.value = id

        try {
            await actionConfig[action].request(id)

            tasks.value = tasks.value.filter((task) => task.id !== id)

            toast.success(`Task ${actionConfig[action].done} successfully`)

            dialogs.value[action] = false
            selectedTaskId.value = null
        } catch (err: unknown) {
            const fallback = `Unable to ${action} the task.`

            toast.error(
                axios.isAxiosError(err)
                    ? (err.response?.data?.message ?? fallback)
                    : fallback,
            )
        } finally {
            actionLoading.value = null
        }
    }

    onMounted(() => {
        fetchTasks()
        fetchFilterOptions()
        fetchUser()
    })

    watch(
        [
            viewMode,
            search,
            projectFilter,
            userFilter,
            statusFilter,
            priorityFilter,
            dueDateFilter,
        ],
        fetchTasks,
    )
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
                        Tasks
                    </h1>

                    <p class="text-muted-foreground mt-1 text-sm">
                        Manage your tasks
                    </p>
                </div>

                <Button v-if="viewMode === 'active'" @click="createTask">
                    Create Task
                </Button>
            </div>

            <div
                class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-center">
                <Input v-model="search" placeholder="Search tasks..." class="md:max-w-sm" />

                <div class="flex gap-2">
                    <Button :variant="viewMode === 'active' ? 'default' : 'outline'" @click="viewMode = 'active'">
                        Active
                    </Button>

                    <Button :variant="viewMode === 'archived' ? 'default' : 'outline'" @click="viewMode = 'archived'">
                        Archived
                    </Button>
                </div>

                <select v-model="projectFilter"
                    class="border-input bg-background h-10 rounded-md border px-3 py-2 text-sm">
                    <option value="All">All Projects</option>
                    <option v-for="p in projects" :key="p.id" :value="p.id">
                        {{ p.name }}
                    </option>
                </select>

                <select v-model="userFilter"
                    class="border-input bg-background h-10 rounded-md border px-3 py-2 text-sm">
                    <option value="All">All Users</option>
                    <option v-for="u in users" :key="u.id" :value="u.id">
                        {{ u.first_name }} {{ u.last_name }}
                    </option>
                </select>

                <select v-model="statusFilter"
                    class="border-input bg-background h-10 rounded-md border px-3 py-2 text-sm">
                    <option value="All">All Statuses</option>
                    <option v-for="s in statuses" :key="s" :value="s">
                        {{ s }}
                    </option>
                </select>

                <select v-model="priorityFilter"
                    class="border-input bg-background h-10 rounded-md border px-3 py-2 text-sm">
                    <option value="All">All Priorities</option>
                    <option v-for="p in priorities" :key="p" :value="p">
                        {{ p }}
                    </option>
                </select>

                <Input v-model="dueDateFilter" type="date" class="md:w-44" />
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
                            <TableHead v-if="isAdmin">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <TableRow v-if="statusMessage">
                            <TableCell :colspan="columnCount" class="h-24 text-center"
                                :class="error ? 'text-destructive' : 'text-muted-foreground'">
                                {{ statusMessage }}
                            </TableCell>
                        </TableRow>

                        <TableRow v-for="task in tasks" v-else :key="task.id" class="cursor-pointer"
                            @click="openTask(task.id)">
                            <TableCell class="font-medium">{{ task.title }}</TableCell>

                            <TableCell>{{ task.project?.name ?? '-' }}</TableCell>

                            <TableCell>
                                {{
                                    task.user
                                        ? `${task.user.first_name} ${task.user.last_name}`
                                        : '-'
                                }}
                            </TableCell>

                            <TableCell>
                                <Badge :class="statusClasses[task.status]">
                                    {{ task.status }}
                                </Badge>
                            </TableCell>

                            <TableCell>
                                <Badge :class="priorityClasses[task.priority]">
                                    {{ task.priority }}
                                </Badge>
                            </TableCell>

                            <TableCell>{{ dateOnly(task.due_date) }}</TableCell>

                            <TableCell v-if="isAdmin" @click.stop>
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <Button variant="outline" size="sm" :disabled="actionLoading === task.id">
                                            Actions
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem v-if="viewMode === 'active'"
                                            @select.prevent="openDialog('archive', task.id)">
                                            Archive
                                        </DropdownMenuItem>

                                        <DropdownMenuItem v-else @select.prevent="openDialog('restore', task.id)">
                                            Restore
                                        </DropdownMenuItem>

                                        <DropdownMenuItem v-if="viewMode === 'archived'"
                                            class="text-destructive focus:text-destructive"
                                            @select.prevent="openDialog('delete', task.id)">
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>

        <ConfirmDialog v-model:open="dialogs.archive" title="Archive task?" :description="dialogText.archive"
            confirm-text="Archive" loading-text="Archiving..." :loading="actionLoading === selectedTaskId" destructive
            @confirm="confirmAction('archive')" />

        <ConfirmDialog v-model:open="dialogs.restore" title="Restore task?" :description="dialogText.restore"
            confirm-text="Restore" loading-text="Restoring..." :loading="actionLoading === selectedTaskId"
            @confirm="confirmAction('restore')" />

        <ConfirmDialog v-model:open="dialogs.delete" title="Delete task?" :description="dialogText.delete"
            confirm-text="Delete" loading-text="Deleting..." :loading="actionLoading === selectedTaskId" destructive
            @confirm="confirmAction('delete')" />
        <FormDialog v-model:open="taskDialogOpen" title="Create Task" description="Create a new task.">
            <TaskForm @saved="onTaskCreated" @cancel="taskDialogOpen = false" />
        </FormDialog>
    </main>
</template>