<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'

interface User {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
    avatar_url: string | null
}

const props = defineProps<{
    user: User
}>()

const emit = defineEmits<{
    saved: [user: User]
    cancel: []
}>()

const errors = ref<Record<string, string[]>>({})
const generalError = ref('')
const submitted = ref(false)
const isSaving = ref(false)

const firstName = ref(props.user.first_name)
const lastName = ref(props.user.last_name)
const email = ref(props.user.email)

const currentPassword = ref('')
const password = ref('')
const passwordConfirmation = ref('')

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

        emit('saved', updatedUser)

        currentPassword.value = ''
        password.value = ''
        passwordConfirmation.value = ''
        submitted.value = false
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
    } finally {
        isSaving.value = false
    }
}

function cancel() {
    emit('cancel')
}
</script>

<template>
    <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
            <div>
                <p class="text-muted-foreground text-sm">
                    First Name
                </p>

                <Input
                    v-model="firstName"
                    type="text"
                />

                <p
                    v-if="submitted && errors.first_name"
                    class="text-destructive mt-1 text-sm"
                >
                    {{ errors.first_name[0] }}
                </p>
            </div>

            <div>
                <p class="text-muted-foreground text-sm">
                    Last Name
                </p>

                <Input
                    v-model="lastName"
                    type="text"
                />

                <p
                    v-if="submitted && errors.last_name"
                    class="text-destructive mt-1 text-sm"
                >
                    {{ errors.last_name[0] }}
                </p>
            </div>
        </div>

        <div>
            <p class="text-muted-foreground text-sm">
                Email
            </p>

            <Input
                v-model="email"
                type="email"
            />

            <p
                v-if="submitted && errors.email"
                class="text-destructive mt-1 text-sm"
            >
                {{ errors.email[0] }}
            </p>
        </div>

        <div>
            <p class="text-muted-foreground text-sm">
                Role
            </p>

            <p class="font-medium">
                {{ user.role }}
            </p>
        </div>

        <div class="border-t pt-4">
            <p class="mb-4 font-medium">
                Change Password
            </p>

            <div class="space-y-4">
                <div>
                    <Input
                        v-model="currentPassword"
                        type="password"
                        placeholder="Current Password"
                    />

                    <p
                        v-if="submitted && errors.current_password"
                        class="text-destructive mt-1 text-sm"
                    >
                        Old password is incorrect.
                    </p>
                </div>

                <div>
                    <Input
                        v-model="password"
                        type="password"
                        placeholder="New Password"
                    />

                    <p
                        v-if="submitted && errors.password"
                        class="text-destructive mt-1 text-sm"
                    >
                        {{ errors.password[0] }}
                    </p>
                </div>

                <div>
                    <Input
                        v-model="passwordConfirmation"
                        type="password"
                        placeholder="Confirm New Password"
                    />

                    <p
                        v-if="submitted && errors.password_confirmation"
                        class="text-destructive mt-1 text-sm"
                    >
                        {{ errors.password_confirmation[0] }}
                    </p>
                </div>
            </div>
        </div>

        <p
            v-if="generalError"
            class="text-destructive rounded-md bg-red-50 p-3 text-sm"
        >
            {{ generalError }}
        </p>

        <div class="flex gap-2 pt-2">
            <Button
                type="button"
                :disabled="isSaving"
                @click="saveProfile"
            >
                {{ isSaving ? 'Saving...' : 'Save' }}
            </Button>

            <Button
                variant="outline"
                type="button"
                :disabled="isSaving"
                @click="cancel"
            >
                Cancel
            </Button>
        </div>
    </div>
</template>