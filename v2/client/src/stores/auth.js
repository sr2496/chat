import { defineStore } from 'pinia'
import { api } from '../utils/axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(JSON.parse(localStorage.getItem('user')) || null)
    const token = ref(localStorage.getItem('token') || null)
    const router = useRouter()

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password })
            user.value = res.data
            token.value = res.data.token
            localStorage.setItem('user', JSON.stringify(res.data))
            localStorage.setItem('token', res.data.token)
            return { success: true, data: res.data }
        } catch (error) {
            console.error(error)
            return { success: false, message: error.response?.data?.message || 'Login failed' }
        }
    }

    const register = async (name, email, password) => {
        try {
            const res = await api.post('/auth/register', { name, email, password })
            user.value = res.data
            token.value = res.data.token
            localStorage.setItem('user', JSON.stringify(res.data))
            localStorage.setItem('token', res.data.token)
            return { success: true, data: res.data }
        } catch (error) {
            console.error(error)
            return { success: false, message: error.response?.data?.message || 'Registration failed' }
        }
    }

    const logout = () => {
        user.value = null
        token.value = null
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        router.push('/login')
    }

    return { user, token, login, logout, register }
})
