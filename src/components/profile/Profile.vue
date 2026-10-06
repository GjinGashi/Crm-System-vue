<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'

import ProfileForm from '@/components/profile/ProfileForm.vue'
import { Button } from '@/components/ui/button'
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
    avatar_url: string | null
}

const user = ref<User | null>(null)

const generalError = ref('')
const editing = ref(false)
const isLoading = ref(true)
const isUploadingAvatar = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)

async function fetchUser() {
    isLoading.value = true
    generalError.value = ''

    try {
        const response = await api.get('/user')
        user.value = response.data
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

function chooseAvatar() {
    avatarInput.value?.click()
}

async function uploadAvatar(event: Event) {
    const target = event.target as HTMLInputElement

    if (!target.files || target.files.length === 0) {
        return
    }

    const file = target.files[0]

    if (!file) {
        return
    }

    const formData = new FormData()
    formData.append('avatar', file)

    isUploadingAvatar.value = true
    generalError.value = ''

    try {
        const response = await api.post(
            '/profile/avatar',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
        )

        if (user.value) {
            user.value.avatar_url = response.data.avatar_url
        }

        target.value = ''
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            if (err.response?.status === 422) {
                generalError.value =
                    err.response.data.errors?.avatar?.[0] ??
                    'Invalid profile photo.'
            } else {
                generalError.value =
                    err.response?.data?.message ??
                    'Unable to upload profile photo.'
            }
        } else {
            generalError.value =
                'Unable to upload profile photo.'
        }
    } finally {
        isUploadingAvatar.value = false
    }
}

function startEditing() {
    generalError.value = ''
    editing.value = true
}

function onProfileSaved(updatedUser: User) {
    user.value = updatedUser
    editing.value = false
}

function cancelEditing() {
    generalError.value = ''
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
                <div class="flex items-center gap-4 border-b pb-6">
                    <div
                        class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-muted"
                    >
                        <img
                            v-if="user?.avatar_url"
                            :src="user.avatar_url"
                            alt="Profile photo"
                            class="h-full w-full object-cover"
                        />

                        <span
                            v-else
                            class="text-2xl font-semibold text-muted-foreground"
                        >
                            {{ user?.first_name?.charAt(0) }}
                            {{ user?.last_name?.charAt(0) }}
                        </span>
                    </div>

                    <div class="space-y-2">
                        <div>
                            <p class="font-medium">
                                Profile Photo
                            </p>

                            <p class="text-muted-foreground text-sm">
                                JPG, PNG or WebP. Maximum 2 MB.
                            </p>
                        </div>

                        <input
                            ref="avatarInput"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            class="hidden"
                            @change="uploadAvatar"
                        />

                        <Button
                            type="button"
                            variant="outline"
                            :disabled="isUploadingAvatar"
                            @click="chooseAvatar"
                        >
                            {{
                                isUploadingAvatar
                                    ? 'Uploading...'
                                    : 'Upload Photo'
                            }}
                        </Button>
                    </div>
                </div>

                <template v-if="editing && user">
                    <ProfileForm
                        :user="user"
                        @saved="onProfileSaved"
                        @cancel="cancelEditing"
                    />
                </template>

                <template v-else-if="user">
                    <div class="grid gap-4 md:grid-cols-2">
                        <div>
                            <p class="text-muted-foreground text-sm">
                                First Name
                            </p>

                            <p class="font-medium">
                                {{ user.first_name }}
                            </p>
                        </div>

                        <div>
                            <p class="text-muted-foreground text-sm">
                                Last Name
                            </p>

                            <p class="font-medium">
                                {{ user.last_name }}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p class="text-muted-foreground text-sm">
                            Email
                        </p>

                        <p class="font-medium">
                            {{ user.email }}
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

                    <div class="flex gap-2">
                        <Button
                            type="button"
                            @click="startEditing"
                        >
                            Edit
                        </Button>
                    </div>
                </template>
            </CardContent>
        </Card>
    </main>
</template>