export interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  githubIssueId: string;
  githubUrl: string;
  githubRepo: string;
  colorId?: string;
  reminders?: CalendarReminder[];
}

export interface CalendarReminder {
  method: 'email' | 'popup';
  minutes: number;
}


