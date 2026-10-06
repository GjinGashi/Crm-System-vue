<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

import FieldRow from '@/components/shared/FieldRow.vue'
import FormField from '@/components/shared/FormField.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    employee: { role_id: number } | null
}

type FieldKey =
    | 'first_name'
    | 'last_name'
    | 'email'
    | 'password'
    | 'account_type'
    | 'role_id'

// With a user: edit mode (used inside UserShow, which owns the buttons).
// Without: create mode (used inside a popup, which shows its own buttons at the bottom).
const props = defineProps<{
    user?: User
}>()

const emit = defineEmits<{
    saved: []
    cancel: []
}>()

// Lets the parent page show "Saving..." on its Save button.
const loading = defineModel<boolean>('loading', { default: false })

const isEdit = computed(() => !!props.user)

function toForm(u?: User): Record<FieldKey, string> {
    return {
        first_name: u?.first_name ?? '',
        last_name: u?.last_name ?? '',
        email: u?.email ?? '',
        password: '',
        account_type: u?.account_type ?? 'user',
        role_id: u?.employee ? String(u.employee.role_id) : '',
    }
}

const form = ref<Record<FieldKey, string>>(toForm(props.user))
const roles = ref<Role[]>([])
const errors = ref<Record<string, string[]>>({})
const generalError = ref('')

function errorMessage(err: unknown, fallback: string) {
    return axios.isAxiosError(err)
        ? (err.response?.data?.message ?? fallback)
        : fallback
}

async function fetchRoles() {
    try {
        const response = await api.get('/roles')

        roles.value = response.data.data ?? response.data
    } catch (err) {
        generalError.value = errorMessage(err, 'Unable to load roles. Please try again.')
    }
}

async function submit() {
    loading.value = true
    errors.value = {}
    generalError.value = ''

    const payload: Record<string, string | null> = {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        email: form.value.email,
        account_type: form.value.account_type,
        // Only users with the "user" account type have a role.
        role_id: form.value.account_type === 'user' ? form.value.role_id : null,
    }

    // The password is only set when creating.
    if (!props.user) {
        payload.password = form.value.password
    }

    try {
        if (props.user) {
            await api.patch(`/users/${props.user.id}`, payload)

            toast.success('User updated successfully.')
        } else {
            await api.post('/users', payload)

            toast.success('User created successfully.')
        }

        emit('saved')
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 422) {
            errors.value = err.response.data.errors ?? {}
        } else {
            generalError.value = errorMessage(err, 'Unable to save user. Please try again.')
        }
    } finally {
        loading.value = false
    }
}

onMounted(fetchRoles)
</script>

<template>
    <form id="user-form" novalidate @submit.prevent="submit">
        <FieldRow>
            <FormField label="First Name" required :error="errors.first_name?.[0]">
                <Input v-model="form.first_name" placeholder="First name" />
            </FormField>

            <FormField label="Last Name" required :error="errors.last_name?.[0]">
                <Input v-model="form.last_name" placeholder="Last name" />
            </FormField>
        </FieldRow>

        <FieldRow :single="isEdit">
            <FormField label="Email" required :error="errors.email?.[0]">
                <Input v-model="form.email" type="email" placeholder="user@example.com" />
            </FormField>

            <FormField v-if="!isEdit" label="Password" required :error="errors.password?.[0]">
                <Input v-model="form.password" type="password" placeholder="Password" />
            </FormField>
        </FieldRow>

        <FieldRow>
            <FormField label="Account Type" required :error="errors.account_type?.[0]">
                <select
                    v-model="form.account_type"
                    class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </FormField>

            <FormField
                v-if="form.account_type === 'user'"
                label="Role"
                required
                :error="errors.role_id?.[0]"
            >
                <select
                    v-model="form.role_id"
                    class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                    <option value="" disabled>Select role</option>
                    <option v-for="r in roles" :key="r.id" :value="String(r.id)">
                        {{ r.name }}
                    </option>
                </select>
            </FormField>
        </FieldRow>

        <p
            v-if="generalError"
            class="mt-2 rounded-md bg-red-50 p-3 text-sm text-destructive"
        >
            {{ generalError }}
        </p>

        <div v-if="!isEdit" class="mt-4 flex justify-end gap-3 border-t pt-6">
            <Button
                type="button"
                variant="outline"
                :disabled="loading"
                @click="emit('cancel')"
            >
                Cancel
            </Button>

            <Button type="submit" :disabled="loading">
                {{ loading ? 'Saving...' : 'Create User' }}
            </Button>
        </div>
    </form>
</template>