<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import EmployeeForm from '@/components/Employees/EmployeeForm.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import DetailField from '@/components/shared/DetailField.vue'
import FieldRow from '@/components/shared/FieldRow.vue'
import FormDialog from '@/components/shared/FormDialog.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import TaskForm from '@/components/Tasks/TaskForm.vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/api'

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
}

interface Employee {
    id: number
    user_id: string
    role_id: number
    user: {
        id: string
        first_name: string
        last_name: string
        email: string
    }
    role: {
        id: number
        name: string
    }
    archived_at: string | null
}

const route = useRoute()
const router = useRouter()

const employee = ref<Employee | null>(null)
const tasks = ref<Task[]>([])
const error = ref('')
const isLoading = ref(true)
const isEditing = ref(false)
const isSaving = ref(false)
const isArchiving = ref(false)
const archiveDialogOpen = ref(false)
const taskDialogOpen = ref(false)
const isEmployeeArchived = computed(() => !!employee.value?.archived_at)

function errorMessage(err: unknown, fallback: string) {
    return axios.isAxiosError(err)
        ? (err.response?.data?.message ?? fallback)
        : fallback
}

// Tasks belong to the employee's user, so they are found by user id.
async function fetchTasks() {
    if (!employee.value) return

    try {
        const response = await api.get('/tasks', {
            params: { archived: 0, user_id: employee.value.user_id },
        })

        tasks.value = response.data.data ?? response.data
    } catch {
        tasks.value = []
    }
}

async function fetchEmployee() {
    try {
        const response = await api.get(`/employees/${route.params.id}`)
        employee.value = response.data

        await fetchTasks()
    } catch (err) {
        error.value = errorMessage(err, 'Unable to load employee. Please try again.')
    } finally {
        isLoading.value = false
    }
}

async function onSaved() {
    await fetchEmployee()
    isEditing.value = false
}

async function onTaskCreated() {
    taskDialogOpen.value = false
    await fetchTasks()
}

async function archiveEmployee() {
    if (!employee.value) return

    isArchiving.value = true

    const isArchived = !!employee.value.archived_at
    const action = isArchived ? 'restore' : 'archive'

    try {
        await api.patch(`/employees/${employee.value.id}/${action}`)

        toast.success(
            isArchived
                ? 'Employee restored successfully.'
                : 'Employee archived successfully.',
        )

        await router.push('/employees')
    } catch (err) {
        toast.error(
            errorMessage(
                err,
                isArchived
                    ? 'Unable to restore employee.'
                    : 'Unable to archive employee.',
            ),
        )
    } finally {
        isArchiving.value = false
        archiveDialogOpen.value = false
    }
}

onMounted(fetchEmployee)
</script>

<template>
    <div class="space-y-6">


        <div>
            <h1 class="text-3xl font-bold tracking-tight">Employee Details</h1>
            <p class="text-muted-foreground">View and edit employee information and assigned tasks</p>
        </div>

        <p v-if="isLoading" class="text-muted-foreground">Loading employee...</p>

        <p v-else-if="error" class="rounded-md bg-red-50 p-3 text-sm text-destructive">
            {{ error }}
        </p>

        <div v-else-if="employee" class="space-y-4">
            <Button variant="outline" @click="router.push('/employees')">
                Back to Employees
            </Button>

            <Tabs default-value="overview" class="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" class="mt-4">
                    <div class="rounded-lg border bg-white p-6">
                        <div class="flex flex-wrap items-start justify-between gap-4  pb-4">
                            <div>
                                <h2 class="text-lg font-semibold">Employee Information</h2>
                                <p class="text-sm text-muted-foreground">Details about this employee</p>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                <Button v-if="!isEditing" type="button" @click="isEditing = true">
                                    Edit Employee
                                </Button>

                                <template v-else>
                                    <Button type="button" :disabled="isSaving || isArchiving"
                                        @click="archiveDialogOpen = true">
                                        {{ isArchiving
                                            ? (isEmployeeArchived ? 'Restoring...' : 'Archiving...')
                                            : (isEmployeeArchived ? 'Restore' : 'Archive')
                                        }}
                                    </Button>

                                    <Button type="button" variant="outline" :disabled="isSaving || isArchiving"
                                        @click="isEditing = false">
                                        Cancel
                                    </Button>

                                    <Button type="submit" form="employee-form" :disabled="isSaving || isArchiving">
                                        {{ isSaving ? 'Saving...' : 'Save' }}
                                    </Button>
                                </template>
                            </div>
                        </div>

                        <EmployeeForm v-if="isEditing" :employee="employee" v-model:loading="isSaving"
                            @saved="onSaved" />

                        <div v-else>
                            <FieldRow>
                                <DetailField label="First Name" :value="employee.user.first_name" />
                                <DetailField label="Last Name" :value="employee.user.last_name" />
                            </FieldRow>

                            <FieldRow>
                                <DetailField label="Email" :value="employee.user.email" />
                                <DetailField label="Role" :value="employee.role.name" />
                            </FieldRow>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="tasks" class="mt-4">
                    <div class="rounded-lg border bg-white p-6">
                        <div class="mb-4 flex items-center justify-between">
                            <h2 class="text-xl font-semibold">Tasks</h2>

                            <Button type="button" @click="taskDialogOpen = true">Add Task</Button>
                        </div>

                        <p v-if="!tasks.length" class="text-muted-foreground">
                            No tasks assigned to this employee yet.
                        </p>

                        <div v-else class="space-y-3">
                            <div v-for="task in tasks" :key="task.id"
                                class="cursor-pointer rounded-md border p-4 transition hover:bg-slate-50"
                                @click="router.push(`/tasks/${task.id}`)">
                                <div class="flex items-center justify-between gap-4">
                                    <h3 class="font-semibold">{{ task.title }}</h3>
                                    <StatusBadge :value="task.status" />
                                </div>

                                <p class="text-sm text-muted-foreground">
                                    {{ task.description || 'No description' }}
                                </p>

                                <div class="mt-2">
                                    <StatusBadge :value="task.priority" />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        <FormDialog v-model:open="taskDialogOpen" title="Create Task"
            :description="`Assign a new task to ${employee?.user.first_name} ${employee?.user.last_name}.`">
            <TaskForm :defaults="{ user_id: employee?.user_id }" @saved="onTaskCreated"
                @cancel="taskDialogOpen = false" />
        </FormDialog>
        <ConfirmDialog v-model:open="archiveDialogOpen"
            :title="isEmployeeArchived ? 'Restore employee?' : 'Archive employee?'" :description="isEmployeeArchived
                ? 'This employee will be restored to the active employees.'
                : 'This employee will be moved to the archived employees.'"
            :confirm-text="isEmployeeArchived ? 'Restore' : 'Archive'"
            :loading-text="isEmployeeArchived ? 'Restoring...' : 'Archiving...'" :loading="isArchiving"
            @confirm="archiveEmployee" />
    </div>
</template>