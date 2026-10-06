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

interface Employee {
    id: number
    role_id: number
    user: {
        first_name: string
        last_name: string
        email: string
    }
}

type FieldKey = 'first_name' | 'last_name' | 'email' | 'role_id'
const props = defineProps<{
    employee?: Employee
}>()

const emit = defineEmits<{
    saved: []
    cancel: []
}>()

const loading = defineModel<boolean>('loading', { default: false })



const isEdit = computed(() => !!props.employee)

function toForm(e?: Employee): Record<FieldKey, string> {
    return {
        first_name: e?.user.first_name ?? '',
        last_name: e?.user.last_name ?? '',
        email: e?.user.email ?? '',
        role_id: e ? String(e.role_id) : '',
    }
}

const form = ref<Record<FieldKey, string>>(toForm(props.employee))
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

    const payload = {
        ...form.value,
        role_id: form.value.role_id ? Number(form.value.role_id) : null,
    }

    try {
        if (props.employee) {
            await api.patch(`/employees/${props.employee.id}`, payload)

            toast.success('Employee updated successfully.')
            emit('saved')
        } else {
            await api.post('/employees', payload)

            toast.success('Employee created successfully.')
            emit('saved')
        }
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 422) {
            errors.value = err.response.data.errors ?? {}
        } else {
            generalError.value = errorMessage(err, 'Unable to save employee. Please try again.')
        }
    } finally {
        loading.value = false
    }
}

onMounted(fetchRoles)
</script>

<template>
    <div :class="isEdit ? '' : 'space-y-6'">
        

        <form id="employee-form" novalidate :class="isEdit ? '' : 'rounded-lg border bg-white p-6'"
            @submit.prevent="submit">
            <FieldRow>
                <FormField label="First Name" required :error="errors.first_name?.[0]">
                    <Input v-model="form.first_name" placeholder="First name" />
                </FormField>

                <FormField label="Last Name" required :error="errors.last_name?.[0]">
                    <Input v-model="form.last_name" placeholder="Last name" />
                </FormField>
            </FieldRow>

            <FieldRow>
                <FormField label="Email" required :error="errors.email?.[0]">
                    <Input v-model="form.email" type="email" placeholder="employee@example.com" />
                </FormField>

                <FormField label="Role" required :error="errors.role_id?.[0]">
                    <select v-model="form.role_id"
                        class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm">
                        <option value="" disabled>Select role</option>
                        <option v-for="r in roles" :key="r.id" :value="String(r.id)">
                            {{ r.name }}
                        </option>
                    </select>
                </FormField>
            </FieldRow>

            <p v-if="generalError" class="mt-2 rounded-md bg-red-50 p-3 text-sm text-destructive">
                {{ generalError }}
            </p>

            
            <div v-if="!isEdit" class="mt-2 flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" :disabled="loading" @click="emit('cancel')">
                    Cancel
                </Button>

                <Button type="submit" :disabled="loading">
                    {{ loading ? 'Saving...' : 'Create Employee' }}
                </Button>
            </div>
        </form>
    </div>
</template>