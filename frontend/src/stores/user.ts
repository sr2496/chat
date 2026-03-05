import { defineStore } from 'pinia';
import { echo } from '../echo';
import type { User } from '../types/chat';
import * as chatApi from '../services/chatApi';

interface PresenceUser {
  id: number;
  name: string;
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    isLoading: true,

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
    setUser(u: User) {
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

      echo.join('presence-chat')
        .here((users: PresenceUser[]) => {
          this.onlineUsers = new Set(users.map(u => u.id))
        })
        .joining((user: PresenceUser) => {
          this.onlineUsers.add(user.id)
        })
        .leaving((user: PresenceUser) => {
          this.onlineUsers.delete(user.id)
        })
    },

    leavePresenceChannel() {
      if (!this.presenceJoined) return

      echo.leave('presence-chat')
      this.onlineUsers.clear()
      this.presenceJoined = false
    },

    async logout() {
      try {
        await chatApi.logout()
      } catch (e) {
        console.error('Logout failed:', e)
      } finally {
        this.clearUser()
        this.leavePresenceChannel()
      }
    },

    async updateProfile(data: { name?: string; avatar?: File }) {
      const user = await chatApi.updateProfile(data);
      this.user = user;
      return user;
    },
  }

});
