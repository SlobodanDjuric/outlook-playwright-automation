import { expect } from "@playwright/test";

export class NewEmailCompose {
  constructor(page) {
    this.page = page;

    this.send = new SendButton(page);
    this.to = new ToField(page);
    this.subject = new SubjectField(page);
    this.body = new BodyField(page);
  }

  async openNewMail() {
    const newMailButton = this.page.getByRole("button", {
      name: /new mail|new email/i,
    });

    await newMailButton.waitFor({ state: "visible", timeout: 30_000 });
    await newMailButton.click();

    await expect(this.body.root()).toBeVisible({ timeout: 30_000 });
  }
}

class SendButton {
  constructor(page) {
    this.page = page;
  }

  button() {
    return this.page.getByRole("button", { name: /^send$/i });
  }

  async click() {
    await this.button().click();
  }
}

class ToField {
  constructor(page) {
    this.page = page;
  }

  well() {
    return this.page.locator("#recipient-well-label-to").locator("xpath=../..");
  }

  inputMaybe() {
    return this.well().locator('input[type="text"]').first();
  }

  async focus() {
    // klik u prazno desno od "To" (ne diramo dugme)
    await this.well().click({
      position: { x: 140, y: 20 },
      force: true,
    });

    // fallback ako postoji input
    const input = this.inputMaybe();
    if (await input.count()) {
      await input.click({ force: true }).catch(() => {});
    }
  }

  async add(email) {
    await this.focus();

    // Outlook ignoriše fill -> kucamo kao korisnik
    await this.page.keyboard.type(email, { delay: 30 });
    await this.page.keyboard.press("Enter");

    await expect(this.well().getByText(email, { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  }

  async addMany(emails) {
    for (const email of emails) {
      await this.add(email);
    }
  }
}

class SubjectField {
  constructor(page) {
    this.page = page;
  }

  input() {
    return this.page.getByPlaceholder(/add a subject/i);
  }

  async set(text) {
    await this.input().click();
    await this.input().fill(text);
  }
}

class BodyField {
  constructor(page) {
    this.page = page;
  }

  root() {
    return this.page.getByLabel(/message body/i);
  }

  async set(text) {
    await this.root().click();
    await this.page.keyboard.type(text, { delay: 10 });
  }
}
