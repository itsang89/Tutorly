import { Student, ScheduleItem, Transaction, WeeklyScheduleSlot } from '../types';

export interface TodoItem {
    id: string;
    text: string;
    due: string;
    done: boolean;
}

export interface DemoData {
    students: Student[];
    scheduleItems: ScheduleItem[];
    transactions: Transaction[];
    todos: TodoItem[];
    weeklyChartData: Array<{ name: string; value: number }>;
    monthlyChartData: Array<{ name: string; value: number }>;
}

// Helper function to get date string N days ago
const getDateString = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
};

// Helper function to get date string for a specific date
const getSpecificDate = (year: number, month: number, day: number): string => {
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
};

export const demoData: DemoData = {
    students: [
        {
            id: 'student-1',
            initials: 'JS',
            name: 'John Smith',
            subject: 'Mathematics',
            progress: 'Excellent',
            nextSession: 'Tomorrow',
            status: 'Active',
            joined: '2024-01-15',
            color: 'primary',
            pricePerHour: 75,
            weeklySchedule: [
                { day: 1, startTime: 14, duration: 1.5 }, // Tuesday 2 PM
                { day: 3, startTime: 16, duration: 1.5 }, // Thursday 4 PM
            ] as WeeklyScheduleSlot[],
        },
        {
            id: 'student-2',
            initials: 'EJ',
            name: 'Emily Johnson',
            subject: 'Physics',
            progress: 'Good',
            nextSession: 'Friday',
            status: 'Active',
            joined: '2024-02-01',
            color: 'blue',
            pricePerHour: 80,
            weeklySchedule: [
                { day: 0, startTime: 10, duration: 2 }, // Monday 10 AM
                { day: 4, startTime: 14, duration: 2 }, // Friday 2 PM
            ] as WeeklyScheduleSlot[],
        },
        {
            id: 'student-3',
            initials: 'MW',
            name: 'Michael Williams',
            subject: 'Chemistry',
            progress: 'Excellent',
            nextSession: 'Monday',
            status: 'Active',
            joined: '2024-01-20',
            color: 'amber',
            pricePerHour: 70,
            weeklySchedule: [
                { day: 2, startTime: 15, duration: 1 }, // Wednesday 3 PM
                { day: 5, startTime: 11, duration: 1.5 }, // Saturday 11 AM
            ] as WeeklyScheduleSlot[],
        },
        {
            id: 'student-4',
            initials: 'SB',
            name: 'Sarah Brown',
            subject: 'Biology',
            progress: 'Good',
            nextSession: 'Wednesday',
            status: 'Active',
            joined: '2024-02-10',
            color: 'stone',
            pricePerHour: 65,
            weeklySchedule: [
                { day: 1, startTime: 9, duration: 1 }, // Tuesday 9 AM
                { day: 3, startTime: 13, duration: 1.5 }, // Thursday 1 PM
            ] as WeeklyScheduleSlot[],
        },
        {
            id: 'student-5',
            initials: 'DJ',
            name: 'David Jones',
            subject: 'Mathematics',
            progress: 'Needs Improvement',
            nextSession: 'Thursday',
            status: 'Active',
            joined: '2024-02-15',
            color: 'accent',
            pricePerHour: 60,
            weeklySchedule: [
                { day: 2, startTime: 16, duration: 1 }, // Wednesday 4 PM
            ] as WeeklyScheduleSlot[],
        },
    ],
    scheduleItems: [
        // Past one-off lessons (adjusted to avoid collisions with recurring schedules)
        {
            id: 'lesson-1',
            title: 'John Smith',
            subtitle: 'Mathematics',
            day: 0, // Monday (moved from Tuesday to avoid collision)
            startTime: 15, // 3 PM (moved from 2 PM)
            duration: 1.5,
            color: 'primary',
            isGroup: false,
            date: getDateString(5), // 5 days ago
            studentId: 'student-1',
        },
        {
            id: 'lesson-2',
            title: 'Emily Johnson',
            subtitle: 'Physics',
            day: 2, // Wednesday (moved from Monday to avoid collision)
            startTime: 11, // 11 AM (moved from 10 AM)
            duration: 2,
            color: 'blue',
            isGroup: false,
            date: getDateString(7), // 7 days ago
            studentId: 'student-2',
        },
        {
            id: 'lesson-3',
            title: 'Michael Williams',
            subtitle: 'Chemistry',
            day: 4, // Friday (moved from Wednesday to avoid collision)
            startTime: 10, // 10 AM (moved from 3 PM)
            duration: 1,
            color: 'amber',
            isGroup: false,
            date: getDateString(10), // 10 days ago
            studentId: 'student-3',
        },
        {
            id: 'lesson-4',
            title: 'Sarah Brown',
            subtitle: 'Biology',
            day: 5, // Saturday (moved from Tuesday to avoid collision)
            startTime: 10, // 10 AM (moved from 9 AM)
            duration: 1,
            color: 'stone',
            isGroup: false,
            date: getDateString(12), // 12 days ago
            studentId: 'student-4',
        },
        // Future one-off lessons
        {
            id: 'lesson-5',
            title: 'David Jones',
            subtitle: 'Mathematics',
            day: 3, // Thursday (moved from Friday to avoid collision)
            startTime: 10, // 10 AM (moved from 2 PM)
            duration: 1.5,
            color: 'accent',
            isGroup: false,
            date: getDateString(-3), // 3 days from now
            studentId: 'student-5',
        },
    ],
    transactions: [
        {
            id: 'trans-1',
            date: getDateString(5),
            student: 'John Smith',
            initials: 'JS',
            subject: 'Mathematics',
            status: 'Paid',
            amount: 112.50, // 75 * 1.5
            color: 'primary',
            duration: 1.5,
        },
        {
            id: 'trans-2',
            date: getDateString(7),
            student: 'Emily Johnson',
            initials: 'EJ',
            subject: 'Physics',
            status: 'Paid',
            amount: 160.00, // 80 * 2
            color: 'blue',
            duration: 2,
        },
        {
            id: 'trans-3',
            date: getDateString(10),
            student: 'Michael Williams',
            initials: 'MW',
            subject: 'Chemistry',
            status: 'Paid',
            amount: 70.00, // 70 * 1
            color: 'amber',
            duration: 1,
        },
        {
            id: 'trans-4',
            date: getDateString(12),
            student: 'Sarah Brown',
            initials: 'SB',
            subject: 'Biology',
            status: 'Paid',
            amount: 65.00, // 65 * 1
            color: 'stone',
            duration: 1,
        },
        {
            id: 'trans-5',
            date: getDateString(14),
            student: 'John Smith',
            initials: 'JS',
            subject: 'Mathematics',
            status: 'Paid',
            amount: 112.50, // 75 * 1.5
            color: 'primary',
            duration: 1.5,
        },
        {
            id: 'trans-6',
            date: getDateString(15),
            student: 'Emily Johnson',
            initials: 'EJ',
            subject: 'Physics',
            status: 'Paid',
            amount: 160.00, // 80 * 2
            color: 'blue',
            duration: 2,
        },
        {
            id: 'trans-7',
            date: getDateString(18),
            student: 'Michael Williams',
            initials: 'MW',
            subject: 'Chemistry',
            status: 'Paid',
            amount: 105.00, // 70 * 1.5
            color: 'amber',
            duration: 1.5,
        },
        {
            id: 'trans-8',
            date: getDateString(20),
            student: 'Sarah Brown',
            initials: 'SB',
            subject: 'Biology',
            status: 'Paid',
            amount: 97.50, // 65 * 1.5
            color: 'stone',
            duration: 1.5,
        },
        {
            id: 'trans-9',
            date: getDateString(21),
            student: 'John Smith',
            initials: 'JS',
            subject: 'Mathematics',
            status: 'Paid',
            amount: 112.50, // 75 * 1.5
            color: 'primary',
            duration: 1.5,
        },
        {
            id: 'trans-10',
            date: getDateString(25),
            student: 'David Jones',
            initials: 'DJ',
            subject: 'Mathematics',
            status: 'Paid',
            amount: 60.00, // 60 * 1
            color: 'accent',
            duration: 1,
        },
    ],
    todos: [
        { id: 'todo-1', text: 'Prepare lesson plan for John', due: getDateString(-1), done: false },
        { id: 'todo-2', text: 'Review Emily\'s homework', due: getDateString(0), done: true },
        { id: 'todo-3', text: 'Schedule parent meeting', due: getDateString(2), done: false },
    ],
    weeklyChartData: [
        { name: 'Mon', value: 160 },
        { name: 'Tue', value: 112.5 },
        { name: 'Wed', value: 70 },
        { name: 'Thu', value: 0 },
        { name: 'Fri', value: 0 },
        { name: 'Sat', value: 0 },
        { name: 'Sun', value: 0 },
    ],
    monthlyChartData: [
        { name: 'Jan', value: 1200 },
        { name: 'Feb', value: 1800 },
        { name: 'Mar', value: 1500 },
        { name: 'Apr', value: 2100 },
        { name: 'May', value: 1900 },
        { name: 'Jun', value: 2200 },
    ],
};

