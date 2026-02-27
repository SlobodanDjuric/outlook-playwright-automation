// tests/send-new-event-pom.spec.js
import { test, expect } from "@playwright/test";
import { CalendarNavigation } from "../pages/components/CalendarNavigation.js";
import { NewEventCompose } from "../pages/outlook/NewEventCompose.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDDMMYYYY(date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function futureDateDDMMYYYY(daysAhead = 30) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return formatDDMMYYYY(d);
}

test("Outlook Calendar - Send new event (POM)", async ({ page }) => {
  test.setTimeout(120_000);

  const TITLE = `Playwright POM Event ${Date.now()}`;
  const ATTENDEE = "test@example.com";
  const START_DATE = futureDateDDMMYYYY(45); // future date
  const START_TIME = "18:15";
  const END_TIME = "19:00";
  const LOCATION = "Conference 3";
  const BODY =
    "Ovo je body poruka za New Event (POM). Playwright test.";

  await page.goto("https://outlook.live.com/mail/", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("button", { name: /new email/i })).toBeVisible({
    timeout: 45_000,
  });

  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE);
  await event.addRequiredAttendee(ATTENDEE);

  await event.openTimeDropdown();
  await event.setStartDate(START_DATE);
  await event.setStartTime(START_TIME);
  await event.setEndTime(END_TIME);
  await event.closeTimeDropdown();

  await event.setLocation(LOCATION);
  await event.setBody(BODY);

  await event.send();

  await page.waitForTimeout(3000);
});