<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import ProjectForm from '@/components/Projects/ProjectForm.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import DetailField from '@/components/shared/DetailField.vue'
import FieldRow from '@/components/shared/FieldRow.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import FormDialog from '@/components/shared/FormDialog.vue'


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
}

interface Project {
    id: string
    name: string
    description: string | null
    status: string
    priority: string
    start_date: string | null
    due_date: string | null
    budget: number | null
    archived_at: string | null
    client: { id: string; first_name: string; last_name: string } | null
    tasks: Task[]
}

const route = useRoute()
const router = useRouter()

const project = ref<Project | null>(null)
const error = ref('')
const isLoading = ref(true)
const isEditing = ref(false)
const isSaving = ref(false)
const isArchiving = ref(false)
const archiveDialogOpen = ref(false)
const taskDialogOpen = ref(false)

function dateOnly(value: string | null) {
    return value ? value.substring(0, 10) : null
}

function errorMessage(err: unknown, fallback: string) {
    return axios.isAxiosError(err)
        ? (err.response?.data?.message ?? fallback)
        : fallback
}

async function fetchProject() {
    try {
        const response = await api.get(`/projects/${route.params.id}`)
        console.log('PROJECT RESPONSE:', response.data)
        project.value = response.data
    } catch (err) {
        error.value = errorMessage(err, 'Unable to load project. Please try again.')
    } finally {
        isLoading.value = false
    }
}

async function onSaved() {
    await fetchProject()
    isEditing.value = false
}

async function archiveProject() {
    if (!project.value) return

    isArchiving.value = true

    const isArchived = !!project.value.archived_at
    const action = isArchived ? 'restore' : 'archive'

    try {
        await api.patch(`/projects/${project.value.id}/${action}`)

        toast.success(
            isArchived
                ? 'Project restored successfully.'
                : 'Project archived successfully.'
        )

        await router.push('/projects')
    } catch (err) {
        toast.error(
            errorMessage(
                err,
                isArchived
                    ? 'Unable to restore project.'
                    : 'Unable to archive project.'
            )
        )
    } finally {
        isArchiving.value = false
        archiveDialogOpen.value = false
    }
}
async function onTaskCreated() {
    taskDialogOpen.value = false
    await fetchProject()
}

onMounted(fetchProject)
</script>

<template>
    <div class="space-y-6">

        <div class="flex items-start justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold tracking-tight">Project Details</h1>
                <p class="text-muted-foreground">
                    View and edit project information and related tasks
                </p>
            </div>
        </div>

        <p v-if="isLoading" class="text-muted-foreground">
            Loading project...
        </p>

        <p v-else-if="error" class="rounded-md bg-red-50 p-3 text-sm text-destructive">
            {{ error }}
        </p>

        <div v-else-if="project" class="space-y-4">
            <Button variant="outline" @click="router.push('/projects')">
                Back to Projects
            </Button>

            <Tabs default-value="overview" class="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" class="mt-4">
                    <div class="rounded-lg border bg-white p-6">
                        <div class="flex flex-wrap items-start justify-between gap-4  pb-4">
                            <div>
                                <h2 class="text-lg font-semibold">Project Information</h2>
                                <p class="text-sm text-muted-foreground">Details about this project</p>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                <Button v-if="!isEditing" type="button" @click="isEditing = true">
                                    Edit Project
                                </Button>

                                <template v-else>
                                    <Button type="button" :disabled="isSaving || isArchiving"
                                        @click="archiveDialogOpen = true">
                                        {{ isArchiving
                                            ? (project.archived_at ? 'Restoring...' : 'Archiving...')
                                            : (project.archived_at ? 'Restore' : 'Archive')
                                        }}
                                    </Button>

                                    <Button type="button" variant="outline" :disabled="isSaving || isArchiving"
                                        @click="isEditing = false">
                                        Cancel
                                    </Button>

                                    <Button type="submit" form="project-form" :disabled="isSaving || isArchiving">
                                        {{ isSaving ? 'Saving...' : 'Save' }}
                                    </Button>
                                </template>
                            </div>
                        </div>

                        <ProjectForm v-if="isEditing" :project="project" v-model:loading="isSaving" @saved="onSaved" />

                        <div v-else>
                            <FieldRow>
                                <DetailField label="Client" :value="project.client
                                    ? `${project.client.first_name} ${project.client.last_name}`
                                    : 'No client assigned'
                                    " />
                                <DetailField label="Project Name" :value="project.name" />
                            </FieldRow>

                            <FieldRow>
                                <DetailField label="Status">
                                    <StatusBadge :value="project.status" />
                                </DetailField>

                                <DetailField label="Priority">
                                    <StatusBadge :value="project.priority" />
                                </DetailField>
                            </FieldRow>

                            <FieldRow>
                                <DetailField label="Start Date" :value="dateOnly(project.start_date)" />
                                <DetailField label="Due Date" :value="dateOnly(project.due_date)" />
                            </FieldRow>

                            <FieldRow single>
                                <DetailField label="Budget" :value="project.budget" />
                            </FieldRow>

                            <FieldRow single>
                                <DetailField label="Description"
                                    :value="project.description || 'No description provided.'" multiline />
                            </FieldRow>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="tasks" class="mt-4">
                    <div class="rounded-lg border bg-white p-6">
                        <div class="mb-4 flex items-center justify-between">
                            <h2 class="text-xl font-semibold">Tasks</h2>

                            <Button type="button" @click="taskDialogOpen = true">
                                Add Task
                            </Button>
                        </div>


                        <p v-if="!project.tasks?.length" class="text-muted-foreground">
                            No tasks associated with this project yet.
                        </p>

                        <div v-else class="space-y-3">
                            <div v-for="task in project.tasks" :key="task.id"
                                class="cursor-pointer rounded-md border p-4 transition hover:bg-slate-50"
                                @click="router.push(`/tasks/${task.id}`)">
                                <div class="flex items-center justify-between gap-4">
                                    <h3 class="font-semibold">{{ task.title }}</h3>
                                    <StatusBadge :value="task.status" />
                                </div>

                                <p class="text-sm text-muted-foreground">
                                    {{ task.description || 'No description' }}
                                </p>

                                <div class="mt-2">
                                    <StatusBadge :value="task.priority" />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            <ConfirmDialog v-model:open="archiveDialogOpen"
                :title="project.archived_at ? 'Restore project?' : 'Archive project?'" :description="project.archived_at
                    ? 'This project will be restored to the active projects.'
                    : 'This project will be moved to the archived projects.'"
                :confirm-text="project.archived_at ? 'Restore' : 'Archive'"
                :loading-text="project.archived_at ? 'Restoring...' : 'Archiving...'" :loading="isArchiving"
                @confirm="archiveProject" />
            <FormDialog v-model:open="taskDialogOpen" title="Create Task"
                :description="`Add a new task to ${project?.name}.`">
                <TaskForm :defaults="{ project_id: project?.id }" @saved="onTaskCreated"
                    @cancel="taskDialogOpen = false" />
            </FormDialog>
        </div>
    </div>
</template>