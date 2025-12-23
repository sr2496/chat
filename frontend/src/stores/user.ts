import { defineStore } from 'pinia';

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
  }

});
