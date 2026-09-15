import { createRouter, createWebHistory } from 'vue-router'

import Login from '@/views/Auth/Login.vue'
import Clients from '@/views/Clients.vue'
import ClientShow from '@/views/ClientShow.vue'
import ClientCreate from '@/views/ClientCreate.vue'
import ClientEdit from '@/views/ClientEdit.vue'
import Profile from '@/views/Profile.vue'
import Projects from '@/views/Projects.vue'
import ProjectCreate from '@/views/ProjectCreate.vue'
import ProjectShow from '@/views/ProjectShow.vue'
import ProjectEdit from '@/views/ProjectEdit.vue'
import Tasks from '@/views/Tasks.vue'
import TaskShow from '@/views/TaskShow.vue'
import CreateTask from '@/views/Tasks/CreateTask.vue'
import EditTask from '@/views/Tasks/EditTask.vue'
import Users from '@/views/Users.vue'
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
            path: '/clients',
            name: 'clients',
            component: Clients,
        },
        {
            path: '/clients/create',
            name: 'clients.create',
            component: ClientCreate,
        },
        {
            path: '/clients/:id',
            name: 'clients.show',
            component: ClientShow,
        },
        {
            path: '/clients/:id/edit',
            name: 'clients.edit',
            component: ClientEdit,
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
            path: '/projects/create',
            name: 'projects.create',
            component: ProjectCreate,
        },
        {
            path: '/projects/:id',
            name: 'projects.show',
            component: ProjectShow,
        },
        {
            path: '/projects/:id/edit',
            name: 'projects.edit',
            component: ProjectEdit,
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
            path: '/tasks/create',
            name: 'tasks.create',
            component: CreateTask,
        },
        {
            path: '/tasks/:id/edit',
            name: 'tasks.edit',
            component: EditTask,
        },
        {
            path: '/users',
            name: 'users',
            component: Users,
        },
    ],
})
router.beforeEach((to) => {
    const token = localStorage.getItem('token')

    if (to.path !== '/login' && !token) {
        return '/login'
    }

    if (to.path === '/login' && token) {
        return '/clients'
    }
})

export default router