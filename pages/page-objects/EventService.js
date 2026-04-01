// pages/page-objects/EventService.js
import { CalendarNavigation } from '../components/CalendarNavigation.js';
import { NewEventCompose } from './NewEventCompose.js';

/**
 * EventService
 * ------------
 * High-level service layer for creating and sending Calendar events.
 *
 * This class orchestrates:
 * - Navigation to Calendar
 * - Opening the New Event dialog
 * - Filling event details
 * - Sending the event
 *
 * It abstracts the full event creation workflow into a single method
 * so tests remain clean and business-focused.
 */
export class EventService {
  constructor(page) {
    this.page = page;
    this.nav = new CalendarNavigation(page);
    this.compose = new NewEventCompose(page);
  }

  /**
   * Creates and sends a calendar event.
   *
   * Expected payload structure:
   * {
   *   title: string,
   *   attendee: string,
   *   startDate: "dd/mm/yyyy",
   *   startTime: "HH:MM",
   *   endTime: "HH:MM",
   *   location?: string,
   *   body?: string
   * }
   */
  async createAndSend(payload) {
    const { title, attendee, startDate, startTime, endTime, location = '', body = '' } = payload;

    // Navigate to Calendar and open New Event dialog
    await this.nav.goToCalendar();
    await this.nav.clickNewEvent();

    await this.compose.waitUntilOpen();

    // Basic event details
    await this.compose.fillTitle(title);
    await this.compose.addRequiredAttendee(attendee);

    // Date and time configuration - use the new helper exposed under
    // eventDetails so we avoid relying on removed legacy methods.
    const time = this.compose.eventDetails.openTimeDropdown;
    await time.setStartDate(startDate);
    await time.setStartTime(startTime);
    await time.setEndTime(endTime);
    await time.close();

    // Optional fields
    if (location) await this.compose.setLocation(location);
    if (body) await this.compose.setBody(body);

    // Finalize and send event
    await this.compose.send();
  }
}
