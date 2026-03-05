import { api } from '../axios';
import type { Conversation, Message, PaginationMeta, MessagePaginationMeta, User } from '../types/chat';

// Response wrappers
interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

interface MessagePaginatedResponse {
  data: Message[];
  meta: MessagePaginationMeta;
}

// Conversations
export async function fetchConversations(params: { limit?: number; after_id?: number | null }): Promise<PaginatedResponse<Conversation>> {
  const res = await api.get('/conversations', { params });
  return res.data;
}

export async function createPrivateConversation(userId: number): Promise<Conversation> {
  const res = await api.post('/private-conversations', { user_id: userId });
  return res.data.data;
}

export async function createGroupConversation(name: string, userIds: number[], avatar?: File): Promise<Conversation> {
  if (avatar) {
    const formData = new FormData();
    formData.append('name', name);
    userIds.forEach(id => formData.append('user_ids[]', id.toString()));
    formData.append('avatar', avatar);
    const res = await api.post('/groups', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  }
  const res = await api.post('/groups', { name, user_ids: userIds });
  return res.data.data;
}

export async function leaveGroup(conversationId: number): Promise<void> {
  await api.post(`/conversations/${conversationId}/leave`);
}

export async function deleteConversation(conversationId: number): Promise<void> {
  await api.delete(`/conversations/${conversationId}`);
}

export async function addMembersToGroup(conversationId: number, userIds: number[]): Promise<{ message: string; users: User[] }> {
  const res = await api.post(`/conversations/${conversationId}/users`, { user_ids: userIds });
  return res.data;
}

// Messages
export async function fetchMessages(conversationId: number, params: { limit?: number; before_id?: number | null }): Promise<MessagePaginatedResponse> {
  const res = await api.get(`/messages/${conversationId}`, { params });
  return res.data;
}

export async function sendTextMessage(
  conversationId: number,
  message: string,
  replyToMessageId?: number
): Promise<Message> {
  const payload: Record<string, unknown> = { message };
  if (replyToMessageId) {
    payload.reply_to_message_id = replyToMessageId;
  }
  const res = await api.post(`/messages/${conversationId}`, payload);
  return res.data.data;
}

export async function sendFileMessage(
  conversationId: number,
  file: File,
  options?: {
    type?: string;
    caption?: string;
    signal?: AbortSignal;
    onUploadProgress?: (progress: number) => void;
  }
): Promise<Message> {
  const form = new FormData();
  form.append('file', file);
  if (options?.type) form.append('type', options.type);
  if (options?.caption?.trim()) form.append('message', options.caption);

  const res = await api.post(`/messages/${conversationId}`, form, {
    signal: options?.signal,
    onUploadProgress: (e) => {
      if (!e.total || !options?.onUploadProgress) return;
      options.onUploadProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return res.data.data;
}

export async function markMessagesAsRead(conversationId: number, messageIds: number[]): Promise<void> {
  await api.post('/messages/read', {
    conversation_id: conversationId,
    message_ids: messageIds,
  });
}

export async function deleteMessage(messageId: number): Promise<void> {
  await api.delete(`/messages/${messageId}`);
}

// Reactions
export async function toggleReaction(messageId: number, emoji: string): Promise<void> {
  await api.post(`/messages/${messageId}/reactions`, { emoji });
}

// Users
export async function fetchUsers(params: { limit?: number; after_id?: number | null }): Promise<PaginatedResponse<User>> {
  const res = await api.get('/users', { params });
  return res.data;
}

// Auth
export async function fetchCurrentUser(): Promise<User> {
  const res = await api.get('/user');
  return res.data.data;
}

export async function login(email: string, password: string): Promise<{ user: User }> {
  const res = await api.post('/login', { email, password });
  return res.data;
}

export async function register(name: string, email: string, password: string): Promise<{ user: User }> {
  const res = await api.post('/register', { name, email, password });
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post('/logout');
}

export async function updateProfile(data: { name?: string; avatar?: File }): Promise<User> {
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.avatar) formData.append('avatar', data.avatar);
  const res = await api.post('/user/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
