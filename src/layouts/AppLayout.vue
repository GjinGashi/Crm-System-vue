
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import {
    Users,
    FolderKanban,
    CheckSquare,
    UserCircle,
    LogOut,
} from 'lucide-vue-next'
import api from '@/lib/api'

interface User {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
}

interface SearchResults {
    clients: {
        id: string
        first_name: string
        last_name: string
    }[]
    projects: { id: string; name: string }[]
    tasks: { id: string; title: string }[]
}

const router = useRouter()
const route = useRoute()

const sidebarOpen = ref(false)
const searchQuery = ref('')
const user = ref<User | null>(null)

const searchResults = ref<SearchResults>({
    clients: [],
    projects: [],
    tasks: [],
})

const isSearching = ref(false)

const pageTitle = computed(() => {
    const path = route.path

    if (path.startsWith('/clients/')) return 'Client Details'
    if (path.startsWith('/projects/')) return 'Project Details'
    if (path.startsWith('/tasks/')) return 'Task Details'
    if (path.startsWith('/clients')) return 'Clients'
    if (path.startsWith('/projects')) return 'Projects'
    if (path.startsWith('/tasks')) return 'Tasks'
    if (path.startsWith('/users')) return 'Users'
    if (path.startsWith('/profile')) return 'Profile'

    return ''
})

const isAdmin = computed(() => user.value?.role === 'admin')

const userInitial = computed(() => {
    return user.value?.first_name?.charAt(0).toUpperCase() ?? ''
})

const userFullName = computed(() => {
    if (!user.value) {
        return ''
    }

    return `${user.value.first_name} ${user.value.last_name}`
})

async function fetchUser() {
    try {
        const response = await api.get('/user')
        user.value = response.data
    } catch {
        user.value = null
    }
}

async function search() {
    const query = searchQuery.value.trim()

    if (!query) {
        searchResults.value = {
            clients: [],
            projects: [],
            tasks: [],
        }

        return
    }

    isSearching.value = true

    try {
        const response = await api.get('/search', {
            params: {
                q: query,
            },
        })

        searchResults.value = response.data
    } catch {
        searchResults.value = {
            clients: [],
            projects: [],
            tasks: [],
        }
    } finally {
        isSearching.value = false
    }
}

function navigate(path: string) {
    searchQuery.value = ''

    searchResults.value = {
        clients: [],
        projects: [],
        tasks: [],
    }

    sidebarOpen.value = false

    router.push(path)
}

async function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    await router.push('/login')
}

fetchUser()
</script>

