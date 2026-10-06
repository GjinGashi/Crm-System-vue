<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/lib/api'

const router = useRouter()

const email = ref('')
const isLoading = ref(false)
const success = ref('')
const error = ref('')

async function sendResetLink() {
    isLoading.value = true
    success.value = ''
    error.value = ''

    try {
        const response = await api.post('/forgot-password', {
            email: email.value,
        })

        success.value =
            response.data.message ??
            'Password reset link sent to your email.'
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            if (err.response?.status === 422) {
                error.value =
                    err.response.data.message ??
                    'Unable to send the reset link.'
            } else {
                error.value =
                    'Something went wrong. Please try again.'
            }
        } else {
            error.value =
                'Something went wrong. Please try again.'
        }
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <main class="min-h-screen bg-slate-50 px-6 py-12">
        <div class="mx-auto w-full max-w-md pt-20">
            <div
                class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
                <h1
                    class="text-2xl font-semibold tracking-tight text-slate-900"
                >
                    Forgot Your Password?
                </h1>

                <p class="mt-2 text-sm text-slate-600">
                    Enter your email address to
                    reset your password.
                </p>

                <form
                    class="mt-6 space-y-5"
                    @submit.prevent="sendResetLink"
                >
                    <div>
                        <label
                            class="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Email
                        </label>

                        <input
                            v-model="email"
                            type="email"
                            required
                            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        />
                    </div>

                    <p
                        v-if="success"
                        class="rounded-lg bg-green-50 p-3 text-sm text-green-700"
                    >
                        {{ success }}
                    </p>

                    <p
                        v-if="error"
                        class="rounded-lg bg-red-50 p-3 text-sm text-destructive"
                    >
                        {{ error }}
                    </p>

                    <button
                        type="submit"
                        :disabled="isLoading"
                        class="bg-primary text-primary-foreground w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {{
                            isLoading
                                ? 'Sending...'
                                : 'Confirm'
                        }}
                    </button>

                    <button
                        type="button"
                        class="text-primary w-full text-center text-sm hover:underline"
                        @click="router.push('/login')"
                    >
                        Back to Sign in
                    </button>
                </form>
            </div>
        </div>
    </main>
</template>