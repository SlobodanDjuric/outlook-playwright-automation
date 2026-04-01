/**
 * Folders
 * -------
 * Centralized definition of standard Outlook folder names.
 *
 * This constant object is used across tests to avoid:
 * - hardcoded string literals
 * - typos
 * - inconsistent folder naming
 *
 * Object.freeze ensures folder names cannot be modified at runtime.
 */
export const Folders = Object.freeze({
  Inbox: 'Inbox',
  Drafts: 'Drafts',
  SentItems: 'Sent Items',
  DeletedItems: 'Deleted Items',
  JunkEmail: 'Junk Email',
  Archive: 'Archive',
  Outbox: 'Outbox',
  ConversationHistory: 'Conversation History',
  Notes: 'Notes',
});
