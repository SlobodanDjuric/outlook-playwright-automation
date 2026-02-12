import { expect } from "@playwright/test";

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
    this.to = new RecipientWellField(page, "TO");
    this.cc = new RecipientWellField(page, "CC", () => this.ensureCcVisible());
    this.bcc = new RecipientWellField(page, "BCC", () =>
      this.ensureBccVisible()
    );

    // Subject and Body fields
    this.subject = new SubjectField(page);
    this.body = new BodyField(page);
  }

  /**
   * Opens a new email and waits until the body editor is visible.
   */
  async openNewMail() {
    const newMailButton = this.page.getByRole("button", {
      name: /new mail|new email/i,
    });

    await newMailButton.waitFor({ state: "visible", timeout: 45_000 });
    await newMailButton.click();

    await expect(this.body.root()).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Ensures that the CC row is visible.
   * If not, clicks the CC toggle button.
   */
  async ensureCcVisible() {
    const ccBtn = this.page.getByRole("button", { name: /^cc$/i }).first();

    const alreadyVisible = await this.page
      .locator('div[id$="_CC"]')
      .first()
      .isVisible()
      .catch(() => false);

    if (alreadyVisible) return;

    await expect(ccBtn).toBeVisible({ timeout: 10_000 });
    await ccBtn.click();

    await expect(this.page.locator('div[id$="_CC"]').first()).toBeVisible({
      timeout: 10_000,
    });
  }

  /**
   * Ensures that the BCC row is visible.
   * If not, clicks the BCC toggle button.
   */
  async ensureBccVisible() {
    const bccBtn = this.page.getByRole("button", { name: /^bcc$/i }).first();

    const alreadyVisible = await this.page
      .locator('div[id$="_BCC"]')
      .first()
      .isVisible()
      .catch(() => false);

    if (alreadyVisible) return;

    await expect(bccBtn).toBeVisible({ timeout: 10_000 });
    await bccBtn.click();

    await expect(this.page.locator('div[id$="_BCC"]').first()).toBeVisible({
      timeout: 10_000,
    });
  }
}

/**
 * SendButton
 * ----------
 * Encapsulates interaction with the "Send" button.
 * Separated for clarity and possible future extension
 * (e.g. waiting for toast confirmation).
 */
class SendButton {
  constructor(page) {
    this.page = page;
  }

  button() {
    return this.page.getByRole("button", { name: /^send$/i }).first();
  }

  async click() {
    const btn = this.button();
    await expect(btn).toBeVisible({ timeout: 30_000 });
    await btn.click();
  }
}

/**
 * RecipientWellField
 * -------------------
 * Represents a single recipient row (TO / CC / BCC).
 *
 * Outlook uses dynamic containers:
 *   div[id$="_TO"] / "_CC" / "_BCC"
 *
 * Inside each container, there is a contenteditable div
 * where the actual email text is typed.
 *
 * Explicit focus verification is required because Outlook
 * may keep focus in a different recipient row.
 */
class RecipientWellField {
  constructor(page, kind /* "TO" | "CC" | "BCC" */, ensureVisibleFn = null) {
    this.page = page;
    this.kind = kind;
    this.ensureVisibleFn = ensureVisibleFn;
  }

  container() {
    return this.page.locator(`div[id$="_${this.kind}"]`).first();
  }

  editor() {
    return this.container().locator('div[contenteditable="true"]').first();
  }

  async ensureVisible() {
    if (this.ensureVisibleFn) await this.ensureVisibleFn();
  }

  /**
   * Focuses the correct recipient editor and verifies
   * that document.activeElement belongs to the expected row.
   */
  async focus() {
    await this.ensureVisible();

    const container = this.container();
    const editor = this.editor();

    await container.waitFor({ state: "visible", timeout: 15_000 });
    await editor.waitFor({ state: "visible", timeout: 15_000 });

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

    throw new Error(
      `Could not focus recipient editor for "${this.kind}". Focus stayed in another row.`
    );
  }

  /**
   * Adds a single recipient and confirms with Enter.
   */
  async add(email) {
    await this.focus();
    await this.page.keyboard.type(email, { delay: 25 });
    await this.page.keyboard.press("Enter");
  }

  /**
   * Adds multiple recipients sequentially.
   */
  async addMany(emails) {
    for (const email of emails) {
      await this.add(email);
    }
  }
}

/**
 * SubjectField
 * ------------
 * Represents the subject input field.
 * Located using its placeholder text.
 */
class SubjectField {
  constructor(page) {
    this.page = page;
  }

  input() {
    return this.page.getByPlaceholder(/add a subject/i);
  }

  async set(text) {
    const el = this.input();
    await expect(el).toBeVisible({ timeout: 30_000 });
    await el.click();
    await el.fill(text);
  }
}

/**
 * BodyField
 * ---------
 * Represents the main message editor (rich text area).
 * Located via aria-label "Message body".
 */
class BodyField {
  constructor(page) {
    this.page = page;
  }

  root() {
    return this.page.getByLabel(/message body/i);
  }

  async set(text) {
    const body = this.root();
    await expect(body).toBeVisible({ timeout: 30_000 });
    await body.click();
    await this.page.keyboard.type(text, { delay: 10 });
  }
}
