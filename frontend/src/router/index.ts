import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Chat from '../components/Design/ChatLayout.vue'
import { useUserStore } from "../stores/user";

const routes = [
    {
        path: '/',
        component: Home,
    },
    {
        path: '/login',
        component: Login,
        meta: { guest: true },
    },
    {
        path: '/register',
        component: Register,
        meta: { guest: true },
    },
    {
        path: '/chat',
        component: Chat,
        meta: { requiresAuth: true },
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})


/**
 * Global Auth Middleware
 */
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();

    // If we're still checking authentication → wait for it
    if (userStore.isLoading) {
        await new Promise<void>((resolve) => {
            const unwatch = watch(
                () => userStore.isLoading,
                (loading) => {
                    if (!loading) {
                        unwatch() // clean up watcher
                        resolve()
                    }
                },
                { immediate: true } // in case it already resolved
            )
        })
    }

    const isAuthenticated = userStore.isAuthenticated

    // 🟢 Auth-only routes
    if (to.meta.requiresAuth && !isAuthenticated) {
        return next('/login')
    }
    
    // 🟢 Guest-only routes (login, register)
    if (to.meta.guest && isAuthenticated) {
        return next('/chat')
    }

    next()
})

export default router
