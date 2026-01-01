import { ScheduleItem, RecurringException, WeeklyScheduleSlot } from '../types';

export interface Conflict {
    day: number;
    time: number;
    duration: number;
    conflictingItem: {
        title: string;
        subtitle: string;
        studentId?: string;
    };
}

/**
 * Applies exceptions to recurring sessions
 * @param sessions - Array of recurring sessions
 * @param exceptions - Array of exceptions to apply
 * @returns Filtered and modified sessions based on exceptions
 */
export function applyExceptions(
    sessions: ScheduleItem[],
    exceptions: RecurringException[]
): ScheduleItem[] {
    return sessions.filter(session => {
        if (!session.recurrenceRuleId) {
            return true; // Not a recurring session, keep it
        }

        // Find exceptions for this rule
        const ruleExceptions = exceptions.filter(
            ex => ex.recurrenceRuleId === session.recurrenceRuleId
        );

        if (ruleExceptions.length === 0) {
            return true; // No exceptions, keep the session
        }

        // Check if this session date matches any skip exception
        // For now, we'll check if the session matches the day of week
        // In a full implementation, we'd need to check the actual date
        const hasSkipException = ruleExceptions.some(ex => ex.type === 'skip');
        
        // If there's a skip exception, we'd need to check the actual date
        // For now, we'll keep all sessions and let the date-specific filtering happen in ScheduleContext
        // when we have the actual date context
        
        return true; // Keep for now, will be filtered by date in ScheduleContext
    }).map(session => {
        if (!session.recurrenceRuleId) {
            return session;
        }

        // Find exceptions for this rule that modify time/duration
        const ruleExceptions = exceptions.filter(
            ex => ex.recurrenceRuleId === session.recurrenceRuleId
        );

        const timeChangeException = ruleExceptions.find(ex => ex.type === 'timeChange');
        const durationChangeException = ruleExceptions.find(ex => ex.type === 'durationChange');

        let modifiedSession = { ...session };

        if (timeChangeException && timeChangeException.newTime !== undefined) {
            modifiedSession.startTime = timeChangeException.newTime;
        }

        if (durationChangeException && durationChangeException.newDuration !== undefined) {
            modifiedSession.duration = durationChangeException.newDuration;
        }

        return modifiedSession;
    });
}

/**
 * Checks if a session should be skipped based on exceptions for a specific date
 * @param session - The session to check
 * @param date - The date to check (ISO string)
 * @param exceptions - Array of exceptions
 * @returns true if the session should be skipped for this date
 */
export function shouldSkipSessionForDate(
    session: ScheduleItem,
    date: string,
    exceptions: RecurringException[]
): boolean {
    if (!session.recurrenceRuleId) {
        return false;
    }

    const ruleExceptions = exceptions.filter(
        ex => ex.recurrenceRuleId === session.recurrenceRuleId && ex.date === date
    );

    return ruleExceptions.some(ex => ex.type === 'skip');
}

/**
 * Gets modified time/duration for a session on a specific date based on exceptions
 * @param session - The session to check
 * @param date - The date to check (ISO string)
 * @param exceptions - Array of exceptions
 * @returns Modified time/duration or null if no modifications
 */
export function getModifiedSessionForDate(
    session: ScheduleItem,
    date: string,
    exceptions: RecurringException[]
): { startTime?: number; duration?: number } | null {
    if (!session.recurrenceRuleId) {
        return null;
    }

    const ruleExceptions = exceptions.filter(
        ex => ex.recurrenceRuleId === session.recurrenceRuleId && ex.date === date
    );

    const timeChangeException = ruleExceptions.find(ex => ex.type === 'timeChange');
    const durationChangeException = ruleExceptions.find(ex => ex.type === 'durationChange');

    if (!timeChangeException && !durationChangeException) {
        return null;
    }

    const modifications: { startTime?: number; duration?: number } = {};

    if (timeChangeException && timeChangeException.newTime !== undefined) {
        modifications.startTime = timeChangeException.newTime;
    }

    if (durationChangeException && durationChangeException.newDuration !== undefined) {
        modifications.duration = durationChangeException.newDuration;
    }

    return Object.keys(modifications).length > 0 ? modifications : null;
}

/**
 * Detects conflicts between a new recurring schedule and existing sessions
 * @param newSlots - The new recurring schedule slots to check
 * @param existingItems - All existing schedule items (one-time + recurring)
 * @param studentId - ID of the student for the new schedule (to exclude their own existing sessions)
 * @returns Array of conflicts
 */
export function detectConflicts(
    newSlots: WeeklyScheduleSlot[],
    existingItems: ScheduleItem[],
    studentId?: string
): Conflict[] {
    const conflicts: Conflict[] = [];

    newSlots.forEach(newSlot => {
        existingItems.forEach(existingItem => {
            // Skip if it's the same student's existing recurring session
            if (studentId && existingItem.studentId === studentId && existingItem.recurrenceRuleId) {
                return;
            }

            // Check if same day
            if (existingItem.day === newSlot.day) {
                // Check for time overlap
                const newStart = newSlot.startTime;
                const newEnd = newSlot.startTime + newSlot.duration;
                const existingStart = existingItem.startTime;
                const existingEnd = existingItem.startTime + existingItem.duration;

                // Check if times overlap
                if (!(newEnd <= existingStart || newStart >= existingEnd)) {
                    conflicts.push({
                        day: newSlot.day,
                        time: newSlot.startTime,
                        duration: newSlot.duration,
                        conflictingItem: {
                            title: existingItem.title,
                            subtitle: existingItem.subtitle,
                            studentId: existingItem.studentId
                        }
                    });
                }
            }
        });
    });

    return conflicts;
}

/**
 * Suggests available time slots based on existing schedule
 * @param day - Day of week (0-6, Mon-Sun)
 * @param existingItems - All existing schedule items
 * @param preferredDuration - Preferred duration in hours
 * @returns Array of available time slots
 */
export function suggestAvailableSlots(
    day: number,
    existingItems: ScheduleItem[],
    preferredDuration: number = 1
): Array<{ startTime: number; endTime: number }> {
    const dayItems = existingItems
        .filter(item => item.day === day)
        .sort((a, b) => a.startTime - b.startTime);

    const availableSlots: Array<{ startTime: number; endTime: number }> = [];
    const startHour = 8; // 8 AM
    const endHour = 20; // 8 PM

    // If no existing items, suggest common times
    if (dayItems.length === 0) {
        return [
            { startTime: 9, endTime: 10 },
            { startTime: 14, endTime: 15 },
            { startTime: 16, endTime: 17 }
        ];
    }

    // Check gaps between existing items
    for (let i = 0; i < dayItems.length; i++) {
        const currentItem = dayItems[i];
        const nextItem = dayItems[i + 1];

        const gapStart = currentItem.startTime + currentItem.duration;
        const gapEnd = nextItem ? nextItem.startTime : endHour;

        if (gapEnd - gapStart >= preferredDuration) {
            availableSlots.push({
                startTime: gapStart,
                endTime: gapEnd
            });
        }
    }

    // Check before first item
    if (dayItems[0].startTime - startHour >= preferredDuration) {
        availableSlots.push({
            startTime: startHour,
            endTime: dayItems[0].startTime
        });
    }

    return availableSlots.slice(0, 5); // Return top 5 suggestions
}

