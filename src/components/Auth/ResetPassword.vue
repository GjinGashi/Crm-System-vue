<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import api from '@/lib/api'

const route = useRoute()
const router = useRouter()

const email = ref(
    typeof route.query.email === 'string'
        ? route.query.email
        : '',
)

const token = ref(
    typeof route.params.token === 'string'
        ? route.params.token
        : '',
)

const password = ref('')
const passwordConfirmation = ref('')

const error = ref('')
const isResetting = ref(false)
const success = ref(false)

async function resetPassword() {
    error.value = ''
    isResetting.value = true

    try {
        await api.post('/reset-password', {
            email: email.value,
            token: token.value,
            password: password.value,
            password_confirmation:
                passwordConfirmation.value,
        })

        success.value = true
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            error.value =
                err.response?.data?.message ??
                'Unable to reset your password.'
        } else {
            error.value =
                'Unable to reset your password.'
        }
    } finally {
        isResetting.value = false
    }
}

function goToLogin() {
    router.push('/login')
}
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="mx-auto max-w-md pt-20">
            <div class="space-y-6">
                <div>
                    <h1 class="text-2xl font-semibold">
                        Reset Password
                    </h1>

                    <p class="text-muted-foreground mt-2">
                        Enter your new password below.
                    </p>
                </div>

                <div
                    v-if="success"
                    class="space-y-4"
                >
                    <p class="rounded-md bg-green-50 p-3 text-sm text-green-700">
                        Your password has been reset successfully.
                    </p>

                    <Button
                        type="button"
                        @click="goToLogin"
                    >
                        Go to Login
                    </Button>
                </div>

                <form
                    v-else
                    class="space-y-4"
                    @submit.prevent="resetPassword"
                >
                    <div>
                        <label class="mb-1 block text-sm font-medium">
                            Email
                        </label>

                        <Input
                            v-model="email"
                            type="email"
                            readonly
                        />
                    </div>

                    <div>
                        <label class="mb-1 block text-sm font-medium">
                            New Password
                        </label>

                        <Input
                            v-model="password"
                            type="password"
                            required
                        />
                    </div>

                    <div>
                        <label class="mb-1 block text-sm font-medium">
                            Confirm New Password
                        </label>

                        <Input
                            v-model="passwordConfirmation"
                            type="password"
                            required
                        />
                    </div>

                    <p
                        v-if="error"
                        class="rounded-md bg-red-50 p-3 text-sm text-destructive"
                    >
                        {{ error }}
                    </p>

                    <Button
                        type="submit"
                        :disabled="isResetting"
                        class="w-full"
                    >
                        {{
                            isResetting
                                ? 'Resetting...'
                                : 'Reset Password'
                        }}
                    </Button>
                </form>
            </div>
        </div>
    </main>
</template>