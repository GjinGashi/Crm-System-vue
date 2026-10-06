<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import DetailField from '@/components/shared/DetailField.vue'
import FieldRow from '@/components/shared/FieldRow.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import TaskForm from '@/components/Tasks/TaskForm.vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/api'

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    due_date: string | null
    archived_at: string | null
    project: {
        id: string
        name: string
        description?: string | null
        status?: string
        priority?: string
    } | null
    user: { id: string; first_name: string; last_name: string } | null
}

const route = useRoute()
const router = useRouter()

const task = ref<Task | null>(null)
const error = ref('')
const isLoading = ref(true)
const isEditing = ref(false)
const isSaving = ref(false)
const isArchiving = ref(false)
const archiveDialogOpen = ref(false)
const isTaskArchived = computed(() => !!task.value?.archived_at)

const assignedTo = computed(() =>
    task.value?.user
        ? `${task.value.user.first_name} ${task.value.user.last_name}`
        : null,
)

const archiveDescription = computed(
    () =>
        `Are you sure you want to archive "${task.value?.title ?? 'this task'}"? You can restore it later from the Archived tasks section.`,
)

function dateOnly(value: string | null) {
    return value ? value.substring(0, 10) : null
}

function errorMessage(err: unknown, fallback: string) {
    return axios.isAxiosError(err)
        ? (err.response?.data?.message ?? fallback)
        : fallback
}

async function fetchTask() {
    try {
        const response = await api.get(`/tasks/${route.params.id}`)
        task.value = response.data
    } catch (err) {
        error.value = errorMessage(err, 'Unable to load task. Please try again.')
    } finally {
        isLoading.value = false
    }
}

async function onSaved() {

    await fetchTask()
    isEditing.value = false
}

async function archiveTask() {
    if (!task.value) return

    isArchiving.value = true

    const isArchived = !!task.value.archived_at
    const action = isArchived ? 'restore' : 'archive'

    try {
        await api.patch(`/tasks/${task.value.id}/${action}`)

        toast.success(
            isArchived
                ? 'Task restored successfully.'
                : 'Task archived successfully.',
        )

        await router.push('/tasks')
    } catch (err) {
        toast.error(
            errorMessage(
                err,
                isArchived
                    ? 'Unable to restore task.'
                    : 'Unable to archive task.',
            ),
        )
    } finally {
        isArchiving.value = false
        archiveDialogOpen.value = false
    }
}

onMounted(fetchTask)
</script>

<template>
    <div class="space-y-6">


        <div>
            <h1 class="text-3xl font-bold tracking-tight">Task Details</h1>
            <p class="text-muted-foreground">View and edit task information and related project</p>
        </div>

        <p v-if="isLoading" class="text-muted-foreground">Loading task...</p>

        <p v-else-if="error" class="rounded-md bg-red-50 p-3 text-sm text-destructive">
            {{ error }}
        </p>

        <div v-else-if="task" class="space-y-4">
            <Button variant="outline" @click="router.push('/tasks')">
                Back to Tasks
            </Button>

            <Tabs default-value="overview" class="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="project">Project</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" class="mt-4">
                    <div class="rounded-lg border bg-white p-6">
                        <div class="flex flex-wrap items-start justify-between gap-4  pb-4">
                            <div>
                                <h2 class="text-lg font-semibold">Task Information</h2>
                                <p class="text-sm text-muted-foreground">Details about this task</p>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                <Button v-if="!isEditing" type="button" @click="isEditing = true">
                                    Edit Task
                                </Button>

                                <template v-else>
                                    <Button type="button" :disabled="isSaving || isArchiving"
                                        @click="archiveDialogOpen = true">
                                        {{ isArchiving
                                            ? (isTaskArchived ? 'Restoring...' : 'Archiving...')
                                            : (isTaskArchived ? 'Restore' : 'Archive')
                                        }}
                                    </Button>

                                    <Button type="button" variant="outline" :disabled="isSaving || isArchiving"
                                        @click="isEditing = false">
                                        Cancel
                                    </Button>

                                    <Button type="submit" form="task-form" :disabled="isSaving || isArchiving">
                                        {{ isSaving ? 'Saving...' : 'Save' }}
                                    </Button>
                                </template>
                            </div>
                        </div>

                        <TaskForm v-if="isEditing" :task="task" v-model:loading="isSaving" @saved="onSaved" />

                        <div v-else>
                            <FieldRow>
                                <DetailField label="Title" :value="task.title" />
                                <DetailField label="Project" :value="task.project?.name" />
                            </FieldRow>

                            <FieldRow>
                                <DetailField label="Assigned User" :value="assignedTo" />
                                <DetailField label="Due Date" :value="dateOnly(task.due_date)" />
                            </FieldRow>

                            <FieldRow>
                                <DetailField label="Status">
                                    <StatusBadge :value="task.status" />
                                </DetailField>

                                <DetailField label="Priority">
                                    <StatusBadge :value="task.priority" />
                                </DetailField>
                            </FieldRow>

                            <FieldRow single>
                                <DetailField label="Description" :value="task.description || 'No description provided.'"
                                    multiline />
                            </FieldRow>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="project" class="mt-4">
                    <div class="rounded-lg border bg-white p-6">
                        <h2 class="mb-4 text-xl font-semibold">Project</h2>

                        <div v-if="task.project"
                            class="cursor-pointer rounded-md border p-4 transition hover:bg-slate-50"
                            @click="router.push(`/projects/${task.project.id}`)">
                            <div class="flex items-center justify-between gap-4">
                                <h3 class="font-semibold">{{ task.project.name }}</h3>
                                <StatusBadge v-if="task.project.status" :value="task.project.status" />
                            </div>

                            <p class="text-sm text-muted-foreground">
                                {{ task.project.description || 'No description' }}
                            </p>

                            <div v-if="task.project.priority" class="mt-2">
                                <StatusBadge :value="task.project.priority" />
                            </div>
                        </div>

                        <p v-else class="text-muted-foreground">
                            No project associated with this task yet.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        <ConfirmDialog v-model:open="archiveDialogOpen" :title="isTaskArchived ? 'Restore task?' : 'Archive task?'"
            :description="isTaskArchived
                ? 'This task will be restored to the active tasks.'
                : archiveDescription" :confirm-text="isTaskArchived ? 'Restore' : 'Archive'"
            :loading-text="isTaskArchived ? 'Restoring...' : 'Archiving...'" :loading="isArchiving"
            @confirm="archiveTask" />
    </div>
</template>