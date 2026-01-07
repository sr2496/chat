import { defineStore } from "pinia";
import { api } from "../axios";
import { useUserStore } from "./user";
import { echo } from "../echo";

interface MessageReply {
  id: number;
  sender_name: string;
  body: string;
}

interface Message {
  id: number;
  message: string;
  type: string;
  sender: any;
  reactions?: Record<string, number[]>;
  conversation_id: number;
  created_at: string;
  reply_to?: MessageReply | null;
  file_path: string;
  mime_type: string;
  file_name: string;
  file_size: number;
  read_by_me: boolean;
  read_by_count: number;
  read_by: number[];
}

export const useChatStore = defineStore("chat", {
  state: () => ({
    conversations: [] as any[],
    conversationPagination: {
      nextCursor: null as number | null,
      hasMore: true,
      loading: false,
    },
    users: [] as any[],
    usersPagination: {
      nextCursor: null as number | null,
      hasMore: true,
      loading: false,
    },
    messagesByConversation: {} as Record<number, Message[]>,
    pagination: {} as Record<
      number,
      {
        beforeId: number | null;
        hasMore: boolean;
        loading: boolean;
      }
    >,
    activeConversationId: null as number | null,
    echoChannels: new Map<number, any>(),
    searchQuery: "",
    typingUsers: {} as Record<number, number[]>,
    mutedConversations: [] as number[],
  }),

  getters: {
    activeMessages(state) {
      return state.activeConversationId
        ? state.messagesByConversation[state.activeConversationId] || []
        : [];
    },
    filteredConversations(state) {
      if (!state.searchQuery) return state.conversations;

      const query = state.searchQuery.toLowerCase();

      return state.conversations.filter(
        (conv) =>
          conv.name?.toLowerCase().includes(query) ||
          conv.last_message?.message?.toLowerCase().includes(query)
      );
    },
    typingText: (state) => (conversationId: number | null) => {
      if (!conversationId) return "";

      const typers = state.typingUsers[conversationId] || [];
      if (typers.length === 0) return "";

      const userStore = useUserStore();
      const currentUserId = userStore.user?.id;

      const conv = state.conversations.find((c) => c.id === conversationId);
      if (!conv) return "";

      const typingUsers = conv.users.filter(
        (u: any) => typers.includes(u.id) && u.id !== currentUserId
      );

      if (typingUsers.length === 0) return "";

      // 👇 Private chat (1-to-1)
      if (conv.users.length === 2) {
        return "Typing...";
      }

      // 👇 Group chat
      const names = typingUsers.map((u: any) => u.name);

      if (names.length === 1) return `${names[0]} is typing...`;
      if (names.length === 2)
        return `${names[0]} and ${names[1]} are typing...`;

      return "Several people are typing...";
    },

    getOtherUser: (_state) => {
      const userStore = useUserStore();
      return (conversation: any) => {
        if (conversation.type !== "private") return null;
        const currentUserId = userStore.user?.id;
        return (
          conversation.users.find((u: any) => u.id !== currentUserId) || null
        );
      };
    },

    computeFirstUnread: (state) => (conversationId: number | null) => {
      if (!conversationId) return null;
      const msgs = state.messagesByConversation[conversationId] || [];
      const myId = useUserStore().user?.id;

      const firstUnread = msgs.find(
        (m) => !m.read_by_me && m.sender.id !== myId
      );
      
      return firstUnread?.id ?? null;
    },
  },

  actions: {
    /* ---------------- CONVERSATIONS ---------------- */

    async loadConversations(loadMore = false) {
      // Prevent concurrent loading
      if (this.conversationPagination.loading) return;

      // If trying to load more but no more available, return
      if (loadMore && !this.conversationPagination.hasMore) return;

      this.conversationPagination.loading = true;

      try {
        const params: any = { limit: 20 };

        // Add cursor for pagination if loading more
        if (loadMore && this.conversationPagination.nextCursor) {
          params.after_id = this.conversationPagination.nextCursor;
        }

        const res = await api.get("/conversations", { params });

        if (loadMore) {
          // Append new conversations to existing list
          this.conversations = [...this.conversations, ...res.data.data];
        } else {
          // Replace all conversations (initial load or refresh)
          this.conversations = res.data.data;
        }

        // Update pagination metadata
        this.conversationPagination.hasMore = res.data.meta?.has_more ?? false;
        this.conversationPagination.nextCursor = res.data.meta?.next_cursor ?? null;
      } finally {
        this.conversationPagination.loading = false;
      }
    },

    async loadMoreConversations() {
      await this.loadConversations(true);
    },

    /* ---------------- USERS ---------------- */

    async loadUsers(loadMore = false) {
      // Reset state for initial load
      if (!loadMore) {
        this.users = [];
        this.usersPagination.nextCursor = null;
        this.usersPagination.hasMore = true;
      }

      // Prevent concurrent loading or loading when no more data
      if (this.usersPagination.loading || (loadMore && !this.usersPagination.hasMore)) {
        return;
      }

      this.usersPagination.loading = true;

      try {
        const params: any = { limit: 20 };

        // Add cursor for pagination if loading more
        if (this.usersPagination.nextCursor) {
          params.after_id = this.usersPagination.nextCursor;
        }

        const res = await api.get("/users", { params });

        if (loadMore) {
          // Append new users to existing list
          this.users = [...this.users, ...res.data.data];
        } else {
          // Replace all users (initial load)
          this.users = res.data.data;
        }

        // Update pagination metadata
        this.usersPagination.hasMore = res.data.meta?.has_more ?? false;
        this.usersPagination.nextCursor = res.data.meta?.next_cursor ?? null;
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        this.usersPagination.loading = false;
      }
    },

    async loadMoreUsers() {
      await this.loadUsers(true);
    },

    setActiveConversation(conversationId: number) {
      this.activeConversationId = conversationId;
    },
    /* ---------------- MESSAGES ---------------- */

    async loadMessages(conversationId: number, loadMore = false) {
      if (!this.pagination[conversationId]) {
        this.pagination[conversationId] = {
          beforeId: null,
          hasMore: true,
          loading: false,
        };
      }

      const pager = this.pagination[conversationId];
      if (pager.loading || (!pager.hasMore && loadMore)) return;

      pager.loading = true;

      let perPage = 20;

      const conversation = this.conversations.find(
        (c) => c.id === conversationId
      );
      if (conversation && conversation.unread_count) {
        perPage = conversation.unread_count + 20; // load all unread + a few extras
      }

      try {
        const res = await api.get(`/messages/${conversationId}`, {
          params: {
            limit: loadMore ? perPage : perPage, // load more initially
            before_id: loadMore ? pager.beforeId : null,
          },
        });

        const msgs = res.data.data;
        const meta = res.data.meta;

        if (loadMore) {
          // PREPEND older messages
          this.messagesByConversation[conversationId] = [
            ...msgs,
            ...(this.messagesByConversation[conversationId] || []),
          ];
        } else {
          this.messagesByConversation[conversationId] = msgs;
        }

        pager.beforeId = meta.oldest_id ?? pager.beforeId;
        pager.hasMore = meta.has_more;
      } finally {
        pager.loading = false;
      }
    },
    pushMessage(message: Message) {
      const convId = message.conversation_id;

      if (!this.messagesByConversation[convId]) {
        this.messagesByConversation[convId] = [];
      }

      this.messagesByConversation[convId].push(message);

      // Update last message & reorder
      this.updateConversationLastMessage(message);
    },

    removeMessage(messageId: number) {
      const convId = this.activeConversationId;
      if (!convId || !this.messagesByConversation[convId]) return;

      this.messagesByConversation[convId] = this.messagesByConversation[convId].filter(
        (m) => m.id !== messageId
      );
    },

    /* ---------------- REALTIME (ECHO) ---------------- */
    
    initUserListener() {
        const userStore = useUserStore();
        if (!userStore.user) return;
        
        echo.private(`chat.${userStore.user.id}`)
            .listen('.UserAddedToConversation', (e: { conversation: any }) => {
                this.addConversationIfMissing(e.conversation);
                this.startListening(e.conversation.id);
            });
    },

    startListening(conversationId: number) {
      if (this.echoChannels.has(conversationId)) return;

      const userStore = useUserStore();

      const channel = echo.private(`conversation.${conversationId}`)
        .listen(".MessageSent", (e: { message: Message }) => {
          const msg = e.message;

          if (msg.sender.id !== userStore.user?.id) {
            this.pushMessage(msg);

            // Show notification if user is not viewing this conversation or window is not focused
            if (
              this.activeConversationId !== conversationId ||
              !document.hasFocus()
            ) {
              this.showNotification(msg);
            }
          }

          // Increment unread if not active
          if (
            this.activeConversationId !== conversationId &&
            msg.sender.id !== userStore.user?.id
          ) {
            this.incrementUnread(conversationId);
          }
        })
        .listenForWhisper("typing", (e: { user_id: number }) => {
          if (e.user_id !== userStore.user?.id) {
            this.setUserTyping(conversationId, e.user_id);

            // auto-remove after 2s
            setTimeout(() => {
              this.removeUserTyping(conversationId, e.user_id);
            }, 2000);
          }
        })
        .listen(
          ".MessageRead",
          (e: {
            conversationId: number;
            messageIds: number[];
            userId: number;
          }) => {
            const msgs = this.messagesByConversation[e.conversationId];
            if (!msgs) return;

            msgs.forEach((m: any) => {
              if (e.messageIds.includes(m.id)) {
                if (!m.read_by) m.read_by = [];
                if (!m.read_by.includes(e.userId)) {
                  m.read_by.push(e.userId);
                }
                m.read_by_count = m.read_by.length;
                if (e.userId === userStore.user?.id) {
                  m.read_by_me = true;
                }
              }
            });

            if (e.userId === userStore.user?.id) {
              this.clearUnread(e.conversationId);
            }
          }
        )
        .listen(
          ".MessageReactionUpdated",
          (e: {
            conversation_id: number;
            message_id: number;
            user_id: number;
            emoji: string | null;
          }) => {
            if (e.user_id === userStore.user?.id) return;
            this.applyReactionUpdate(
              e.conversation_id,
              e.message_id,
              e.user_id,
              e.emoji
            );

          }
        )
        .listen(

          ".UserLeftGroup",
          (e: { conversationId: number; userId: number }) => {
            const index = this.conversations.findIndex((c) => c.id === e.conversationId);
            if (index !== -1) {
              const conv = this.conversations[index];
              if (conv.users) {
                const updatedUsers = conv.users.filter((u: any) => u.id !== e.userId);
                // Immutable update
                this.conversations[index] = {
                  ...conv,
                  users: updatedUsers,
                };
              }
            }
          }
        )
        .listen(
          ".UserAddedToGroup",
          (e: { conversationId: number; users: any[] }) => {
            const index = this.conversations.findIndex(c => c.id === e.conversationId);
            if (index !== -1) {
              const conv = this.conversations[index];
              if (conv.users) {
                const existingIds = new Set(conv.users.map((u: any) => u.id));
                const uniqueNewUsers = e.users.filter((u: any) => !existingIds.has(u.id));
                
                if (uniqueNewUsers.length > 0) {
                     this.conversations[index] = {
                        ...conv,
                        users: [...conv.users, ...uniqueNewUsers]
                    };
                }
              }
            }
          }
        );

      this.echoChannels.set(conversationId, channel);
    },

    stopAllListeners() {
      this.echoChannels.forEach((_, id) => {
        echo.leave(`conversation.${id}`);
      });
      this.echoChannels.clear();
    },

    addConversationIfMissing(conversation: any) {
      const exists = this.conversations.find((c) => c.id === conversation.id);
      if (!exists) {
        this.conversations.unshift(conversation);
      }
    },

    reorderConversation(conversationId: number) {
      const index = this.conversations.findIndex(
        (c) => c.id === conversationId
      );
      if (index <= 0) return;

      const conv = this.conversations[index];
      this.conversations.splice(index, 1);
      this.conversations.unshift(conv);
    },

    async createPrivateConversation(userId: number) {
      const res = await api.post("private-conversations", { user_id: userId });
      const conversation = res.data.data;

      this.addConversationIfMissing(conversation);
      this.setActiveConversation(conversation.id);

      return conversation;
    },

    async createGroupConversation(name: string, userIds: number[], avatar?: File) {
      if (avatar) {
        const formData = new FormData();
        formData.append("name", name);
        userIds.forEach((id) => formData.append("user_ids[]", id.toString()));
        formData.append("avatar", avatar);

        const res = await api.post("groups", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const conversation = res.data.data;
        this.addConversationIfMissing(conversation);
        this.setActiveConversation(conversation.id);
        return conversation;
      } else {
        const res = await api.post("groups", {
          name,
          user_ids: userIds,
        });

        const conversation = res.data.data;
        this.addConversationIfMissing(conversation);
        this.setActiveConversation(conversation.id);
        return conversation;
      }
    },

    updateConversationLastMessage(message: Message) {
      const convId = message.conversation_id;

      // Use string conversion to handle potential string/number mismatches
      const index = this.conversations.findIndex((c) => String(c.id) === String(convId));
      if (index === -1) return;

      const updatedConv = {
        ...this.conversations[index],
        last_message: message,
        time: message.created_at,
      };

      // Move conversation to top (WhatsApp behavior)
      this.conversations = [
        updatedConv,
        ...this.conversations.filter((c) => String(c.id) !== String(convId)),
      ];
    },
    
    getLastMessagePreview(msg?: Message): string {
      if (!msg) return "No messages yet";

      switch (msg.type) {
        case "image":
          return msg.message ? `📷 ${msg.message}` : "📷 Photo";
        case "video":
          return msg.message ? `🎥 ${msg.message}` : "🎥 Video";
        case "audio":
          return "🎤 Voice message";
        case "file":
          return `📎 ${(msg as any).file_name || "File"}`;
        default:
          return msg.message?.trim() || "";
      }
    },

    incrementUnread(conversationId: number) {
      const conv = this.conversations.find((c) => c.id === conversationId);
      if (!conv) return;

      conv.unread_count = (conv.unread_count || 0) + 1;
    },

    clearUnread(conversationId: number) {
      const conv = this.conversations.find((c) => c.id === conversationId);
      if (!conv) return;

      conv.unread_count = 0;
    },

    setUserTyping(conversationId: number, userId: number) {
      if (!this.typingUsers[conversationId]) {
        this.typingUsers[conversationId] = [];
      }

      if (!this.typingUsers[conversationId].includes(userId)) {
        this.typingUsers[conversationId].push(userId);
      }
    },

    removeUserTyping(conversationId: number, userId: number) {
      if (!this.typingUsers[conversationId]) return;

      this.typingUsers[conversationId] = this.typingUsers[
        conversationId
      ].filter((id) => id !== userId);
    },

    applyReactionUpdate(
      conversationId: number,
      messageId: number,
      userId: number,
      emoji: string | null
    ) {
      const messages = this.messagesByConversation[conversationId];
      if (!messages) return;

      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const msg = messages[index]!;
      const oldReactions = msg.reactions ?? {};

      let newReactions: Record<string, number[]> = {};

      // Remove user from all existing emojis
      for (const [em, users] of Object.entries(oldReactions)) {
        const filtered = users.filter((id) => id !== userId);
        if (filtered.length) newReactions[em] = filtered;
      }

      // Add new emoji if exists
      if (emoji) {
        newReactions[emoji] = [...(newReactions[emoji] || []), userId];
      }

      // Replace message immutably
      this.messagesByConversation[conversationId] = [
        ...messages.slice(0, index),
        { ...msg, reactions: newReactions } as Message,
        ...messages.slice(index + 1),
      ];
    },

    toggleReaction(messageId: number, emoji: string) {
      const myId = useUserStore().user?.id;
      const convId = this.activeConversationId;

      if (!myId || !convId) return;

      const messages = this.messagesByConversation[convId];
      if (!messages) return;

      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const msg = messages[index]!;
      const oldReactions = msg.reactions ?? {};

      let newReactions: Record<string, number[]> = {};

      // 1️⃣ Remove my reaction from all emojis
      for (const [em, users] of Object.entries(oldReactions)) {
        const filtered = users.filter((id) => id !== myId);
        if (filtered.length) {
          newReactions[em] = filtered;
        }
      }

      // 2️⃣ Toggle clicked emoji
      const hadEmoji = oldReactions[emoji]?.includes(myId);
      if (!hadEmoji) {
        newReactions[emoji] = [...(newReactions[emoji] || []), myId];
      }

      // 3️⃣ Replace message immutably
      this.messagesByConversation[convId] = [
        ...messages.slice(0, index),
        { ...msg, reactions: newReactions } as Message,
        ...messages.slice(index + 1),
      ];
    },

    async reactToMessage(messageId: number, emoji: string) {
      this.toggleReaction(messageId, emoji);

      try {
        await api.post(`/messages/${messageId}/reactions`, { emoji });
      } catch {
        // rollback on failure
        this.toggleReaction(messageId, emoji);
      }
    },

    /* ---------------- CONVERSATION MANAGEMENT ---------------- */

    toggleMute(conversationId: number) {
      const index = this.mutedConversations.indexOf(conversationId);
      if (index > -1) {
        this.mutedConversations.splice(index, 1);
      } else {
        this.mutedConversations.push(conversationId);
      }
      // TODO: Persist to backend if needed
    },

    async deleteConversation(conversationId: number) {
      try {
        await api.delete(`/conversations/${conversationId}`);
        
        // Remove from local state
        this.conversations = this.conversations.filter(c => c.id !== conversationId);
        delete this.messagesByConversation[conversationId];
        delete this.pagination[conversationId];
        
        // Stop listening
        if (this.echoChannels.has(conversationId)) {
          echo.leave(`conversation.${conversationId}`);
          this.echoChannels.delete(conversationId);
        }
        
        // Clear active if it was deleted
        if (this.activeConversationId === conversationId) {
          this.activeConversationId = null;
        }
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        throw error;
      }
    },

    async leaveGroup(conversationId: number) {
      try {
        await api.post(`/conversations/${conversationId}/leave`);
        
        // Remove from local state
        this.conversations = this.conversations.filter(c => c.id !== conversationId);
        delete this.messagesByConversation[conversationId];
        delete this.pagination[conversationId];
        
        // Stop listening
        if (this.echoChannels.has(conversationId)) {
          echo.leave(`conversation.${conversationId}`);
          this.echoChannels.delete(conversationId);
        }
        
        // Clear active if we left this group
        if (this.activeConversationId === conversationId) {
          this.activeConversationId = null;
        }
      } catch (error) {
        console.error('Failed to leave group:', error);
        throw error;
      }
    },

    async addMembersToGroup(conversationId: number, userIds: number[]) {
        const res = await api.post(`/conversations/${conversationId}/users`, { user_ids: userIds });
        const newUsers = res.data.users;
        
        // Local update (in case broadcast is slow or self-message is ignored)
        // Actually, broadcast excludes self, so we MUST update locally for the adder.
        const index = this.conversations.findIndex(c => c.id === conversationId);
            if (index !== -1) {
              const conv = this.conversations[index];
              if (conv.users) {
                const existingIds = new Set(conv.users.map((u: any) => u.id));
                const uniqueNewUsers = newUsers.filter((u: any) => !existingIds.has(u.id));
                
                if (uniqueNewUsers.length > 0) {
                     this.conversations[index] = {
                        ...conv,
                        users: [...conv.users, ...uniqueNewUsers]
                    };
                }
              }
            }
        return res.data;
    },

    // Notification handling
    showNotification(message: Message) {
      const conversation = this.conversations.find(c => c.id === message.conversation_id);
      if (!conversation) return;

      // Determine conversation name
      let conversationName = '';
      if (conversation.type === 'group') {
        conversationName = conversation.name || 'Group';
      } else {
        const otherUser = this.getOtherUser(conversation);
        conversationName = otherUser?.name || 'Chat';
      }

      // Get sender info
      const userStore = useUserStore();
      
      // Create notification payload
      const notification = {
        id: `msg-${message.id}-${Date.now()}`,
        conversationId: message.conversation_id,
        senderName: message.sender.name,
        avatar: message.sender.avatar,
        isOnline: userStore.isUserOnline(message.sender.id),
        message: message.message || this.getLastMessagePreview(message),
        conversationName,
      };

      // Trigger notification via global handler (set by ChatLayout)
      if ((window as any).__chatNotificationHandler) {
        (window as any).__chatNotificationHandler(notification);
      }

      // Play sound
      if ((window as any).__chatSoundHandler) {
        (window as any).__chatSoundHandler();
      }
    },
  },
});