<template>
    <div class="bg-background min-h-screen">
        <div class="flex min-h-screen">
            <!-- Sidebar -->
            <aside
                class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-[#343a40] text-slate-100 transition-transform duration-200 md:sticky md:top-0 md:h-screen"
                :class="
                    sidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full md:translate-x-0'
                "
            >
                <!-- Logo -->
                <div class="flex items-center justify-between px-5 py-5">
                    <div class="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="CRM Logo"
                            class="h-11 w-auto shrink-0"
                        />
                    </div>

                    <button
                        type="button"
                        class="rounded-lg p-2 hover:bg-white/10 md:hidden"
                        @click="sidebarOpen = false"
                        aria-label="Close navigation"
                    >
                        ×
                    </button>
                </div>

                <!-- Navigation -->
                <nav class="flex flex-col space-y-6 px-4 pt-2">
                    <div>
                        <p
                            class="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase"
                        >
                            Main
                        </p>

                        <div class="space-y-1">
                            <!-- Clients -->
                            <button
                                type="button"
                                class="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-all duration-200"
                                :class="
                                    route.path.startsWith('/clients')
                                        ? 'bg-white/10 text-white ring-1 ring-white/10'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                "
                                @click="navigate('/clients')"
                            >
                                <Users class="h-4 w-4 shrink-0" />
                                <span>Clients</span>
                            </button>

                            <!-- Projects -->
                            <button
                                type="button"
                                class="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-all duration-200"
                                :class="
                                    route.path.startsWith('/projects')
                                        ? 'bg-white/10 text-white ring-1 ring-white/10'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                "
                                @click="navigate('/projects')"
                            >
                                <FolderKanban class="h-4 w-4 shrink-0" />
                                <span>Projects</span>
                            </button>

                            <!-- Tasks -->
                            <button
                                type="button"
                                class="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-all duration-200"
                                :class="
                                    route.path.startsWith('/tasks')
                                        ? 'bg-white/10 text-white ring-1 ring-white/10'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                "
                                @click="navigate('/tasks')"
                            >
                                <CheckSquare class="h-4 w-4 shrink-0" />
                                <span>Tasks</span>
                            </button>
                        </div>
                    </div>

                    <!-- Management -->
                    <div v-if="isAdmin">
                        <p
                            class="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase"
                        >
                            Management
                        </p>

                        <div class="space-y-1">
                            <button
                                type="button"
                                class="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-all duration-200"
                                :class="
                                    route.path.startsWith('/users')
                                        ? 'bg-white/10 text-white ring-1 ring-white/10'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                "
                                @click="navigate('/users')"
                            >
                                <Users class="h-4 w-4 shrink-0" />
                                <span>Users</span>
                            </button>
                        </div>
                    </div>

                    <!-- Account -->
                    <div>
                        <p
                            class="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase"
                        >
                            Account
                        </p>

                        <div class="space-y-1">
                            <button
                                type="button"
                                class="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-all duration-200"
                                :class="
                                    route.path.startsWith('/profile')
                                        ? 'bg-white/10 text-white ring-1 ring-white/10'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                "
                                @click="navigate('/profile')"
                            >
                                <UserCircle class="h-4 w-4 shrink-0" />
                                <span>Profile</span>
                            </button>
                        </div>
                    </div>

                    <!-- User -->
                    <div class="pt-2">
                        <div
                            v-if="user"
                            class="mb-3 flex items-center gap-3 rounded-lg border border-white/10 bg-black/10 px-3 py-3"
                        >
                            <div
                                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/10"
                            >
                                {{ userInitial }}
                            </div>

                            <div class="min-w-0">
                                <p
                                    class="truncate text-sm font-semibold"
                                >
                                    {{ userFullName }}
                                </p>

                                <p
                                    class="text-muted-foreground mt-0.5 truncate text-xs capitalize"
                                >
                                    {{ user.role }}
                                </p>
                            </div>
                        </div>
                    </div>
                </nav>

                <!-- Logout -->
                <div class="mt-auto px-4 pb-4">
                    <button
                        type="button"
                        class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex w-full items-center gap-3 rounded-lg px-0 py-3 text-left text-sm font-medium transition-colors"
                        @click="logout"
                    >
                        <LogOut class="h-4 w-4 shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <!-- Main -->
            <main class="min-w-0 flex-1">
                <header
                    class="flex h-16 items-center justify-between border-b bg-white px-6 lg:px-8"
                >
                    <div class="flex items-center gap-3">
                        <button
                            type="button"
                            class="rounded-lg p-2 hover:bg-muted md:hidden"
                            @click="sidebarOpen = true"
                            aria-label="Open navigation"
                        >
                            ☰
                        </button>

                        <h1
                            class="text-sm font-semibold text-slate-900"
                        >
                            {{ pageTitle }}
                        </h1>
                    </div>

                    <!-- Search -->
                    <div class="relative hidden w-full max-w-md md:block">
                        <input
                            v-model="searchQuery"
                            type="search"
                            placeholder="Search clients, projects, tasks..."
                            class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                            @input="search"
                        />

                        <div
                            v-if="
                                searchQuery.trim() &&
                                (
                                    isSearching ||
                                    searchResults.clients.length ||
                                    searchResults.projects.length ||
                                    searchResults.tasks.length
                                )
                            "
                            class="absolute top-full right-0 left-0 z-50 mt-2 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
                        >
                            <p
                                v-if="isSearching"
                                class="px-3 py-2 text-sm text-slate-500"
                            >
                                Searching...
                            </p>

                            <!-- Clients -->
                            <div
                                v-if="searchResults.clients.length"
                            >
                                <p
                                    class="px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase"
                                >
                                    Clients
                                </p>

                                <button
                                    v-for="client in searchResults.clients"
                                    :key="`client-${client.id}`"
                                    type="button"
                                    class="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50"
                                    @click="
                                        navigate(
                                            `/clients/${client.id}`,
                                        )
                                    "
                                >
                                    {{ client.first_name }}
                                    {{ client.last_name }}
                                </button>
                            </div>

                            <!-- Projects -->
                            <div
                                v-if="searchResults.projects.length"
                            >
                                <p
                                    class="px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase"
                                >
                                    Projects
                                </p>

                                <button
                                    v-for="project in searchResults.projects"
                                    :key="`project-${project.id}`"
                                    type="button"
                                    class="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50"
                                    @click="
                                        navigate(
                                            `/projects/${project.id}`,
                                        )
                                    "
                                >
                                    {{ project.name }}
                                </button>
                            </div>

                            <!-- Tasks -->
                            <div
                                v-if="searchResults.tasks.length"
                            >
                                <p
                                    class="px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase"
                                >
                                    Tasks
                                </p>

                                <button
                                    v-for="task in searchResults.tasks"
                                    :key="`task-${task.id}`"
                                    type="button"
                                    class="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50"
                                    @click="
                                        navigate(
                                            `/tasks/${task.id}`,
                                        )
                                    "
                                >
                                    {{ task.title }}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div>
                    <slot />
                </div>
            </main>
        </div>
    </div>

    <Toaster
        position="top-center"
        :pause-on-hover="false"
        :toast-options="{
            class: 'w-[380px] rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xl',
        }"
    />
</template>
