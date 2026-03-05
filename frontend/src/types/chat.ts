// Core domain types for the chat application

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  is_online: boolean;
  is_admin?: boolean;
  notification_sound?: boolean;
  notification_preview?: boolean;
  notification_muted_until?: string | null;
}

export interface MessageReply {
  id: number;
  sender_name: string;
  body: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  message: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';
  sender: User;
  created_at: string;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  reply_to?: MessageReply | null;
  reactions?: Record<string, number[]>;
  read_by_me: boolean;
  read_by_count: number;
  read_by: number[];
}

export interface LastMessage {
  message: string | null;
  type: string;
  time: string;
  file_name?: string | null;
}

export interface Conversation {
  id: number;
  type: 'private' | 'group';
  name: string | null;
  display_avatar: string | null;
  description?: string | null;
  created_at: string;
  users: ConversationUser[];
  unread_count: number;
  last_message?: LastMessage | null;
}

export interface ConversationUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  is_online: boolean;
  is_admin: boolean;
}

export interface PaginationMeta {
  has_more: boolean;
  next_cursor: number | null;
}

export interface MessagePaginationMeta {
  has_more: boolean;
  oldest_id: number | null;
}

export interface CursorPagination {
  nextCursor: number | null;
  hasMore: boolean;
  loading: boolean;
}

export interface MessagePagination {
  beforeId: number | null;
  hasMore: boolean;
  loading: boolean;
}

export interface ChatNotification {
  id: string;
  conversationId: number;
  senderName: string;
  avatar: string | null;
  isOnline: boolean;
  message: string;
  conversationName: string;
}

export interface QueuedFile {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'file' | 'audio';
  name: string;
  size: number;
  caption?: string;
}

export interface UploadingMessage {
  tempId: string;
  file: File;
  preview?: string;
  type: string;
  progress: number;
  controller: AbortController;
}
