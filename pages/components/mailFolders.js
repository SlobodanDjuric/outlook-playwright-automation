import { expect } from "@playwright/test";

export class MailFolders {
  constructor(page) {
    this.page = page;
  }

  async waitUntilReady() {
    const newEmail = this.page.getByRole("button", { name: /new email/i });
    const folderTree = this.page.getByRole("tree").first();

    await Promise.race([
      newEmail.waitFor({ state: "visible", timeout: 45_000 }).catch(() => {}),
      folderTree.waitFor({ state: "visible", timeout: 45_000 }).catch(() => {}),
    ]);

    const ok =
      (await newEmail.isVisible().catch(() => false)) ||
      (await folderTree.isVisible().catch(() => false));

    if (!ok) {
      throw new Error("Outlook UI not ready (Mail or folder tree not visible).");
    }
  }

  async open(folderName) {
    await this.waitUntilReady();

    const nameRx = new RegExp(escapeRegExp(folderName), "i");

    const tree = this.page.getByRole("tree").first();
    const items = tree.getByRole("treeitem", { name: nameRx });

    const candidates = (await items.count())
      ? items
      : this.page.getByRole("treeitem", { name: nameRx });

    const count = await candidates.count();
    if (!count) throw new Error(`Folder not found: ${folderName}`);

    let toClick = candidates.nth(0);
    for (let i = 0; i < count; i++) {
      const el = candidates.nth(i);
      const selected =
        (await el.getAttribute("aria-selected"))?.toLowerCase() === "true";
      if (!selected) {
        toClick = el;
        break;
      }
    }

    await toClick.scrollIntoViewIfNeeded();
    await expect(toClick).toBeVisible({ timeout: 30_000 });
    await toClick.click();

    await expect
      .poll(
        async () => {
          const c = await candidates.count();
          for (let i = 0; i < c; i++) {
            const el = candidates.nth(i);
            const selected =
              (await el.getAttribute("aria-selected"))?.toLowerCase() === "true";
            if (selected) return true;
          }
          return false;
        },
        { timeout: 30_000 }
      )
      .toBe(true);

    // mali UI stabilizator (BEZ networkidle)
    await this.page.waitForTimeout(400);
  }

  // ============================================================
  // 🔥 UNIVERZALNO: selektuj mail po subjectu u otvorenom folderu
  // ============================================================
  async selectMessageBySubject(subject, { timeout = 60_000 } = {}) {
    const list = this.page.getByRole("listbox", { name: /message list/i });
    await expect(list).toBeVisible({ timeout: 30_000 });

    const endAt = Date.now() + timeout;

    while (Date.now() < endAt) {
      const options = list.locator('[role="option"]');
      const count = await options.count();

      for (let i = 0; i < count; i++) {
        const row = options.nth(i);
        const text = (await row.innerText().catch(() => "")) || "";

        if (text.toLowerCase().includes(subject.toLowerCase())) {
          await row.scrollIntoViewIfNeeded();
          await row.click({ force: true, position: { x: 60, y: 40 } });

          await expect(row).toHaveAttribute("aria-selected", "true", {
            timeout: 30_000,
          });

          return row;
        }
      }

      // virtualized lista → skroluj dalje
      await list.focus();
      await this.page.keyboard.press("PageDown");
      await this.page.waitForTimeout(250);
    }

    throw new Error(`Message with subject "${subject}" not found.`);
  }

  // ============================================================
  // 🔁 Helper: otvori folder + selektuj mail po subjectu
  // ============================================================
  async openAndSelectBySubject(folderName, subject, opts) {
    await this.open(folderName);
    return this.selectMessageBySubject(subject, opts);
  }
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// import { expect } from "@playwright/test";

// export class MailFolders {
//   constructor(page) {
//     this.page = page;
//   }

//   async waitUntilReady() {
//     const newEmail = this.page.getByRole("button", { name: /new email/i });
//     const folderTree = this.page.getByRole("tree").first();
  
//     await Promise.race([
//       newEmail.waitFor({ state: "visible", timeout: 45_000 }).catch(() => {}),
//       folderTree.waitFor({ state: "visible", timeout: 45_000 }).catch(() => {}),
//     ]);
  
//     // ako ni jedno ni drugo nije vidljivo, onda stvarno UI nije spreman
//     const ok = (await newEmail.isVisible().catch(() => false)) || (await folderTree.isVisible().catch(() => false));
//     if (!ok) throw new Error("Outlook UI not ready (neither Mail nor folder tree is visible).");
//   }

//   async open(folderName) {
//     await this.waitUntilReady();

//     const nameRx = new RegExp(escapeRegExp(folderName), "i");

//     // Fokusiramo se na folder tree (najbliže “pravim” folderima)
//     const tree = this.page.getByRole("tree").first();
//     const items = tree.getByRole("treeitem", { name: nameRx });

//     // Ako nema u tree-u, fallback globalno (Outlook zna da varira)
//     const candidates = (await items.count())
//       ? items
//       : this.page.getByRole("treeitem", { name: nameRx });

//     const count = await candidates.count();
//     if (!count) throw new Error(`Folder not found: ${folderName}`);

//     // 1) Izaberi instancu koja NIJE selektovana (da klik napravi promenu)
//     let toClick = candidates.nth(0);
//     for (let i = 0; i < count; i++) {
//       const el = candidates.nth(i);
//       const selected =
//         (await el.getAttribute("aria-selected"))?.toLowerCase() === "true";
//       if (!selected) {
//         toClick = el;
//         break;
//       }
//     }

//     await toClick.scrollIntoViewIfNeeded();
//     await expect(toClick).toBeVisible({ timeout: 30_000 });
//     await toClick.click();

//     // 2) WAIT: čekaj da BILO KOJA instanca tog foldera postane selektovana
//     await expect
//       .poll(
//         async () => {
//           const c = await candidates.count();
//           for (let i = 0; i < c; i++) {
//             const el = candidates.nth(i);
//             const selected =
//               (await el.getAttribute("aria-selected"))?.toLowerCase() ===
//               "true";
//             if (selected) return true;
//           }
//           return false;
//         },
//         { timeout: 30_000 }
//       )
//       .toBe(true);
//       await this.page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
//   }
// }

// function escapeRegExp(str) {
//   return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }
