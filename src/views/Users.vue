<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import FormDialog from '@/components/shared/FormDialog.vue'
import UserForm from '@/components/Users/UserForm.vue'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import api from '@/lib/api'

interface Role {
    id: number
    name: string
}

interface User {
    id: string
    first_name: string
    last_name: string
    email: string
    account_type: 'admin' | 'user'
    employee: {
        id: number
        user_id: string
        role_id: number
        role?: Role
    } | null
}

const router = useRouter()

const users = ref<User[]>([])
const error = ref('')
const isLoading = ref(true)

const userDialogOpen = ref(false)
const deleteDialogOpen = ref(false)

const selectedUserId = ref<string | null>(null)
const actionLoading = ref<string | null>(null)

const statusMessage = computed(() => {
    if (isLoading.value) return 'Loading users...'
    if (error.value) return error.value
    if (users.value.length === 0) return 'No users found.'
    return ''
})

async function fetchUsers() {
    isLoading.value = true
    error.value = ''

    try {
        const response = await api.get('/users')
        users.value = response.data
    } catch (err: unknown) {
        error.value = axios.isAxiosError(err)
            ? (err.response?.data?.message ??
                'Unable to load users. Please try again.')
            : 'Unable to load users. Please try again.'
    } finally {
        isLoading.value = false
    }
}

function openUser(id: string) {
    router.push(`/users/${id}`)
}

function createUser() {
    userDialogOpen.value = true
}

async function onUserCreated() {
    userDialogOpen.value = false
    await fetchUsers()
}

function openDeleteDialog(id: string) {
    selectedUserId.value = id
    deleteDialogOpen.value = true
}

async function deleteUser() {
    const id = selectedUserId.value

    if (!id) {
        return
    }

    actionLoading.value = id

    try {
        await api.delete(`/users/${id}`)

        users.value = users.value.filter(
            (user) => user.id !== id,
        )

        toast.success('User deleted successfully.')

        deleteDialogOpen.value = false
        selectedUserId.value = null
    } catch (err: unknown) {
        const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ??
                'Unable to delete the user. Please try again.')
            : 'Unable to delete the user. Please try again.'

        toast.error(message)
    } finally {
        actionLoading.value = null
    }
}

onMounted(fetchUsers)
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
                    Users
                </h1>

                <p class="mt-1 text-sm text-muted-foreground">
                    Manage system users and their roles
                </p>
            </div>

            <Button @click="createUser">
                Add User
            </Button>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Account Type</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    <TableRow v-if="statusMessage">
                        <TableCell :colspan="6" class="h-24 text-center" :class="error
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                            ">
                            {{ statusMessage }}
                        </TableCell>
                    </TableRow>

                    <TableRow v-for="user in users" v-else :key="user.id" class="cursor-pointer"
                        @click="openUser(user.id)">
                        <TableCell>
                            {{ user.first_name }}
                        </TableCell>

                        <TableCell>
                            {{ user.last_name }}
                        </TableCell>

                        <TableCell>
                            {{ user.email }}
                        </TableCell>

                        <TableCell>
                            {{ user.account_type }}
                        </TableCell>

                        <TableCell>
                            {{ user.employee?.role?.name ?? 'No role assigned' }}
                        </TableCell>

                        <TableCell>
                            <div class="flex items-center gap-2" @click.stop>
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <Button variant="outline" size="sm" :disabled="actionLoading === user.id
                                            ">
                                            Actions
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem @select.prevent="
                                            openUser(user.id)
                                            ">
                                            View
                                        </DropdownMenuItem>

                                        <DropdownMenuItem class="text-destructive focus:text-destructive"
                                            @select.prevent="
                                                openDeleteDialog(user.id)
                                                ">
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

        <ConfirmDialog v-model:open="deleteDialogOpen" title="Delete user?"
            description="This action cannot be undone. This will permanently delete the user and their account."
            confirm-text="Delete" loading-text="Deleting..." :loading="actionLoading === selectedUserId" destructive
            @confirm="deleteUser" />

        <FormDialog v-model:open="userDialogOpen" title="Create User" >
            <UserForm @saved="onUserCreated" @cancel="userDialogOpen = false" />
        </FormDialog>
    </div>
</template>