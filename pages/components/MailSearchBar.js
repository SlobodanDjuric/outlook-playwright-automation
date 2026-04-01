import { expect } from '@playwright/test';

/**
 * MailSearchBar
 * -------------
 * Page Object for the Outlook search bar (top of the Mail UI).
 *
 * Responsibilities:
 * - Typing a search query and submitting it
 * - Filtering results by scope (All, From, Subject, Has attachment, etc.)
 * - Clearing an active search
 * - Asserting that results / no-results states are correct
 *
 * Outlook Web's search input is identified by [role="searchbox"] or
 * input elements with aria-label/placeholder containing "search".
 * After submitting, results appear in the same message-list listbox.
 */
export class MailSearchBar {
  constructor(page) {
    this.page = page;
  }

  // -------------------------------------------------------------------------
  // element locators
  // -------------------------------------------------------------------------

  /**
   * The search input field.
   */
  input() {
    // Outlook Web renders the search box as role="combobox" (not "searchbox").
    return this.page
      .getByRole('combobox', { name: /search/i })
      .or(this.page.getByRole('searchbox'))
      .or(this.page.locator('input[aria-label*="search" i]'))
      .or(this.page.locator('input[placeholder*="search" i]'))
      .first();
  }

  /**
   * The "Clear search" / close button that appears while a search is active.
   */
  clearButton() {
    return this.page
      .getByRole('button', { name: /clear search|close search|cancel search|exit search/i })
      .or(this.page.locator('[aria-label*="clear" i][aria-label*="search" i]'))
      .first();
  }

  /**
   * The message-list results listbox.
   */
  resultsList() {
    return this.page.getByRole('listbox', { name: /message list/i });
  }

  // -------------------------------------------------------------------------
  // actions
  // -------------------------------------------------------------------------

  /**
   * Clicks the search input, types `query`, and submits with Enter.
   * Waits briefly for the results list to refresh.
   *
   * @param {string} query
   */
  async search(query) {
    const input = this.input();
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.click();
    await this.page.waitForTimeout(300);
    await input.fill(query);
    await this.page.waitForTimeout(300);

    // Prefer clicking the explicit "Search" submit button when visible;
    // fall back to pressing Enter (Outlook's combobox sometimes handles
    // Enter as suggestion-navigation rather than form submission).
    const searchBtn = this.page
      .getByRole('button', { name: /^search$/i })
      .first();
    if (await searchBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await searchBtn.click();
    } else {
      await this.page.keyboard.press('Enter');
    }

    // allow Outlook to fetch and render results
    await this.page.waitForTimeout(2_000);
  }

  /**
   * Clears the active search.
   * Tries the explicit clear button first; falls back to Escape.
   */
  async clear() {
    if (await this.clearButton().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.clearButton().click();
    } else {
      await this.input().press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
      await this.page.keyboard.press('Delete');
      await this.page.keyboard.press('Escape');
    }
    await this.page.waitForTimeout(800);
  }

  /**
   * Activates a search-result filter after a search is performed.
   *
   * Outlook Web shows two layers of filters:
   *   • Content-type tabs: "All" | "Email" | "Files" | "People"
   *   • Refinement chips (buttons): "Has attachments" | "Unread" |
   *     "To me" | "Mentions me" | "Flagged" | "High importance"
   *
   * Pass any of those labels (or a partial substring) and the method
   * will click the first matching tab or button.
   *
   * @param {string} scope - e.g. "Email", "Unread", "Flagged"
   */
  async filterByScope(scope) {
    const rx = new RegExp(scope, 'i');
    const filter = this.page
      .getByRole('tab', { name: rx })
      .or(this.page.getByRole('button', { name: rx }))
      .first();

    await expect(filter).toBeVisible({ timeout: 10_000 });
    await filter.click();
    await this.page.waitForTimeout(1_000);
  }

  // -------------------------------------------------------------------------
  // assertions
  // -------------------------------------------------------------------------

  /**
   * Asserts that the results list is visible (search returned at least one row).
   */
  async verifyResultsVisible() {
    await expect(this.resultsList()).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Asserts that at least one result contains `subject` (case-insensitive).
   * @param {string} subject
   */
  async verifyResultContains(subject) {
    await expect(
      this.resultsList()
        .getByRole('option', { name: new RegExp(subject, 'i') })
        .first()
    ).toBeVisible({ timeout: 20_000 });
  }

  /**
   * Asserts that a "no results" message is visible.
   * Outlook Web shows "We didn't find anything." when a search returns zero matches.
   */
  async verifyNoResults() {
    // Outlook uses curly apostrophes (U+2019) in its no-results messages.
    // Match by multiple possible phrases, trying both straight and curly apostrophes.
    const noResults = this.page
      .getByText(/no results|no messages found|nothing here/i)
      .or(this.page.getByText(/we (didn|couldn).t find/i))
      .or(this.page.getByText(/didn.t find anything/i))
      .first();
    await expect(noResults).toBeVisible({ timeout: 20_000 });
  }

  /**
   * Returns true if the search input currently contains text / is in an
   * active-search state (the clear button is visible).
   */
  async isSearchActive() {
    // Check for the "Exit search" button that Outlook shows while a search is active.
    const hasExitBtn = await this.clearButton().isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasExitBtn) return true;

    // Fallback: check if the search input contains text.
    try {
      const val = await this.input().inputValue({ timeout: 2_000 });
      return val.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Asserts that the search input is visible (the search bar is rendered).
   */
  async verifySearchBarVisible() {
    await expect(this.input()).toBeVisible({ timeout: 15_000 });
  }
}
