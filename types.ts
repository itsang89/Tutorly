export interface WeeklyScheduleSlot {
    day: number; // 0 = Mon, 6 = Sun
    startTime: number; // 8.0 = 8am, 14.5 = 2:30pm
    duration: number; // in hours
}

export interface Student {
    id: string;
    initials: string;
    name: string;
    subject: string;
    progress: string;
    nextSession: string;
    status: 'Active' | 'Paused' | 'Risk';
    joined: string;
    color: string;
    weeklySchedule?: WeeklyScheduleSlot[]; // Recurring weekly schedule
    pricePerHour?: number; // Price per hour for this student
}

export interface Transaction {
    id: string;
    date: string;
    student: string;
    initials: string;
    subject: string;
    status: 'Paid' | 'Pending';
    amount: number;
    color: string;
    duration?: number; // Duration in hours for calculating hourly rate
}

export interface ScheduleItem {
    id: string;
    title: string;
    subtitle: string;
    day: number; // 0 = Mon, 6 = Sun
    startTime: number; // 8.0 = 8am, 14.5 = 2:30pm
    duration: number; // in hours
    color: 'amber' | 'blue' | 'stone' | 'accent';
    isGroup?: boolean;
    date?: string; // ISO date string for specific lessons (optional for recurring)
    studentId?: string; // ID of the student for this lesson
    recurrenceRuleId?: string | null; // ID of the recurring rule that generated this session
}

export interface RecurringException {
    id: string;
    recurrenceRuleId: string;
    date: string; // ISO date string
    type: 'skip' | 'timeChange' | 'durationChange';
    newTime?: number; // For timeChange
    newDuration?: number; // For durationChange
}

export interface RecurringRule {
    id: string;
    studentId: string;
    dayOfWeek: number; // 0-6 (Mon-Sun)
    startTime: number; // Decimal hours
    duration: number; // Hours
    startDate: string; // ISO date
    endDate: string | null; // ISO date or null for ongoing
    frequency: 'weekly' | 'biweekly' | 'monthly';
}
