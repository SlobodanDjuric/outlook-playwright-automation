/**
 * MailContextActions
 * ------------------
 * Centralized list of available Outlook mail context menu actions.
 *
 * This object prevents:
 * - hardcoded strings in tests
 * - spelling inconsistencies
 * - duplication of action names
 *
 * Intended to be used together with MailContextMenu Page Object.
 *
 * Example:
 *   await contextMenu.applyActionToMail(subject, MailContextActions.Delete);
 */
export const MailContextActions = Object.freeze({
  // Reply actions
  Reply: "Reply",
  ReplyAll: "Reply all",
  Forward: "Forward",

  // Basic message management
  Delete: "Delete",
  Archive: "Archive",

  // Move operations
  Move: "Move",
  Copy: "Copy",

  // Message state actions
  MarkAsUnread: "Mark as unread",
  Pin: "Pin",
  Categorize: "Categorise", // UK spelling in Outlook UI
  Flag: "Flag",
  Snooze: "Snooze",

  // Rules & automation
  Rules: "Rules",

  // Safety & filtering
  Report: "Report",
  Block: "Block",
  Ignore: "Ignore",

  // Additional utilities
  Download: "Download",
  FindRelated: "Find related",
  View: "View",

  // Advanced submenu
  AdvancedActions: "Advanced actions",
});
