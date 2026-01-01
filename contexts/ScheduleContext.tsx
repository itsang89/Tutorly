import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ScheduleItem, Student, RecurringException } from '../types';
import { useStudents } from './StudentsContext';

interface ScheduleContextType {
    scheduleItems: ScheduleItem[];
    recurringItems: ScheduleItem[]; // Generated from student weekly schedules
    allScheduleItems: ScheduleItem[]; // Combined scheduleItems + recurringItems
    addScheduleItem: (item: ScheduleItem) => void;
    removeScheduleItem: (id: string) => void;
    updateScheduleItem: (id: string, updates: Partial<ScheduleItem>) => void;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    recurringExceptions: RecurringException[];
    addRecurringException: (exception: RecurringException) => void;
    removeRecurringException: (id: string) => void;
    getExceptionsForRule: (recurrenceRuleId: string) => RecurringException[];
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { students } = useStudents();
    // Initialize state from localStorage immediately
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(() => {
        const stored = localStorage.getItem('tutorly_scheduleItems');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse stored schedule items:', e);
                return [];
            }
        }
        return [];
    });
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Initialize recurring exceptions from localStorage
    const [recurringExceptions, setRecurringExceptions] = useState<RecurringException[]>(() => {
        const stored = localStorage.getItem('tutorly_recurringExceptions');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse stored recurring exceptions:', e);
                return [];
            }
        }
        return [];
    });

    // Generate recurring schedule items from students' weekly schedules
    const recurringItems = useMemo(() => {
        const items: ScheduleItem[] = [];
        
        students.forEach(student => {
            if (student.weeklySchedule && student.weeklySchedule.length > 0 && student.status === 'Active') {
                student.weeklySchedule.forEach((slot, index) => {
                    const recurrenceRuleId = `rule-${student.id}-${slot.day}-${index}`;
                    const item: ScheduleItem = {
                        id: `recurring-${student.id}-${slot.day}-${index}`,
                        title: student.name,
                        subtitle: student.subject,
                        day: slot.day,
                        startTime: slot.startTime,
                        duration: slot.duration,
                        color: (student.color as 'amber' | 'blue' | 'stone' | 'accent') || 'stone',
                        isGroup: false,
                        studentId: student.id, // Store student ID for price lookup
                        recurrenceRuleId: recurrenceRuleId, // Store recurrence rule ID
                    };
                    items.push(item);
                });
            }
        });
        
        return items;
    }, [students]);

    // Combine manual schedule items with recurring items
    const allScheduleItems = useMemo(() => {
        return [...scheduleItems, ...recurringItems];
    }, [scheduleItems, recurringItems]);

    // Load schedule items from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('tutorly_scheduleItems');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setScheduleItems(parsed);
            } catch (e) {
                console.error('Failed to parse stored schedule items:', e);
            }
        }
    }, []);

    // Save schedule items to localStorage whenever they change (but skip initial empty array)
    useEffect(() => {
        if (scheduleItems.length > 0 || localStorage.getItem('tutorly_scheduleItems')) {
            localStorage.setItem('tutorly_scheduleItems', JSON.stringify(scheduleItems));
        }
    }, [scheduleItems]);

    // Load recurring exceptions from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('tutorly_recurringExceptions');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setRecurringExceptions(parsed);
            } catch (e) {
                console.error('Failed to parse stored recurring exceptions:', e);
            }
        }
    }, []);

    // Save recurring exceptions to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('tutorly_recurringExceptions', JSON.stringify(recurringExceptions));
    }, [recurringExceptions]);

    const addScheduleItem = (item: ScheduleItem) => {
        setScheduleItems(prev => [...prev, item]);
    };

    const removeScheduleItem = (id: string) => {
        setScheduleItems(prev => prev.filter(item => item.id !== id));
    };

    const updateScheduleItem = (id: string, updates: Partial<ScheduleItem>) => {
        setScheduleItems(prev => prev.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
    };

    const addRecurringException = (exception: RecurringException) => {
        setRecurringExceptions(prev => [...prev, exception]);
    };

    const removeRecurringException = (id: string) => {
        setRecurringExceptions(prev => prev.filter(ex => ex.id !== id));
    };

    const getExceptionsForRule = (recurrenceRuleId: string): RecurringException[] => {
        return recurringExceptions.filter(ex => ex.recurrenceRuleId === recurrenceRuleId);
    };

    return (
        <ScheduleContext.Provider value={{ 
            scheduleItems,
            recurringItems,
            allScheduleItems,
            addScheduleItem, 
            removeScheduleItem, 
            updateScheduleItem,
            currentDate,
            setCurrentDate,
            recurringExceptions,
            addRecurringException,
            removeRecurringException,
            getExceptionsForRule
        }}>
            {children}
        </ScheduleContext.Provider>
    );
};

export const useSchedule = () => {
    const context = useContext(ScheduleContext);
    if (context === undefined) {
        throw new Error('useSchedule must be used within a ScheduleProvider');
    }
    return context;
};

