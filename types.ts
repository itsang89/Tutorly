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
}
