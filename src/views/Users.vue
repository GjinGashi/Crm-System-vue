```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import api from '@/lib/api'

interface User {
    id: number
    first_name: string
    last_name: string
    email: string
    role: string
}

const users = ref<User[]>([])

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const role = ref('user')

const createErrors = ref<Record<string, string[]>>({})
const editErrors = ref<Record<string, string[]>>({})
const generalError = ref('')
const isLoading = ref(true)
const isCreating = ref(false)

const editingUserId = ref<number | null>(null)
const editFirstName = ref('')
const editLastName = ref('')
const editEmail = ref('')
const editRole = ref('')

const actionLoading = ref<number | null>(null)

async function fetchUsers() {
    isLoading.value = true
    generalError.value = ''

    try {
        const response = await api.get('/users')

        users.value = response.data
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            generalError.value =
                err.response?.data?.message ??
                'Unable to load users.'
        } else {
            generalError.value = 'Unable to load users.'
        }
    } finally {
        isLoading.value = false
    }
}

async function createUser() {
    createErrors.value = {}
    generalError.value = ''
    isCreating.value = true

    try {
        const response = await api.post('/users', {
            first_name: firstName.value,
            last_name: lastName.value,
            email: email.value,
            password: password.value,
            role: role.value,
        })

        const newUser: User =
            response.data.user ?? response.data

        users.value.push(newUser)

        firstName.value = ''
        lastName.value = ''
        email.value = ''
        password.value = ''
        role.value = 'user'
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            if (err.response?.status === 422) {
                createErrors.value =
                    err.response.data.errors ?? {}
            } else {
                generalError.value =
                    err.response?.data?.message ??
                    'Unable to create user.'
            }
        } else {
            generalError.value = 'Unable to create user.'
        }
    } finally {
        isCreating.value = false
    }
}

function startEditingUser(user: User) {
    editingUserId.value = user.id

    editFirstName.value = user.first_name
    editLastName.value = user.last_name
    editEmail.value = user.email
    editRole.value = user.role

    editErrors.value = {}
    generalError.value = ''
}

async function saveEdit() {
    if (editingUserId.value === null) {
        return
    }

    const userId = editingUserId.value

    editErrors.value = {}
    generalError.value = ''
    actionLoading.value = userId

    try {
        const response = await api.patch(`/users/${userId}`, {
            first_name: editFirstName.value,
            last_name: editLastName.value,
            email: editEmail.value,
            role: editRole.value,
        })

        const updatedUser: User =
            response.data.user ?? response.data

        const index = users.value.findIndex(
            (user) => user.id === userId,
        )

        if (index !== -1) {
            users.value[index] = updatedUser
        }

        cancelEditing()
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            if (err.response?.status === 422) {
                editErrors.value =
                    err.response.data.errors ?? {}
            } else {
                generalError.value =
                    err.response?.data?.message ??
                    'Unable to update user.'
            }
        } else {
            generalError.value = 'Unable to update user.'
        }
    } finally {
        actionLoading.value = null
    }
}

async function changeRole(user: User, event: Event) {
    const newRole = (event.target as HTMLSelectElement).value

    actionLoading.value = user.id
    generalError.value = ''

    try {
        const response = await api.patch(`/users/${user.id}`, {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: newRole,
        })

        const updatedUser: User =
            response.data.user ?? response.data

        const index = users.value.findIndex(
            (item) => item.id === user.id,
        )

        if (index !== -1) {
            users.value[index] = updatedUser
        }
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            generalError.value =
                err.response?.data?.message ??
                'Unable to change user role.'
        } else {
            generalError.value = 'Unable to change user role.'
        }

        await fetchUsers()
    } finally {
        actionLoading.value = null
    }
}

async function deleteUser(id: number) {
    actionLoading.value = id
    generalError.value = ''

    try {
        await api.delete(`/users/${id}`)

        users.value = users.value.filter(
            (user) => user.id !== id,
        )
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            generalError.value =
                err.response?.data?.message ??
                'Unable to delete user.'
        } else {
            generalError.value = 'Unable to delete user.'
        }
    } finally {
        actionLoading.value = null
    }
}

function cancelEditing() {
    editingUserId.value = null
    editFirstName.value = ''
    editLastName.value = ''
    editEmail.value = ''
    editRole.value = ''
    editErrors.value = {}
}

onMounted(fetchUsers)
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="space-y-6">
            <h1 class="text-3xl font-bold">
                Users
            </h1>

            <p v-if="generalError" class="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {{ generalError }}
            </p>

            <Card class="mb-6">
                <CardHeader>
                    <CardTitle>Create User</CardTitle>
                </CardHeader>

                <CardContent>
                    <form novalidate class="space-y-4" @submit.prevent="createUser">
                        <div>
                            <Input v-model="firstName" type="text" placeholder="First Name" />

                            <p v-if="createErrors.first_name" class="text-destructive mt-1 text-sm">
                                {{ createErrors.first_name[0] }}
                            </p>
                        </div>

                        <div>
                            <Input v-model="lastName" type="text" placeholder="Last Name" />

                            <p v-if="createErrors.last_name" class="text-destructive mt-1 text-sm">
                                {{ createErrors.last_name[0] }}
                            </p>
                        </div>

                        <div>
                            <Input v-model="email" type="email" placeholder="Email" />

                            <p v-if="createErrors.email" class="text-destructive mt-1 text-sm">
                                {{ createErrors.email[0] }}
                            </p>
                        </div>

                        <div>
                            <Input v-model="password" type="password" placeholder="Password" />

                            <p v-if="createErrors.password" class="text-destructive mt-1 text-sm">
                                {{ createErrors.password[0] }}
                            </p>
                        </div>

                        <div>
                            <Select v-model="role">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="user">
                                        User
                                    </SelectItem>

                                    <SelectItem value="admin">
                                        Admin
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <p v-if="createErrors.role" class="text-destructive mt-1 text-sm">
                                {{ createErrors.role[0] }}
                            </p>
                        </div>

                        <Button type="submit" :disabled="isCreating">
                            {{
                                isCreating
                                    ? 'Creating...'
                                    : 'Create User'
                            }}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div>
                <h2 class="mb-4 text-xl font-semibold">
                    All Users
                </h2>

                <div v-if="isLoading">
                    <p class="text-muted-foreground">
                        Loading users...
                    </p>
                </div>

                <Table v-else>
                    <TableHeader>
                        <TableRow>
                            <TableHead>First Name</TableHead>
                            <TableHead>Last Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <TableRow v-for="user in users" :key="user.id">
                            <TableCell>
                                <div v-if="editingUserId === user.id">
                                    <Input v-model="editFirstName" placeholder="First Name" />

                                    <p v-if="editErrors.first_name" class="text-destructive mt-1 text-sm">
                                        {{ editErrors.first_name[0] }}
                                    </p>
                                </div>

                                <div v-else>
                                    {{ user.first_name }}
                                </div>
                            </TableCell>

                            <TableCell>
                                <div v-if="editingUserId === user.id">
                                    <Input v-model="editLastName" placeholder="Last Name" />

                                    <p v-if="editErrors.last_name" class="text-destructive mt-1 text-sm">
                                        {{ editErrors.last_name[0] }}
                                    </p>
                                </div>

                                <div v-else>
                                    {{ user.last_name }}
                                </div>
                            </TableCell>

                            <TableCell>
                                <div v-if="editingUserId === user.id">
                                    <Input v-model="editEmail" type="email" />

                                    <p v-if="editErrors.email" class="text-destructive mt-1 text-sm">
                                        {{ editErrors.email[0] }}
                                    </p>
                                </div>

                                <div v-else>
                                    {{ user.email }}
                                </div>
                            </TableCell>

                            <TableCell>
                                <div v-if="editingUserId === user.id">
                                    <Select v-model="editRole">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="user">
                                                User
                                            </SelectItem>

                                            <SelectItem value="admin">
                                                Admin
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <p v-if="editErrors.role" class="text-destructive mt-1 text-sm">
                                        {{ editErrors.role[0] }}
                                    </p>
                                </div>

                                <div v-else>
                                    <select :value="user.role" :disabled="actionLoading === user.id"
                                        class="border-input bg-background rounded-md border px-3 py-2 text-sm"
                                        @change="changeRole(user, $event)">
                                        <option value="user">
                                            User
                                        </option>

                                        <option value="admin">
                                            Admin
                                        </option>
                                    </select>
                                </div>
                            </TableCell>

                            <TableCell>
                                <div v-if="editingUserId === user.id">
                                    <Button type="button" :disabled="actionLoading === user.id" @click="saveEdit">
                                        {{
                                            actionLoading === user.id
                                                ? 'Saving...'
                                                : 'Save'
                                        }}
                                    </Button>


                                    <Button variant="outline" type="button" :disabled="actionLoading === user.id"
                                        @click="cancelEditing">
                                        Cancel
                                    </Button>
                                </div>

                                <div v-else>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger as-child>
                                            <Button variant="outline" type="button"
                                                :disabled="actionLoading === user.id">
                                                Actions
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem @click="startEditingUser(user)">
                                                Edit
                                            </DropdownMenuItem>

                                            <DropdownMenuItem class="text-destructive focus:text-destructive"
                                                @click="deleteUser(user.id)">
                                                {{
                                                    actionLoading === user.id
                                                        ? 'Deleting...'
                                                        : 'Delete'
                                                }}
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
    </main>
</template>
