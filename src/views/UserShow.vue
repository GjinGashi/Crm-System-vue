<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import DetailField from '@/components/shared/DetailField.vue'
import FieldRow from '@/components/shared/FieldRow.vue'
import UserForm from '@/components/Users/UserForm.vue'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

interface User {
    id: string
    first_name: string
    last_name: string
    email: string
    account_type: 'admin' | 'user'
    employee: {
        role_id: number
        role?: {
            id: number
            name: string
        }
    } | null
}

const route = useRoute()
const router = useRouter()

const user = ref<User | null>(null)
const error = ref('')
const isLoading = ref(true)
const isEditing = ref(false)
const isSaving = ref(false)

function errorMessage(err: unknown, fallback: string) {
    return axios.isAxiosError(err)
        ? (err.response?.data?.message ?? fallback)
        : fallback
}

async function fetchUser() {
    try {
        const response = await api.get(`/users/${route.params.id}`)
        user.value = response.data
    } catch (err) {
        error.value = errorMessage(err, 'Unable to load user. Please try again.')
    } finally {
        isLoading.value = false
    }
}

async function onSaved() {
    await fetchUser()
    isEditing.value = false
}

onMounted(fetchUser)
</script>

<template>
    <div class="space-y-6">


        <div>
            <h1 class="text-3xl font-bold tracking-tight">User Details</h1>
            <p class="text-muted-foreground">
                View and edit user information
            </p>
        </div>

        <p v-if="isLoading" class="text-muted-foreground">
            Loading user...
        </p>

        <p v-else-if="error" class="rounded-md bg-red-50 p-3 text-sm text-destructive">
            {{ error }}
        </p>

        <div v-else-if="user" class="space-y-4">
            <Button variant="outline" @click="router.push('/users')">
                Back to Users
            </Button>

            <div class="rounded-lg border bg-white p-6">
                <div class="flex flex-wrap items-start justify-between gap-4 pb-4">
                    <div>
                        <h2 class="text-lg font-semibold">
                            User Information
                        </h2>

                        <p class="text-sm text-muted-foreground">
                            Details about this user
                        </p>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <Button v-if="!isEditing" type="button" @click="isEditing = true">
                            Edit User
                        </Button>

                        <template v-else>
                            <Button type="button" variant="outline" :disabled="isSaving" @click="isEditing = false">
                                Cancel
                            </Button>

                            <Button type="submit" form="user-form" :disabled="isSaving">
                                {{ isSaving ? 'Saving...' : 'Save' }}
                            </Button>
                        </template>
                    </div>
                </div>

                <UserForm v-if="isEditing" :user="user" v-model:loading="isSaving" @saved="onSaved" />

                <div v-else>
                    <FieldRow>
                        <DetailField label="First Name" :value="user.first_name" />

                        <DetailField label="Last Name" :value="user.last_name" />
                    </FieldRow>

                    <FieldRow>
                        <DetailField label="Email" :value="user.email" />

                        <DetailField label="Account Type" :value="user.account_type" />
                    </FieldRow>

                    <FieldRow single>
                        <DetailField label="Role" :value="user.employee?.role?.name ?? 'No role assigned'" />
                    </FieldRow>
                </div>
            </div>
        </div>
        </div>
</template>