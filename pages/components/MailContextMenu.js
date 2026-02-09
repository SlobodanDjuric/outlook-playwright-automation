import { expect } from "@playwright/test";

export class MailContextMenu {
  constructor(page) {
    this.page = page;
  }

  /**
   * Otvori context menu za mail po subjectu
   */
  async openForSubject(subject) {
    const mailItem = this.page
      .getByRole("option", { name: new RegExp(subject, "i") })
      .first();

    await expect(mailItem).toBeVisible({ timeout: 30_000 });
    await mailItem.click({ button: "right" });
  }

  /**
   * Klik na opciju iz context menija (Delete, Flag, Archive, ...)
   */
  async selectOption(optionName) {
    const option = this.page.getByRole("menuitem", {
      name: new RegExp(optionName, "i"),
    });

    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
  }

  /**
   * Shortcut metoda (jedan poziv u testu)
   */
  async applyActionToMail(subject, action) {
    await this.openForSubject(subject);
    await this.selectOption(action);
  }
}