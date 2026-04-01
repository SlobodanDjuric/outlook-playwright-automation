/**
 * MailOptions
 * -----------
 * Centralized constants for mail list toolbar dropdowns:
 * Filter, Sort, and Jump-to options.
 *
 * Used with FolderToolbar.filter(), .sortBy(), and .jumpTo() methods
 * to avoid hardcoding label strings in tests.
 */

/**
 * Filter dropdown options.
 * Accessible via FolderToolbar.filter(MailFilterOptions.Unread).
 */
export const MailFilterOptions = Object.freeze({
  Unread:             'Unread',
  Flagged:            'Flagged',
  ToMe:               'To me',
  HasFiles:           'Has files',
  MentionsMe:         'Mentions me',
  HasCalendarInvites: 'Has calendar invites',
});

/**
 * Sort dropdown field options.
 * Accessible via FolderToolbar.sortBy(SortOptions.Date).
 *
 * Note: the dropdown also contains "Oldest on top" / "Newest on top"
 * ordering toggles, which are not included here as they are not sort fields.
 */
export const SortOptions = Object.freeze({
  Date:       'Date',
  From:       'From',
  Category:   'Category',
  FlagStatus: 'Flag Status',
  Size:       'Size',
  Importance: 'Importance',
  Subject:    'Subject',
  Type:       'Type',
});

/**
 * Jump-to dropdown options, grouped by the Sort field that exposes them.
 *
 * Jump To is only available for these sort fields:
 *   ByDate, ByCategory, BySize, ByImportance
 *
 * The following sort fields have NO Jump To dropdown:
 *   From, Flag Status, Subject, Type
 *
 * Usage example:
 *   await folder.toolbar.sortBy(SortOptions.Category);
 *   await folder.toolbar.jumpTo(JumpToOptions.ByCategory.Blue);
 */
export const JumpToOptions = Object.freeze({
  // Available when sorted by Date
  ByDate: Object.freeze({
    Today:     'Today',
    Yesterday: 'Yesterday',
    LastWeek:  'Last week',
    LastMonth: 'Last month',
    LastYear:  'Last year',
  }),

  // Available when sorted by Category
  ByCategory: Object.freeze({
    Red:    'Red category',
    Orange: 'Orange category',
    Yellow: 'Yellow category',
    Green:  'Green category',
    Blue:   'Blue category',
    Purple: 'Purple category',
    None:   'None',
  }),

  // Available when sorted by Size (ordered smallest → largest)
  BySize: Object.freeze({
    Tiny:      'Tiny',
    Small:     'Small',
    Medium:    'Medium',
    Large:     'Large',
    VeryLarge: 'Very large',
    Huge:      'Huge',
    Enormous:  'Enormous',
  }),

  // Available when sorted by Importance
  ByImportance: Object.freeze({
    High:   'High',
    Normal: 'Normal',
    Low:    'Low',
  }),
});
