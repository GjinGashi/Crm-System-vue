```vue
<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

import api from '@/lib/api'

interface User {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
}

const user = ref<User | null>(null)

const errors = ref<Record<string, string[]>>({})
const generalError = ref('')

const submitted = ref(false)
const editing = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)

const firstName = ref('')
const lastName = ref('')
const email = ref('')

const currentPassword = ref('')
const password = ref('')
const passwordConfirmation = ref('')

async function fetchUser() {
    isLoading.value = true
    generalError.value = ''

    try {
        const response = await api.get('/user')

        user.value = response.data

        firstName.value = response.data.first_name
        lastName.value = response.data.last_name
        email.value = response.data.email
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            generalError.value =
                err.response?.data?.message ??
                'Unable to load your profile.'
        } else {
            generalError.value = 'Unable to load your profile.'
        }
    } finally {
        isLoading.value = false
    }
}

function startEditing() {
    if (!user.value) return

    firstName.value = user.value.first_name
    lastName.value = user.value.last_name
    email.value = user.value.email

    currentPassword.value = ''
    password.value = ''
    passwordConfirmation.value = ''

    errors.value = {}
    generalError.value = ''
    submitted.value = false
    editing.value = true
}

async function saveProfile() {
    submitted.value = true
    errors.value = {}
    generalError.value = ''
    isSaving.value = true

    try {
        const response = await api.patch('/profile', {
            first_name: firstName.value,
            last_name: lastName.value,
            email: email.value,
            current_password: currentPassword.value,
            password: password.value,
            password_confirmation: passwordConfirmation.value,
        })

        const updatedUser: User = response.data.user

        user.value = updatedUser

        firstName.value = updatedUser.first_name
        lastName.value = updatedUser.last_name
        email.value = updatedUser.email

        editing.value = false
        submitted.value = false

        currentPassword.value = ''
        password.value = ''
        passwordConfirmation.value = ''
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            if (err.response?.status === 422) {
                errors.value = err.response.data.errors ?? {}
            } else {
                generalError.value =
                    err.response?.data?.message ??
                    'Unable to update your profile.'
            }
        } else {
            generalError.value = 'Unable to update your profile.'
        }

        editing.value = true
    } finally {
        isSaving.value = false
    }
}

function cancelEditing() {
    if (user.value) {
        firstName.value = user.value.first_name
        lastName.value = user.value.last_name
        email.value = user.value.email
    }

    currentPassword.value = ''
    password.value = ''
    passwordConfirmation.value = ''

    errors.value = {}
    generalError.value = ''
    submitted.value = false
    editing.value = false
}

onMounted(fetchUser)
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div v-if="isLoading">
            <p class="text-muted-foreground">
                Loading profile...
            </p>
        </div>

        <div v-else-if="generalError && !user">
            <p class="text-destructive">
                {{ generalError }}
            </p>
        </div>

        <Card v-else class="max-w-2xl">
            <CardHeader>
                <CardTitle>Profile</CardTitle>
            </CardHeader>

            <CardContent class="space-y-4">
                <div class="grid gap-4 md:grid-cols-2">
                    <div>
                        <p class="text-muted-foreground text-sm">
                            First Name
                        </p>

                        <Input v-if="editing" v-model="firstName" type="text" />

                        <p v-if="
                            editing &&
                            submitted &&
                            errors.first_name
                        " class="text-destructive mt-1 text-sm">
                            {{ errors.first_name[0] }}
                        </p>

                        <p v-else class="font-medium">
                            {{ user?.first_name }}
                        </p>
                    </div>

                    <div>
                        <p class="text-muted-foreground text-sm">
                            Last Name
                        </p>

                        <Input v-if="editing" v-model="lastName" type="text" />

                        <p v-if="
                            editing &&
                            submitted &&
                            errors.last_name
                        " class="text-destructive mt-1 text-sm">
                            {{ errors.last_name[0] }}
                        </p>

                        <p v-else class="font-medium">
                            {{ user?.last_name }}
                        </p>
                    </div>
                </div>

                <div>
                    <p class="text-muted-foreground text-sm">
                        Email
                    </p>

                    <Input v-if="editing" v-model="email" type="email" />

                    <p v-if="
                        editing &&
                        submitted &&
                        errors.email
                    " class="text-destructive mt-1 text-sm">
                        {{ errors.email[0] }}
                    </p>

                    <p v-else class="font-medium">
                        {{ user?.email }}
                    </p>
                </div>

                <div>
                    <p class="text-muted-foreground text-sm">
                        Role
                    </p>

                    <p class="font-medium">
                        {{ user?.role }}
                    </p>
                </div>

                <template v-if="editing">
                    <div>
                        <Input v-model="currentPassword" type="password" placeholder="Current Password" />
                        <p v-if="
                            submitted &&
                            errors.current_password
                        " class="text-destructive mt-1 text-sm">
                            Old password is incorrect.
                        </p>
                    </div>

                    <div>
                        <Input v-model="password" type="password" placeholder="New Password" />

                        <p v-if="
                            submitted &&
                            errors.password
                        " class="text-destructive mt-1 text-sm">
                            {{ errors.password[0] }}
                        </p>
                    </div>

                    <div>
                        <Input v-model="passwordConfirmation" type="password" placeholder="Confirm New Password" />

                        <p v-if="
                            submitted &&
                            errors.password_confirmation
                        " class="text-destructive mt-1 text-sm">
                            {{ errors.password_confirmation[0] }}
                        </p>
                    </div>

                    <p v-if="generalError" class="text-destructive rounded-md bg-red-50 p-3 text-sm">
                        {{ generalError }}
                    </p>
                </template>

                <div class="flex gap-2">
                    <Button v-if="!editing" type="button" @click="startEditing">
                        Edit
                    </Button>

                    <template v-else>
                        <Button type="button" :disabled="isSaving" @click="saveProfile">
                            {{ isSaving ? 'Saving...' : 'Save' }}
                        </Button>

                        <Button variant="outline" type="button" :disabled="isSaving" @click="cancelEditing">
                            Cancel
                        </Button>
                    </template>
                </div>
            </CardContent>
        </Card>
    </main>
</template>
