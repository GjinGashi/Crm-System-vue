```vue
<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import api from '@/lib/api'

const router = useRouter()

const form = ref({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    country: '',
    status: 'Active',
    notes: '',
})

const errors = ref<Record<string, string[]>>({})
const generalError = ref('')
const isLoading = ref(false)

async function createClient() {
    errors.value = {}
    generalError.value = ''
    isLoading.value = true

    try {
        await api.post('/clients', form.value)

        await router.push('/clients')
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            if (err.response?.status === 422) {
                errors.value = err.response.data.errors ?? {}
            } else {
                generalError.value =
                    err.response?.data?.message ??
                    'Unable to create client. Please try again.'
            }
        } else {
            generalError.value =
                'Unable to create client. Please try again.'
        }
    } finally {
        isLoading.value = false
    }
}

function cancel() {
    router.push('/clients')
}
</script>

<template>
    <main class="min-h-screen bg-background p-6">
        <div class="mx-auto max-w-3xl space-y-6 lg:p-8">
            <div>
                <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
                    Create Client
                </h1>

                <p class="text-muted-foreground mt-1 text-sm">
                    Add a new client
                </p>
            </div>

            <form
                novalidate
                class="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                @submit.prevent="createClient"
            >
                <div class="grid gap-5 md:grid-cols-2">
                    <div class="space-y-2">
                        <label class="text-sm font-medium">
                            First Name <span class="text-destructive">*</span>
                        </label>

                        <Input
                            v-model="form.first_name"
                            placeholder="First name"
                            :aria-invalid="!!errors.first_name"
                        />

                        <p v-if="errors.first_name" class="text-destructive text-sm">
                            {{ errors.first_name[0] }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium">
                            Last Name <span class="text-destructive">*</span>
                        </label>

                        <Input
                            v-model="form.last_name"
                            placeholder="Last name"
                            :aria-invalid="!!errors.last_name"
                        />

                        <p v-if="errors.last_name" class="text-destructive text-sm">
                            {{ errors.last_name[0] }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium">
                            Email <span class="text-destructive">*</span>
                        </label>

                        <Input
                            v-model="form.email"
                            type="email"
                            placeholder="client@example.com"
                            :aria-invalid="!!errors.email"
                        />

                        <p v-if="errors.email" class="text-destructive text-sm">
                            {{ errors.email[0] }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium">Phone</label>

                        <Input v-model="form.phone" placeholder="Phone number" />

                        <p v-if="errors.phone" class="text-destructive text-sm">
                            {{ errors.phone[0] }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium">Company</label>

                        <Input v-model="form.company" placeholder="Company name" />

                        <p v-if="errors.company" class="text-destructive text-sm">
                            {{ errors.company[0] }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium">Address</label>

                        <Input v-model="form.address" placeholder="Address" />

                        <p v-if="errors.address" class="text-destructive text-sm">
                            {{ errors.address[0] }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium">City</label>

                        <Input v-model="form.city" placeholder="City" />

                        <p v-if="errors.city" class="text-destructive text-sm">
                            {{ errors.city[0] }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium">Country</label>

                        <Input v-model="form.country" placeholder="Country" />

                        <p v-if="errors.country" class="text-destructive text-sm">
                            {{ errors.country[0] }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium">Status</label>

                        <select
                            v-model="form.status"
                            class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Lead">Lead</option>
                            <option value="Archived">Archived</option>
                        </select>

                        <p v-if="errors.status" class="text-destructive text-sm">
                            {{ errors.status[0] }}
                        </p>
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="text-sm font-medium">Notes</label>

                    <Textarea
                        v-model="form.notes"
                        placeholder="Additional notes about this client"
                        rows="5"
                    />

                    <p v-if="errors.notes" class="text-destructive text-sm">
                        {{ errors.notes[0] }}
                    </p>
                </div>

                <p
                    v-if="generalError"
                    class="text-destructive rounded-md bg-red-50 p-3 text-sm"
                >
                    {{ generalError }}
                </p>

                <div class="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        :disabled="isLoading"
                        @click="cancel"
                    >
                        Cancel
                    </Button>

                    <Button type="submit" :disabled="isLoading">
                        {{ isLoading ? 'Saving...' : 'Save Client' }}
                    </Button>
                </div>
            </form>
        </div>
    </main>
</template>
