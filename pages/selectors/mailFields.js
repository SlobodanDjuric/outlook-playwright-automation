// pages/selectors/mailFields.js

/**
 * MailFields
 * ----------
 * Centralized collection of Outlook Mail field selectors and ARIA label
 * patterns used by Mail Page Objects (e.g. NewEmailCompose).
 *
 * CSS selectors are stored as strings; ARIA label patterns as RegExp.
 */
export const MailFields = Object.freeze({
  // ── Recipient containers ──────────────────────────────────────────────────

  // Recipient row containers — Outlook uses dynamic IDs ending with _TO/_CC/_BCC
  RecipientContentEditable: 'div[contenteditable="true"]',
  CcContainer:  'div[id$="_CC"]',
  BccContainer: 'div[id$="_BCC"]',

  // ARIA label patterns for CC/BCC toggle buttons
  CcButtonLabel:  /^cc$/i,
  BccButtonLabel: /^bcc$/i,

  // ── Compose toolbar buttons ───────────────────────────────────────────────

  NewMailLabel:       /new mail|new email/i,
  SendLabel:          /^send$/i,
  DiscardLabel:       /^discard$/i,
  PopOutLabel:        /^pop out$/i,
  CloseLabel:         /close$/i,
  AttachFileLabel:    /^attach file$/i,
  BrowseComputerLabel:/browse this computer/i,

  // "More send options" dropdown (used by scheduleSend, setReadReceipt, setDeliveryReceipt)
  MoreSendOptionsLabel: /^more send options$/i,
  ScheduleSendLabel:    /^schedule send$/i,
  ReadReceiptLabel:     /read receipt/i,
  DeliveryReceiptLabel: /delivery receipt/i,

  // ── Format toolbar ────────────────────────────────────────────────────────

  FontComboboxSelector:     '[aria-label*="font" i][role="combobox"]',
  FontSizeComboboxSelector: '[aria-label*="size" i][role="combobox"]',
  FontLabel:     /font/i,
  FontSizeLabel: /font size/i,

  // ── Body / subject ────────────────────────────────────────────────────────

  SubjectPlaceholder: /add a subject/i,
  MessageBodyLabel:   /message body/i,

  // ── Importance buttons ────────────────────────────────────────────────────

  ImportanceHighLabel: /high importance/i,
  ImportanceLowLabel:  /low importance/i,

  // ── Dialog helpers ────────────────────────────────────────────────────────

  ScheduleSendPickerSelector: '[role="dialog"], [role="menu"], [role="listbox"]',
  OkLabel:   /^ok$/i,
  SaveLabel: /^save$/i,
});
