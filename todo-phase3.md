# Phase 3 — Features

## Message Search, Soft Deletes, Message Editing
- [ ] Backend: Add `deleted_at` soft delete column to messages table + migration
- [ ] Backend: Message edit endpoint (PATCH /messages/{id}) with `edited_at` timestamp
- [ ] Backend: Message search endpoint (GET /messages/search?q=) with full-text search
- [ ] Frontend: Search UI in chat header (search bar + results overlay)
- [ ] Frontend: Edit message flow (long press / context menu -> edit -> inline editor)
- [ ] Frontend: Show "edited" label on edited messages
- [ ] Frontend: Show "deleted" placeholder for soft-deleted messages
- [ ] Update MessageContextMenu with Edit option

## Link Previews & Markdown Rendering
- [ ] Backend: Link preview metadata extraction (title, description, image, favicon)
- [ ] Backend: Cache link previews in DB or Redis
- [ ] Frontend: Install markdown renderer (e.g. markdown-it)
- [ ] Frontend: LinkPreview component (card with image, title, description)
- [ ] Frontend: Render markdown in text messages (bold, italic, code, links)
- [ ] Frontend: Auto-detect URLs in messages and fetch previews

## Offline Support & Optimistic Updates
- [ ] Frontend: Optimistic message sending (show message immediately, confirm on server response)
- [ ] Frontend: Retry failed messages (queue + retry button)
- [ ] Frontend: Cache conversations/messages in IndexedDB or localStorage
- [ ] Frontend: Show connection status indicator (online/offline/reconnecting)
- [ ] Frontend: Queue actions while offline, sync on reconnect

## User Blocking & Reporting
- [ ] Backend: Block/unblock user endpoints + `blocked_users` pivot table + migration
- [ ] Backend: Filter blocked users from conversations, messages, and search
- [ ] Backend: Report user endpoint + `reports` table + migration
- [ ] Frontend: Block/unblock from UserInfoOffcanvas (already has button, needs API)
- [ ] Frontend: Report user modal with reason selection
- [ ] Frontend: Hide messages from blocked users
