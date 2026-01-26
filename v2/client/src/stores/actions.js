import { defineStore } from 'pinia'
import { api } from '../utils/axios'
import { ref } from 'vue'

export const useActionStore = defineStore('actions', () => {
    const actions = ref([])
    const loading = ref(false)
    const error = ref(null)

    const fetchActions = async (filters = {}) => {
        loading.value = true
        try {
            const params = new URLSearchParams(filters).toString()
            const res = await api.get(`/actions?${params}`)
            actions.value = res.data
        } catch (err) {
            console.error(err)
            error.value = err.response?.data?.message || 'Failed to fetch actions'
        } finally {
            loading.value = false
        }
    }

    const createAction = async (data) => {
        try {
            const res = await api.post('/actions', data)
            actions.value.unshift(res.data)
            return res.data
        } catch (err) {
            console.error(err)
            throw err
        }
    }

    const updateAction = async (id, data) => {
        try {
            const res = await api.put(`/actions/${id}`, data)
            const index = actions.value.findIndex(a => a._id === id)
            if (index !== -1) {
                actions.value[index] = res.data
            }
            return res.data
        } catch (err) {
            console.error(err)
            throw err
        }
    }

    const deleteAction = async (id) => {
        try {
            await api.delete(`/actions/${id}`)
            actions.value = actions.value.filter(a => a._id !== id)
        } catch (err) {
            console.error(err)
            throw err
        }
    }

    const handleSocketAction = (action, type) => {
        if (type === 'new') {
            if (!actions.value.some(a => a._id === action._id)) {
                actions.value.unshift(action)
            }
        } else if (type === 'update') {
            const index = actions.value.findIndex(a => a._id === action._id)
            if (index !== -1) {
                actions.value[index] = action
            }
        } else if (type === 'delete') {
            actions.value = actions.value.filter(a => a._id !== action)
        }
    }

    return {
        actions,
        loading,
        error,
        fetchActions,
        createAction,
        updateAction,
        deleteAction,
        handleSocketAction
    }
})
