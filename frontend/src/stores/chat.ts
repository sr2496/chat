import { defineStore } from "pinia";
import { useUserStore } from "./user";
import { echo } from "../echo";
import mitt from "mitt";
import type {
  Message,
  Conversation,
  ConversationUser,
  User,
  ChatNotification,
  CursorPagination,
  MessagePagination,
} from "../types/chat";
import * as chatApi from "../services/chatApi";

type ChatEvents = {
  notification: ChatNotification;
  sound: void;
};

export const chatEventBus = mitt<ChatEvents>();

export const useChatStore = defineStore("chat", {
  state: () => ({
    conversations: [] as Conversation[],
    conversationPagination: {
      nextCursor: null,
      hasMore: true,
      loading: false,
    } as CursorPagination,
    users: [] as User[],
    usersPagination: {
      nextCursor: null,
      hasMore: true,
      loading: false,
    } as CursorPagination,
    messagesByConversation: {} as Record<number, Message[]>,
    pagination: {} as Record<number, MessagePagination>,
    activeConversationId: null as number | null,
    echoChannels: new Map<number, any>(),
    searchQuery: "",
    typingUsers: {} as Record<number, number[]>,
    mutedConversations: [] as number[],
    _typingTimeouts: new Map<string, ReturnType<typeof setTimeout>>(),
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

      const typingUserList = conv.users.filter(
        (u) => typers.includes(u.id) && u.id !== currentUserId
      );

      if (typingUserList.length === 0) return "";

      // 👇 Private chat (1-to-1)
      if (conv.users.length === 2) {
        return "Typing...";
      }

      // 👇 Group chat
      const names = typingUserList.map((u) => u.name);

      if (names.length === 1) return `${names[0]} is typing...`;
      if (names.length === 2)
        return `${names[0]} and ${names[1]} are typing...`;

      return "Several people are typing...";
    },

    getOtherUser: (_state) => {
      const userStore = useUserStore();
      return (conversation: Conversation): ConversationUser | null => {
        if (conversation.type !== "private") return null;
        const currentUserId = userStore.user?.id;
        return (
          conversation.users.find((u) => u.id !== currentUserId) || null
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
      if (this.conversationPagination.loading) return;
      if (loadMore && !this.conversationPagination.hasMore) return;

      this.conversationPagination.loading = true;

      try {
        const res = await chatApi.fetchConversations({
          limit: 20,
          after_id: loadMore ? this.conversationPagination.nextCursor : null,
        });

        if (loadMore) {
          this.conversations = [...this.conversations, ...res.data];
        } else {
          this.conversations = res.data;
        }

        this.conversationPagination.hasMore = res.meta?.has_more ?? false;
        this.conversationPagination.nextCursor = res.meta?.next_cursor ?? null;
      } finally {
        this.conversationPagination.loading = false;
      }
    },

    async loadMoreConversations() {
      await this.loadConversations(true);
    },

    /* ---------------- USERS ---------------- */

    async loadUsers(loadMore = false) {
      if (!loadMore) {
        this.users = [];
        this.usersPagination.nextCursor = null;
        this.usersPagination.hasMore = true;
      }

      if (this.usersPagination.loading || (loadMore && !this.usersPagination.hasMore)) {
        return;
      }

      this.usersPagination.loading = true;

      try {
        const res = await chatApi.fetchUsers({
          limit: 20,
          after_id: this.usersPagination.nextCursor,
        });

        if (loadMore) {
          this.users = [...this.users, ...res.data];
        } else {
          this.users = res.data;
        }

        this.usersPagination.hasMore = res.meta?.has_more ?? false;
        this.usersPagination.nextCursor = res.meta?.next_cursor ?? null;
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

      let perPage = 50;

      const conversation = this.conversations.find(
        (c) => c.id === conversationId
      );
      if (conversation && conversation.unread_count) {
        const needed = conversation.unread_count + 20;
        perPage = Math.max(perPage, needed);
      }

      try {
        const res = await chatApi.fetchMessages(conversationId, {
          limit: perPage,
          before_id: loadMore ? pager.beforeId : null,
        });

        if (loadMore) {
          this.messagesByConversation[conversationId] = [
            ...res.data,
            ...(this.messagesByConversation[conversationId] || []),
          ];
        } else {
          this.messagesByConversation[conversationId] = res.data;
        }

        pager.beforeId = res.meta.oldest_id ?? pager.beforeId;
        pager.hasMore = res.meta.has_more;
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
            .listen('.UserAddedToConversation', (e: { conversation: Conversation }) => {
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

            // auto-remove after 2s, tracking the timeout for cleanup
            const key = `${conversationId}-${e.user_id}`;
            const existing = this._typingTimeouts.get(key);
            if (existing) clearTimeout(existing);
            this._typingTimeouts.set(key, setTimeout(() => {
              this.removeUserTyping(conversationId, e.user_id);
              this._typingTimeouts.delete(key);
            }, 2000));
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

            msgs.forEach((m) => {
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
                const updatedUsers = conv.users.filter((u) => u.id !== e.userId);
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
          (e: { conversationId: number; users: ConversationUser[] }) => {
            const index = this.conversations.findIndex(c => c.id === e.conversationId);
            if (index !== -1) {
              const conv = this.conversations[index];
              if (conv.users) {
                const existingIds = new Set(conv.users.map((u) => u.id));
                const uniqueNewUsers = e.users.filter((u) => !existingIds.has(u.id));
                
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

      // Clear all tracked typing timeouts
      this._typingTimeouts.forEach((timeout) => clearTimeout(timeout));
      this._typingTimeouts.clear();
    },

    addConversationIfMissing(conversation: Conversation) {
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
      const conversation = await chatApi.createPrivateConversation(userId);

      this.addConversationIfMissing(conversation);
      this.setActiveConversation(conversation.id);

      return conversation;
    },

    async createGroupConversation(name: string, userIds: number[], avatar?: File) {
      const conversation = await chatApi.createGroupConversation(name, userIds, avatar);

      this.addConversationIfMissing(conversation);
      this.setActiveConversation(conversation.id);
      return conversation;
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
          return `📎 ${msg.file_name || "File"}`;
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
        await chatApi.toggleReaction(messageId, emoji);
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
        await chatApi.deleteConversation(conversationId);
        
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
        await chatApi.leaveGroup(conversationId);
        
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
        const res = await chatApi.addMembersToGroup(conversationId, userIds);
        const newUsers = res.users;

        const index = this.conversations.findIndex(c => c.id === conversationId);
        if (index !== -1) {
          const conv = this.conversations[index];
          if (conv.users) {
            const existingIds = new Set(conv.users.map((u) => u.id));
            const uniqueNewUsers = newUsers.filter((u) => !existingIds.has(u.id));

            if (uniqueNewUsers.length > 0) {
              this.conversations[index] = {
                ...conv,
                users: [...conv.users, ...uniqueNewUsers] as ConversationUser[],
              };
            }
          }
        }
        return res;
    },

    showNotification(message: Message) {
      const conversation = this.conversations.find(c => c.id === message.conversation_id);
      if (!conversation) return;

      let conversationName = '';
      if (conversation.type === 'group') {
        conversationName = conversation.name || 'Group';
      } else {
        const otherUser = this.getOtherUser(conversation);
        conversationName = otherUser?.name || 'Chat';
      }

      const userStore = useUserStore();

      const notification: ChatNotification = {
        id: `msg-${message.id}-${Date.now()}`,
        conversationId: message.conversation_id,
        senderName: message.sender.name,
        avatar: message.sender.avatar,
        isOnline: userStore.isUserOnline(message.sender.id),
        message: message.message || this.getLastMessagePreview(message),
        conversationName,
      };

      chatEventBus.emit('notification', notification);
      chatEventBus.emit('sound');
    },
  },
});
