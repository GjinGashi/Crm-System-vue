```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import axios from 'axios'

import api from '@/lib/api'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')
const emailError = ref('')
const passwordError = ref('')

const login = async () => {
    isLoading.value = true

    error.value = ''
    emailError.value = ''
    passwordError.value = ''

    try {
        const response = await api.post('/login', {
            email: email.value,
            password: password.value,
        })

        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        await router.push('/clients')
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            if (err.response?.status === 422) {
                const errors = err.response.data.errors ?? {}

                emailError.value = errors.email?.[0] ?? ''
                passwordError.value = errors.password?.[0] ?? ''
            } else if (err.response?.status === 401) {
                error.value =
                    err.response.data.message ??
                    'The provided details are incorrect.'
            } else {
                error.value = 'Something went wrong. Please try again.'
            }
        } else {
            error.value = 'Something went wrong. Please try again.'
        }
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div
        class="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12"
    >
        <div
            class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
            <div class="mb-8">
                <h1
                    class="text-2xl font-semibold tracking-tight text-slate-900"
                >
                    Welcome back
                </h1>
            </div>

            <form novalidate class="space-y-5" @submit.prevent="login">
                <div>
                    <label
                        class="mb-2 block text-sm font-medium text-slate-700"
                    >
                        Email <span class="text-destructive">*</span>
                    </label>

                    <input
                        v-model="email"
                        type="email"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />

                    <p
                        v-if="emailError"
                        class="text-destructive mt-1.5 text-sm"
                    >
                        {{ emailError }}
                    </p>
                </div>

                <div>
                    <label
                        class="mb-2 block text-sm font-medium text-slate-700"
                    >
                        Password <span class="text-destructive">*</span>
                    </label>

                    <div class="relative">
                        <input
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'"
                            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm transition outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        />

                        <button
                            type="button"
                            class="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 hover:text-slate-700"
                            :aria-label="
                                showPassword
                                    ? 'Hide password'
                                    : 'Show password'
                            "
                            @click="showPassword = !showPassword"
                        >
                            <EyeOff v-if="showPassword" class="h-4 w-4" />
                            <Eye v-else class="h-4 w-4" />
                        </button>
                    </div>

                    <p
                        v-if="passwordError"
                        class="text-destructive mt-1.5 text-sm"
                    >
                        {{ passwordError }}
                    </p>
                </div>

                <p
                    v-if="error"
                    class="text-destructive rounded-lg bg-red-50 p-3 text-sm"
                >
                    {{ error }}
                </p>

                <button
                    type="submit"
                    :disabled="isLoading"
                    class="bg-primary text-primary-foreground w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:opacity-90 focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {{ isLoading ? 'Signing in...' : 'Sign in' }}
                </button>
            </form>
        </div>
    </div>
</template>
```
