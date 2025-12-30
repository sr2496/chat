import { defineStore } from 'pinia';
import { api } from '../axios';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as any | null,
    isLoading: true,

    // 🔵 presence
    onlineUsers: new Set<number>(),
    presenceJoined: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isUserOnline: (state) => {
      return (userId?: number | null) =>
        !!userId && state.onlineUsers.has(userId)
    },
  },

  actions: {
    setUser(u: any) {
      this.user = u;
      this.isLoading = false;
    },

    clearUser() {
      this.user = null;
      this.isLoading = false;
    },

    joinPresenceChannel() {
      if (this.presenceJoined || !this.user) return
      this.presenceJoined = true

      window.Echo.join('presence-chat')
        .here((users: any[]) => {
          this.onlineUsers = new Set(users.map(u => u.id))
        })
        .joining((user: any) => {
          this.onlineUsers.add(user.id)

        })
        .leaving((user: any) => {
          this.onlineUsers.delete(user.id)
        })
    },
    leavePresenceChannel() {
      if (!this.presenceJoined) return

      window.Echo.leave('presence-chat')
      this.onlineUsers.clear()
      this.presenceJoined = false
    },

    async logout() {
      try {
        await api.post('/logout')
      } catch (e) {
        console.error('Logout failed:', e)
      } finally {
        this.clearUser()
        this.leavePresenceChannel()
      }
    },

    async updateProfile(data: { name?: string; avatar?: File }) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.avatar) formData.append('avatar', data.avatar);
      
      const response = await api.post('/user/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Backend returns UserResource directly, so user data is in response.data.data
      this.user = response.data.data;
      return response.data.data;
    },
  }

});
