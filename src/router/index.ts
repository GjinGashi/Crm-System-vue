import { createRouter, createWebHistory } from 'vue-router'

import Login from '@/components/Auth/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Clients from '@/views/Clients.vue'
import ClientShow from '@/views/ClientShow.vue'

import Profile from '@/views/Profile.vue'
import Projects from '@/views/Projects.vue'
import ProjectShow from '@/views/ProjectShow.vue'
import Tasks from '@/views/Tasks.vue'
import TaskShow from '@/views/TaskShow.vue'

import Users from '@/views/Users.vue'
import UserShow from '@/views/UserShow.vue'

import Employees from '@/views/Employees.vue'
import EmployeeShow from '@/views/EmployeeShow.vue'

import ForgotPassword from '@/components/Auth/ForgotPassword.vue'
import ResetPassword from '@/components/Auth/ResetPassword.vue'
import api from '@/lib/api'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),

    routes: [
        {
            path: '/',
            redirect: '/login',
        },
        {
            path: '/login',
            name: 'login',
            component: Login,
        },
        {
            path: '/reset-password/:token',
            name: 'reset-password',
            component: ResetPassword,
        },
        {
            path: '/forgot-password',
            name: 'forgot-password',
            component: ForgotPassword,
        },
        {
            path: '/clients',
            name: 'clients',
            component: Clients,
        },

        {
            path: '/clients/:id',
            name: 'clients.show',
            component: ClientShow,
        },
        {
            path: '/profile',
            name: 'profile',
            component: Profile,
        },
        {
            path: '/projects',
            name: 'projects',
            component: Projects,
        },
        {
            path: '/projects/:id',
            name: 'projects.show',
            component: ProjectShow,
        },
        {
            path: '/tasks',
            name: 'tasks',
            component: Tasks,
        },

        {
            path: '/tasks/:id',
            name: 'tasks.show',
            component: TaskShow,
        },
        {
            path: '/users',
            name: 'users',
            component: Users,
        },
        {
            path: '/employees',
            name: 'employees',
            component: Employees,
        },

        {
            path: '/employees/:id',
            component: EmployeeShow,
        },
        {
            path: '/users/:id',
            component: UserShow,
        },
        {
            path: '/dashboard',
            component: Dashboard,
        }
    ],
})
router.beforeEach(async (to) => {
    const token = localStorage.getItem('token')

    if (
        to.path !== '/login' &&
        to.name !== 'forgot-password' &&
        to.name !== 'reset-password' &&
        !token
    ) {
        return '/login'
    }

    if (!token) {
        return true
    }

    try {
        const response = await api.get('/user')
        const user = response.data

        const isAdmin = user.role === 'admin'
        const isEmployee =
            user.role === 'user' && user.employee !== null

        if (to.path === '/login') {
            return isAdmin ? '/dashboard' : '/tasks'
        }

        if (!isAdmin && !isEmployee) {
            return '/profile'
        }

        if (isEmployee) {
            if (
                to.path.startsWith('/dashboard') ||
                to.path.startsWith('/clients') ||
                to.path.startsWith('/projects') ||
                to.path.startsWith('/employees') ||
                to.path.startsWith('/users')
            ) {
                return '/tasks'
            }
        }

        if (!isAdmin && to.path.startsWith('/dashboard')) {
            return '/profile'
        }

        return true
    } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return '/login'
    }
})

export default router