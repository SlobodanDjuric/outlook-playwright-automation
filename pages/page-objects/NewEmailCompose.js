import { expect } from '@playwright/test';
import { MailFields } from '../selectors/mailFields.js';

// Internal helpers: FormatToolbar, SendButton, RecipientWellField, SubjectField, BodyField

/**
 * NewEmailCompose
 * ----------------
 * Page Object representing the Outlook "New Mail" compose panel.
 *
 * It provides a clean high-level API for:
 * - opening a new email
 * - interacting with To / Cc / Bcc fields
 * - setting Subject
 * - typing Body
 * - clicking Send
 *
 * Tests should interact only with this abstraction
 * instead of dealing directly with raw locators.
 */
export class NewEmailCompose {
  constructor(page) {
    this.page = page;

    // Send button abstraction
    this.send = new SendButton(page);

    // Recipient fields (TO is always visible, CC/BCC may need to be expanded)
    this.to = new RecipientWellField(page, 'TO');
    this.cc = new RecipientWellField(page, 'CC', () => this.ensureCcVisible());
    this.bcc = new RecipientWellField(page, 'BCC', () => this.ensureBccVisible());

    // Subject and Body fields
    this.subject = new SubjectField(page);
    this.body = new BodyField(page);
  }

  /**
   * Opens a new email and waits until the body editor is visible.
   */
  async openNewMail() {
    const newMailButton = this.page.getByRole('button', {
      name: MailFields.NewMailLabel,
    });

    await newMailButton.waitFor({ state: 'visible', timeout: 45_000 });
    await newMailButton.click();

    await expect(this.body.root()).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Attaches a file to the email via the "Attach" toolbar button.
   * @param {string} filePath - absolute path to the file to attach
   */
  async attach(filePath) {
    const attachBtn = this.page.getByRole('button', { name: MailFields.AttachFileLabel }).first();
    await expect(attachBtn).toBeVisible({ timeout: 15_000 });
    await attachBtn.click();
    await this.page.waitForTimeout(300);

    const browseItem = this.page.getByRole('menuitem', { name: MailFields.BrowseComputerLabel }).first();
    await expect(browseItem).toBeVisible({ timeout: 8_000 });

    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      browseItem.click(),
    ]);
    await fileChooser.setFiles(filePath);
    await this.page.waitForTimeout(500);
  }

  /**
   * Sets message importance via the toolbar icon.
   * @param {'High' | 'Low'} level
   */
  async setImportance(level) {
    const name = level === 'High' ? MailFields.ImportanceHighLabel : MailFields.ImportanceLowLabel;
    const btn = this.page.getByRole('button', { name }).first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Format text toolbar helpers.
   * Call after clicking into the body so the toolbar is active.
   */
  get format() {
    return new FormatToolbar(this.page);
  }

  /**
   * Asserts that the schedule-send picker (dialog, menu, or date listbox) is
   * visible after calling scheduleSend().
   */
  async verifyScheduleSendPickerVisible() {
    await expect(
      this.page.locator(MailFields.ScheduleSendPickerSelector).first()
    ).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Opens the "Schedule send" picker (dropdown next to Send).
   */
  async scheduleSend() {
    const moreBtn = this.page.getByRole('button', { name: MailFields.MoreSendOptionsLabel }).first();
    await expect(moreBtn).toBeVisible({ timeout: 15_000 });
    await moreBtn.click();
    await this.page.waitForTimeout(300);

    const scheduleItem = this.page.getByRole('menuitem', { name: MailFields.ScheduleSendLabel }).first();
    await expect(scheduleItem).toBeVisible({ timeout: 8_000 });
    await scheduleItem.click();
    await this.page.waitForTimeout(400);
  }

  /**
   * Opens the "More send options" menu and enables Read receipt.
   * Returns false if the option is not available (Outlook.com free accounts).
   */
  async setReadReceipt() {
    return this._toggleSendOption(MailFields.ReadReceiptLabel);
  }

  /**
   * Opens the "More send options" menu and enables Delivery receipt.
   * Returns false if the option is not available (Outlook.com free accounts).
   */
  async setDeliveryReceipt() {
    return this._toggleSendOption(MailFields.DeliveryReceiptLabel);
  }

  async _toggleSendOption(nameRegex) {
    const moreBtn = this.page.getByRole('button', { name: MailFields.MoreSendOptionsLabel }).first();
    await expect(moreBtn).toBeVisible({ timeout: 15_000 });
    await moreBtn.click();
    await this.page.waitForTimeout(300);

    const item = this.page.getByRole('menuitem', { name: nameRegex }).first();
    if (!(await item.isVisible({ timeout: 3_000 }).catch(() => false))) {
      await this.page.keyboard.press('Escape');
      return false;
    }
    await item.click();
    await this.page.waitForTimeout(300);
    return true;
  }

  /**
   * Discards the draft without saving.
   */
  async discardDraft() {
    const discardBtn = this.page.getByRole('button', { name: MailFields.DiscardLabel }).first();
    await expect(discardBtn).toBeVisible({ timeout: 15_000 });
    await discardBtn.click();
    await this.page.waitForTimeout(500);

    const okBtn = this.page.getByRole('button', { name: MailFields.OkLabel }).first();
    if (await okBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await okBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Opens the compose window as a pop-out in a new browser window.
   * Returns the new Playwright Page, or null if not available.
   */
  async popOutCompose() {
    const btn = this.page.getByRole('button', { name: MailFields.PopOutLabel }).first();
    if (!(await btn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return null;
    }
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      btn.click(),
    ]);
    await newPage.waitForLoadState('load', { timeout: 30_000 });
    return newPage;
  }

  /**
   * Closes the compose panel.
   * Handles the optional "Save changes?" dialog.
   */
  async close() {
    const closeBtn = this.page.getByRole('button', { name: MailFields.CloseLabel }).first();
    await expect(closeBtn).toBeVisible({ timeout: 15_000 });
    await closeBtn.click();

    await this.page.waitForTimeout(1_500);
    const saveBtn = this.page.getByRole('button', { name: MailFields.SaveLabel }).first();
    if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await saveBtn.click();
    }
    await this.page.waitForTimeout(2_000);
  }

  /**
   * Asserts that the message body is visible in the given pop-out page.
   * Pass the Page returned by popOutCompose().
   * @param {import('@playwright/test').Page} popOutPage
   */
  async verifyPopOutBodyVisible(popOutPage) {
    await expect(popOutPage.getByLabel(MailFields.MessageBodyLabel)).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Asserts that an attached file with the given filename appears in the compose form.
   * @param {string} filename - partial match, e.g. 'my-file.txt'
   */
  async verifyAttachment(filename) {
    await expect(
      this.page.getByText(filename, { exact: false }).first()
    ).toBeVisible({ timeout: 15_000 });
  }

  async ensureCcVisible() {
    const alreadyVisible = await this.page.locator(MailFields.CcContainer).first().isVisible().catch(() => false);
    if (alreadyVisible) return;

    const ccBtn = this.page.getByRole('button', { name: MailFields.CcButtonLabel }).first();
    await expect(ccBtn).toBeVisible({ timeout: 10_000 });
    await ccBtn.click();
    await expect(this.page.locator(MailFields.CcContainer).first()).toBeVisible({ timeout: 10_000 });
  }

  async ensureBccVisible() {
    const alreadyVisible = await this.page.locator(MailFields.BccContainer).first().isVisible().catch(() => false);
    if (alreadyVisible) return;

    const bccBtn = this.page.getByRole('button', { name: MailFields.BccButtonLabel }).first();
    await expect(bccBtn).toBeVisible({ timeout: 10_000 });
    await bccBtn.click();
    await expect(this.page.locator(MailFields.BccContainer).first()).toBeVisible({ timeout: 10_000 });
  }
}


// ============================================================================
// Internal helper classes
// ============================================================================

/**
 * FormatToolbar
 * -------------
 * Helpers for the rich-text format toolbar inside the compose body.
 * All methods assume focus is already in the body editor.
 */
class FormatToolbar {
  constructor(page) {
    this.page = page;
  }

  async bold() {
    await this.page.keyboard.press(process.platform === 'darwin' ? 'Meta+B' : 'Control+B');
  }

  async italic() {
    await this.page.keyboard.press(process.platform === 'darwin' ? 'Meta+I' : 'Control+I');
  }

  async underline() {
    await this.page.keyboard.press(process.platform === 'darwin' ? 'Meta+U' : 'Control+U');
  }

  /** @param {string} fontName - e.g. 'Arial', 'Calibri' */
  async setFont(fontName) {
    const fontDropdown = this.page
      .getByRole('combobox', { name: MailFields.FontLabel })
      .or(this.page.locator(MailFields.FontComboboxSelector))
      .first();
    await expect(fontDropdown).toBeVisible({ timeout: 10_000 });
    await fontDropdown.click();
    await this.page.waitForTimeout(200);
    await fontDropdown.fill(fontName);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(200);
  }

  /** @param {string|number} size - e.g. '12', 14 */
  async setFontSize(size) {
    const sizeDropdown = this.page
      .getByRole('combobox', { name: MailFields.FontSizeLabel })
      .or(this.page.locator(MailFields.FontSizeComboboxSelector))
      .first();
    await expect(sizeDropdown).toBeVisible({ timeout: 10_000 });
    await sizeDropdown.click();
    await this.page.waitForTimeout(200);
    await sizeDropdown.fill(String(size));
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(200);
  }
}

// ----------------------------------------------------------------------------

/**
 * SendButton
 * ----------
 * Encapsulates interaction with the "Send" button.
 */
class SendButton {
  constructor(page) {
    this.page = page;
  }

  button() {
    return this.page.getByRole('button', { name: MailFields.SendLabel }).first();
  }

  async click() {
    const btn = this.button();
    await expect(btn).toBeVisible({ timeout: 30_000 });
    await btn.click();
  }
}

// ----------------------------------------------------------------------------

/**
 * RecipientWellField
 * ------------------
 * Represents a single recipient row (TO / CC / BCC).
 * Outlook uses dynamic containers: div[id$="_TO"] / "_CC" / "_BCC"
 */
class RecipientWellField {
  constructor(page, kind /* "TO" | "CC" | "BCC" */, ensureVisibleFn = null) {
    this.page = page;
    this.kind = kind;
    this.ensureVisibleFn = ensureVisibleFn;
  }

  container() {
    return this.page.locator(`div[id$="_${this.kind}"]`).first(); // dynamic — uses this.kind ("TO"/"CC"/"BCC")
  }

  editor() {
    return this.container().locator(MailFields.RecipientContentEditable).first();
  }

  async ensureVisible() {
    if (this.ensureVisibleFn) await this.ensureVisibleFn();
  }

  async focus() {
    await this.ensureVisible();

    const container = this.container();
    const editor = this.editor();

    await container.waitFor({ state: 'visible', timeout: 15_000 });
    await editor.waitFor({ state: 'visible', timeout: 15_000 });

    for (let i = 0; i < 4; i++) {
      await editor.click({ force: true });

      const focusedInRow = await this.page
        .evaluate((suffix) => {
          const active = document.activeElement;
          return !!active?.closest(`div[id$="_${suffix}"]`);
        }, this.kind)
        .catch(() => false);

      if (focusedInRow) return;
      await this.page.waitForTimeout(150);
    }

    throw new Error(`Could not focus recipient editor for "${this.kind}". Focus stayed in another row.`);
  }

  async add(email) {
    await this.focus();
    await this.page.keyboard.type(email, { delay: 25 });
    await this.page.keyboard.press('Enter');
  }

  async addMany(emails) {
    for (const email of emails) {
      await this.add(email);
    }
  }
}

// ----------------------------------------------------------------------------

/**
 * SubjectField
 * ------------
 * Represents the subject input field.
 */
class SubjectField {
  constructor(page) {
    this.page = page;
  }

  input() {
    return this.page.getByPlaceholder(MailFields.SubjectPlaceholder);
  }

  async set(text) {
    const el = this.input();
    await expect(el).toBeVisible({ timeout: 30_000 });
    await el.click();
    await el.fill(text);
  }
}

// ----------------------------------------------------------------------------

/**
 * BodyField
 * ---------
 * Represents the main message editor (rich text area).
 */
class BodyField {
  constructor(page) {
    this.page = page;
  }

  root() {
    return this.page.getByLabel(MailFields.MessageBodyLabel);
  }

  async set(text) {
    const body = this.root();
    await expect(body).toBeVisible({ timeout: 30_000 });
    await body.click();
    await this.page.keyboard.type(text, { delay: 10 });
  }

  /** Asserts the body editor is hidden (compose form was closed). */
  async verifyHidden() {
    await expect(this.root()).toBeHidden({ timeout: 10_000 });
  }

  /** Clicks into the body editor and selects all text. */
  async selectAll() {
    const body = this.root();
    await body.click();
    const key = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';
    await body.press(key);
  }
}
