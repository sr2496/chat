import { defineStore } from "pinia";
import { api } from "../axios";
import { useUserStore } from "./user";

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
    messagesByConversation: {} as Record<number, Message[]>,
    pagination: {} as Record<
      number,
      {
        page: number;
        hasMore: boolean;
        loading: boolean;
      }
    >,
    activeConversationId: null as number | null,
    echoChannels: new Map<number, any>(),
    searchQuery: "",
    typingUsers: {} as Record<number, number[]>,
    firstUnreadByConversation: {} as Record<number, number | null>,
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

    getOtherUser: (state) => {
      const userStore = useUserStore();
      return (conversation: any) => {
        if (conversation.type !== "private") return null;
        const currentUserId = userStore.user?.id;
        return (
          conversation.users.find((u: any) => u.id !== currentUserId) || null
        );
      };
    },
  },

  actions: {
    /* ---------------- CONVERSATIONS ---------------- */

    async loadConversations() {
      const res = await api.get("/conversations");
      this.conversations = res.data.data;
    },

    setActiveConversation(conversationId: number) {
      this.activeConversationId = conversationId;

      const msgs = this.messagesByConversation[conversationId] || [];

      const firstUnread = msgs.find(
        (m) => !m.read_by_me && m.sender.id !== useUserStore().user?.id
      );

      this.firstUnreadByConversation[conversationId] = firstUnread
        ? firstUnread.id
        : null;

      // Reset unread count
      const conv = this.conversations.find((c) => c.id === conversationId);
      if (conv) conv.unread_count = 0;

      if (!this.messagesByConversation[conversationId]) {
        this.loadMessages(conversationId);
      }
    },

    /* ---------------- MESSAGES ---------------- */

    async loadMessages(conversationId: number, append = false) {
      if (!this.pagination[conversationId]) {
        this.pagination[conversationId] = {
          page: 1,
          hasMore: true,
          loading: false,
        };
      }

      const pager = this.pagination[conversationId];

      if (pager.loading || (!pager.hasMore && append)) return;

      if (!append) {
        pager.page = 1;
        pager.hasMore = true;
      } else {
        pager.loading = true;
        pager.page += 1;
      }

      try {
        const res = await api.get(`/messages/${conversationId}`, {
          params: { page: pager.page, per_page: 20 },
        });

        const msgs = res.data.data;
        const meta = res.data.meta;

        if (append) {
          this.messagesByConversation[conversationId] = [
            ...msgs,
            ...(this.messagesByConversation[conversationId] || []),
          ];
        } else {
          this.messagesByConversation[conversationId] = msgs;
        }

        pager.hasMore = meta.current_page < meta.last_page;
      } catch (e) {
        if (append) pager.page -= 1;
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

      // Update last message
      const conv = this.conversations.find((c) => c.id === convId);
      if (conv) {
        conv.last_message = {
          message: message.message,
          time: message.created_at,
        };

        // Move conversation to top
        this.conversations = [
          conv,
          ...this.conversations.filter((c) => c.id !== convId),
        ];
      }
    },

    /* ---------------- REALTIME (ECHO) ---------------- */

    startListening(conversationId: number) {
      if (this.echoChannels.has(conversationId)) return;

      const userStore = useUserStore();

      const channel = window.Echo.private(`conversation.${conversationId}`)
        .listen(".MessageSent", (e: { message: Message }) => {
          const msg = e.message;

          if (msg.sender.id !== userStore.user?.id) {
            this.pushMessage(msg);
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
            this.applyReactionUpdate(e.conversation_id, e.message_id, e.user_id, e.emoji);
          }
        );

      this.echoChannels.set(conversationId, channel);
    },

    stopAllListeners() {
      this.echoChannels.forEach((_, id) => {
        window.Echo.leave(`conversation.${id}`);
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

    async createGroupConversation(name: string, userIds: number[]) {
      const res = await api.post("groups", {
        name,
        user_ids: userIds,
      });

      const conversation = res.data.data;

      this.addConversationIfMissing(conversation);
      this.setActiveConversation(conversation.id);

      return conversation;
    },

    updateConversationLastMessage(message: Message) {
      const convId = message.conversation_id;

      const conv = this.conversations.find((c) => c.id === convId);
      if (!conv) return;

      conv.last_message = {
        message: this.getLastMessagePreview(message),
        time: message.created_at || new Date().toISOString(),
      };

      // Move conversation to top (WhatsApp behavior)
      const index = this.conversations.findIndex((c) => c.id === convId);
      if (index > 0) {
        const [item] = this.conversations.splice(index, 1);
        this.conversations.unshift(item);
      }
    },
    getLastMessagePreview(msg: Message): string {
      switch (msg.type) {
        case "image":
          return "📷 Photo";
        case "video":
          return "🎥 Video";
        case "file":
          return "📎 File";
        default:
          return msg.message || "";
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

      const msg = messages[index];
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
        { ...msg, reactions: newReactions },
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

      const msg = messages[index];
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
        { ...msg, reactions: newReactions },
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
  },
});
