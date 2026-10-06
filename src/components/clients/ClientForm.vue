<script setup lang="ts">
import axios from 'axios'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import FieldRow from '@/components/shared/FieldRow.vue'
import FormField from '@/components/shared/FormField.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/api'

interface Client {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    company: string | null
    address: string | null
    city: string | null
    country: string | null
    status: string
    notes: string | null
}

type FieldKey =
    | 'first_name'
    | 'last_name'
    | 'email'
    | 'phone'
    | 'company'
    | 'status'
    | 'address'
    | 'city'
    | 'country'
    | 'notes'

const statuses = ['Active', 'Inactive', 'Lead']


const props = defineProps<{
    client?: Client
}>()

const emit = defineEmits<{
    saved: [client: Client]
    cancel: []
}>()

const loading = defineModel<boolean>('loading', { default: false })


const isEdit = computed(() => !!props.client)

function toForm(c?: Client): Record<FieldKey, string> {
    return {
        first_name: c?.first_name ?? '',
        last_name: c?.last_name ?? '',
        email: c?.email ?? '',
        phone: c?.phone ?? '',
        company: c?.company ?? '',
        status: c?.status ?? 'Active',
        address: c?.address ?? '',
        city: c?.city ?? '',
        country: c?.country ?? '',
        notes: c?.notes ?? '',
    }
}

const form = ref<Record<FieldKey, string>>(toForm(props.client))
const errors = ref<Record<string, string[]>>({})
const generalError = ref('')

async function submit() {
    loading.value = true
    errors.value = {}
    generalError.value = ''

    try {
        if (props.client) {
            const { data } = await api.patch(`/clients/${props.client.id}`, form.value)

            toast.success('Client updated successfully.')
            emit('saved', data)
        } else {
            const { data } = await api.post('/clients', form.value)

            toast.success('Client created successfully.')
            emit('saved', data)
        }
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 422) {
            errors.value = err.response.data.errors ?? {}
        } else {
            generalError.value = axios.isAxiosError(err)
                ? (err.response?.data?.message ?? 'Unable to save client. Please try again.')
                : 'Unable to save client. Please try again.'
        }
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div :class="isEdit ? '' : 'space-y-6'">
        <h1 v-if="!isEdit" class="text-3xl font-bold tracking-tight">Add Client</h1>

        <form id="client-form" novalidate :class="isEdit ? '' : 'rounded-lg border bg-white p-6'"
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
                    <Input v-model="form.email" type="email" placeholder="Email" />
                </FormField>

                <FormField label="Phone" :error="errors.phone?.[0]">
                    <Input v-model="form.phone" placeholder="Phone" />
                </FormField>
            </FieldRow>

            <FieldRow>
                <FormField label="Company" :error="errors.company?.[0]">
                    <Input v-model="form.company" placeholder="Company" />
                </FormField>

                <FormField label="Status" :error="errors.status?.[0]">
                    <select v-model="form.status"
                        class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm">
                        <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                    </select>
                </FormField>
            </FieldRow>

            <FieldRow single>
                <FormField label="Street" :error="errors.address?.[0]">
                    <Input v-model="form.address" placeholder="Street" />
                </FormField>
            </FieldRow>

            <FieldRow>
                <FormField label="City" :error="errors.city?.[0]">
                    <Input v-model="form.city" placeholder="City" />
                </FormField>

                <FormField label="Country" :error="errors.country?.[0]">
                    <Input v-model="form.country" placeholder="Country" />
                </FormField>
            </FieldRow>

            <FieldRow single>
                <FormField label="Description" :error="errors.notes?.[0]">
                    <Textarea v-model="form.notes" rows="4" placeholder="Add a description" />
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
                    {{ loading ? 'Saving...' : 'Create Client' }}
                </Button>
            </div>
        </form>
    </div>
</template>