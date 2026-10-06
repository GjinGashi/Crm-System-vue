<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import FormDialog from '@/components/shared/FormDialog.vue'
import EmployeeForm from '@/components/employees/EmployeeForm.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface Employee {
    id: number
    user_id: string
    role_id: number
    archived_at: string | null
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
}

type EmployeeAction = 'archive' | 'restore' | 'delete'

const actionConfig: Record<
    EmployeeAction,
    { request: (id: number) => Promise<unknown>; done: string }
> = {
    archive: { request: (id) => api.patch(`/employees/${id}/archive`), done: 'archived' },
    restore: { request: (id) => api.patch(`/employees/${id}/restore`), done: 'restored' },
    delete: { request: (id) => api.delete(`/employees/${id}`), done: 'deleted' },
}

const router = useRouter()

const employees = ref<Employee[]>([])
const search = ref('')
const viewMode = ref<'active' | 'archived'>('active')
const isLoading = ref(true)
const generalError = ref('')
const actionLoading = ref(false)
const employeeDialogOpen = ref(false)

const dialogs = ref<Record<EmployeeAction, boolean>>({
    archive: false,
    restore: false,
    delete: false,
})

const selectedEmployee = ref<Employee | null>(null)

const selectedName = computed(() =>
    selectedEmployee.value
        ? `${selectedEmployee.value.user.first_name} ${selectedEmployee.value.user.last_name}`
        : 'this employee',
)

const dialogText = computed(() => ({
    archive: `Are you sure you want to archive "${selectedName.value}"? You can restore this employee later from the Archived employees section.`,
    restore: `Are you sure you want to restore "${selectedName.value}"? The employee will return to the Active employees list.`,
    delete: 'This will delete the employee account permanently. This action cannot be undone.',
}))


const filteredEmployees = computed(() => {
    const value = search.value.trim().toLowerCase()

    if (!value) {
        return employees.value
    }

    return employees.value.filter((employee) => {
        const fullName = `${employee.user.first_name} ${employee.user.last_name}`.toLowerCase()

        return (
            fullName.includes(value) ||
            employee.user.email.toLowerCase().includes(value) ||
            employee.role.name.toLowerCase().includes(value)
        )
    })
})

async function fetchEmployees() {
    isLoading.value = true
    generalError.value = ''

    try {
        const response = await api.get('/employees', {
            params: { archived: viewMode.value === 'archived' ? 1 : 0 },
        })

        employees.value = response.data
    } catch (err) {
        generalError.value = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Unable to load employees.')
            : 'Unable to load employees.'
    } finally {
        isLoading.value = false
    }
}
function createEmployee() {
    employeeDialogOpen.value = true
}

async function onEmployeeCreated() {
    employeeDialogOpen.value = false
    await fetchEmployees()
}

function openDialog(action: EmployeeAction, employee: Employee) {
    selectedEmployee.value = employee
    dialogs.value[action] = true
}

async function confirmAction(action: EmployeeAction) {
    const id = selectedEmployee.value?.id

    if (!id) return

    actionLoading.value = true

    try {
        await actionConfig[action].request(id)

        employees.value = employees.value.filter((employee) => employee.id !== id)

        toast.success(`Employee ${actionConfig[action].done} successfully.`)

        dialogs.value[action] = false
        selectedEmployee.value = null
    } catch (err) {
        const fallback = `Unable to ${action} employee.`

        toast.error(
            axios.isAxiosError(err)
                ? (err.response?.data?.message ?? fallback)
                : fallback,
        )
    } finally {
        actionLoading.value = false
    }
}

watch(viewMode, fetchEmployees)

onMounted(fetchEmployees)
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-semibold">Employees</h1>
                <p class="text-sm text-muted-foreground">Manage employees</p>
            </div>

            <Button v-if="viewMode === 'active'" @click="employeeDialogOpen = true">
                Add Employee
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Employees</CardTitle>
            </CardHeader>

            <CardContent class="space-y-4">
                <div
                    class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                    <Input v-model="search" placeholder="Search employees..." class="md:max-w-sm" />

                    <div class="flex gap-2">
                        <Button :variant="viewMode === 'active' ? 'default' : 'outline'" @click="viewMode = 'active'">
                            Active
                        </Button>

                        <Button :variant="viewMode === 'archived' ? 'default' : 'outline'"
                            @click="viewMode = 'archived'">
                            Archived
                        </Button>
                    </div>
                </div>

                <div v-if="generalError"
                    class="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {{ generalError }}
                </div>

                <div v-if="isLoading" class="py-10 text-center text-sm text-muted-foreground">
                    Loading employees...
                </div>

                <div v-else-if="filteredEmployees.length === 0" class="py-10 text-center text-sm text-muted-foreground">
                    No employees found.
                </div>

                <div v-else class="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead class="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            <TableRow v-for="employee in filteredEmployees" :key="employee.id"
                                class="cursor-pointer hover:bg-muted/50"
                                @click="router.push(`/employees/${employee.id}`)">
                                <TableCell class="font-medium">
                                    {{ employee.user.first_name }} {{ employee.user.last_name }}
                                </TableCell>

                                <TableCell>{{ employee.user.email }}</TableCell>

                                <TableCell>{{ employee.role.name }}</TableCell>

                                <TableCell class="text-right">
                                    <div class="flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger as-child @click.stop>
                                                <Button variant="outline" size="sm">Actions</Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem v-if="viewMode === 'active'"
                                                    @click.stop="openDialog('archive', employee)">
                                                    Archive
                                                </DropdownMenuItem>

                                                <DropdownMenuItem v-if="viewMode === 'archived'"
                                                    @click.stop="openDialog('restore', employee)">
                                                    Restore
                                                </DropdownMenuItem>

                                                <DropdownMenuItem v-if="viewMode === 'archived'"
                                                    class="text-destructive"
                                                    @click.stop="openDialog('delete', employee)">
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
            </CardContent>
        </Card>

        <ConfirmDialog v-model:open="dialogs.archive" title="Archive employee?" :description="dialogText.archive"
            confirm-text="Archive" loading-text="Archiving..." :loading="actionLoading" destructive
            @confirm="confirmAction('archive')" />

        <ConfirmDialog v-model:open="dialogs.restore" title="Restore employee?" :description="dialogText.restore"
            confirm-text="Restore" loading-text="Restoring..." :loading="actionLoading"
            @confirm="confirmAction('restore')" />

        <ConfirmDialog v-model:open="dialogs.delete" title="Delete employee?" :description="dialogText.delete"
            confirm-text="Delete" loading-text="Deleting..." :loading="actionLoading" destructive
            @confirm="confirmAction('delete')" />

        <FormDialog v-model:open="employeeDialogOpen" title="Create Employee" description="Create a new employee.">
            <EmployeeForm @saved="employeeDialogOpen = false; fetchEmployees()" @cancel="employeeDialogOpen = false" />
        </FormDialog>
    </div>
</template>