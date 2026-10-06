<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
    CheckSquare,
    FolderKanban,
    LayoutDashboard,
    LogOut,
    Settings,
    UserCircle,
    UserRoundCog,
    Users,
} from 'lucide-vue-next'

import { Toaster } from '@/components/ui/sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import api from '@/lib/api'

interface User {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
    avatar_url: string | null
    employee: {
        id: number
        role_id: number
    } | null
}

const adminLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Clients', path: '/clients', icon: Users },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Employees', path: '/employees', icon: UserRoundCog },
    { label: 'Users', path: '/users', icon: Users },
]

const employeeLinks = [
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
]

const router = useRouter()
const route = useRoute()

const user = ref<User | null>(null)

const isAdmin = computed(() => user.value?.role === 'admin')

const isEmployee = computed(
    () => user.value?.role === 'user' && user.value?.employee !== null,
)

const links = computed(() => {
    if (isAdmin.value) return adminLinks
    if (isEmployee.value) return employeeLinks
    return []
})

const userInitial = computed(
    () => user.value?.first_name?.charAt(0).toUpperCase() ?? '',
)

const userFullName = computed(() =>
    user.value ? `${user.value.first_name} ${user.value.last_name}` : '',
)

const userRole = computed(() => {
    if (isAdmin.value) return 'Administrator'
    if (isEmployee.value) return 'Employee'
    return 'User'
})

function linkClass(path: string) {
    return route.path.startsWith(path)
        ? 'bg-white/15 text-white'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
}

async function fetchUser() {
    try {
        const response = await api.get('/user')
        user.value = response.data
    } catch {
        user.value = null
    }
}

async function logout() {
    try {
        await api.post('/logout')
    } catch {
        // log out locally even if the request fails
    } finally {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        await router.push('/login')
    }
}

fetchUser()
</script>

<template>
    <div class="min-h-screen bg-background">
        <header class="sticky top-0 z-50 border-b border-blue-900 bg-blue-950 text-white shadow-md">
            <div class="px-4 sm:px-6 lg:px-8">
                <div class="flex min-h-[72px] items-center justify-between gap-4">
                    <div class="flex min-w-0 items-center gap-6">
                        <img src="/logo.png" alt="CRM Logo" class="h-10 w-auto" />

                        <nav class="hidden items-center gap-1 lg:flex">
                            <RouterLink
                                v-for="link in links"
                                :key="link.path"
                                :to="link.path"
                                class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                                :class="linkClass(link.path)"
                            >
                                <component :is="link.icon" class="h-4 w-4" />
                                {{ link.label }}
                            </RouterLink>
                        </nav>
                    </div>

                    <div v-if="user" class="flex shrink-0 items-center gap-2">
                        <div class="hidden items-center gap-3 px-2 py-1.5 sm:flex">
                            <img
                                v-if="user.avatar_url"
                                :src="user.avatar_url"
                                :alt="userFullName"
                                class="h-9 w-9 rounded-full border-2 border-white/30 object-cover"
                            />

                            <div
                                v-else
                                class="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold"
                            >
                                {{ userInitial }}
                            </div>

                            <div class="hidden text-left xl:block">
                                <p class="max-w-[140px] truncate text-sm font-semibold">
                                    {{ userFullName }}
                                </p>

                                <p class="text-xs text-slate-400">{{ userRole }}</p>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <button
                                    type="button"
                                    class="rounded-lg p-2.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                                    aria-label="Settings"
                                    title="Settings"
                                >
                                    <Settings class="h-5 w-5" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" class="w-56">
                                <div class="border-b px-3 py-2">
                                    <p class="truncate text-sm font-semibold">{{ userFullName }}</p>
                                    <p class="text-xs text-slate-500">{{ userRole }}</p>
                                </div>

                                <DropdownMenuItem @select="router.push('/profile')">
                                    <UserCircle class="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    class="text-red-600 focus:text-red-600"
                                    @select="logout"
                                >
                                    <LogOut class="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <nav class="flex gap-1 overflow-x-auto border-t border-white/10 py-2 lg:hidden">
                    <RouterLink
                        v-for="link in links"
                        :key="link.path"
                        :to="link.path"
                        class="shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                        :class="linkClass(link.path)"
                    >
                        {{ link.label }}
                    </RouterLink>
                </nav>
            </div>
        </header>

        <main class="px-4 py-6 sm:px-6 lg:px-8">
            <slot />
        </main>

        <Toaster
            position="top-center"
            :pause-on-hover="false"
            :toast-options="{
                class: 'w-[380px] rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xl',
            }"
        />
    </div>
</template>